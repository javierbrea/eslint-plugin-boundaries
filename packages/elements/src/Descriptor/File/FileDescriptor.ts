import { CacheManager, CacheManagerDisabled } from "../../Cache";
import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";
import { isArray, isObject, normalizePath } from "../../Shared";
import type { CapturedValues } from "../Shared";

import type {
  FileDescription,
  KnownFileDescription,
  UnknownFileDescription,
} from "./FileDescription.types";
import { isKnownFileDescription } from "./FileDescriptionHelpers";
import type {
  FileDescriptor,
  FileDescriptors,
  FilesDescriptorSerializedCache,
} from "./FileDescriptor.types";
import { isFileDescriptor } from "./FileDescriptorHelpers";

const BACKWARD_COMPATIBILITY_CAPTURE_PROPERTY = "restOfPath";

const UNKNOWN_FILE_DESCRIPTION: UnknownFileDescription = {
  path: null,
  categories: null,
  isIgnored: false,
  isUnknown: true,
  captured: null,
};

/**
 * Class describing files in a project given their paths and configuration.
 */
export class FilesDescriptor {
  /**
   * Cache to store previously described files.
   */
  private readonly _descriptionsCache:
    | CacheManager<string, FileDescription>
    | CacheManagerDisabled<string, FileDescription>;

  /**
   * Configuration instance for this descriptor.
   */
  private readonly _config: DescriptorOptionsNormalized;

  /**
   * File descriptors used by this descriptor.
   */
  private readonly _fileDescriptors: FileDescriptors;

  /** Micromatch instance for path matching */
  private readonly _micromatch: Micromatch;

  /**
   * The configuration options for this descriptor.
   * @param fileDescriptors The file descriptors.
   * @param configOptions The configuration options.
   * @param globalCache The global cache for various caching needs.
   * @param micromatch The micromatch instance for path matching.
   */
  constructor(
    fileDescriptors: FileDescriptors,
    configOptions: DescriptorOptionsNormalized,
    micromatch: Micromatch
  ) {
    this._micromatch = micromatch;
    this._fileDescriptors = fileDescriptors;
    this._validateDescriptors(fileDescriptors);
    this._config = configOptions;
    this._descriptionsCache = this._config.cache
      ? new CacheManager<string, FileDescription>()
      : new CacheManagerDisabled<string, FileDescription>();
  }

  /**
   * Serializes the elements cache to a plain object.
   * @returns The serialized elements cache.
   */
  public serializeCache(): FilesDescriptorSerializedCache {
    return {
      descriptions: this._descriptionsCache.serialize(),
    };
  }

  /**
   * Sets the elements cache from a serialized object.
   * @param serializedCache The serialized files cache.
   */
  public setCacheFromSerialized(
    serializedCache: FilesDescriptorSerializedCache
  ): void {
    this._descriptionsCache.setFromSerialized(serializedCache.descriptions);
  }

  /**
   * Clears the files cache.
   */
  public clearCache(): void {
    this._descriptionsCache.clear();
  }

  /**
   * Validates the file descriptors to ensure they are correctly defined.
   */
  private _validateDescriptors(fileDescriptors: FileDescriptors): void {
    let index = 0;
    for (const descriptor of fileDescriptors) {
      if (!isFileDescriptor(descriptor)) {
        throw new Error(
          `File descriptor at index ${index} must have a pattern, and a 'category' defined.`
        );
      }
      index++;
    }
  }

  /**
   * Determines if a file path is outside the configured root path.
   * @param filePath The file path to check.
   * @returns True if the file path is outside the root path, false otherwise.
   */
  private _isOutsideRootPath(filePath: string): boolean {
    if (!this._config.rootPath) {
      return false;
    }
    return !filePath.startsWith(this._config.rootPath);
  }

  /**
   * Converts an absolute file path to a relative path if rootPath is configured.
   * If rootPath is not configured, returns the path as-is (maintains backward compatibility).
   * @param filePath The file path to convert (can be absolute or relative)
   * @returns The relative path if rootPath is configured and path is absolute, otherwise the original path
   */
  private _toRelativePath(filePath: string): string {
    if (!this._config.rootPath || this._isOutsideRootPath(filePath)) {
      return filePath;
    }
    return filePath.replace(this._config.rootPath, "");
  }

  /**
   * Determines if a given path is included based on the configuration.
   * Uses caching for better performance on repeated calls.
   * @param elementPath The element path to check.
   * @param includeExternal Whether to include external files.
   * @returns True if the path is included, false otherwise.
   */
  private _pathIsIncluded(elementPath: string): boolean {
    let result: boolean;

    if (this._config.includePaths && this._config.ignorePaths) {
      const isIncluded = this._micromatch.isMatch(
        elementPath,
        this._config.includePaths
      );
      const isIgnored = this._micromatch.isMatch(
        elementPath,
        this._config.ignorePaths
      );
      result = isIncluded && !isIgnored;
    } else if (this._config.includePaths) {
      result = this._micromatch.isMatch(elementPath, this._config.includePaths);
    } else if (this._config.ignorePaths) {
      result = !this._micromatch.isMatch(elementPath, this._config.ignorePaths);
    } else {
      result = true;
    }

    return result;
  }

  /**
   * Gets captured values from the captured array and capture configuration.
   * @param captured The array of captured strings.
   * @param captureConfig The configuration for capturing values.
   * @returns The captured values as an object.
   */
  private _getCapturedValues(
    captured: string[],
    captureConfig?: string[]
  ): CapturedValues | null {
    if (!captureConfig) {
      return null;
    }
    return captured.reduce((capturedValues, captureValue, index) => {
      if (captureConfig[index]) {
        capturedValues[captureConfig[index]] = captureValue;
      }
      return capturedValues;
    }, {} as CapturedValues);
  }

  /**
   * Determines if a file descriptor matches the provided file path, and captures values if it matches.
   * @param options The options for matching the descriptor.
   * @param options.fileDescriptor The file descriptor to match against.
   * @param options.filePath The file path to match against the descriptor.
   * @returns The result of the match, including whether it matched.
   */
  private _fileDescriptorMatch(options: {
    /** The file descriptor to match. */
    fileDescriptor: FileDescriptor;
    /** The file path to match against the descriptor */
    filePath: string;
  }): {
    matched: true;
    capture: string[];
  };
  private _fileDescriptorMatch({
    fileDescriptor,
    filePath,
  }: {
    /** The file descriptor to match. */
    fileDescriptor: FileDescriptor;
    /** The file path to match against the descriptor */
    filePath: string;
  }): {
    matched: boolean;
    capture?: string[];
  } {
    const patterns = isArray(fileDescriptor.pattern)
      ? fileDescriptor.pattern
      : [fileDescriptor.pattern];

    for (const pattern of patterns) {
      const patternUsed = fileDescriptor.basePattern
        ? `${fileDescriptor.basePattern}/${pattern}`
        : pattern;
      const capture = this._micromatch.capture(patternUsed, filePath);

      if (capture) {
        return {
          matched: true,
          capture,
        };
      }
    }

    return { matched: false };
  }

  /**
   * Returns the capture array for a file descriptor, combining baseCapture and capture if basePattern is used, for backward compatibility with legacy mode "file".
   * @param fileDescriptor The file descriptor to get the capture array for.
   * @returns The combined capture array if basePattern is used, otherwise undefined.
   */
  private _getCaptureArray(
    fileDescriptor: FileDescriptor
  ): string[] | undefined {
    if (fileDescriptor.basePattern) {
      if (fileDescriptor.baseCapture && fileDescriptor.capture) {
        return [
          ...fileDescriptor.baseCapture,
          BACKWARD_COMPATIBILITY_CAPTURE_PROPERTY,
          ...fileDescriptor.capture,
        ];
      } else if (fileDescriptor.baseCapture) {
        return [
          ...fileDescriptor.baseCapture,
          BACKWARD_COMPATIBILITY_CAPTURE_PROPERTY,
        ];
      } else if (fileDescriptor.capture) {
        return [
          BACKWARD_COMPATIBILITY_CAPTURE_PROPERTY,
          ...fileDescriptor.capture,
        ];
      }
    }
  }

  /**
   * Retrieves the description of a local file given its path.
   * @param elementPath The path of the element to describe.
   * @returns The description of the element.
   */
  private _getFileDescription(filePath?: string): FileDescription {
    if (!filePath) {
      return UNKNOWN_FILE_DESCRIPTION;
    }
    // Return ignored element if the path is not included in the configuration.
    if (!this._pathIsIncluded(filePath)) {
      return {
        ...UNKNOWN_FILE_DESCRIPTION,
        path: filePath,
        categories: null,
        isIgnored: true,
      };
    }

    const fileResult: FileDescription = {
      ...UNKNOWN_FILE_DESCRIPTION,
      path: filePath,
      isIgnored: false,
    };

    const processElementMatch = (
      fileDescriptor: FileDescriptor,
      matchInfo: {
        capture: string[];
      }
    ) => {
      const { capture } = matchInfo;

      const capturedValues = this._getCapturedValues(
        capture,
        this._getCaptureArray(fileDescriptor)
      );

      fileResult.categories = isArray(fileResult.categories)
        ? [...fileResult.categories, ...fileDescriptor.category]
        : [fileDescriptor.category];

      fileResult.isUnknown = false;
      fileResult.captured = isObject(capturedValues)
        ? {
            ...(fileResult.captured || {}),
            ...capturedValues,
          }
        : capturedValues;
    };

    for (const fileDescriptor of this._fileDescriptors) {
      const match = this._fileDescriptorMatch({
        fileDescriptor,
        filePath,
      });

      if (match.matched) {
        processElementMatch(fileDescriptor, match);
        if (fileDescriptor.basePattern) {
          break; // If the descriptor has a basePattern, it has been converted from legacy mode "file", so we stop processing other matches to maintain backward compatibility. In future versions, when legacy mode is removed, this condition can be removed.
        }
      }
    }

    // Not matched as any element, ensure that it is marked as unknown
    if (!isKnownFileDescription(fileResult)) {
      const result: UnknownFileDescription = {
        ...fileResult,
        categories: null,
        isIgnored: false,
        isUnknown: true,
        captured: null,
      };
      return result;
    }

    return fileResult satisfies KnownFileDescription;
  }

  /**
   * Describes a file given its path.
   * @param filePath The absolute path of the file to describe
   */
  public describeFile(filePath?: string): FileDescription {
    const cacheKey = `$${filePath}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }
    const normalizedFilePath = filePath ? normalizePath(filePath) : filePath;
    const relativePath =
      normalizedFilePath && this._config.rootPath
        ? this._toRelativePath(normalizedFilePath)
        : normalizedFilePath;
    const fileDescription = this._getFileDescription(relativePath);
    this._descriptionsCache.set(cacheKey, fileDescription);
    return fileDescription;
  }
}
