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
