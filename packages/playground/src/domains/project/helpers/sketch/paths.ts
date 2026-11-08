import { CONFIG_PATH } from "./sketch.constants";
import type { NormalizedPath } from "./sketch.types";

/**
 * Cleans up a path as a user wrote it: it trims it, turns `\` into `/`, collapses repeated `/` and drops a leading `./` or `/`. A trailing `/` marks a folder and is returned apart.
 * @param input The path as written.
 * @returns The path and whether it marks a folder. The path is not checked: use {@link getPathError} for that.
 */
export function normalizePath(input: string): NormalizedPath {
  const unified = input
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");

  return {
    path: unified.replace(/^(?:\.?\/)+/, "").replace(/\/$/, ""),
    isFolder: unified.endsWith("/"),
  };
}

/**
 * Tells whether a character is an ASCII control character.
 * @param char A single character.
 */
function isControlCharacter(char: string): boolean {
  const code = char.charCodeAt(0);

  return code < 32 || code === 127;
}

/**
 * Tells why a path cannot be a node of the sketch.
 * @param path A path, as {@link normalizePath} returns it.
 * @returns The reason as a sentence for the user, or `undefined` when the path is valid.
 */
export function getPathError(path: string): string | undefined {
  if (path === "") {
    return "The path is empty.";
  }

  const segments = path.split("/");

  if (segments.includes("")) {
    return "The path has an empty segment.";
  }
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return "The path cannot have `.` or `..` segments.";
  }
  if (Array.from(path).some(isControlCharacter)) {
    return "The path cannot have control characters.";
  }
  // A statement writes the path of a target between quotes, so that no path the sketch holds can have one
  if (/["'\\]/.test(path)) {
    return "A path cannot have quotes or backslashes.";
  }
  // Text mode reads a line that starts with a space as a dependency of the file above it, and trims the line of a node, so that a path that starts with any other space that `trim` removes, such as U+00A0, would lose it on the next read
  if (path !== path.trimStart()) {
    return "A path cannot start with a space.";
  }
  // A path under it would make a folder with the path, and the id in the tree, of the config node
  if (isSameOrInside(path, CONFIG_PATH)) {
    return `${CONFIG_PATH} at the root is the config node, not a file or a folder.`;
  }
  return undefined;
}

/**
 * Gets the folder that contains a path.
 * @param path A path of the sketch.
 * @returns The path of the folder, or an empty string when the path is at the root.
 */
export function getParentPath(path: string): string {
  const index = path.lastIndexOf("/");

  return index === -1 ? "" : path.slice(0, index);
}

/**
 * Gets the last segment of a path.
 * @param path A path of the sketch.
 */
export function getName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

/**
 * Joins a folder and a name.
 * @param folder The path of a folder, or an empty string for the root.
 * @param child The name of a node inside it.
 */
export function joinPath(folder: string, child: string): string {
  return folder === "" ? child : `${folder}/${child}`;
}

/**
 * Gets the folders above a path, from the root down.
 * @param path A path of the sketch.
 * @returns For `a/b/c.js`, `["a", "a/b"]`.
 */
export function getAncestors(path: string): readonly string[] {
  const segments = path.split("/").slice(0, -1);

  return segments.map((_segment, index) =>
    segments.slice(0, index + 1).join("/")
  );
}

/**
 * Tells whether a path is a folder's own path or is inside it.
 * @param path The path to check.
 * @param folder The path of the folder.
 */
export function isSameOrInside(path: string, folder: string): boolean {
  return path === folder || path.startsWith(`${folder}/`);
}

/**
 * Moves a path and everything under it, as renaming a folder does.
 * @param path The path to move.
 * @param from The path of the file or folder that moves.
 * @param to The path it moves to.
 * @returns The new path, or the same one when it is outside what moves.
 */
export function movePath(path: string, from: string, to: string): string {
  return isSameOrInside(path, from) ? `${to}${path.slice(from.length)}` : path;
}
