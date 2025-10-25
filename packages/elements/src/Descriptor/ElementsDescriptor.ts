import type Mod from "module";

import isCoreModule from "is-core-module";
import micromatch from "micromatch";

import { CacheManager } from "../Cache";
import type { ConfigOptions } from "../Config";
import { Config } from "../Config";
import { isArray, isNullish } from "../Support";

import type {
  ElementDescription,
  ElementDescriptor,
  ElementDescriptors,
  ElementsDescriptorSerializedCache,
  LocalElementKnown,
  CapturedValues,
  LocalDependencyElement,
  FileElement,
  ExternalDependencyElement,
  LocalElementUnknown,
  CoreDependencyElement,
  DependencyElement,
} from "./ElementsDescriptor.types";
import {
  ELEMENT_DESCRIPTOR_MODES_MAP,
  ELEMENT_ORIGINS_MAP,
} from "./ElementsDescriptor.types";
import {
  isElementDescriptorMode,
  isIgnoredElement,
  isKnownLocalElement,
} from "./ElementsDescriptorHelpers";

const UNKNOWN_LOCAL_ELEMENT: LocalElementUnknown = {
  path: null,
  type: null,
  category: null,
  capturedValues: null,
  origin: ELEMENT_ORIGINS_MAP.LOCAL,
};

/**
 * Class describing elements in a project given their paths and configuration.
 */
export class ElementsDescriptor {
  private _mod: typeof Mod | null = null;
  /**
   * Cache to store previously described elements.
   */
  private _elementsCache: CacheManager<
    {
      dependencySource?: string;
      filePath: string;
    },
    ElementDescription
  > = new CacheManager();

  /**
   * Cache to store previously described files.
   */
  private _filesCache: CacheManager<string, FileElement> = new CacheManager();
  /**
   * Configuration instance for this descriptor.
   */
  private _config: Config;

  /**
   * Element descriptors used by this descriptor.
   */
  private _elementDescriptors: ElementDescriptors;

  /**
   * The configuration options for this descriptor.
   * @param elementDescriptors The element descriptors.
   * @param configOptions The configuration options.
   */
  constructor(
    elementDescriptors: ElementDescriptors,
    configOptions?: ConfigOptions,
  ) {
    this._elementDescriptors = elementDescriptors;
    this._config = new Config(configOptions);
    this._loadModuleInNode();
  }

  /**
   * Serializes the elements cache to a plain object.
   * @returns The serialized elements cache.
   */
  public serializeCache(): ElementsDescriptorSerializedCache {
    return this._elementsCache.serialize();
  }

  /**
   * Sets the elements cache from a serialized object.
   * @param serializedCache The serialized elements cache.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsDescriptorSerializedCache,
  ): void {
    this._elementsCache.setFromSerialized(serializedCache);
  }

  /**
   * Loads the Node.js module to access built-in modules information when running in Node.js environment.
   */
  private _loadModuleInNode(): void {
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
   * Determines if a dependency source is a core module.
   * @param dependencySource The source of the dependency to check.
   * @param baseDependencySource The base source of the dependency to check.
   * @returns True if the dependency source is a core module, false otherwise.
   */
  private _dependencySourceIsCoreModule(
    dependencySource: string,
    baseDependencySource: string,
  ): boolean {
    if (this._mod) {
      const baseSourceWithoutPrefix = baseDependencySource.startsWith("node:")
        ? baseDependencySource.slice(5)
        : baseDependencySource;
      return this._mod.builtinModules.includes(baseSourceWithoutPrefix);
    }
    return isCoreModule(dependencySource);
  }

  /**
   * Determines if a dependency source is scoped (e.g., @scope/package).
   * @param dependencySource The source of the dependency to check.
   * @returns True if the dependency source is scoped, false otherwise.
   */
  private _dependencySourceIsScoped(dependencySource: string): boolean {
    return /^@[^/]*\/?[^/]+/.test(dependencySource);
  }

  /**
   * Determines if a dependency source is external or an alias.
   * @param dependencySource The source of the dependency to check.
   * @returns True if the dependency source is external or an alias, false otherwise.
   */
  private _dependencySourceIsExternalOrScoped(
    dependencySource: string,
  ): boolean {
    return (
      /^\w/.test(dependencySource) ||
      this._dependencySourceIsScoped(dependencySource)
    );
  }

  /**
   * Gets the base source of an external module.
   * @param dependencySource The source of the dependency to check.
   * @returns The base source of the external module. (e.g., for "@scope/package/submodule", it returns "@scope/package")
   */
  private _getExternalModuleBaseSource(dependencySource: string): string {
    if (this._dependencySourceIsScoped(dependencySource)) {
      const [scope, packageName] = dependencySource.split("/");
      return `${scope}/${packageName}`;
    }
    const [pkg] = dependencySource.split("/");
    return pkg;
  }

  /**
   * Determines if an element is external based on its file path and dependency source.
   * Files inside "node_modules" are considered external.
   * If the dependency source is not provided, only the file path is considered.
   * If the dependency source is provided, it must not be a local path (i.e, it should start by "./", "../", or "/").
   * @param filePath
   * @param dependencySource
   * @returns
   */
  private _isExternalDependency(
    filePath: string | null,
    dependencySource?: string,
  ): boolean {
    return (
      (!filePath || filePath.includes("node_modules")) &&
      (!dependencySource ||
        this._dependencySourceIsExternalOrScoped(dependencySource))
    );
  }

  /**
   * Determines if a given path is included based on the configuration.
   * @param elementPath The element path to check.
   * @returns True if the path is included, false otherwise.
   */
  private _pathIsIncluded(elementPath: string): boolean {
    if (this._config.options.includePaths && this._config.options.ignorePaths) {
      const isIncluded = micromatch.isMatch(
        elementPath,
        this._config.options.includePaths,
      );
      const isIgnored = micromatch.isMatch(
        elementPath,
        this._config.options.ignorePaths,
      );
      return isIncluded && !isIgnored;
    } else if (this._config.options.includePaths) {
      return micromatch.isMatch(elementPath, this._config.options.includePaths);
    } else if (this._config.options.ignorePaths) {
      return !micromatch.isMatch(elementPath, this._config.options.ignorePaths);
    }
    return true;
  }

  /**
   * Gets captured values from the captured array and capture configuration.
   * @param captured The array of captured strings.
   * @param captureConfig The configuration for capturing values.
   * @returns The captured values as an object.
   */
  private _getCapturedValues(
    captured: string[],
    captureConfig?: string[],
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
    allPathSegments: string[],
  ): string {
    const elementPathRegexp = micromatch.makeRe(pathPattern);
    const testedSegments: string[] = [];
    let result: string | undefined;
    pathSegments.forEach((pathSegment) => {
      if (!result) {
        testedSegments.push(pathSegment);
        const joinedSegments = testedSegments.join("/");
        if (elementPathRegexp.test(joinedSegments)) {
          result = joinedSegments;
        }
      }
    });
    if (!result) {
      return [...allPathSegments].reverse().join("/");
    }
    return `${[...allPathSegments].reverse().join("/").split(result)[0]}${result}`;
  }

  /**
   * Determines if an element descriptor matches the given parameters in the provided path.
   * @param options The options for matching the descriptor.
   * @returns The result of the match, including whether it matched and any captured values.
   */
  private _fileDescriptorMatch = ({
    elementDescriptor,
    filePath,
    currentPathSegments,
    lastPathSegmentMatching,
    alreadyMatched,
  }: {
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
  }): {
    matched: boolean;
    capture?: string[];
    baseCapture?: string[] | null;
    useFullPathMatch?: boolean;
    patternUsed?: string;
  } => {
    const mode = isElementDescriptorMode(elementDescriptor.mode)
      ? elementDescriptor.mode
      : ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
    // TODO: Filter patterns to file/folder/full when mode supports "external".
    // Another method to match external dependencies might be needed, using source instead of filePath.
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

      let baseCapture: string[] | null = null;
      let hasCapture = true;

      if (elementDescriptor.basePattern) {
        const baseTarget = filePath
          .split("/")
          .slice(0, filePath.split("/").length - lastPathSegmentMatching)
          .join("/");
        baseCapture = micromatch.capture(
          [elementDescriptor.basePattern, "**", effectivePattern].join("/"),
          baseTarget,
        );
        hasCapture = baseCapture !== null;
      }

      const capture = micromatch.capture(
        effectivePattern,
        useFullPathMatch ? filePath : currentPathSegments.join("/"),
      );

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
  };

  /**
   * Retrieves the description of an element given its path.
   * It does not identify external files. Files not matching any element are considered unknown.
   * If a file in node_modules does a match, it is considered local as well.
   * @param elementPath The path of the element to describe.
   * @returns The description of the element.
   */
  private _getFileDescription(filePath?: string): FileElement {
    // Return unknown element if no file path is provided. Filepath couldn't be resolved.
    if (!filePath) {
      return {
        ...UNKNOWN_LOCAL_ELEMENT,
      };
    }

    // Return ignored element if the path is not included in the configuration.
    if (!this._pathIsIncluded(filePath)) {
      return {
        ...UNKNOWN_LOCAL_ELEMENT,
        isIgnored: true,
      };
    }

    const parents: LocalElementKnown["parents"] = [];
    const elementResult: Partial<LocalElementKnown> = {
      path: filePath,
      type: null,
      category: null,
      capturedValues: null,
      origin: ELEMENT_ORIGINS_MAP.LOCAL,
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
      matchInfo: NonNullable<ReturnType<typeof this._fileDescriptorMatch>>,
      currentPathSegments: string[],
      elementPaths: string[],
    ) => {
      const { capture, baseCapture, useFullPathMatch, patternUsed } = matchInfo;
      if (!capture || !patternUsed) return;

      let capturedValues = this._getCapturedValues(
        capture,
        elementDescriptor.capture,
      );

      if (elementDescriptor.basePattern && baseCapture) {
        capturedValues = {
          ...this._getCapturedValues(
            baseCapture,
            elementDescriptor.baseCapture,
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
        elementResult.elementPath = elementPath;
        elementResult.capturedValues = capturedValues;
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
          capturedValues,
        });
      }
    };

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      state.pathSegmentsAccumulator.unshift(segment);

      for (const elementDescriptor of this._elementDescriptors) {
        const match = this._fileDescriptorMatch({
          elementDescriptor,
          filePath,
          currentPathSegments: state.pathSegmentsAccumulator,
          lastPathSegmentMatching: state.lastPathSegmentMatching,
          alreadyMatched:
            Boolean(elementResult.type) || Boolean(elementResult.category),
        });

        if (match.matched) {
          processElementMatch(
            elementDescriptor,
            match,
            state.pathSegmentsAccumulator,
            pathSegments,
          );
          state.pathSegmentsAccumulator = [];
          state.lastPathSegmentMatching = i + 1;
          break;
        }
      }
    }

    const result = { ...elementResult, parents };

    // Not matched as any element, ensure that it is marked as unknown
    if (!isKnownLocalElement(result)) {
      return {
        ...UNKNOWN_LOCAL_ELEMENT,
        path: filePath,
      };
    }

    return result;
  }

  /**
   * Describes a file given its path.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  private _describeFile(filePath?: string): FileElement {
    if (this._filesCache.has(String(filePath))) {
      return this._filesCache.get(String(filePath))!;
    }
    const description = this._getFileDescription(filePath);
    this._filesCache.set(String(filePath), description);
    return description;
  }

  /**
   * Describes a dependency element given the file element and dependency source, by completing the file description.
   * @param element The file element to complete the description for.
   * @param dependencySource The source of the dependency.
   * @returns The description of the dependency element.
   */
  private _describeDependencyElement(
    element: FileElement,
    dependencySource: string,
  ): DependencyElement {
    // Ignored elements remain ignored
    if (isIgnoredElement(element)) {
      return element;
    }

    // Determine if the dependency source is a core module
    const baseDependencySource =
      this._getExternalModuleBaseSource(dependencySource);
    const isCore = this._dependencySourceIsCoreModule(
      dependencySource,
      baseDependencySource,
    );

    // Core modules become core dependency elements
    if (isCore) {
      const coreElement: CoreDependencyElement = {
        ...element,
        source: dependencySource,
        baseSource: baseDependencySource,
        origin: ELEMENT_ORIGINS_MAP.CORE,
      };
      return coreElement;
    }

    const isExternal = this._isExternalDependency(
      element.path,
      dependencySource,
    );

    // Local elements become dependency elements, but only with the source and baseSource added
    if (!isExternal) {
      const localElement: LocalDependencyElement = {
        ...element,
        source: dependencySource,
        baseSource: baseDependencySource,
      };
      return localElement;
    }

    // External elements become external dependency elements. Internal path is calculated from the source minus the base source.
    const externalElement: ExternalDependencyElement = {
      ...element,
      internalPath: dependencySource.replace(baseDependencySource, ""),
      source: dependencySource,
      baseSource: baseDependencySource,
      origin: ELEMENT_ORIGINS_MAP.EXTERNAL,
    };
    return externalElement;
  }

  /**
   * Describes an element given its file path and dependency source, if any.
   * @param filePath The path of the file to describe.
   * @param dependencySource The source of the dependency, if the element to describe is so. It refers to the import/export path used to reference the file or external module.
   * @returns The description of the element. A dependency element if dependency source is provided, otherwise a file element.
   */
  public describeElement(): LocalElementUnknown;
  public describeElement(
    // eslint-disable-next-line no-unused-vars
    filePath?: string,
  ): FileElement;
  public describeElement(
    // eslint-disable-next-line no-unused-vars
    filePath?: string,
    // eslint-disable-next-line no-unused-vars
    dependencySource?: string,
  ): DependencyElement;

  public describeElement(
    filePath?: string,
    dependencySource?: string,
  ): ElementDescription {
    if (
      this._elementsCache.has({
        dependencySource,
        filePath: String(filePath),
      })
    ) {
      return this._elementsCache.get({
        dependencySource,
        filePath: String(filePath),
      })!;
    }

    // First we get the file description
    const fileDescription = this._describeFile(filePath);
    const elementResult = dependencySource
      ? this._describeDependencyElement(fileDescription, dependencySource)
      : fileDescription;

    this._elementsCache.set(
      {
        dependencySource,
        filePath: String(filePath),
      },
      elementResult,
    );
    return elementResult;
  }
}
