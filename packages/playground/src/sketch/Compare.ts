import type { Sketch } from "@/contract";

/**
 * Tells whether two values hold the same data: the same primitives, in arrays of the same items in the same order and objects of the same keys.
 * @param first A value of a sketch, such as a node or a dependency.
 * @param second Another value.
 * @returns `true` when both hold the same data, whether or not they are the same object.
 */
function isSameData(first: unknown, second: unknown): boolean {
  if (first === second) {
    return true;
  }
  if (Array.isArray(first) || Array.isArray(second)) {
    return (
      Array.isArray(first) &&
      Array.isArray(second) &&
      first.length === second.length &&
      first.every((item, index) => isSameData(item, second[index]))
    );
  }
  if (
    typeof first !== "object" ||
    typeof second !== "object" ||
    first === null ||
    second === null
  ) {
    return false;
  }

  const keys = Object.keys(first);

  return (
    keys.length === Object.keys(second).length &&
    keys.every(
      (key) =>
        key in second &&
        isSameData(
          (first as Record<string, unknown>)[key],
          (second as Record<string, unknown>)[key]
        )
    )
  );
}

/**
 * Tells whether two sketches are the same project: they have the same files and folders, in the same order, and the same dependencies. The config is not compared: it is not part of the project that text mode writes.
 * @param first A sketch.
 * @param second Another sketch.
 * @returns `true` when the tree and the dependencies hold the same data, whether or not they are the same objects.
 */
export function isSameProject(first: Sketch, second: Sketch): boolean {
  return (
    isSameData(first.tree, second.tree) &&
    isSameData(first.dependencies, second.dependencies)
  );
}
