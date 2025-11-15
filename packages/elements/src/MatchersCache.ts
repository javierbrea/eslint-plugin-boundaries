import { CacheManager } from "./Cache";
import type { ConfigOptionsNormalized } from "./Config";
import type { ElementDescriptors } from "./Descriptor";
import type { Matcher } from "./Matcher";

/**
 * Cache manager for Matcher instances, unique for each different configuration
 */
export class MatchersCache extends CacheManager<
  {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
  },
  {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
    matcher: Matcher;
  }
> {
  /**
   * Generates a unique key based on the configuration options and element descriptors
   * @param params The configuration and element descriptors
   * @returns A unique string key
   */
  protected generateKey({
    config,
    elementDescriptors,
  }: {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
  }): string {
    const configHash = `${config.legacyTemplates}|${config.includePaths}|${config.ignorePaths}|${
      config.cache
    }`;

    const elementDescriptorsHash = elementDescriptors
      .map(
        (descriptor) =>
          `${descriptor.type}|${descriptor.category}|${descriptor.pattern}|${descriptor.basePattern}|${descriptor.mode}|${descriptor.capture}|${descriptor.baseCapture}`
      )
      .join(",");
    return `${configHash}|:|${elementDescriptorsHash}`;
  }
}
