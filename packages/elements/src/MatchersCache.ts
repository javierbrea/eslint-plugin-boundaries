import { CacheManager } from "./Cache";
import type { ConfigOptionsNormalized } from "./Config";
import type {
  BaseDescriptor,
  DescriptorsConfig,
  ElementDescriptors,
  FileDescriptors,
} from "./Descriptor";
import { resolveElementsSingleMatch } from "./Descriptor";
import type { Matcher } from "./Matcher";
import { isArray, isObject } from "./Shared";

/**
 * Hash of a descriptor that is not an object, so that building the matcher reports it as invalid instead of failing while the cache key is built.
 */
const INVALID_DESCRIPTOR_HASH = "invalid-descriptor";

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
   * Calculates a hash for the `capture` or `baseCapture` of a descriptor to be used in the cache key. A list is hashed as its JSON text, so lists whose names join into the same text, such as `["a,b"]` and `["a", "b"]`, get different hashes, and no list gets the hash of a missing value. A value that is set and is not an array gets a hash of its own instead of failing here, so that building the matcher reports the descriptor as invalid, and a matcher cached for a valid descriptor is never returned for it.
   * @param capture The value of the property.
   * @param name The name of the property in the hash.
   * @returns A string hash representing the value of the property.
   */
  private _getCaptureHash(
    capture: unknown,
    name: "capture" | "base-capture"
  ): string {
    if (isArray(capture)) {
      return JSON.stringify(capture);
    }
    return capture ? `invalid-${name}` : `no-${name}`;
  }

  /**
   * Calculates a hash for the base properties of a descriptor to be used in the cache key. The pattern is hashed as its JSON text, so a string and a list of patterns never get the same hash.
   * @param descriptor The descriptor to calculate the hash for.
   * @returns A string hash representing the base properties of the descriptor.
   */
  private _getBaseDescriptorsHash(descriptor: BaseDescriptor): string {
    const captureKey = this._getCaptureHash(descriptor.capture, "capture");
    return `${JSON.stringify(descriptor.pattern)}|${captureKey}`;
  }

  /**
   * Calculates a hash for the element descriptors to be used in the cache key. An entry that is not an object gets a hash of its own, so that building the matcher reports it as invalid.
   * @param elementDescriptors The element descriptors to calculate the hash for.
   * @returns A string hash representing the element descriptors.
   */
  private _getElementDescriptorsHash(
    elementDescriptors: ElementDescriptors
  ): string {
    return elementDescriptors
      .map((descriptor) => {
        if (!isObject(descriptor)) {
          return INVALID_DESCRIPTOR_HASH;
        }
        const baseCaptureKey = this._getCaptureHash(
          descriptor.baseCapture,
          "base-capture"
        );
        return `${this._getBaseDescriptorsHash(descriptor)}|${descriptor.type}|${descriptor.category}|${descriptor.mode}|${descriptor.basePattern}|${baseCaptureKey}|${descriptor.partialMatch}|${descriptor.stopMatching}|${descriptor.exclusive}`;
      })
      .join(",");
  }

  /**
   * Calculates a hash for the file descriptors to be used in the cache key. An entry that is not an object gets a hash of its own, so that building the matcher reports it as invalid.
   * @param fileDescriptors The file descriptors to calculate the hash for.
   * @returns A string hash representing the file descriptors.
   */
  private _getFileDescriptorsHash(fileDescriptors: FileDescriptors): string {
    return fileDescriptors
      .map((descriptor) => {
        if (!isObject(descriptor)) {
          return INVALID_DESCRIPTOR_HASH;
        }
        return `${this._getBaseDescriptorsHash(descriptor)}|${descriptor.category}|${descriptor.basePattern}|${this._getCaptureHash(descriptor.baseCapture, "base-capture")}|${descriptor.stopMatching}|${descriptor.exclusive}`;
      })
      .join(",");
  }

  /**
   * Generates a unique key based on the configuration options and element descriptors. The patterns of the options are hashed as their JSON text, so a string and a list of patterns never get the same hash.
   * @param params The configuration and element descriptors
   * @param params.config The normalized configuration options.
   * @param params.descriptors The descriptors configuration.
   * @returns A unique string key
   */
  protected generateKey({
    config,
    descriptors,
  }: {
    config: ConfigOptionsNormalized;
    descriptors: DescriptorsConfig;
  }): string {
    const configHash = `${config.legacyTemplates}|${JSON.stringify(config.includePaths)}|${JSON.stringify(config.ignorePaths)}|${
      config.cache
    }|${config.rootPath}|${config.flagAsExternal.inNodeModules}|${config.flagAsExternal.unresolvableAlias}|${
      config.flagAsExternal.outsideRootPath
    }|${JSON.stringify(config.flagAsExternal.customSourcePatterns)}`;

    const elementDescriptorsHash = this._getElementDescriptorsHash(
      descriptors.elements || []
    );
    const elementsSingleMatch = resolveElementsSingleMatch(descriptors)
      ? "true"
      : "false";
    const filesSingleMatch = descriptors.filesSingleMatch ? "true" : "false";
    const fileDescriptorsHash = this._getFileDescriptorsHash(
      descriptors.files || []
    );
    return `|:config:|${configHash}|:elements:|${elementDescriptorsHash}|:elementsSingleMatch:|${elementsSingleMatch}|:files:|${fileDescriptorsHash}|:filesSingleMatch:|${filesSingleMatch}`;
  }
}
