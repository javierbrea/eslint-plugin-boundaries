import type { DependencyRef } from "@/domains/project/helpers/sketch";

import type { DependencyLocation } from "./dependencyLocation.types";

/**
 * Writes where a dependency is, in the words that its row of the problem list and the body of its tab share.
 * @param ref The dependency: its file and its position among the dependencies of the file.
 * @param source The source that the statement of the dependency writes.
 * @returns The file, the line after a colon, which is the position plus one, and the source.
 */
export function getDependencyLocation(
  ref: DependencyRef,
  source: string
): DependencyLocation {
  return { path: ref.path, position: `:${ref.index + 1}`, source };
}
