import { CacheManager } from "../../Cache";

import type { DependencyDescription } from "./DependencyDescription.types";
import type { DependencyDescriptorOptions } from "./DependencyDescriptor.types";

/**
 * Cache to store previously described dependencies.
 */
export class DependenciesDescriptionsCache extends CacheManager<
  DependencyDescriptorOptions,
  DependencyDescription
> {
  /** Generates a unique key for the given dependency description options.
   * @param options The options to generate the key from.
   * @param options.from Path of the element where the dependency originates.
   * @param options.to Path of the element where the dependency points to.
   * @param options.source Source of the dependency (import/export path).
   * @param options.kind Kind of the dependency: `value`, `type` or `typeof`.
   * @param options.nodeKind Type of the node creating the dependency in the dependent element.
   * @param options.specifiers Specifiers imported or exported in the dependency.
   * @returns The generated key.
   */
  protected generateKey(options: {
    from: string;
    to?: string;
    source: string;
    kind: string;
    nodeKind?: string;
    specifiers?: string[];
  }): string {
    return `${options.from}|${options.to}|${options.source}|${options.kind}|${
      options.nodeKind
    }|${options.specifiers ? options.specifiers.join(",") : ""}`;
  }
}
