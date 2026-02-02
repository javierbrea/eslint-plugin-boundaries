import type Mod from "node:module";

import isCoreModule from "is-core-module";

import { CacheManager, CacheManagerDisabled } from "../Cache";
import type { DescriptorOptionsNormalized, MicromatchPattern } from "../Config";
import type { Micromatch } from "../Matcher";
import { isArray, isNullish, normalizePath } from "../Support";

import type {
  ElementDescription,
  ElementDescriptor,
  ElementDescriptors,
  LocalElementKnown,
  CapturedValues,
  FileElement,
  ExternalDependencyElement,
  LocalElementUnknown,
  CoreDependencyElement,
  DependencyElementDescription,
  ElementsDescriptorSerializedCache,
} from "./ElementsDescriptor.types";
import {
  ELEMENT_DESCRIPTOR_MODES_MAP,
  ELEMENT_ORIGINS_MAP,
} from "./ElementsDescriptor.types";
import {
  isElementDescriptorMode,
  isKnownLocalElement,
  isElementDescriptor,
} from "./ElementsDescriptorHelpers";

const UNKNOWN_ELEMENT: LocalElementUnknown = {
  path: null,
  elementPath: null,
  internalPath: null,
  source: null,
  baseSource: null,
  parents: null,
  type: null,
  category: null,
  captured: null,
  origin: ELEMENT_ORIGINS_MAP.LOCAL,
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

const SCOPED_PACKAGE_REGEX = /^@[^/]*\/?[^/]+/;
const EXTERNAL_PATH_REGEX = /^\w/;

/**
 * Class describing elements in a project given their paths and configuration.
 */
export class ElementsDescriptor {
  private _mod: typeof Mod | null = null;
  /**
   * Cache to store previously described elements.
   */
  private readonly _descriptionsCache:
    | CacheManager<string, ElementDescription>
    | CacheManagerDisabled<string, ElementDescription>;

  /**
   * Cache to store previously described files.
   */
  private readonly _filesCache:
    | CacheManager<string, FileElement>
    | CacheManagerDisabled<string, FileElement>;

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
      ? new CacheManager<string, FileElement>()
      : new CacheManagerDisabled<string, FileElement>();
    this._descriptionsCache = this._config.cache
      ? new CacheManager<string, ElementDescription>()
      : new CacheManagerDisabled<string, ElementDescription>();
    this._loadModuleInNode();
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
   * Loads the Node.js module to access built-in modules information when running in Node.js environment.
   */
  private _loadModuleInNode(): void {
    // istanbul ignore next: Fallback for non-Node.js environments
    if (
      !this._mod &&
      !isNullish(process) &&
      !isNullish(process.versions) &&
      !isNullish(process.versions.node)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this._mod = require("node:module");
    }
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
   * Determines if a dependency source is a core module.
   * @param dependencySource The source of the dependency to check.
   * @param baseDependencySource The base source of the dependency to check.
   * @returns True if the dependency source is a core module, false otherwise.
   */
  private _dependencySourceIsCoreModule(
    dependencySource: string,
    baseDependencySource: string
  ): boolean {
    // istanbul ignore next: Fallback for non-Node.js environments
    if (this._mod) {
      const baseSourceWithoutPrefix = baseDependencySource.startsWith("node:")
        ? baseDependencySource.slice(5)
        : baseDependencySource;
      return this._mod.builtinModules.includes(baseSourceWithoutPrefix);
    }
    // istanbul ignore next: Fallback for non-Node.js environments
    return isCoreModule(dependencySource);
  }

  /**
   * Determines if a dependency source is scoped (e.g., @scope/package).
   * @param dependencySource The source of the dependency to check.
   * @returns True if the dependency source is scoped, false otherwise.
   */
  private _dependencySourceIsScoped(dependencySource: string): boolean {
    return SCOPED_PACKAGE_REGEX.test(dependencySource);
  }

  /**
   * Determines if a dependency source is external or an alias.
   * @param dependencySource The source of the dependency to check.
   * @returns True if the dependency source is external or an alias, false otherwise.
   */
  private _dependencySourceIsExternalOrScoped(
    dependencySource: string
  ): boolean {
    return (
      EXTERNAL_PATH_REGEX.test(dependencySource) ||
      this._dependencySourceIsScoped(dependencySource)
    );
  }

  /**
   * Gets the base source of an external module.
   * @param dependencySource The source of the dependency to check.
   * @returns The base source of the external module. (e.g., for "@scope/package/submodule", it returns "@scope/package")
   */
  private _getExternalOrCoreModuleBaseSource(dependencySource: string): string {
    if (this._dependencySourceIsScoped(dependencySource)) {
      const [scope, packageName] = dependencySource.split("/");
      return `${scope}/${packageName}`;
    }
    const [pkg] = dependencySource.split("/");
    return pkg;
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
   * Checks if a source string matches any of the provided patterns using micromatch.
   * @param patterns - Array of micromatch patterns
   * @param source - The source string to match against patterns
   * @returns True if the source matches any pattern, false otherwise
   */
  private _matchesAnyPattern(
    patterns: MicromatchPattern,
    source?: string
  ): boolean {
    if (!source || patterns.length === 0) {
      return false;
    }
    return this._micromatch.isMatch(source, patterns);
  }

  /**
   * Determines if an element is external based on its file path and dependency source.
   * Uses the flagAsExternal configuration to evaluate multiple conditions with OR logic:
   * - unresolvableAlias: Files whose path cannot be resolved (filePath is null)
   * - inNodeModules: Non-relative paths that include "node_modules"
   * - outsideRootPath: Resolved path is outside the configured root path (only if rootPath is configured)
   * - customSourcePatterns: Source matches any of the configured patterns
   * @param filePath The resolved file path (null if unresolved). Can be absolute if rootPath is configured, or relative if rootPath is not configured.
   * @param isOutsideRootPath Whether the file path is outside the configured root path.
   * @param dependencySource The import/export source string
   * @returns True if any of the configured conditions is met, false otherwise
   */
  private _isExternalDependency(
    filePath: string | null,
    isOutsideRootPath: boolean,
    dependencySource?: string
  ): boolean {
    const {
      unresolvableAlias,
      inNodeModules,
      outsideRootPath,
      customSourcePatterns,
    } = this._config.flagAsExternal;

    // Check outsideRootPath: resolved path is outside configured root path
    if (outsideRootPath && isOutsideRootPath) {
      return true;
    }

    // Check inNodeModules: path includes node_modules
    if (inNodeModules && filePath?.includes("node_modules")) {
      return true;
    }

    // Check unresolvableAlias: dependency whose path cannot be resolved
    if (
      unresolvableAlias &&
      !filePath &&
      dependencySource &&
      this._dependencySourceIsExternalOrScoped(dependencySource)
    ) {
      return true;
    }

    // Check customSourcePatterns: source matches configured patterns
    if (this._matchesAnyPattern(customSourcePatterns, dependencySource)) {
      return true;
    }

    return false;
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
    const mode = isElementDescriptorMode(elementDescriptor.mode)
      ? elementDescriptor.mode
      : ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
    // TODO: Filter patterns to file/folder/full when mode supports "external". Another method to match external dependencies might be needed.
    const patterns = isArray(elementDescriptor.pattern)
      ? elementDescriptor.pattern
      : [elementDescriptor.pattern];

    for (const pattern of patterns) {
      const useFullPathMatch =
        mode === ELEMENT_DESCRIPTOR_MODES_MAP.FULL && !alreadyMatched;
      const effectivePattern =
        mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER && !alreadyMatched
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
  private _getFileDescription(filePath?: string): FileElement {
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
        path: filePath,
        isIgnored: true,
        origin: null,
      };
    }

    const parents: LocalElementKnown["parents"] = [];
    const elementResult: Partial<LocalElementKnown> = {
      path: filePath,
      type: null,
      category: null,
      captured: null,
      origin: ELEMENT_ORIGINS_MAP.LOCAL,
      isIgnored: false,
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
        const mode =
          elementDescriptor.mode || ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
        // It is the main element
        elementResult.type = elementDescriptor.type || null;
        elementResult.category = elementDescriptor.category || null;
        elementResult.isUnknown = false;
        elementResult.elementPath = elementPath;
        elementResult.captured = capturedValues;
        elementResult.internalPath =
          mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER ||
          filePath !== elementPath // When using 'file' mode, but the pattern matches a folder, we need to calculate the internal path
            ? filePath.replace(`${elementPath}/`, "")
            : filePath.split("/").pop(); // In 'file' mode, if the pattern matches the full file, internalPath is the file name
      } else {
        // It is a parent element, because we have already matched the main one
        parents.push({
          type: elementDescriptor.type || null,
          category: elementDescriptor.category || null,
          elementPath,
          captured: capturedValues,
        });
      }
    };

    // Optimized matching loop - reduced complexity from O(n*m) to better performance
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      state.pathSegmentsAccumulator.unshift(segment);

      // Early exit if we have both type and category (main element found)
      const alreadyHasMainElement =
        Boolean(elementResult.type) || Boolean(elementResult.category);

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
    if (!isKnownLocalElement(result)) {
      return {
        ...UNKNOWN_ELEMENT,
        path: filePath,
      };
    }

    return result;
  }

  /**
   * Describes a file given its path.
   * @param includeExternal Whether to include external files (inside node_modules) in the matching process.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  private _describeFile(filePath?: string): FileElement {
    const cacheKey = this._filesCache.getKey(String(filePath));
    if (this._filesCache.has(cacheKey)) {
      return this._filesCache.get(cacheKey)!;
    }
    const description = this._getFileDescription(filePath);
    this._filesCache.set(cacheKey, description);
    return description;
  }

  /**
   * Returns an external or core dependency element given its dependency source and file path.
   * @param dependencySource The source of the dependency.
   * @param isOutsideRootPath Whether the file path is outside the configured root path.
   * @param filePath The resolved file path of the dependency, if known. Can be absolute if rootPath is configured.
   * @returns The external or core dependency element, or null if it is a local dependency.
   */
  private _getExternalOrCoreDependencyElement(
    dependencySource: string,
    isOutsideRootPath: boolean,
    filePath?: string
  ): ExternalDependencyElement | CoreDependencyElement | null {
    const baseDependencySource =
      this._getExternalOrCoreModuleBaseSource(dependencySource);

    // Determine if the dependency source is a core module
    const isCore = this._dependencySourceIsCoreModule(
      dependencySource,
      baseDependencySource
    );

    if (isCore) {
      const coreElement: CoreDependencyElement = {
        ...UNKNOWN_ELEMENT,
        source: dependencySource,
        baseSource: baseDependencySource,
        origin: ELEMENT_ORIGINS_MAP.CORE,
      };
      return coreElement;
    }

    const isExternal = this._isExternalDependency(
      filePath || null,
      isOutsideRootPath,
      dependencySource
    );

    if (isExternal) {
      const externalElement: ExternalDependencyElement = {
        ...UNKNOWN_ELEMENT,
        path: filePath || null,
        internalPath: dependencySource.replace(baseDependencySource, ""),
        source: dependencySource,
        baseSource: baseDependencySource,
        origin: ELEMENT_ORIGINS_MAP.EXTERNAL,
      };
      return externalElement;
    }
    return null;
  }

  /**
   * Describes an element given its file path and dependency source, if any.
   * @param filePath The path of the file to describe. Can be absolute if rootPath is configured, or relative if not.
   * @param dependencySource The source of the dependency, if the element to describe is so. It refers to the import/export path used to reference the file or external module.
   * @returns The description of the element. A dependency element if dependency source is provided, otherwise a file element.
   */
  private _describeElement(): LocalElementUnknown;
  private _describeElement(filePath?: string): FileElement;
  private _describeElement(
    filePath?: string,
    dependencySource?: string
  ): DependencyElementDescription;

  private _describeElement(
    filePath?: string,
    dependencySource?: string
  ): ElementDescription {
    const cacheKey = `${String(dependencySource)}::${String(filePath)}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }

    const normalizedFilePath = filePath ? normalizePath(filePath) : filePath;
    const isOutsideRootPath = normalizedFilePath
      ? this._isOutsideRootPath(normalizedFilePath)
      : false;
    const relativePath =
      normalizedFilePath && this._config.rootPath
        ? this._toRelativePath(normalizedFilePath)
        : normalizedFilePath;

    const externalOrCoreDependencyElement = dependencySource
      ? this._getExternalOrCoreDependencyElement(
          dependencySource,
          isOutsideRootPath,
          relativePath
        )
      : null;

    if (externalOrCoreDependencyElement) {
      this._descriptionsCache.set(cacheKey, externalOrCoreDependencyElement);
      return externalOrCoreDependencyElement;
    }

    const fileDescription = this._describeFile(relativePath);
    const elementResult = dependencySource
      ? {
          ...fileDescription,
          source: dependencySource,
        }
      : fileDescription;

    this._descriptionsCache.set(cacheKey, elementResult);
    return elementResult;
  }

  /**
   * Describes an element given its file path.
   * @param filePath The path of the file to describe. Can be absolute if rootPath is configured, or relative if not.
   * @returns The description of the element.
   */
  public describeElement(filePath?: string): FileElement {
    return this._describeElement(filePath);
  }

  /**
   * Describes a dependency element given its dependency source and file path.
   * @param dependencySource The source of the dependency.
   * @param filePath The path of the file being the dependency, if known. Can be absolute if rootPath is configured, or relative if not.
   * @returns The description of the dependency element.
   */
  public describeDependencyElement(
    dependencySource: string,
    filePath?: string
  ): DependencyElementDescription {
    return this._describeElement(filePath, dependencySource);
  }
}
