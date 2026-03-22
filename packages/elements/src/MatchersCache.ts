import { CacheManager } from "./Cache";
import type { ConfigOptionsNormalized } from "./Config";
import type { ElementDescriptors, FileDescriptors } from "./Descriptor";
import type { Matcher } from "./Matcher";

/**
 * Cache manager for Matcher instances, unique for each different configuration
 */
export class MatchersCache extends CacheManager<
  {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
    fileDescriptors?: FileDescriptors;
  },
  {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
    fileDescriptors?: FileDescriptors;
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
    fileDescriptors,
  }: {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
    fileDescriptors?: FileDescriptors;
  }): string {
    const configHash = `${config.legacyTemplates}|${config.includePaths}|${config.ignorePaths}|${
      config.cache
    }|${config.descriptorsPriority}|${config.rootPath}|${config.flagAsExternal.inNodeModules}|${config.flagAsExternal.unresolvableAlias}|${
      config.flagAsExternal.outsideRootPath
    }|${config.flagAsExternal.customSourcePatterns.join(",")}`;

    const elementDescriptorsHash = elementDescriptors
      .map(
        (descriptor) =>
          `${descriptor.type}|${descriptor.pattern}|${descriptor.basePattern}|${descriptor.mode}|${descriptor.capture}|${descriptor.baseCapture}`
      )
      .join(",");
    const fileDescriptorsHash = (fileDescriptors || [])
      .map(
        (descriptor) =>
          `${descriptor.category}|${descriptor.pattern}|${descriptor.basePattern}|${descriptor.fullMatch}|${descriptor.capture}|${descriptor.baseCapture}`
      )
      .join(",");
    return `${configHash}|:|${elementDescriptorsHash}|:|${fileDescriptorsHash}`;
  }
}
