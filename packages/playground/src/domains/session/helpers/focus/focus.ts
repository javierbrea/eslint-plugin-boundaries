import type { Sketch, SketchDependency } from "@/contract";
import type {
  PolicySummary,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import {
  getFileDependencies,
  getFiles,
  isSameDependency,
} from "@/domains/project/helpers/sketch";

import type { Focus, PolicyHighlight } from "./focus.types";

/** Nothing in focus. */
const NO_FOCUS: Focus = { kind: "none" };

/**
 * Gets the file that a focus is on: the open file, which a dependency in focus belongs to.
 * @param openNode What is in focus.
 * @returns The path of the file for a file or a dependency in focus, and `undefined` for the config and for nothing.
 */
export function getFocusedPath(openNode: Focus): string | undefined {
  return openNode.kind === "file" || openNode.kind === "dependency"
    ? openNode.path
    : undefined;
}

/**
 * Finds a dependency among the ones of its file after the text of text mode built all of them again, which leaves no object to tell them apart: by their data. With as many lines as before, the line stays where it is when it still says the same or says something that no line said before, so that editing a line in place, or turning another line into what it says, does not move the focus; otherwise several lines can say the same, and the dependency in focus is the one that has as many equal lines before it as it had, which is how lines that were swapped are followed.
 * @param openNode The dependency in focus before the edit.
 * @param dependency The dependency in focus, as the sketch before holds it.
 * @param before The dependencies of its file before the edit.
 * @param after The dependencies of its file after the edit.
 * @returns The same focus when the line did not move, the focus on the line that says the same, or on the same line when it was edited in place (nothing equal, and as many lines as before), and `undefined` when the line is gone.
 */
function followRewrittenDependency(
  openNode: Extract<Focus, { kind: "dependency" }>,
  dependency: SketchDependency,
  before: readonly SketchDependency[],
  after: readonly SketchDependency[]
): Focus | undefined {
  const atIndex = after[openNode.index];

  // As many lines as before: the line is where it was when it says the same, or when it says something that no line said before, which is an edit in place. A line that says what another line said was swapped with it
  if (
    after.length === before.length &&
    atIndex !== undefined &&
    (isSameDependency(atIndex, dependency) ||
      !before.some((candidate) => isSameDependency(candidate, atIndex)))
  ) {
    return openNode;
  }

  const equalBefore = before
    .slice(0, openNode.index)
    .filter((candidate) => isSameDependency(candidate, dependency)).length;
  const equalAfter = after.flatMap((candidate, position) =>
    isSameDependency(candidate, dependency) ? [position] : []
  );
  const index = equalAfter[equalBefore];

  if (index !== undefined) {
    return index === openNode.index ? openNode : { ...openNode, index };
  }
  // The line is not there, and the text may have changed it: it is the same line when no line was added or deleted
  return after.length === before.length ? openNode : undefined;
}

/**
 * Moves a dependency in focus with an edit of the sketch that changed its dependencies, so that the focus keeps pointing at the dependency the user had open. The edits keep a dependency they do not touch as the same object, and the text of text mode builds all of them again, which tells the two apart.
 * @param openNode The dependency in focus before the edit.
 * @param before The sketch before the edit.
 * @param after The sketch after the edit.
 * @returns The same focus when the dependency is where it was, the dependency at its new index when others before it in its file went or the text moved it, its file when the dependency is gone and the file is not, and nothing when the file is gone too.
 */
function moveDependencyFocus(
  openNode: Extract<Focus, { kind: "dependency" }>,
  before: Sketch,
  after: Sketch
): Focus {
  const fileFocus: Focus = getFiles(after).includes(openNode.path)
    ? { kind: "file", path: openNode.path }
    : NO_FOCUS;
  const beforeList = getFileDependencies(before, openNode.path);
  const afterList = getFileDependencies(after, openNode.path);
  const dependency = beforeList[openNode.index];

  if (dependency === undefined) {
    return fileFocus;
  }

  // A dependency that survives is the same object: removing a node drops some dependencies and keeps the others as they were
  const index = afterList.indexOf(dependency);

  if (index !== -1) {
    return index === openNode.index ? openNode : { ...openNode, index };
  }

  // No dependency of the file is an object of before: the text built them again, and the lines are told apart by what they say
  if (afterList.every((candidate) => !beforeList.includes(candidate))) {
    return (
      followRewrittenDependency(openNode, dependency, beforeList, afterList) ??
      fileFocus
    );
  }

  // The dependency is not there: an edit dropped it, and the one at its index is another, or an edit replaced it by another one and the one at its index is that one
  const isReplaced = afterList.some(
    (candidate) => !beforeList.includes(candidate)
  );

  return isReplaced && afterList[openNode.index] !== undefined
    ? openNode
    : fileFocus;
}

/**
 * Moves the focus with an edit of the sketch that removed nodes or changed dependencies: a file that is gone leaves nothing in focus, and a dependency follows {@link moveDependencyFocus}. The config and nothing stay as they are. A rename is not here: it moves the path of the focus before anything else.
 * @param openNode What is in focus before the edit.
 * @param before The sketch before the edit.
 * @param after The sketch after the edit.
 * @returns The focus after the edit; the same object when it did not move.
 */
export function moveFocus(
  openNode: Focus,
  before: Sketch,
  after: Sketch
): Focus {
  if (openNode.kind === "file") {
    return getFiles(after).includes(openNode.path) ? openNode : NO_FOCUS;
  }
  return openNode.kind === "dependency"
    ? moveDependencyFocus(openNode, before, after)
    : openNode;
}

/**
 * Moves the dependency that a highlight came from with an edit of the sketch, as {@link moveFocus} moves the focus.
 * @param highlight The highlight, if there is one.
 * @param before The sketch before the edit.
 * @param after The sketch after the edit.
 * @returns The highlight with the dependency where it is now, the same object when it did not move, and `undefined` when there was none or the dependency is gone: the note could not say where the policy came from.
 */
export function moveHighlight(
  highlight: PolicyHighlight | undefined,
  before: Sketch,
  after: Sketch
): PolicyHighlight | undefined {
  if (highlight === undefined) {
    return undefined;
  }

  const opened: Focus = { kind: "dependency", ...highlight.dependency };
  const moved = moveFocus(opened, before, after);

  if (moved.kind !== "dependency") {
    return undefined;
  }
  return moved === opened
    ? highlight
    : { ...highlight, dependency: { path: moved.path, index: moved.index } };
}

/**
 * Moves the range of a highlight with an edit of the config that the editor reported: the editor moves the range through the changes of the text, and reports it with the text.
 * @param highlight The highlight, if there is one.
 * @param range Where the editor says the highlight is after the edit: `null` when it has none, such as when the edit deleted the policy, and `undefined` when the text did not come from an edit of the editor, which says nothing of the highlight.
 * @returns The highlight with the range of the editor, the same object when the range is the one it had or the editor said nothing, and `undefined` when there was none or the editor has none now.
 */
export function moveHighlightRange(
  highlight: PolicyHighlight | undefined,
  range: TextRange | null | undefined
): PolicyHighlight | undefined {
  if (highlight === undefined || range === undefined) {
    return highlight;
  }
  if (range === null) {
    return undefined;
  }

  const { range: known } = highlight;

  return known.from === range.from &&
    known.to === range.to &&
    known.line === range.line &&
    known.column === range.column
    ? highlight
    : { ...highlight, range };
}

/**
 * Finds the policy of a highlight again in the policies of an evaluation of the config text where the highlight is: the policy that starts where the range of the highlight starts. The index of a policy changes when the user adds or deletes one before it, and its range moves with every edit, so the range is what finds it.
 * @param highlight The highlight, if there is one.
 * @param policies The policies of the evaluated rule and its default, as the evaluation lists them.
 * @returns The highlight with the index of the policy that starts at its range (`null` for the default) and without an index when none does, the same object when the index is the one it had, and `undefined` when there was no highlight.
 */
export function findHighlightPolicy(
  highlight: PolicyHighlight | undefined,
  policies: readonly Pick<PolicySummary, "index" | "range">[]
): PolicyHighlight | undefined {
  if (highlight === undefined) {
    return undefined;
  }

  const policy = policies.find(
    ({ range }) => range.from === highlight.range.from
  )?.index;

  return policy === highlight.policy ? highlight : { ...highlight, policy };
}
