import { CacheManager, CacheManagerDisabled } from "../Cache";
import type { DescriptorOptionsNormalized } from "../Config";
import type { Micromatch } from "../Matcher";
import { isArray, normalizePath } from "../Support";

import type {
  ElementDescription,
  ElementDescriptor,
  ElementDescriptors,
  CapturedValues,
  ElementsDescriptorSerializedCache,
} from "./ElementsDescriptor.types";
import {
  ELEMENT_DESCRIPTOR_MODES_MAP,
  ELEMENT_DESCRIPTORS_PRIORITY_MAP,
} from "./ElementsDescriptor.types";
import {
  isElementDescriptorMode,
  isElementDescriptor,
} from "./ElementsDescriptorHelpers";

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

type DescriptorMatch = {
  elementDescriptor: ElementDescriptor;
  matchInfo: {
    matched: true;
    capture: string[];
    baseCapture: string[] | null;
    useFullPathMatch: boolean;
    patternUsed: string;
  };
};

/**
 * Class describing elements in a project given their paths and configuration.
 */
export class ElementsDescriptor {
  /**
   * Cache to store previously described elements.
   */
  private readonly _descriptionsCache:
    | CacheManager<string, ElementDescription | null>
    | CacheManagerDisabled<string, ElementDescription | null>;

  /**
   * Cache to store previously described files.
   */
  private readonly _filesCache:
    | CacheManager<string, ElementDescription | null>
    | CacheManagerDisabled<string, ElementDescription | null>;

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
    this._filesCache = this._config.cache
      ? new CacheManager<string, ElementDescription | null>()
      : new CacheManagerDisabled<string, ElementDescription | null>();
    this._descriptionsCache = this._config.cache
      ? new CacheManager<string, ElementDescription | null>()
      : new CacheManagerDisabled<string, ElementDescription | null>();
  }

  /**
   * Serializes the elements cache to a plain object.
   * @returns The serialized elements cache.
   */
  public serializeCache(): ElementsDescriptorSerializedCache {
    return {
      descriptions: this._descriptionsCache.serialize(),
      files: this._filesCache.serialize(),
    };
  }

  /**
   * Sets the elements cache from a serialized object.
   * @param serializedCache The serialized elements cache.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsDescriptorSerializedCache
  ): void {
    this._descriptionsCache.setFromSerialized(serializedCache.descriptions);
    this._filesCache.setFromSerialized(serializedCache.files);
  }

  /**
   * Clears the elements cache.
   */
  public clearCache(): void {
    this._descriptionsCache.clear();
    this._filesCache.clear();
  }

  /**
   * Validates the element descriptors to ensure they are correctly defined.
   */
  private _validateDescriptors(elementDescriptors: ElementDescriptors): void {
    let index = 0;
    for (const descriptor of elementDescriptors) {
      if (!isElementDescriptor(descriptor)) {
        throw new Error(
          `Element descriptor at index ${index} must have a pattern and a 'type' defined.`
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
    const useFullPathMatch = elementDescriptor.fullMatch === true;
    const mode = isElementDescriptorMode(elementDescriptor.mode)
      ? elementDescriptor.mode
      : ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
    const patterns = isArray(elementDescriptor.pattern)
      ? elementDescriptor.pattern
      : [elementDescriptor.pattern];

    for (const pattern of patterns) {
      const effectivePattern =
        !useFullPathMatch &&
        mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER &&
        !alreadyMatched
          ? `${pattern}/**/*`
          : pattern;

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
   * Retrieves the description of a local file given its path.
   * @param elementPath The path of the element to describe.
   * @returns The description of the element.
   */
  private _getFileDescription(filePath?: string): ElementDescription | null {
    if (!filePath) {
      return null;
    }

    if (!this._pathIsIncluded(filePath)) {
      return null;
    }

    const parents: ElementDescription["parents"] = [];
    const elementResult: Partial<ElementDescription> = {
      path: undefined,
      type: undefined,
      captured: null,
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

    const getPriorityMatch = (matches: DescriptorMatch[]): DescriptorMatch => {
      return this._config.descriptorsPriority ===
        ELEMENT_DESCRIPTORS_PRIORITY_MAP.LAST
        ? matches[matches.length - 1]
        : matches[0];
    };

    const getCapturedFromMatch = (
      match: DescriptorMatch
    ): CapturedValues | null => {
      const { capture, baseCapture } = match.matchInfo;

      let capturedValues = this._getCapturedValues(
        capture,
        match.elementDescriptor.capture
      );

      if (match.elementDescriptor.basePattern && baseCapture) {
        capturedValues = {
          ...this._getCapturedValues(
            baseCapture,
            match.elementDescriptor.baseCapture
          ),
          ...capturedValues,
        };
      }

      return capturedValues;
    };

    const processElementMatches = (
      matches: DescriptorMatch[],
      currentPathSegments: string[],
      elementPaths: string[],
      isMainElement: boolean
    ): void => {
      const pathMatch = getPriorityMatch(matches);
      const valueMatch = getPriorityMatch(matches);
      const typeValue = valueMatch.elementDescriptor.type;
      const capturedValues = getCapturedFromMatch(valueMatch);

      const elementPath = pathMatch.matchInfo.useFullPathMatch
        ? filePath
        : this._getElementPath(
            pathMatch.matchInfo.patternUsed,
            currentPathSegments,
            elementPaths
          );

      if (isMainElement) {
        elementResult.type = typeValue;
        elementResult.path = elementPath;
        elementResult.captured = capturedValues;
      } else {
        parents.push({
          type: typeValue,
          path: elementPath,
          captured: capturedValues,
        });
      }
    };

    // Optimized matching loop - reduced complexity from O(n*m) to better performance
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      state.pathSegmentsAccumulator.unshift(segment);

      const alreadyHasMainElement = Boolean(elementResult.path);
      const levelMatches: DescriptorMatch[] = [];

      // If main element was found with fullMatch, stop searching for parents
      if (
        alreadyHasMainElement &&
        this._elementDescriptors.some(
          (desc) => desc.fullMatch === true && desc.type === elementResult.type
        )
      ) {
        break;
      }

      for (const elementDescriptor of this._elementDescriptors) {
        const match = this._fileDescriptorMatch({
          elementDescriptor,
          filePath,
          currentPathSegments: state.pathSegmentsAccumulator,
          lastPathSegmentMatching: state.lastPathSegmentMatching,
          alreadyMatched: alreadyHasMainElement,
        });

        if (match.matched) {
          levelMatches.push({
            elementDescriptor,
            matchInfo: match,
          });
          if (
            this._config.descriptorsPriority ===
            ELEMENT_DESCRIPTORS_PRIORITY_MAP.FIRST
          ) {
            break;
          }
        }
      }

      if (levelMatches.length > 0) {
        const isMainElement = !alreadyHasMainElement;
        processElementMatches(
          levelMatches,
          state.pathSegmentsAccumulator,
          pathSegments,
          isMainElement
        );
        state.pathSegmentsAccumulator = [];
        state.lastPathSegmentMatching = i + 1;
      }
    }

    if (!elementResult.path || !elementResult.type) {
      return null;
    }

    return {
      path: elementResult.path,
      type: elementResult.type,
      captured: elementResult.captured ?? null,
      parents,
    };
  }

  /**
   * Describes a file given its path.
   * @param includeExternal Whether to include external files (inside node_modules) in the matching process.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  private _describeFile(filePath?: string): ElementDescription | null {
    const cacheKey = this._filesCache.getKey(String(filePath));
    if (this._filesCache.has(cacheKey)) {
      return this._filesCache.get(cacheKey)!;
    }
    const description = this._getFileDescription(filePath);
    this._filesCache.set(cacheKey, description);
    return description;
  }

  /**
   * Describes an element given its file path and dependency source, if any.
   * @param filePath The path of the file to describe. Can be absolute if rootPath is configured, or relative if not.
   * @param dependencySource The source of the dependency, if the element to describe is so. It refers to the import/export path used to reference the file or external module.
   * @returns The description of the element. A dependency element if dependency source is provided, otherwise a file element.
   */
  private _describeElement(): null;
  private _describeElement(filePath?: string): ElementDescription | null;
  private _describeElement(
    filePath?: string,
    dependencySource?: string
  ): ElementDescription | null;

  private _describeElement(
    filePath?: string,
    dependencySource?: string
  ): ElementDescription | null {
    const cacheKey = `${String(dependencySource)}::${String(filePath)}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }

    const normalizedFilePath = filePath ? normalizePath(filePath) : filePath;
    const relativePath =
      normalizedFilePath && this._config.rootPath
        ? this._toRelativePath(normalizedFilePath)
        : normalizedFilePath;

    // Note: External and core dependencies are now handled by FilesDescriptor
    // ElementsDescriptor always returns element descriptions (local elements only)
    const fileDescription = this._describeFile(relativePath);

    this._descriptionsCache.set(cacheKey, fileDescription);
    return fileDescription;
  }

  /**
   * Describes an element given its file path.
   * @param filePath The path of the file to describe. Can be absolute if rootPath is configured, or relative if not.
   * @returns The description of the element.
   */
  public describeElement(filePath?: string): ElementDescription | null;
  /**
   * Describes a dependency target element given dependency source and target file path.
   * @param filePath The path of the dependency target file, if known. Can be absolute if rootPath is configured, or relative if not.
   * @param dependencySource The source of the dependency.
   * @returns The description of the dependency element.
   */
  public describeElement(
    filePath: string | undefined,
    dependencySource: string
  ): ElementDescription | null;
  public describeElement(
    filePath?: string,
    dependencySource?: string
  ): ElementDescription | null {
    return this._describeElement(filePath, dependencySource);
  }
}
