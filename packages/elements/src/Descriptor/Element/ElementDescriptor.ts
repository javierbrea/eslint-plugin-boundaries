import { CacheManager, CacheManagerDisabled } from "../../Cache";
import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";
import { isArray, normalizePath } from "../../Shared";
import type { CapturedValues } from "../Shared";

import type {
  ElementDescription,
  UnknownElementDescription,
} from "./ElementDescription.types";
import { isKnownElementDescription } from "./ElementDescriptionHelpers";
import type {
  ElementDescriptor,
  ElementDescriptors,
  ElementsDescriptorSerializedCache,
} from "./ElementDescriptor.types";
import { ELEMENT_DESCRIPTOR_MODES_MAP } from "./ElementDescriptor.types";
import { isElementDescriptor } from "./ElementDescriptorHelpers";

const UNKNOWN_ELEMENT: UnknownElementDescription = {
  path: null,
  fileInternalPath: null,
  filePath: null,
  parents: [],
  type: null,
  category: null,
  captured: null,
  isIgnored: false,
  isUnknown: true,
};

/** Options for the _fileDescriptorMatch private method */
type FileDescriptorMatchOptions = {
  /** The element descriptor to match. */
  elementDescriptor: ElementDescriptor;
  /** The file path to match against the descriptor */
  filePath: string;
  /** The current path segments leading to the element */
  currentPathSegments: string[];
  /** The last path segment that was matched */
  lastPathSegmentMatching: number;
  /** Whether the element matched previously */
  alreadyMatched: boolean;
};

/**
 * Class describing elements in a project given their paths and configuration.
 */
export class ElementsDescriptor {
  /**
   * Cache to store previously described elements.
   */
  private readonly _descriptionsCache:
    | CacheManager<string, ElementDescription>
    | CacheManagerDisabled<string, ElementDescription>;

  /**
   * Configuration instance for this descriptor.
   */
  private readonly _config: DescriptorOptionsNormalized;

  /**
   * Element descriptors used by this descriptor.
   */
  private readonly _elementDescriptors: ElementDescriptors;

  /** Micromatch instance for path matching */
  private readonly _micromatch: Micromatch;

  /**
   * The configuration options for this descriptor.
   * @param elementDescriptors The element descriptors.
   * @param configOptions The configuration options.
   * @param globalCache The global cache for various caching needs.
   * @param micromatch The micromatch instance for path matching.
   */
  constructor(
    elementDescriptors: ElementDescriptors,
    configOptions: DescriptorOptionsNormalized,
    micromatch: Micromatch
  ) {
    this._micromatch = micromatch;
    this._elementDescriptors = elementDescriptors;
    this._validateDescriptors(elementDescriptors);
    this._config = configOptions;
    this._descriptionsCache = this._config.cache
      ? new CacheManager<string, ElementDescription>()
      : new CacheManagerDisabled<string, ElementDescription>();
  }

  /**
   * Serializes the elements cache to a plain object.
   * @returns The serialized elements cache.
   */
  public serializeCache(): ElementsDescriptorSerializedCache {
    return this._descriptionsCache.serialize();
  }

  /**
   * Sets the elements cache from a serialized object.
   * @param serializedCache The serialized elements cache.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsDescriptorSerializedCache
  ): void {
    this._descriptionsCache.setFromSerialized(serializedCache);
  }

  /**
   * Clears the elements cache.
   */
  public clearCache(): void {
    this._descriptionsCache.clear();
  }

  /**
   * Validates the element descriptors to ensure they are correctly defined.
   */
  private _validateDescriptors(elementDescriptors: ElementDescriptors): void {
    let index = 0;
    for (const descriptor of elementDescriptors) {
      if (!isElementDescriptor(descriptor)) {
        throw new Error(
          `Element descriptor at index ${index} must have a pattern, and either a 'type' or 'category' defined.`
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
   * Gets the element path based on the path pattern, path segments to the element, and all path segments from the file path.
   * @param pathPattern The element path pattern.
   * @param pathSegments The path segments leading to the element.
   * @param allPathSegments The full path segments from the file path.
   * @returns The element path.
   */
  private _getElementPath(
    pathPattern: string,
    pathSegments: string[],
    allPathSegments: string[]
  ): string {
    const elementPathRegexp = this._micromatch.makeRe(pathPattern);

    const testedSegments: string[] = [];
    let result: string | undefined;

    for (const pathSegment of pathSegments) {
      testedSegments.push(pathSegment);
      const joinedSegments = testedSegments.join("/");
      if (elementPathRegexp.test(joinedSegments)) {
        result = joinedSegments;
        break; // Early exit when match is found
      }
    }
    // NOTE: result should never be undefined here, as we already matched the pattern before
    return `${[...allPathSegments].reverse().join("/").split(result!)[0]}${result}`;
  }

  /**
   * Determines if an element descriptor matches the given parameters in the provided path.
   * @param options The options for matching the descriptor.
   * @returns The result of the match, including whether it matched and any captured values.
   */
  private _fileDescriptorMatch(options: FileDescriptorMatchOptions): {
    matched: true;
    capture: string[];
    baseCapture: string[] | null;
    useFullPathMatch: boolean;
    patternUsed: string;
  };

  /**
   * Determines if an element descriptor matches the given parameters in the provided path.
   * @param options The options for matching the descriptor.
   * @param options.elementDescriptor The element descriptor to match.
   * @param options.filePath The file path to match against the descriptor.
   * @param options.currentPathSegments The current path segments leading to the element.
   * @param options.lastPathSegmentMatching The last path segment that was matched.
   * @param options.alreadyMatched Whether the element matched previously.
   * @returns The result of the match, including whether it matched.
   */
  private _fileDescriptorMatch({
    elementDescriptor,
    filePath,
    currentPathSegments,
    lastPathSegmentMatching,
    alreadyMatched,
  }: FileDescriptorMatchOptions): {
    matched: boolean;
    capture?: string[];
    baseCapture?: string[] | null;
    useFullPathMatch?: boolean;
    patternUsed?: string;
  } {
    const isFolderMode =
      !elementDescriptor.mode ||
      elementDescriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
    const patterns = isArray(elementDescriptor.pattern)
      ? elementDescriptor.pattern
      : [elementDescriptor.pattern];

    for (const pattern of patterns) {
      const useFullPathMatch =
        elementDescriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FULL &&
        !alreadyMatched;
      const effectivePattern =
        isFolderMode && !alreadyMatched ? `${pattern}/**/*` : pattern;

      const targetPath = useFullPathMatch
        ? filePath
        : currentPathSegments.join("/");

      let baseCapture: string[] | null = null;
      let hasCapture = true;

      if (elementDescriptor.basePattern) {
        const baseTarget = filePath
          .split("/")
          .slice(0, filePath.split("/").length - lastPathSegmentMatching)
          .join("/");
        baseCapture = this._micromatch.capture(
          [elementDescriptor.basePattern, "**", effectivePattern].join("/"),
          baseTarget
        );
        hasCapture = baseCapture !== null;
      }

      const capture = this._micromatch.capture(effectivePattern, targetPath);

      if (capture && hasCapture) {
        return {
          matched: true,
          capture,
          baseCapture,
          useFullPathMatch,
          patternUsed: pattern,
        };
      }
    }

    return { matched: false };
  }

  /**
   * Describes an element given its file path
   * @param elementPath The path of the element to describe.
   * @returns The description of the element.
   */
  private _describeElement(filePath?: string): ElementDescription {
    // Return unknown element if no file path is provided. Filepath couldn't be resolved.
    if (!filePath) {
      return {
        ...UNKNOWN_ELEMENT,
      };
    }

    // Return ignored element if the path is not included in the configuration.
    if (!this._pathIsIncluded(filePath)) {
      return {
        ...UNKNOWN_ELEMENT,
        filePath: filePath,
        path: filePath,
        isIgnored: true,
      };
    }

    const parents: UnknownElementDescription["parents"] = [];
    const elementResult: ElementDescription = {
      filePath: filePath, // For backward compatibility with legacy mode "file", where filePath was used to store the path of the element. --- IGNORE ---
      path: filePath,
      fileInternalPath: null,
      type: null,
      category: null,
      captured: null,
      isIgnored: false,
      isUnknown: true,
      parents,
    };

    interface State {
      pathSegmentsAccumulator: string[];
      lastPathSegmentMatching: number;
    }

    const state: State = {
      pathSegmentsAccumulator: [],
      lastPathSegmentMatching: 0,
    };

    const pathSegments = filePath.split("/").reverse();

    const processElementMatch = (
      elementDescriptor: ElementDescriptor,
      matchInfo: {
        matched: true;
        capture: string[];
        baseCapture: string[] | null;
        useFullPathMatch: boolean;
        patternUsed: string;
      },
      currentPathSegments: string[],
      elementPaths: string[]
    ) => {
      const { capture, baseCapture, useFullPathMatch, patternUsed } = matchInfo;

      let capturedValues = this._getCapturedValues(
        capture,
        elementDescriptor.capture
      );

      if (elementDescriptor.basePattern && baseCapture) {
        capturedValues = {
          ...this._getCapturedValues(
            baseCapture,
            elementDescriptor.baseCapture
          ),
          ...capturedValues,
        };
      }

      const elementPath = useFullPathMatch
        ? filePath
        : this._getElementPath(patternUsed, currentPathSegments, elementPaths);

      if (!elementResult.type && !elementResult.category) {
        const isFolderMode =
          !elementDescriptor.mode ||
          elementDescriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
        // It is the main element
        elementResult.type = elementDescriptor.type || null;
        elementResult.category = elementDescriptor.category || null;
        elementResult.isUnknown = false;
        elementResult.path = elementPath;
        elementResult.captured = capturedValues;
        elementResult.fileInternalPath =
          isFolderMode || filePath !== elementPath // Defensive check to ensure we don't return an empty string if filePath and elementPath are the same. This should not happen.
            ? filePath.replace(`${elementPath}/`, "")
            : filePath.split("/").pop() || filePath; // Extra defensive check to ensure we don't return an empty string if filePath is a single segment. This should not happen either, but we want to be safe.
      } else {
        // It is a parent element, because we have already matched the main one
        parents.push({
          type: elementDescriptor.type || null,
          category: elementDescriptor.category || null,
          path: elementPath,
          captured: capturedValues,
        });
      }
    };

    // Optimized matching loop - reduced complexity from O(n*m) to better performance
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      state.pathSegmentsAccumulator.unshift(segment);

      // Early exit if we have a type and the current segment doesn't match any descriptor pattern, to avoid unnecessary checks
      const alreadyHasMainElement = Boolean(elementResult.type);

      for (const elementDescriptor of this._elementDescriptors) {
        const match = this._fileDescriptorMatch({
          elementDescriptor,
          filePath,
          currentPathSegments: state.pathSegmentsAccumulator,
          lastPathSegmentMatching: state.lastPathSegmentMatching,
          alreadyMatched: alreadyHasMainElement,
        });

        if (match.matched) {
          processElementMatch(
            elementDescriptor,
            match,
            state.pathSegmentsAccumulator,
            pathSegments
          );
          state.pathSegmentsAccumulator = [];
          state.lastPathSegmentMatching = i + 1;

          // Break out of the inner loop since we found a match
          break;
        }
      }
    }

    const result = { ...elementResult, parents };

    // Not matched as any element, ensure that it is marked as unknown
    if (!isKnownElementDescription(result)) {
      return {
        ...UNKNOWN_ELEMENT,
        path: null, // Path is null for unknown elements, as it can't be resolved to any descriptor
      } satisfies UnknownElementDescription;
    }

    return result;
  }

  /**
   * Describes the element of a file given its path.
   * @param filePath The path of the dependency target file, if known. Can be absolute if rootPath is configured, or relative if not.
   * @returns The description of the dependency element.
   */
  public describeElement(filePath: string | undefined): ElementDescription {
    const cacheKey = `${filePath}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }
    const normalizedFilePath = filePath ? normalizePath(filePath) : filePath;
    const relativePath =
      normalizedFilePath && this._config.rootPath
        ? this._toRelativePath(normalizedFilePath)
        : normalizedFilePath;
    const description = this._describeElement(relativePath);
    this._descriptionsCache.set(cacheKey, description);
    return description;
  }
}
