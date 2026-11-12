import type { ProjectCapabilities, Sketch, SketchDependency } from "@/contract";
import type {
  Evaluation,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type { EvaluationStatus } from "@/domains/evaluation/helpers/evaluator";
import {
  CONFIG_PATH,
  addDependency as addSketchDependency,
  addNode as addSketchNode,
  fromText,
  getDependency as getSketchDependency,
  getFileDependencies,
  getDependencyAtLine,
  getDependencyLine,
  getFiles,
  getParentPath,
  getUniquePath,
  hasNode,
  isSameOrInside,
  isSameProject,
  movePath,
  moveTextLine,
  removeDependency as removeSketchDependency,
  removeNode as removeSketchNode,
  renameInFolder,
  replaceDependency as replaceSketchDependency,
  setConfig,
  toText,
} from "@/domains/project/helpers/sketch";
import type {
  DependencyRef,
  EditResult,
} from "@/domains/project/helpers/sketch";
import {
  findHighlightPolicy,
  getFocusedPath,
  moveFocus,
  moveHighlight,
  moveHighlightRange,
} from "@/domains/session/helpers/focus";
import type {
  Focus,
  PolicyHighlight,
  ProblemsTabId,
  ProjectView,
  Target,
} from "@/domains/session/helpers/focus";

import type {
  FileFocus,
  FocusAnchor,
  HighlightAnchor,
  SessionState,
  TextAnchors,
} from "./sessionState.types";
import type { RenameTransition } from "./transitions.types";

const NO_FOCUS: Focus = { kind: "none" };

const CONFIG_FOCUS: Focus = { kind: "config" };

/** The folders the user closed, before the user closes any. */
const NONE_CLOSED: ReadonlySet<string> = new Set();

/** Names that a new file and a new folder start with, until the user renames them. */
const NEW_NAMES = { file: "new-file.js", folder: "new-folder" } as const;

/**
 * Creates the state an instance starts with: the sketch, whose evaluation is on its way, with the config in focus, so that the config is the first thing the user reads, the project as a tree with every folder open, and the problems panel open on the sketch, which sums up the problems of the config and of the files.
 * @param sketch The sketch to start from.
 * @param capabilities What the user can change in the project.
 * @returns The first state.
 */
export function createSessionState(
  sketch: Sketch,
  capabilities: ProjectCapabilities
): SessionState {
  return {
    sketch,
    evaluation: undefined,
    evaluationStatus: "pending",
    capabilities,
    focus: CONFIG_FOCUS,
    tab: "sketch",
    problemsCollapsed: false,
    reveal: undefined,
    highlight: undefined,
    revealCount: 0,
    view: "tree",
    textDraft: undefined,
    textAnchors: undefined,
    pickedFolder: undefined,
    closedFolders: NONE_CLOSED,
    renaming: undefined,
  };
}

/**
 * Opens the folders above a path, so that the node at it shows.
 * @param closedFolders The folders that are closed.
 * @param path The path of a node.
 * @returns The folders that stay closed: the same set when none of them is above the path.
 */
function openAncestors(
  closedFolders: ReadonlySet<string>,
  path: string
): ReadonlySet<string> {
  let stillClosed: Set<string> | undefined;

  for (
    let folder = getParentPath(path);
    folder !== "";
    folder = getParentPath(folder)
  ) {
    if (closedFolders.has(folder)) {
      stillClosed ??= new Set(closedFolders);
      stillClosed.delete(folder);
    }
  }
  return stillClosed ?? closedFolders;
}

/**
 * Leaves nothing in focus. The tab of the problems panel goes back to the sketch's, and the range to reveal and the highlight, which belong to the config, go.
 * @param state The state before.
 * @returns The state after.
 */
function closeFocus(state: SessionState): SessionState {
  return {
    ...state,
    focus: NO_FOCUS,
    tab: "sketch",
    reveal: undefined,
    highlight: undefined,
  };
}

/**
 * Gets the tab of the problems panel after the focus moved. A tab follows the focus to the most specific one it can: the dependency's tab goes when the focus leaves the dependency, and the node's tab goes back to the dependency's when the focus comes back to one from its file, such as when the line of a dependency reads again. The other tabs stay, as the user chose them.
 * @param tab The selected tab.
 * @param before What was in focus.
 * @param after What is in focus now.
 * @returns The tab.
 */
function getFollowedTab(
  tab: ProblemsTabId,
  before: Focus,
  after: Focus
): ProblemsTabId {
  if (after.kind !== "dependency" && tab === "dependency") {
    return "node";
  }
  return after.kind === "dependency" && before.kind === "file" && tab === "node"
    ? "dependency"
    : tab;
}

/**
 * Keeps a sketch whose nodes or dependencies an edit changed, and moves with it what points into them: the focus, the tab that follows it and the dependency a highlight came from. A file in focus that the new sketch no longer has, such as one whose line was deleted in text mode, leaves nothing in focus. A dependency in focus that is gone leaves its file in focus, and the tab of the node replaces the dependency's.
 * @param state The state before, whose sketch is the one before the edit.
 * @param sketch The new sketch.
 * @param moved Where the focus and the highlight are after the edit. They follow the sketch with `moveFocus` and `moveHighlight` when it is unset; a read of the text decides them by the lines of the text instead.
 * @param moved.focus The focus after the edit.
 * @param moved.highlight The highlight after the edit.
 * @returns The state after.
 */
function followSketch(
  state: SessionState,
  sketch: Sketch,
  { focus: moved, highlight }: Pick<SessionState, "focus" | "highlight"> = {
    focus: moveFocus(state.focus, state.sketch, sketch),
    highlight: moveHighlight(state.highlight, state.sketch, sketch),
  }
): SessionState {
  const followed: SessionState = { ...state, sketch, highlight };

  if (moved === state.focus) {
    return followed;
  }
  if (moved.kind === "none") {
    return closeFocus(followed);
  }
  return {
    ...followed,
    focus: moved,
    tab: getFollowedTab(state.tab, state.focus, moved),
  };
}

/**
 * Applies an edit of the sketch, or leaves the state as it was when the edit is refused.
 * @param state The state before the edit.
 * @param result What the operation of `src/domains/project/helpers/sketch/` returned.
 * @param apply Builds the state after the edit from the new sketch.
 * @returns The state after the edit.
 */
function applyEdit(
  state: SessionState,
  result: EditResult,
  apply: (sketch: Sketch) => SessionState
): SessionState {
  return "error" in result ? state : apply(result.sketch);
}

/**
 * Gets the folder that a new node goes in: the folder the user selected, the folder of the file in focus, or the root.
 * @param state The state.
 * @param state.sketch
 * @param state.pickedFolder
 * @param state.focus
 * @returns The path of the folder, or an empty string for the root.
 */
function getTargetFolder({
  sketch,
  pickedFolder,
  focus: openNode,
}: SessionState): string {
  // The selected folder can be gone, or be a file, after an edit of the text
  if (
    pickedFolder !== undefined &&
    hasNode(sketch, pickedFolder) &&
    !getFiles(sketch).includes(pickedFolder)
  ) {
    return pickedFolder;
  }
  // A dependency in focus is a line of its file, which is the open one
  const openPath = getFocusedPath(openNode);

  return openPath === undefined ? "" : getParentPath(openPath);
}

/**
 * Gets the focus on a file.
 * @param openNode What is in focus.
 * @param path The path of the file.
 * @returns The focus on the file: the same object when it already is the focus, so that nothing that reads it renders again.
 */
function getFileFocus(openNode: Focus, path: string): FileFocus {
  return openNode.kind === "file" && openNode.path === path
    ? openNode
    : { kind: "file", path };
}

/**
 * Gets the focus on a dependency.
 * @param openNode What is in focus.
 * @param path The path of the file that has the dependency.
 * @param index Its position among the dependencies of the file.
 * @returns The focus on the dependency: the same object when it already is the focus, so that nothing that reads it renders again.
 */
function getDependencyFocus(
  openNode: Focus,
  path: string,
  index: number
): FileFocus {
  return openNode.kind === "dependency" &&
    openNode.path === path &&
    openNode.index === index
    ? openNode
    : { kind: "dependency", path, index };
}

/**
 * Gets the focus that opening a target gives.
 * @param openNode What is in focus.
 * @param target What to open.
 * @returns The focus on the target: the same object when it already is the focus, so that nothing that reads it renders again.
 */
function getTargetFocus(openNode: Focus, target: Target): Focus {
  if (target.kind === "config") {
    return CONFIG_FOCUS;
  }
  return target.kind === "file"
    ? getFileFocus(openNode, target.path)
    : getDependencyFocus(openNode, target.path, target.index);
}

/**
 * Gets the folders that stay closed when a target opens: the ones above the node it opens, and, for a dependency on a file of the sketch, the ones above that file too, so that the outline of the target shows in the tree.
 * @param state The state before.
 * @param target What to open.
 * @returns The folders that stay closed: the same set when none of them is above what shows.
 */
function getTargetClosedFolders(
  state: SessionState,
  target: Target
): ReadonlySet<string> {
  if (target.kind === "config") {
    return state.closedFolders;
  }

  const closedFolders = openAncestors(state.closedFolders, target.path);
  const dependency =
    target.kind === "dependency"
      ? getSketchDependency(state.sketch, target)
      : undefined;

  return dependency?.target.kind === "node"
    ? openAncestors(closedFolders, dependency.target.path)
    : closedFolders;
}

/**
 * Gets the policy to keep highlighted when a target opens: the one a config target says, with its range and the dependency it came from.
 * @param target What is opened.
 * @returns The highlight, or `undefined` for every other target, and for a config target that lacks the range, the policy or the dependency.
 */
function getTargetHighlight(target: Target): PolicyHighlight | undefined {
  return target.kind === "config" &&
    target.range !== undefined &&
    target.policy !== undefined &&
    target.dependency !== undefined
    ? {
        range: target.range,
        policy: target.policy,
        dependency: target.dependency,
      }
    : undefined;
}

/**
 * Opens a target: puts it in focus, selects the most specific tab (the dependency's for a dependency, the node's otherwise) and shows the node in the tree, with the folders above a file, or above the file of a dependency and above its target, open. A config target with a range scrolls the editor to it; the range of a request that was already shown stays, so that the editor does not scroll again. A config target with a range and a dependency keeps that policy highlighted while the config stays in focus. Opening a file while one of its dependencies is in focus puts the file in focus, and the dependency tab goes.
 * @param state The state before.
 * @param target What to open.
 * @returns The state after.
 */
export function openTarget(state: SessionState, target: Target): SessionState {
  const opened: SessionState = {
    ...state,
    focus: getTargetFocus(state.focus, target),
    tab: target.kind === "dependency" ? "dependency" : "node",
    // The focus replaces the folder the user selected, and shows even if a folder above it is closed
    pickedFolder: undefined,
    closedFolders: getTargetClosedFolders(state, target),
    // The range to reveal and the highlight belong to the config, so they go when the focus leaves it
    reveal: target.kind === "config" ? state.reveal : undefined,
    highlight: getTargetHighlight(target),
  };

  if (target.kind !== "config" || target.range === undefined) {
    return opened;
  }

  const key = state.revealCount + 1;

  return {
    ...opened,
    reveal: { range: target.range, key },
    revealCount: key,
  };
}

/**
 * Handles the selection of an item of the tree. A file and the config open; a folder is only selected, and is where the next node goes.
 * @param state The state before.
 * @param id The id of the item: `eslint.config.js` for the config node, or the path of a node.
 * @returns The state after.
 */
export function selectItem(state: SessionState, id: string): SessionState {
  if (id === CONFIG_PATH) {
    return openTarget(state, { kind: "config" });
  }
  if (getFiles(state.sketch).includes(id)) {
    return openTarget(state, { kind: "file", path: id });
  }
  return id === state.pickedFolder ? state : { ...state, pickedFolder: id };
}

/**
 * Remembers that a folder of the tree was opened or closed.
 * @param state The state before.
 * @param path The path of the folder.
 * @param isOpen Whether the folder is open now.
 * @returns The state after, or the same one when the folder already was.
 */
export function toggleFolder(
  state: SessionState,
  path: string,
  isOpen: boolean
): SessionState {
  if (isOpen !== state.closedFolders.has(path)) {
    return state;
  }

  const closedFolders = new Set(state.closedFolders);

  if (isOpen) {
    closedFolders.delete(path);
  } else {
    closedFolders.add(path);
  }
  return { ...state, closedFolders };
}

/**
 * Shows the project as a tree or as text. Leaving text mode drops the lines that were not read.
 * @param state The state before.
 * @param view The view to show.
 * @returns The state after.
 */
export function setView(state: SessionState, view: ProjectView): SessionState {
  return view === state.view ? state : { ...state, view, textDraft: undefined };
}

/**
 * Adds a file or a folder with a free name and starts renaming it, from the tree or from the pane of nothing open alike. It goes in the folder the user selected, the folder of the file in focus or the root; the tree shows, with the folders above it open. A new file opens; a new folder is selected.
 * @param state The state before.
 * @param kind Whether to add a file or a folder.
 * @returns The state after, or the same one without `editTree`.
 */
export function addNode(
  state: SessionState,
  kind: "file" | "folder"
): SessionState {
  if (!state.capabilities.editTree) {
    return state;
  }

  const path = getUniquePath(
    state.sketch,
    getTargetFolder(state),
    NEW_NAMES[kind]
  );

  // The path is free and valid, and no file is above it, so the edit is not refused
  return applyEdit(state, addSketchNode(state.sketch, path, kind), (sketch) => {
    // Text mode has no row to rename in
    const added = { ...setView(state, "tree"), sketch, renaming: path };

    return kind === "file"
      ? openTarget(added, { kind: "file", path })
      : {
          ...added,
          pickedFolder: path,
          closedFolders: openAncestors(added.closedFolders, path),
        };
  });
}

/**
 * Starts renaming a node in the tree.
 * @param state The state before.
 * @param path The path of the node.
 * @returns The state after, or the same one without `editTree`.
 */
export function startRename(state: SessionState, path: string): SessionState {
  return path === state.renaming || !state.capabilities.editTree
    ? state
    : { ...state, renaming: path };
}

/**
 * Gives up renaming.
 * @param state The state before.
 * @returns The state after.
 */
export function cancelRename(state: SessionState): SessionState {
  return state.renaming === undefined
    ? state
    : { ...state, renaming: undefined };
}

/**
 * Moves the path of the file in focus, or of the file that has the dependency in focus, with a rename.
 * @param openNode What is in focus.
 * @param renamed The path of the node that is renamed.
 * @param move Gives the path that a path has after the rename.
 * @returns The focus with the new path; the same object when the file is not inside the renamed node, and for the config and nothing.
 */
function moveFocusPath(
  openNode: Focus,
  renamed: string,
  move: (path: string) => string
): Focus {
  if (openNode.kind === "file" || openNode.kind === "dependency") {
    return isSameOrInside(openNode.path, renamed)
      ? { ...openNode, path: move(openNode.path) }
      : openNode;
  }
  return openNode;
}

/**
 * Renames a node in its folder with the name the user typed, and ends the rename. The sketch, the focus, the folder the user selected and the closed folders move together, and the tab of the problems panel stays; the folders above the new path open, so that the node shows where it went.
 * @param state The state before.
 * @param path The path of the node.
 * @param typedName The name as typed: it can have a path, which moves the node.
 * @returns The state after and the new path of the node, or why the name is refused. Without `editTree`, the same state and the path of the node, which keeps its name.
 */
export function renameNode(
  state: SessionState,
  path: string,
  typedName: string
): RenameTransition {
  if (!state.capabilities.editTree) {
    return { state, path };
  }

  const result = renameInFolder(state.sketch, path, typedName);

  if ("error" in result) {
    return result;
  }

  const { focus: openNode, pickedFolder, highlight } = state;
  const newPath = result.path;
  const move = (moved: string): string => movePath(moved, path, newPath);

  return {
    path: newPath,
    state: {
      ...state,
      sketch: result.sketch,
      // The dependencies of a renamed file keep their order, so a dependency in focus keeps its index
      focus: moveFocusPath(openNode, path, move),
      highlight:
        highlight !== undefined &&
        isSameOrInside(highlight.dependency.path, path)
          ? {
              ...highlight,
              dependency: {
                ...highlight.dependency,
                path: move(highlight.dependency.path),
              },
            }
          : highlight,
      pickedFolder: pickedFolder === undefined ? undefined : move(pickedFolder),
      closedFolders: openAncestors(
        new Set(Array.from(state.closedFolders, move)),
        newPath
      ),
      renaming: undefined,
    },
  };
}

/**
 * Removes a node and everything under it. What was inside it leaves the focus, the selection, the rename and the closed folders. A dependency in focus follows its file, and its file takes the focus when only its target went.
 * @param state The state before.
 * @param path The path of the node.
 * @returns The state after, or the same one when there is no node at the path or without `editTree`.
 */
export function removeNode(state: SessionState, path: string): SessionState {
  if (!state.capabilities.editTree) {
    return state;
  }

  const isRemoved = (candidate: string | undefined): boolean =>
    candidate !== undefined && isSameOrInside(candidate, path);

  return applyEdit(state, removeSketchNode(state.sketch, path), (sketch) =>
    followSketch(
      {
        ...state,
        pickedFolder: isRemoved(state.pickedFolder)
          ? undefined
          : state.pickedFolder,
        renaming: isRemoved(state.renaming) ? undefined : state.renaming,
        closedFolders: new Set(
          Array.from(state.closedFolders).filter((folder) => !isRemoved(folder))
        ),
      },
      sketch
    )
  );
}

/**
 * Adds a dependency at the end of the dependencies of its file, and puts it in focus: the file shows with the dependency selected, and the problems panel selects its tab. The text draft goes: the file pane stays in text mode, so the edit must not lose against a draft whose next read would bring back the dependencies it had, and text mode shows the text of the new sketch. The lines of the draft that could not be read are lost with it.
 * @param state The state before.
 * @param dependency The dependency to add.
 * @returns The state after, or the same one when the sketch refuses the dependency, such as one whose target is its own file, or without `editDependencies`; the draft stays in both cases.
 */
export function addDependency(
  state: SessionState,
  dependency: SketchDependency
): SessionState {
  if (!state.capabilities.editDependencies) {
    return state;
  }

  return applyEdit(
    state,
    addSketchDependency(state.sketch, dependency),
    (sketch) =>
      openTarget(
        { ...state, sketch, textDraft: undefined },
        {
          kind: "dependency",
          path: dependency.from,
          index: getFileDependencies(sketch, dependency.from).length - 1,
        }
      )
  );
}

/**
 * Replaces a dependency with another one of the same file, in the same position. It stays in focus if it was. The text draft goes, as `addDependency` explains: the lines that could not be read are lost, and text mode shows the text of the new sketch.
 * @param state The state before.
 * @param ref The file and the position of the dependency to replace.
 * @param dependency The dependency that takes its place.
 * @returns The state after, or the same one when the sketch refuses the edit, such as when there is no dependency at the position, or without `editDependencies`; the draft stays in both cases.
 */
export function replaceDependency(
  state: SessionState,
  ref: DependencyRef,
  dependency: SketchDependency
): SessionState {
  return state.capabilities.editDependencies
    ? applyEdit(
        state,
        replaceSketchDependency(state.sketch, ref, dependency),
        (sketch) => followSketch({ ...state, textDraft: undefined }, sketch)
      )
    : state;
}

/**
 * Removes a dependency. The ones after it in its file move up one line, and a dependency in focus moves with them: the one in focus that is removed leaves its file in focus, and the problems panel selects the tab of the node. The text draft goes, as `addDependency` explains: the lines that could not be read are lost, and text mode shows the text of the new sketch.
 * @param state The state before.
 * @param ref The file and the position of the dependency to remove.
 * @returns The state after, or the same one when there is no dependency at the position or without `editDependencies`; the draft stays in both cases.
 */
export function removeDependency(
  state: SessionState,
  ref: DependencyRef
): SessionState {
  return state.capabilities.editDependencies
    ? applyEdit(state, removeSketchDependency(state.sketch, ref), (sketch) =>
        followSketch({ ...state, textDraft: undefined }, sketch)
      )
    : state;
}

/**
 * Replaces the config text. The editor reports an edit of the user with where the highlighted policy is after it, and the text and the range change in one state, so that they never disagree: the highlight stays on the same text, and the evaluation of the new text finds its policy again.
 * @param state The state before.
 * @param config The new config, as JSON5 text.
 * @param highlight Where the editor says the highlighted policy is after the edit: `null` when it has none now, such as when the edit deleted the policy, which drops the highlight, and `undefined` for a text that did not come from the editor, which leaves the highlight as it was.
 * @returns The state after, or the same one when neither the text nor the range changed or without `editConfig`.
 */
export function changeConfig(
  state: SessionState,
  config: string,
  highlight?: TextRange | null
): SessionState {
  if (!state.capabilities.editConfig) {
    return state;
  }

  const sketch =
    config === state.sketch.config
      ? state.sketch
      : setConfig(state.sketch, config);
  const moved = moveHighlightRange(state.highlight, highlight);

  return sketch === state.sketch && moved === state.highlight
    ? state
    : { ...state, sketch, highlight: moved };
}

/**
 * Gets the anchors that still mean something in a state: the ones of the draft the state has, and, of those, the one of the focus when the focus is the object it was made for, and the one of the highlight when the highlight has the dependency object it was made for. A transition that means another draft, focus or highlight makes a new value, so the anchors left behind by one that did not know of them are never read.
 * @param state The state.
 * @param state.textDraft The draft.
 * @param state.textAnchors The anchors the state holds.
 * @param state.focus What is in focus.
 * @param state.highlight The highlight.
 * @returns The anchor of the focus and the anchor of the highlight; each is `undefined` when it is missing or no longer means anything.
 */
function getValidAnchors({
  textDraft,
  textAnchors,
  focus: openNode,
  highlight,
}: SessionState): {
  readonly focus: FocusAnchor | undefined;
  readonly highlight: HighlightAnchor | undefined;
} {
  if (textDraft === undefined || textAnchors?.draft !== textDraft) {
    return { focus: undefined, highlight: undefined };
  }
  return {
    focus:
      textAnchors.focus?.focus === openNode ? textAnchors.focus : undefined,
    highlight:
      highlight !== undefined &&
      textAnchors.highlight?.dependency === highlight.dependency
        ? textAnchors.highlight
        : undefined,
  };
}

/**
 * Moves a line through an edit of the text.
 * @param before The text before the edit.
 * @param after The text after it.
 * @param line The line in the text before, or `undefined` when it already was gone.
 * @returns The line in the text after, or `undefined` when it is gone.
 */
function moveAnchorLine(
  before: string,
  after: string,
  line: number | undefined
): number | undefined {
  return line === undefined ? undefined : moveTextLine(before, after, line);
}

/**
 * Moves the line of the focus through a keystroke. The line of a valid anchor is moved as it is, even when it says that the line is gone; without one, a dependency in focus is looked for in the text before.
 * @param openNode What is in focus.
 * @param anchor The anchor of the focus when it is valid.
 * @param before The text before the keystroke.
 * @param after The text after it.
 * @returns The new anchor, or `undefined` when the focus is not a dependency and has no line that cannot be read to follow.
 */
function moveFocusAnchor(
  openNode: Focus,
  anchor: FocusAnchor | undefined,
  before: string,
  after: string
): FocusAnchor | undefined {
  if (anchor !== undefined) {
    return {
      focus: anchor.focus,
      line: moveAnchorLine(before, after, anchor.line),
    };
  }
  return openNode.kind === "dependency"
    ? {
        focus: openNode,
        line: moveAnchorLine(
          before,
          after,
          getDependencyLine(before, openNode)
        ),
      }
    : undefined;
}

/**
 * Moves the line of the dependency of the highlight through a keystroke, as {@link moveFocusAnchor} does for the focus.
 * @param highlight The highlight, if there is one.
 * @param anchor The anchor of the highlight when it is valid.
 * @param before The text before the keystroke.
 * @param after The text after it.
 * @returns The new anchor, or `undefined` when there is no highlight.
 */
function moveHighlightAnchor(
  highlight: PolicyHighlight | undefined,
  anchor: HighlightAnchor | undefined,
  before: string,
  after: string
): HighlightAnchor | undefined {
  if (highlight === undefined) {
    return undefined;
  }

  const { dependency } = highlight;

  return {
    dependency,
    line: moveAnchorLine(
      before,
      after,
      anchor === undefined ? getDependencyLine(before, dependency) : anchor.line
    ),
  };
}

/**
 * Moves the anchors of a state through a keystroke, so that they say where the dependency in focus and the dependency of the highlight are written in the new draft. A new draft (the state had none) starts from the text of the sketch, never from an old anchor.
 * @param state The state before the keystroke.
 * @param after The whole text after the keystroke.
 * @returns The anchors for the new draft, or `undefined` when nothing is to be followed or the dependency lines are not read.
 */
function moveTextAnchors(
  state: SessionState,
  after: string
): TextAnchors | undefined {
  // Without `editDependencies` the dependency lines are ignored, so nothing can follow a line of them: the dependencies of the sketch stay as they are
  if (!state.capabilities.editDependencies) {
    return undefined;
  }

  const before = state.textDraft ?? toText(state.sketch);
  const valid = getValidAnchors(state);
  const focusAnchor = moveFocusAnchor(state.focus, valid.focus, before, after);
  const highlightAnchor = moveHighlightAnchor(
    state.highlight,
    valid.highlight,
    before,
    after
  );

  return focusAnchor === undefined && highlightAnchor === undefined
    ? undefined
    : { draft: after, focus: focusAnchor, highlight: highlightAnchor };
}

/**
 * Keeps what the user typed in text mode, and moves with the keystroke the line where the dependency in focus is written and the line of the dependency of the highlight, so that the next read puts them back on the dependencies of those lines. The draft is the only way that text reaches the sketch, so without it `readText` and `settleText` have nothing to read.
 * @param state The state before.
 * @param text The whole text.
 * @returns The state after, or the same one without `editTree`.
 */
export function setTextDraft(state: SessionState, text: string): SessionState {
  return text === state.textDraft || !state.capabilities.editTree
    ? state
    : {
        ...state,
        textDraft: text,
        textAnchors: moveTextAnchors(state, text),
      };
}

/**
 * Decides the focus after a read of the draft by what is written at the line of its anchor. A dependency line that was read puts the focus on that dependency; an indented line that cannot be read, on its file; and a line that is gone, or that is no dependency line any more, on the file of the focus when the sketch still has it, and on nothing otherwise.
 * @param anchor The anchor of the focus.
 * @param draft The draft that was read.
 * @param sketch The sketch that the draft gave.
 * @returns The focus and its anchor: the same objects when nothing changed, the anchor with the new focus when the line can be read or not read, and none once the line is gone.
 */
function readFocusLine(
  anchor: FocusAnchor,
  draft: string,
  sketch: Sketch
): { readonly focus: Focus; readonly anchor: FocusAnchor | undefined } {
  const { focus: openNode, line } = anchor;
  const found =
    line === undefined ? undefined : getDependencyAtLine(draft, line);

  if (found === undefined) {
    return {
      focus: getFiles(sketch).includes(openNode.path)
        ? getFileFocus(openNode, openNode.path)
        : NO_FOCUS,
      anchor: undefined,
    };
  }

  const next =
    found.index === undefined
      ? getFileFocus(openNode, found.path)
      : getDependencyFocus(openNode, found.path, found.index);

  return {
    focus: next,
    anchor: next === openNode ? anchor : { focus: next, line },
  };
}

/**
 * Decides the highlight after a read of the draft by what is written at the line of its anchor. A dependency line that was read gives the highlight that dependency; a line that cannot be read leaves the highlight and its anchor as they are, until it reads again; a line that is gone, or that is no dependency line any more, drops the highlight.
 * @param highlight The highlight.
 * @param anchor The anchor of the highlight.
 * @param draft The draft that was read.
 * @returns The highlight and its anchor: the same objects when nothing changed.
 */
function readHighlightLine(
  highlight: PolicyHighlight,
  anchor: HighlightAnchor,
  draft: string
): {
  readonly highlight: PolicyHighlight | undefined;
  readonly anchor: HighlightAnchor | undefined;
} {
  const found =
    anchor.line === undefined
      ? undefined
      : getDependencyAtLine(draft, anchor.line);

  if (found === undefined) {
    return { highlight: undefined, anchor: undefined };
  }

  const { dependency } = highlight;

  if (
    found.index === undefined ||
    (found.path === dependency.path && found.index === dependency.index)
  ) {
    return { highlight, anchor };
  }

  const moved = {
    ...highlight,
    dependency: { path: found.path, index: found.index },
  };

  return {
    highlight: moved,
    anchor: { dependency: moved.dependency, line: anchor.line },
  };
}

/**
 * Keeps the anchors a read of the draft leaves. Only the ones that still mean something are kept, with the focus and the dependency the read gave them.
 * @param state The state before the read.
 * @param draft The draft that was read.
 * @param anchors The anchors that stay: the focus and the highlight that the read decided.
 * @param anchors.focus The anchor of the focus.
 * @param anchors.highlight The anchor of the highlight.
 * @returns The anchors of the state: the same object when they did not change, and `undefined` when none stays.
 */
function keepAnchors(
  state: SessionState,
  draft: string,
  {
    focus: focusAnchor,
    highlight: highlightAnchor,
  }: Pick<TextAnchors, "focus" | "highlight">
): TextAnchors | undefined {
  const { textAnchors } = state;

  if (
    focusAnchor === textAnchors?.focus &&
    highlightAnchor === textAnchors?.highlight
  ) {
    return textAnchors;
  }
  return focusAnchor === undefined && highlightAnchor === undefined
    ? undefined
    : { draft, focus: focusAnchor, highlight: highlightAnchor };
}

/**
 * Moves the focus and the highlight with the sketch that a draft gave. When the state has anchors for them, they follow the lines of the draft: the focus is decided by what is at the line of its anchor, and the highlight by the line of its own. Without an anchor, they follow the sketch as the edits of the tree do, by the data of the dependencies.
 * @param state The state before.
 * @param draft The draft that was read.
 * @param sketch The sketch that the draft gave.
 * @returns The state after: the same one when the project, the focus, the highlight and the anchors are as they were.
 */
function followDraft(
  state: SessionState,
  draft: string,
  sketch: Sketch
): SessionState {
  const changed = !isSameProject(state.sketch, sketch);
  const valid = getValidAnchors(state);
  const followedFocus =
    valid.focus === undefined
      ? {
          focus: changed
            ? moveFocus(state.focus, state.sketch, sketch)
            : state.focus,
          anchor: undefined,
        }
      : readFocusLine(valid.focus, draft, sketch);
  const followedHighlight =
    state.highlight !== undefined && valid.highlight !== undefined
      ? readHighlightLine(state.highlight, valid.highlight, draft)
      : {
          highlight: changed
            ? moveHighlight(state.highlight, state.sketch, sketch)
            : state.highlight,
          anchor: undefined,
        };
  const textAnchors = keepAnchors(state, draft, {
    focus: followedFocus.anchor,
    highlight: followedHighlight.anchor,
  });

  if (
    !changed &&
    followedFocus.focus === state.focus &&
    followedHighlight.highlight === state.highlight
  ) {
    return textAnchors === state.textAnchors
      ? state
      : { ...state, textAnchors };
  }
  return {
    ...followSketch(state, changed ? sketch : state.sketch, {
      focus: followedFocus.focus,
      highlight: followedHighlight.highlight,
    }),
    textAnchors,
  };
}

/**
 * Reads the text the user typed into the sketch. Lines that cannot be read are left out of the sketch, and the draft keeps them so that the user can fix them. A source that names no file exactly is read with the rule of the playground, which adds an extension or `/index` to it. The dependency lines of the text are read only when the host lets the user edit dependencies; otherwise they are ignored, and the dependencies of the sketch stay as they were, as far as their files remain.
 * @param state The state before.
 * @param settle Whether the user is done with the text: when every line was read, the draft goes with its anchors, and the text is the sketch's again, in the order of the tree.
 * @returns The state after. A dependency in focus and the dependency of a highlight follow the line they are written at in the draft, as every keystroke moved it: the focus is on the dependency that line says, on its file while the line cannot be read (the node's tab replaces the dependency's, and comes back with the dependency), and on the file of the dependency, or on nothing, when the line is gone; the highlight takes the dependency of its line, stays as it is while the line cannot be read, and goes when the line is gone. This holds while the focus and the highlight are the ones the last keystroke saw. If either was changed since, such as by opening a dependency from the problems panel, it follows the sketch instead, by the data of the dependencies: a dependency stays on its line when the line still says the same or says something new (as long as the file has as many lines), and otherwise follows the line that says the same, and its file is in focus when the line is gone.
 */
function readDraft(state: SessionState, settle: boolean): SessionState {
  const { textDraft } = state;

  if (textDraft === undefined) {
    return state;
  }

  // Without `editDependencies` the dependency lines are neither read nor reported, as `getTextProblems` reads them, so a draft whose nodes were all read settles
  const { sketch, problems } = fromText(textDraft, state.sketch, {
    dependencies: state.capabilities.editDependencies,
  });
  const read = followDraft(state, textDraft, sketch);

  return settle && problems.length === 0
    ? { ...read, textDraft: undefined, textAnchors: undefined }
    : read;
}

/**
 * Reads the text the user typed into the sketch, while the user is still typing: the draft stays, and so do the anchors, which the next keystroke moves. The focus and the highlight follow the lines of their dependencies, as {@link readDraft} says.
 * @param state The state before.
 * @returns The state after.
 */
export function readText(state: SessionState): SessionState {
  return readDraft(state, false);
}

/**
 * Reads the text the user typed into the sketch when the user is done with it, such as when the text loses the focus. When every line was read, the text is the sketch's again and the anchors go with the draft; otherwise the draft and the anchors stay. The focus and the highlight follow the lines of their dependencies, as {@link readDraft} says.
 * @param state The state before.
 * @returns The state after.
 */
export function settleText(state: SessionState): SessionState {
  return readDraft(state, true);
}

/**
 * Selects a tab of the problems panel, and expands the panel: a tab that is pressed while the panel is collapsed is pressed to read it. The sketch's and the node's tabs are accepted while a dependency is in focus, so that the user can read them without losing the dependency.
 * @param state The state before.
 * @param tab The tab.
 * @returns The state after.
 */
export function selectTab(
  state: SessionState,
  tab: ProblemsTabId
): SessionState {
  return tab === state.tab && !state.problemsCollapsed
    ? state
    : { ...state, tab, problemsCollapsed: false };
}

/**
 * Collapses or expands the problems panel.
 * @param state The state before.
 * @param collapsed Whether the panel shows its head only.
 * @returns The state after.
 */
export function setProblemsCollapsed(
  state: SessionState,
  collapsed: boolean
): SessionState {
  return collapsed === state.problemsCollapsed
    ? state
    : { ...state, problemsCollapsed: collapsed };
}

/**
 * Keeps the evaluation on screen and how it stands to the sketch. When a new evaluation is of the config text the sketch has, the highlighted policy is found again in it, by where the range of the highlight starts: the policies may have moved or changed index since the highlight was set, and the note names the index of the evaluation. While the evaluation is behind the text, such as during the delay of the store after the last keystroke, the highlight keeps the index it had.
 * @param state The state before.
 * @param evaluation The evaluation on screen: the evaluation of the sketch, or the last one aligned to the sketch, or `undefined` while there is none.
 * @param evaluationStatus How the evaluation stands to the sketch.
 * @returns The state after, or the same state when both are as they were.
 */
export function setEvaluation(
  state: SessionState,
  evaluation: Evaluation | undefined,
  evaluationStatus: EvaluationStatus
): SessionState {
  if (
    evaluation === state.evaluation &&
    evaluationStatus === state.evaluationStatus
  ) {
    return state;
  }

  return {
    ...state,
    evaluation,
    evaluationStatus,
    highlight:
      evaluation !== undefined &&
      evaluation !== state.evaluation &&
      evaluation.sketch.config === state.sketch.config
        ? findHighlightPolicy(state.highlight, evaluation.policies)
        : state.highlight,
  };
}
