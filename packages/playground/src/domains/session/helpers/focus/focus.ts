import type { Sketch } from "@/contract";
import {
  getDependency,
  getFileDependencies,
  getFiles,
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
 * Moves a dependency in focus with an edit of the sketch that changed its dependencies, so that the focus keeps pointing at the dependency the user had open. The edits keep a dependency they do not touch as the same object, and the text of text mode builds them again, which tells the two apart.
 * @param openNode The dependency in focus before the edit.
 * @param before The sketch before the edit.
 * @param after The sketch after the edit.
 * @returns The same focus when the dependency is where it was, the dependency at its new index when others before it in its file went, its file when the dependency is gone and the file is not, and nothing when the file is gone too.
 */
function moveDependencyFocus(
  openNode: Extract<Focus, { kind: "dependency" }>,
  before: Sketch,
  after: Sketch
): Focus {
  const fileFocus: Focus = getFiles(after).includes(openNode.path)
    ? { kind: "file", path: openNode.path }
    : NO_FOCUS;
  const dependency = getDependency(before, openNode);

  if (dependency === undefined) {
    return fileFocus;
  }

  // A dependency that survives is the same object: removing a node drops some dependencies and keeps the others as they were
  const index = getFileDependencies(after, dependency.from).indexOf(dependency);

  if (index !== -1) {
    return index === openNode.index ? openNode : { ...openNode, index };
  }

  // The dependency is not there: either an edit dropped it, and the one at its index is another, or the text built every dependency again and the one at its index is the same line
  const isRewritten = after.dependencies.some(
    (candidate) => !before.dependencies.includes(candidate)
  );

  return isRewritten && getDependency(after, openNode) !== undefined
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
