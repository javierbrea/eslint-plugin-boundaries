import type { Sketch } from "@/contract";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import {
  CONFIG_PATH,
  addNode as addSketchNode,
  fromText,
  getFiles,
  getParentPath,
  getUniquePath,
  hasNode,
  isSameOrInside,
  isSameProject,
  movePath,
  removeNode as removeSketchNode,
  renameInFolder,
  setConfig,
} from "@/domains/project/helpers/sketch";
import type { EditResult } from "@/domains/project/helpers/sketch";
import type {
  Focus,
  ProblemsTabId,
  ProjectView,
  Target,
} from "@/domains/session/helpers/focus";

import type { SessionState } from "./sessionState.types";
import type { RenameTransition } from "./transitions.types";

const NO_FOCUS: Focus = { kind: "none" };

const CONFIG_FOCUS: Focus = { kind: "config" };

/** The folders the user closed, before the user closes any. */
const NONE_CLOSED: ReadonlySet<string> = new Set();

/** Names that a new file and a new folder start with, until the user renames them. */
const NEW_NAMES = { file: "new-file.js", folder: "new-folder" } as const;

/**
 * Creates the state an instance starts with: the sketch and its evaluation, with nothing in focus, the project as a tree with every folder open, and the problems panel open on the sketch.
 * @param sketch The sketch to start from.
 * @param evaluation What the engine says about it.
 * @returns The first state.
 */
export function createSessionState(
  sketch: Sketch,
  evaluation: Evaluation
): SessionState {
  return {
    sketch,
    evaluation,
    focus: NO_FOCUS,
    tab: "sketch",
    problemsCollapsed: false,
    reveal: undefined,
    revealCount: 0,
    view: "tree",
    textDraft: undefined,
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
 * Leaves nothing in focus. The tab of the problems panel goes back to the sketch's, and the range to reveal, which belongs to the config, goes.
 * @param state The state before.
 * @returns The state after.
 */
function closeFocus(state: SessionState): SessionState {
  return { ...state, focus: NO_FOCUS, tab: "sketch", reveal: undefined };
}

/**
 * Replaces the sketch with one that the text made. A file in focus that the new sketch no longer has, such as one whose line was deleted in text mode, leaves nothing in focus.
 * @param state The state before.
 * @param sketch The new sketch.
 * @returns The state after.
 */
function replaceSketch(state: SessionState, sketch: Sketch): SessionState {
  const { focus: openNode } = state;

  return openNode.kind === "file" && !getFiles(sketch).includes(openNode.path)
    ? closeFocus({ ...state, sketch })
    : { ...state, sketch };
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
  return openNode.kind === "file" ? getParentPath(openNode.path) : "";
}

/**
 * Opens a target: puts it in focus, selects the tab of the node in focus and shows the node in the tree. A config target with a range scrolls the editor to it; the range of a request that was already shown stays, so that the editor does not scroll again.
 * @param state The state before.
 * @param target What to open.
 * @returns The state after.
 */
export function openTarget(state: SessionState, target: Target): SessionState {
  const { focus: openNode } = state;
  let nextFocus: Focus = CONFIG_FOCUS;

  if (target.kind === "file") {
    nextFocus =
      openNode.kind === "file" && openNode.path === target.path
        ? openNode
        : { kind: "file", path: target.path };
  }

  const opened: SessionState = {
    ...state,
    focus: nextFocus,
    tab: "node",
    // The focus replaces the folder the user selected, and shows even if a folder above it is closed
    pickedFolder: undefined,
    closedFolders:
      target.kind === "file"
        ? openAncestors(state.closedFolders, target.path)
        : state.closedFolders,
    // The range to reveal belongs to the config, so it goes when the focus leaves it
    reveal: target.kind === "config" ? state.reveal : undefined,
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
 * @returns The state after.
 */
export function addNode(
  state: SessionState,
  kind: "file" | "folder"
): SessionState {
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
 * @returns The state after.
 */
export function startRename(state: SessionState, path: string): SessionState {
  return path === state.renaming ? state : { ...state, renaming: path };
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
 * Renames a node in its folder with the name the user typed, and ends the rename. The sketch, the focus, the folder the user selected and the closed folders move together, and the tab of the problems panel stays; the folders above the new path open, so that the node shows where it went.
 * @param state The state before.
 * @param path The path of the node.
 * @param typedName The name as typed: it can have a path, which moves the node.
 * @returns The state after and the new path of the node, or why the name is refused.
 */
export function renameNode(
  state: SessionState,
  path: string,
  typedName: string
): RenameTransition {
  const result = renameInFolder(state.sketch, path, typedName);

  if ("error" in result) {
    return result;
  }

  const { focus: openNode, pickedFolder } = state;
  const newPath = result.path;
  const move = (moved: string): string => movePath(moved, path, newPath);

  return {
    path: newPath,
    state: {
      ...state,
      sketch: result.sketch,
      focus:
        openNode.kind === "file" && isSameOrInside(openNode.path, path)
          ? { kind: "file", path: move(openNode.path) }
          : openNode,
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
 * Removes a node and everything under it. What was inside it leaves the focus, the selection, the rename and the closed folders.
 * @param state The state before.
 * @param path The path of the node.
 * @returns The state after, or the same one when there is no node at the path.
 */
export function removeNode(state: SessionState, path: string): SessionState {
  const isRemoved = (candidate: string | undefined): boolean =>
    candidate !== undefined && isSameOrInside(candidate, path);

  return applyEdit(state, removeSketchNode(state.sketch, path), (sketch) => {
    const removed: SessionState = {
      ...state,
      sketch,
      pickedFolder: isRemoved(state.pickedFolder)
        ? undefined
        : state.pickedFolder,
      renaming: isRemoved(state.renaming) ? undefined : state.renaming,
      closedFolders: new Set(
        Array.from(state.closedFolders).filter((folder) => !isRemoved(folder))
      ),
    };
    const { focus: openNode } = state;

    return openNode.kind === "file" && isRemoved(openNode.path)
      ? closeFocus(removed)
      : removed;
  });
}

/**
 * Replaces the config text.
 * @param state The state before.
 * @param config The new config, as JSON5 text.
 * @returns The state after, or the same one when the text did not change.
 */
export function changeConfig(
  state: SessionState,
  config: string
): SessionState {
  return config === state.sketch.config
    ? state
    : { ...state, sketch: setConfig(state.sketch, config) };
}

/**
 * Keeps what the user typed in text mode.
 * @param state The state before.
 * @param text The whole text.
 * @returns The state after.
 */
export function setTextDraft(state: SessionState, text: string): SessionState {
  return text === state.textDraft ? state : { ...state, textDraft: text };
}

/**
 * Reads the text the user typed into the sketch. Lines that cannot be read are left out of the sketch, and the draft keeps them so that the user can fix them.
 * @param state The state before.
 * @param settle Whether the user is done with the text: when every line was read, the draft goes, and the text is the sketch's again, in the order of the tree.
 * @returns The state after.
 */
function readDraft(state: SessionState, settle: boolean): SessionState {
  const { textDraft } = state;

  if (textDraft === undefined) {
    return state;
  }

  const result = fromText(textDraft, state.sketch);
  const read = isSameProject(state.sketch, result.sketch)
    ? state
    : replaceSketch(state, result.sketch);

  return settle && result.problems.length === 0
    ? { ...read, textDraft: undefined }
    : read;
}

/**
 * Reads the text the user typed into the sketch, while the user is still typing: the draft stays.
 * @param state The state before.
 * @returns The state after.
 */
export function readText(state: SessionState): SessionState {
  return readDraft(state, false);
}

/**
 * Reads the text the user typed into the sketch when the user is done with it, such as when the text loses the focus. When every line was read, the text is the sketch's again.
 * @param state The state before.
 * @returns The state after.
 */
export function settleText(state: SessionState): SessionState {
  return readDraft(state, true);
}

/**
 * Selects a tab of the problems panel, and expands the panel: a tab that is pressed while the panel is collapsed is pressed to read it.
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
 * Keeps a new evaluation of the sketch.
 * @param state The state before.
 * @param evaluation What the engine says about the sketch.
 * @returns The state after.
 */
export function setEvaluation(
  state: SessionState,
  evaluation: Evaluation
): SessionState {
  return evaluation === state.evaluation ? state : { ...state, evaluation };
}
