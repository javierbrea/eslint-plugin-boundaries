import { CacheManager, CacheManagerDisabled } from "../../Cache";
import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";
import { isArray, isObject, normalizePath } from "../../Shared";
import { PathHelper } from "../Shared";

import type {
  ElementDescription,
  ElementParent,
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
  types: null,
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
   * Cache storing the folder-stable base description for each folder.
   * Multiple files in the same folder share the same base (path, types, category,
   * captured, parents), so it is computed once per folder and extended per file with
   * the file-specific fields (fileInternalPath, isIgnored).
   */
  private readonly _folderDescriptionsCache:
    | CacheManager<string, ElementDescription>
    | CacheManagerDisabled<string, ElementDescription>;

  /**
   * Whether the folder-level cache can be used. It is only sound when no descriptor
   * relies on the file name to match, i.e. no descriptor uses the deprecated "file" or
   * "full" modes. In those modes a sibling file could match a different descriptor, so
   * the description is not folder-deterministic and the per-file path must be used.
   */
  private readonly _canCacheByFolder: boolean;

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

  /** Whether single-type matching is enabled (only first matching type is kept) */
  private readonly _singleType: boolean;

  /** Shared path helper providing root-path and include/ignore utilities */
  private readonly _pathHelper: PathHelper;

  /**
   * The configuration options for this descriptor.
   * @param elementDescriptors The element descriptors.
   * @param configOptions The configuration options.
   * @param globalCache The global cache for various caching needs.
   * @param micromatch The micromatch instance for path matching.
   * @param singleType Whether single-type matching is enabled.
   */
  constructor(
    elementDescriptors: ElementDescriptors,
    configOptions: DescriptorOptionsNormalized,
    micromatch: Micromatch,
    singleType: boolean = false
  ) {
    this._micromatch = micromatch;
    this._singleType = singleType;
    this._elementDescriptors = elementDescriptors;
    this._validateDescriptors(elementDescriptors);
    this._config = configOptions;
    this._pathHelper = new PathHelper(configOptions, micromatch);
    this._descriptionsCache = this._config.cache
      ? new CacheManager<string, ElementDescription>()
      : new CacheManagerDisabled<string, ElementDescription>();
    this._canCacheByFolder =
      this._config.cache &&
      !elementDescriptors.some(
        (descriptor) =>
          descriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FILE ||
          descriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FULL
      );
    this._folderDescriptionsCache = this._canCacheByFolder
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
    this._folderDescriptionsCache.clear();
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
   * Gets the element folder path for a `partialMatch: false` descriptor.
   * Walks `filePath` from the project root and returns the first prefix that satisfies
   * `basePattern`. This gives the folder path rather than the full file path.
   * @param basePattern The raw element pattern WITHOUT the `/**\/*` suffix.
   * @param filePath The full file path relative to rootPath.
   * @returns The folder path prefix that the pattern matches.
   */
  private _getFullFolderMatchElementPath(
    basePattern: string,
    filePath: string
  ): string {
    const elementPathRegexp = this._micromatch.makeRe(basePattern);
    const segments = filePath.split("/");
    const accumulated: string[] = [];
    for (const segment of segments) {
      accumulated.push(segment);
      if (elementPathRegexp.test(accumulated.join("/"))) {
        return accumulated.join("/");
      }
    }
    // Defensive fallback — unreachable when the pattern already matched the file.
    // istanbul ignore next
    return filePath;
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
      elementDescriptor.partialMatch === false ||
      !elementDescriptor.mode ||
      elementDescriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
    const patterns = isArray(elementDescriptor.pattern)
      ? elementDescriptor.pattern
      : [elementDescriptor.pattern];

    for (const pattern of patterns) {
      const useFullPathMatch =
        elementDescriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FULL &&
        elementDescriptor.partialMatch !== false &&
        !alreadyMatched;
      const effectivePattern =
        isFolderMode && !alreadyMatched ? `${pattern}/**/*` : pattern;

      const targetPath =
        useFullPathMatch ||
        (elementDescriptor.partialMatch === false && !alreadyMatched)
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
    if (!this._pathHelper.pathIsIncluded(filePath)) {
      return {
        ...UNKNOWN_ELEMENT,
        filePath: filePath,
        path: filePath,
        isIgnored: true,
      };
    }

    const parents: ElementParent[] = [];
    const elementResult: ElementDescription = {
      filePath: filePath, // For backward compatibility with legacy mode "file", where filePath was used to store the path of the element. --- IGNORE ---
      path: filePath,
      fileInternalPath: null,
      types: null,
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
      elementPaths: string[],
      isMainElementLevel: boolean
    ) => {
      const { capture, baseCapture, useFullPathMatch, patternUsed } = matchInfo;

      let capturedValues = this._pathHelper.getCapturedValues(
        capture,
        elementDescriptor.capture
      );

      if (elementDescriptor.basePattern && baseCapture) {
        capturedValues = {
          ...this._pathHelper.getCapturedValues(
            baseCapture,
            elementDescriptor.baseCapture
          ),
          ...capturedValues,
        };
      }

      const elementPath = useFullPathMatch
        ? filePath
        : elementDescriptor.partialMatch === false && isMainElementLevel
          ? this._getFullFolderMatchElementPath(patternUsed, filePath)
          : this._getElementPath(
              patternUsed,
              currentPathSegments,
              elementPaths
            );

      if (!elementResult.types && !elementResult.category) {
        const isFolderMode =
          elementDescriptor.partialMatch === false ||
          !elementDescriptor.mode ||
          elementDescriptor.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
        // It is the main element
        elementResult.types = elementDescriptor.type
          ? [elementDescriptor.type]
          : null;
        elementResult.category = elementDescriptor.category || null;
        elementResult.isUnknown = false;
        elementResult.path = elementPath;
        elementResult.captured = capturedValues;
        elementResult.fileInternalPath =
          isFolderMode || filePath !== elementPath // Defensive check to ensure we don't return an empty string if filePath and elementPath are the same. This should not happen.
            ? filePath.replace(`${elementPath}/`, "")
            : filePath.split("/").pop() ||
              // istanbul ignore next -- Ensures non-empty string if filePath were a single segment. Unreachable: filePath is guaranteed non-empty, so split("/").pop() always returns a truthy string
              filePath;
      } else if (isMainElementLevel && !this._singleType) {
        // Multi-type: additional type at same path level
        if (elementDescriptor.type && isArray(elementResult.types)) {
          elementResult.types = [
            ...elementResult.types,
            elementDescriptor.type,
          ];
        }
        if (isObject(capturedValues)) {
          elementResult.captured = {
            ...(elementResult.captured || {}),
            ...capturedValues,
          };
        }
      } else if (elementPath !== elementResult.path) {
        // It is a parent element, because we have already matched the main one.
        // Skip when the resolved path equals the main element's path — this prevents
        // self-duplication when a root-anchored `partialMatch: false` pattern also matches
        // the accumulated suffix segments at a deeper iteration.
        const lastParent = parents[parents.length - 1];
        if (lastParent && lastParent.path === elementPath) {
          // Multi-type: accumulate additional type at same parent path level
          if (elementDescriptor.type && isArray(lastParent.types)) {
            lastParent.types = [...lastParent.types, elementDescriptor.type];
          }
          if (isObject(capturedValues)) {
            lastParent.captured = {
              ...(lastParent.captured || {}),
              ...capturedValues,
            };
          }
        } else {
          parents.push({
            types: elementDescriptor.type ? [elementDescriptor.type] : null,
            category: elementDescriptor.category || null,
            path: elementPath,
            captured: capturedValues,
          });
        }
      }
    };

    // Optimized matching loop - reduced complexity from O(n*m) to better performance
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      state.pathSegmentsAccumulator.unshift(segment);

      // Main element is considered matched when either type or category is set.
      const alreadyHasMainElement =
        Boolean(elementResult.types) || Boolean(elementResult.category);

      let matchFoundAtThisLevel = false;

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
            pathSegments,
            !alreadyHasMainElement
          );
          matchFoundAtThisLevel = true;

          if (this._singleType) {
            // Break out of the inner loop since we found a match
            break;
          }
        }
      }

      if (matchFoundAtThisLevel) {
        state.pathSegmentsAccumulator = [];
        state.lastPathSegmentMatching = i + 1;
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
   * Gets the folder key used to cache the folder-stable base description.
   * @param relativePath The relative file path.
   * @returns The folder portion of the path (everything but the last segment, empty for a file at the root).
   */
  private _getFolderKey(relativePath: string): string {
    const lastSeparatorIndex = relativePath.lastIndexOf("/");
    return lastSeparatorIndex === -1
      ? ""
      : relativePath.slice(0, lastSeparatorIndex);
  }

  /**
   * Gets the file path relative to its element folder.
   * This is only used in the folder-cacheable branch, where all descriptors are in
   * folder mode, so the element path is always a folder containing the file.
   * @param relativePath The relative file path.
   * @param elementPath The matched element path.
   * @returns The file path relative to the element folder.
   */
  private _getFileInternalPath(
    relativePath: string,
    elementPath: string | null
  ): string {
    return relativePath.replace(`${elementPath}/`, "");
  }

  /**
   * Describes an element reusing a folder-level cache.
   * The folder-stable base (path, types, category, captured, parents) is computed once
   * per folder and extended per file with the file-specific fields.
   * @param relativePath The relative file path.
   * @returns The description of the element.
   */
  private _describeElementWithFolderCache(
    relativePath: string
  ): ElementDescription {
    // isIgnored depends on the full file path, so it must be evaluated per file before
    // touching the folder base.
    if (!this._pathHelper.pathIsIncluded(relativePath)) {
      return {
        ...UNKNOWN_ELEMENT,
        filePath: relativePath,
        path: relativePath,
        isIgnored: true,
      };
    }

    const folderKey = this._getFolderKey(relativePath);
    let base = this._folderDescriptionsCache.get(folderKey);
    if (base === undefined) {
      // relativePath is guaranteed included here, so _describeElement returns either a
      // known element or the unknown shape ({ ...UNKNOWN_ELEMENT, path: null }), never
      // the "ignored" shape. The base is computed from the first included file in the
      // folder.
      base = this._describeElement(relativePath);
      this._folderDescriptionsCache.set(folderKey, base);
    }

    // A folder matching no descriptor is file-independent in folder-only mode.
    if (base.isUnknown) {
      return base;
    }

    return {
      ...base,
      filePath: relativePath,
      fileInternalPath: this._getFileInternalPath(relativePath, base.path),
    };
  }

  /**
   * Describes the element of a file given its path.
   * @param filePath The path of the dependency target file, if known. Can be absolute if rootPath is configured, or relative if not.
   * @returns The description of the dependency element.
   */
  public describeElement(filePath: string | undefined): ElementDescription {
    const normalizedFilePath = filePath ? normalizePath(filePath) : filePath;
    const relativePath =
      normalizedFilePath && this._config.rootPath
        ? this._pathHelper.toRelativePath(normalizedFilePath)
        : normalizedFilePath;
    const cacheKey = `${relativePath}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }
    const description =
      this._canCacheByFolder && relativePath
        ? this._describeElementWithFolderCache(relativePath)
        : this._describeElement(relativePath);
    this._descriptionsCache.set(cacheKey, description);
    return description;
  }
}
