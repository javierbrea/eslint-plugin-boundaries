import type { Sketch, SketchDependency, SketchNode } from "../contract";

import {
  getParentPath,
  isSameOrInside,
  joinPath,
  movePath,
  normalizePath,
} from "./Paths";
import type { EditResult, RenameResult } from "./Sketch.types";
import { canonicalizeNodes, getAddError, getNodeKind, hasNode } from "./Tree";

const NOT_FOUND = "There is no file or folder at that path.";

const MOVE_INTO_ITSELF = "A folder cannot be moved into itself.";

/**
 * Adds a counter before the extension of a name, so that `new-file.js` becomes `new-file-2.js`. A leading dot, as in `.gitignore`, is not an extension.
 * @param fileName A name that has no counter.
 * @param counter The number to add.
 */
function addCounter(fileName: string, counter: number): string {
  return fileName.replace(
    /^(.+?)((?:\.[^.]+)?)$/s,
    (_match, stem: string, extension: string) =>
      `${stem}-${counter}${extension}`
  );
}

/**
 * Makes the dependencies follow a moved file or folder: the `from` of each one and the path of its node target.
 * @param dependencies The dependencies of the sketch.
 * @param from The path of the file or folder that moves.
 * @param to The path it moves to.
 */
function moveDependencies(
  dependencies: readonly SketchDependency[],
  from: string,
  to: string
): readonly SketchDependency[] {
  return dependencies.map((dependency) => ({
    ...dependency,
    from: movePath(dependency.from, from, to),
    target:
      dependency.target.kind === "node"
        ? {
            ...dependency.target,
            path: movePath(dependency.target.path, from, to),
          }
        : dependency.target,
  }));
}

/**
 * Adds a file or a folder. A folder that was empty and now has the node under it is no longer a node of its own: the new node implies it.
 * @param sketch The sketch to edit. It is not changed.
 * @param path The path of the new node, as {@link normalizePath} returns it.
 * @param kind Whether to add a file or a folder.
 * @returns The new sketch, or the reason why the node cannot be added: the path is invalid, there is already a node there, or a file is above it.
 */
export function addNode(
  sketch: Sketch,
  path: string,
  kind: SketchNode["kind"]
): EditResult {
  const error = getAddError(sketch.tree, path, kind);

  if (error !== undefined) {
    return { error };
  }
  return {
    sketch: {
      ...sketch,
      tree: canonicalizeNodes([...sketch.tree, { path, kind }]),
    },
  };
}

/**
 * Renames a file or a folder, which can move it to another folder. A folder takes everything under it with it, and the dependencies follow: the `from` of each one and the path of its node target.
 * @param sketch The sketch to edit. It is not changed.
 * @param path The path of the file or folder to rename.
 * @param newPath The new path, as {@link normalizePath} returns it. It is the same path when the node does not change.
 * @returns The new sketch, or the reason why the node cannot be renamed: there is no node at `path`, a folder would move into itself, or `newPath` is refused as {@link addNode} refuses it.
 */
export function renameNode(
  sketch: Sketch,
  path: string,
  newPath: string
): EditResult {
  const kind = getNodeKind(sketch.tree, path);

  if (kind === undefined) {
    return { error: NOT_FOUND };
  }
  if (kind === "folder" && newPath.startsWith(`${path}/`)) {
    return { error: MOVE_INTO_ITSELF };
  }

  // The new path is checked against what stays: the node that moves does not conflict with itself
  const staying = sketch.tree.filter(
    (node) => !isSameOrInside(node.path, path)
  );
  const error = getAddError(staying, newPath, kind);

  if (error !== undefined) {
    return { error };
  }

  const moved = sketch.tree
    .filter((node) => isSameOrInside(node.path, path))
    .map((node) => ({
      ...node,
      path: movePath(node.path, path, newPath),
    }));

  return {
    sketch: {
      ...sketch,
      tree: canonicalizeNodes([...staying, ...moved]),
      dependencies: moveDependencies(sketch.dependencies, path, newPath),
    },
  };
}

/**
 * Renames a file or a folder with the name a user typed for it, in the folder it is in. The name can have a path, which moves the node: it is joined to the folder, as {@link renameNode} takes it.
 * @param sketch The sketch to edit. It is not changed.
 * @param path The path of the file or folder to rename.
 * @param typedName The name as typed. It is cleaned up as {@link normalizePath} does, and an empty name is refused as an empty path is.
 * @returns The new sketch and the new path of the node, or the reason why the node cannot be renamed, as {@link renameNode} gives it. When the name leaves the path as it was, the same sketch and path: nothing is edited.
 */
export function renameInFolder(
  sketch: Sketch,
  path: string,
  typedName: string
): RenameResult {
  const { path: cleaned } = normalizePath(typedName);
  // An empty name has no folder in front of it, so that the reason is the one of an empty path
  const newPath =
    cleaned === "" ? cleaned : joinPath(getParentPath(path), cleaned);

  if (newPath === path) {
    return { sketch, path };
  }

  const result = renameNode(sketch, path, newPath);

  return "error" in result ? result : { sketch: result.sketch, path: newPath };
}

/**
 * Removes a file, or a folder and everything under it. The dependencies from or to what is removed go with it.
 * @param sketch The sketch to edit. It is not changed.
 * @param path The path of the file or folder to remove.
 * @returns The new sketch, or the reason why there is nothing to remove.
 */
export function removeNode(sketch: Sketch, path: string): EditResult {
  if (getNodeKind(sketch.tree, path) === undefined) {
    return { error: NOT_FOUND };
  }
  return {
    sketch: {
      ...sketch,
      tree: canonicalizeNodes(
        sketch.tree.filter((node) => !isSameOrInside(node.path, path))
      ),
      dependencies: sketch.dependencies.filter(
        ({ from, target }) =>
          !isSameOrInside(from, path) &&
          !(target.kind === "node" && isSameOrInside(target.path, path))
      ),
    },
  };
}

/**
 * Replaces the config text.
 * @param sketch The sketch to edit. It is not changed.
 * @param config The new config, as JSON5 text. It is not checked: the engine reports what is wrong with it.
 * @returns The new sketch. A config is never refused, so it is not an {@link EditResult}.
 */
export function setConfig(sketch: Sketch, config: string): Sketch {
  return { ...sketch, config };
}

/**
 * Finds a free path for a new node: `base`, then `base-2`, `base-3` and so on, with the counter before the extension of a file, as in `new-file-2.js`.
 * @param sketch The sketch to read.
 * @param folder The folder of the new node, or an empty string for the root.
 * @param base The first name to try, such as `new-file.js` or `new-folder`.
 * @returns The full path of the first name that is free in the folder.
 */
export function getUniquePath(
  sketch: Sketch,
  folder: string,
  base: string
): string {
  for (let counter = 1; ; counter += 1) {
    const path = joinPath(
      folder,
      counter === 1 ? base : addCounter(base, counter)
    );

    if (!hasNode(sketch, path)) {
      return path;
    }
  }
}
