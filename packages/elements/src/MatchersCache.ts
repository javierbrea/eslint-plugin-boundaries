import { CacheManager } from "./Cache";
import type { ConfigOptionsNormalized } from "./Config";
import type {
  BaseDescriptor,
  DescriptorsConfig,
  ElementDescriptors,
  FileDescriptors,
} from "./Descriptor";
import type { Matcher } from "./Matcher";

/**
 * Cache manager for Matcher instances, unique for each different configuration
 */
export class MatchersCache extends CacheManager<
  {
    config: ConfigOptionsNormalized;
    descriptors: DescriptorsConfig;
  },
  {
    config: ConfigOptionsNormalized;
    descriptors: DescriptorsConfig;
    matcher: Matcher;
  }
> {
  /**
   * Calculates a hash for the base properties of a descriptor to be used in the cache key.
   * @param descriptor The descriptor to calculate the hash for.
   * @returns A string hash representing the base properties of the descriptor.
   */
  private _getBaseDescriptorsHash(descriptor: BaseDescriptor): string {
    const captureKey = descriptor.capture
      ? descriptor.capture.join(",")
      : "no-capture";
    return `${descriptor.pattern}|${captureKey}`;
  }

  /**
   * Calculates a hash for the element descriptors to be used in the cache key.
   * @param elementDescriptors The element descriptors to calculate the hash for.
   * @returns A string hash representing the element descriptors.
   */
  private _getElementDescriptorsHash(
    elementDescriptors: ElementDescriptors
  ): string {
    return elementDescriptors
      .map((descriptor) => {
        const baseCaptureKey = descriptor.baseCapture
          ? descriptor.baseCapture.join(",")
          : "no-base-capture";
        return `${this._getBaseDescriptorsHash(descriptor)}|${descriptor.type}|${descriptor.category}|${descriptor.mode}|${descriptor.basePattern}|${baseCaptureKey}`;
      })
      .join(",");
  }

  /**
   * Calculates a hash for the file descriptors to be used in the cache key.
   * @param fileDescriptors The file descriptors to calculate the hash for.
   * @returns A string hash representing the file descriptors.
   */
  private _getFileDescriptorsHash(fileDescriptors: FileDescriptors): string {
    return fileDescriptors
      .map(
        (descriptor) =>
          `${this._getBaseDescriptorsHash(descriptor)}|${descriptor.category}`
      )
      .join(",");
  }

  /**
   * Generates a unique key based on the configuration options and element descriptors
   * @param params The configuration and element descriptors
   * @returns A unique string key
   */
  protected generateKey({
    config,
    descriptors,
  }: {
    config: ConfigOptionsNormalized;
    descriptors: DescriptorsConfig;
  }): string {
    const configHash = `${config.legacyTemplates}|${config.includePaths}|${config.ignorePaths}|${
      config.cache
    }|${config.rootPath}|${config.flagAsExternal.inNodeModules}|${config.flagAsExternal.unresolvableAlias}|${
      config.flagAsExternal.outsideRootPath
    }|${config.flagAsExternal.customSourcePatterns.join(",")}`;

    const elementDescriptorsHash = this._getElementDescriptorsHash(
      descriptors.elements || []
    );
    const fileDescriptorsHash = this._getFileDescriptorsHash(
      descriptors.files || []
    );
    return `|:config:|${configHash}|:elements:|${elementDescriptorsHash}|:files:|${fileDescriptorsHash}`;
  }
}
