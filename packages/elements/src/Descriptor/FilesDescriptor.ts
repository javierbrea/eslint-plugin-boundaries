import type Mod from "node:module";

import isCoreModule from "is-core-module";

import { CacheManager, CacheManagerDisabled } from "../Cache";
import type { DescriptorOptionsNormalized, MicromatchPattern } from "../Config";
import type { Micromatch } from "../Matcher";
import { isArray, isNullish, normalizePath } from "../Support";

import type { ElementsDescriptor } from "./ElementsDescriptor";
import type {
  CapturedValues,
  ElementDescription,
  FileDescription,
  FileDescriptors,
  FileDescriptionsSerializedCache,
  FileCategories,
  FileOrigin,
  ExternalFileDescription,
  CoreFileDescription,
  IgnoredFile,
  LocalFileKnown,
  LocalFileUnknown,
} from "./ElementsDescriptor.types";
import { FILE_ORIGINS_MAP } from "./ElementsDescriptor.types";
import { isFileDescriptor } from "./ElementsDescriptorHelpers";

const SCOPED_PACKAGE_REGEX = /^@[^/]*\/?[^/]+/;
const EXTERNAL_PATH_REGEX = /^\w/;

type FileClassification = {
  origin: FileOrigin | null;
  isIgnored: boolean;
  category: FileCategories;
  captured: CapturedValues | null;
};

type FileDescriptorMatch = {
  descriptor: FileDescriptors[number];
  capture: string[];
  baseCapture: string[] | null;
};

/**
 * Class describing files in a project given their paths and configuration.
 */
export class FilesDescriptor {
  private _mod: typeof Mod | null = null;
  private readonly _elementsDescriptor: ElementsDescriptor;
  private readonly _fileDescriptors: FileDescriptors;
  private readonly _config: DescriptorOptionsNormalized;
  private readonly _micromatch: Micromatch;

  private readonly _descriptionsCache:
    | CacheManager<string, FileDescription>
    | CacheManagerDisabled<string, FileDescription>;

  constructor(
    elementsDescriptor: ElementsDescriptor,
    fileDescriptors: FileDescriptors,
    config: DescriptorOptionsNormalized,
    micromatch: Micromatch
  ) {
    this._elementsDescriptor = elementsDescriptor;
    this._fileDescriptors = fileDescriptors;
    this._validateDescriptors(fileDescriptors);
    this._config = config;
    this._micromatch = micromatch;
    this._loadModuleInNode();

    this._descriptionsCache = config.cache
      ? new CacheManager<string, FileDescription>()
      : new CacheManagerDisabled<string, FileDescription>();
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

  public serializeCache(): FileDescriptionsSerializedCache {
    return this._descriptionsCache.serialize();
  }

  public setCacheFromSerialized(
    serializedCache: FileDescriptionsSerializedCache
  ): void {
    this._descriptionsCache.setFromSerialized(serializedCache);
  }

  public clearCache(): void {
    this._descriptionsCache.clear();
  }

  private _validateDescriptors(fileDescriptors: FileDescriptors): void {
    let index = 0;
    for (const descriptor of fileDescriptors) {
      if (!isFileDescriptor(descriptor)) {
        throw new Error(
          `File descriptor at index ${index} must have a pattern and a 'category' defined.`
        );
      }
      index++;
    }
  }

  private _toPatterns(pattern: MicromatchPattern): string[] {
    return isArray(pattern) ? pattern : [pattern];
  }

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

  private _matchFileDescriptor({
    descriptor,
    filePath,
    currentPathSegments,
    lastPathSegmentMatching,
  }: {
    descriptor: FileDescriptors[number];
    filePath: string;
    currentPathSegments: string[];
    lastPathSegmentMatching: number;
  }): {
    matched: boolean;
    capture?: string[];
    baseCapture?: string[] | null;
  } {
    const useFullPathMatch = descriptor.fullMatch === true;
    const patterns = this._toPatterns(descriptor.pattern);

    for (const pattern of patterns) {
      const effectivePattern = pattern;

      const targetPath = useFullPathMatch
        ? filePath
        : currentPathSegments.join("/");

      let baseCapture: string[] | null = null;
      let hasCapture = true;

      if (descriptor.basePattern) {
        const baseTarget = filePath
          .split("/")
          .slice(0, filePath.split("/").length - lastPathSegmentMatching)
          .join("/");
        baseCapture = this._micromatch.capture(
          [descriptor.basePattern, "**", effectivePattern].join("/"),
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
        };
      }
    }

    return { matched: false };
  }

  private _getCapturedFromMatch(
    match: FileDescriptorMatch
  ): CapturedValues | null {
    const { descriptor, capture, baseCapture } = match;
    let capturedValues = this._getCapturedValues(capture, descriptor.capture);

    if (descriptor.basePattern && baseCapture) {
      capturedValues = {
        ...this._getCapturedValues(baseCapture, descriptor.baseCapture),
        ...capturedValues,
      };
    }

    return capturedValues;
  }

  private _mergeCapturedValues(
    matches: FileDescriptorMatch[]
  ): CapturedValues | null {
    const orderedMatches =
      this._config.descriptorsPriority === "last"
        ? matches
        : [...matches].reverse();

    return orderedMatches.reduce<CapturedValues | null>((acc, match) => {
      const currentCaptured = this._getCapturedFromMatch(match);
      if (!currentCaptured) {
        return acc;
      }
      return {
        ...(acc || {}),
        ...currentCaptured,
      };
    }, null);
  }

  private _appendCategories(
    categories: string[],
    descriptorCategory: string | string[]
  ): string[] {
    const values = isArray(descriptorCategory)
      ? descriptorCategory
      : [descriptorCategory];

    for (const value of values) {
      categories.push(value);
    }

    return categories;
  }

  private _pathIsIncluded(filePath: string): boolean {
    if (this._config.includePaths && this._config.ignorePaths) {
      const isIncluded = this._micromatch.isMatch(
        filePath,
        this._config.includePaths
      );
      const isIgnored = this._micromatch.isMatch(
        filePath,
        this._config.ignorePaths
      );

      return isIncluded && !isIgnored;
    }

    if (this._config.includePaths) {
      return this._micromatch.isMatch(filePath, this._config.includePaths);
    }

    if (this._config.ignorePaths) {
      return !this._micromatch.isMatch(filePath, this._config.ignorePaths);
    }

    return true;
  }

  private _isOutsideRootPath(filePath: string): boolean {
    if (!this._config.rootPath) {
      return false;
    }

    return !filePath.startsWith(this._config.rootPath);
  }

  private _toRelativePath(filePath: string): string {
    if (!this._config.rootPath || this._isOutsideRootPath(filePath)) {
      return filePath;
    }

    return filePath.replace(this._config.rootPath, "");
  }

  private _matchesAnyPattern(
    patterns: MicromatchPattern,
    source?: string
  ): boolean {
    if (!source || patterns.length === 0) {
      return false;
    }

    return this._micromatch.isMatch(source, patterns);
  }

  private _dependencySourceIsScoped(dependencySource: string): boolean {
    return SCOPED_PACKAGE_REGEX.test(dependencySource);
  }

  private _dependencySourceIsExternalOrScoped(
    dependencySource: string
  ): boolean {
    return (
      EXTERNAL_PATH_REGEX.test(dependencySource) ||
      this._dependencySourceIsScoped(dependencySource)
    );
  }

  private _getExternalOrCoreModuleModule(dependencySource: string): string {
    if (this._dependencySourceIsScoped(dependencySource)) {
      const [scope, packageName] = dependencySource.split("/");
      return `${scope}/${packageName}`;
    }
    const [pkg] = dependencySource.split("/");
    return pkg;
  }

  private _dependencySourceIsCoreModule(
    dependencySource: string,
    baseDependencySource: string
  ): boolean {
    // istanbul ignore next: Fallback for non-Node.js environments
    if (this._mod) {
      const moduleWithoutPrefix = baseDependencySource.startsWith("node:")
        ? baseDependencySource.slice(5)
        : baseDependencySource;
      return this._mod.builtinModules.includes(moduleWithoutPrefix);
    }

    // istanbul ignore next: Fallback for non-Node.js environments
    return isCoreModule(dependencySource);
  }

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

    if (outsideRootPath && isOutsideRootPath) {
      return true;
    }

    if (inNodeModules && filePath?.includes("node_modules")) {
      return true;
    }

    if (
      unresolvableAlias &&
      !filePath &&
      dependencySource &&
      this._dependencySourceIsExternalOrScoped(dependencySource)
    ) {
      return true;
    }

    if (this._matchesAnyPattern(customSourcePatterns, dependencySource)) {
      return true;
    }

    return false;
  }

  private _getDependencyOrigin(
    filePath: string | undefined,
    isOutsideRootPath: boolean,
    dependencySource?: string
  ): FileOrigin | null {
    if (!dependencySource) {
      return null;
    }

    const baseDependencySource =
      this._getExternalOrCoreModuleModule(dependencySource);

    if (
      this._dependencySourceIsCoreModule(dependencySource, baseDependencySource)
    ) {
      return FILE_ORIGINS_MAP.CORE;
    }

    if (
      this._isExternalDependency(
        filePath || null,
        isOutsideRootPath,
        dependencySource
      )
    ) {
      return FILE_ORIGINS_MAP.EXTERNAL;
    }

    return null;
  }

  private _getInternalPath(
    filePath: string | undefined,
    containerElementPath: string | null
  ): string | null {
    if (!filePath || !containerElementPath) {
      return null;
    }

    return filePath === containerElementPath
      ? filePath.split("/").pop() || null
      : filePath.replace(`${containerElementPath}/`, "");
  }

  private _resolveFileClassification(
    filePath: string | undefined,
    isOutsideRootPath: boolean,
    dependencySource?: string
  ): FileClassification {
    const dependencyOrigin = this._getDependencyOrigin(
      filePath,
      isOutsideRootPath,
      dependencySource
    );

    if (dependencyOrigin === FILE_ORIGINS_MAP.EXTERNAL) {
      return {
        origin: FILE_ORIGINS_MAP.EXTERNAL,
        isIgnored: false,
        category: null,
        captured: null,
      };
    }

    if (dependencyOrigin === FILE_ORIGINS_MAP.CORE) {
      return {
        origin: FILE_ORIGINS_MAP.CORE,
        isIgnored: false,
        category: null,
        captured: null,
      };
    }

    if (!filePath) {
      return {
        origin: FILE_ORIGINS_MAP.LOCAL,
        isIgnored: false,
        category: null,
        captured: null,
      };
    }

    if (!this._pathIsIncluded(filePath)) {
      return {
        origin: null,
        isIgnored: true,
        category: null,
        captured: null,
      };
    }

    if (this._fileDescriptors.length === 0) {
      return {
        origin: FILE_ORIGINS_MAP.LOCAL,
        isIgnored: false,
        category: null,
        captured: null,
      };
    }

    const pathSegments = filePath.split("/").reverse();
    const pathSegmentsAccumulator: string[] = [];

    let lastPathSegmentMatching = 0;
    const categories: string[] = [];
    const allMatches: FileDescriptorMatch[] = [];

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      pathSegmentsAccumulator.unshift(segment);

      const levelMatches: FileDescriptorMatch[] = [];

      for (const descriptor of this._fileDescriptors) {
        const match = this._matchFileDescriptor({
          descriptor,
          filePath,
          currentPathSegments: pathSegmentsAccumulator,
          lastPathSegmentMatching,
        });

        if (match.matched) {
          levelMatches.push({
            descriptor,
            capture: match.capture!,
            baseCapture: match.baseCapture || null,
          });
        }
      }

      if (levelMatches.length > 0) {
        for (const levelMatch of levelMatches) {
          this._appendCategories(categories, levelMatch.descriptor.category);
        }
        allMatches.push(...levelMatches);

        pathSegmentsAccumulator.length = 0;
        lastPathSegmentMatching = i + 1;
      }
    }

    return {
      origin: FILE_ORIGINS_MAP.LOCAL,
      isIgnored: false,
      category: categories.length > 0 ? categories : null,
      captured: this._mergeCapturedValues(allMatches),
    };
  }

  private _buildFileDescription(
    filePath: string | undefined,
    relativeFilePath: string | undefined,
    elementDescription: ElementDescription | null,
    fileClassification: FileClassification
  ): FileDescription {
    if (fileClassification.origin === FILE_ORIGINS_MAP.EXTERNAL) {
      const externalFile: ExternalFileDescription = {
        path: filePath || null,
        internalPath: null,
        category: fileClassification.category,
        captured: fileClassification.captured,
        element: null,
        origin: FILE_ORIGINS_MAP.EXTERNAL,
        isIgnored: false,
        isUnknown: true,
      };
      return externalFile;
    }

    if (fileClassification.origin === FILE_ORIGINS_MAP.CORE) {
      const coreFile: CoreFileDescription = {
        path: filePath || null,
        internalPath: null,
        category: fileClassification.category,
        captured: fileClassification.captured,
        element: null,
        origin: FILE_ORIGINS_MAP.CORE,
        isIgnored: false,
        isUnknown: true,
      };
      return coreFile;
    }

    if (fileClassification.isIgnored) {
      const ignoredFile: IgnoredFile = {
        path: filePath || null,
        internalPath: null,
        category: null,
        captured: null,
        element: null,
        origin: null,
        isIgnored: true,
        isUnknown: true,
      };
      return ignoredFile;
    }

    if (elementDescription === null) {
      const unknownLocalFile: LocalFileUnknown = {
        path: filePath || null,
        internalPath: null,
        category: fileClassification.category,
        captured: fileClassification.captured,
        element: null,
        origin: FILE_ORIGINS_MAP.LOCAL,
        isIgnored: false,
        isUnknown: true,
      };
      return unknownLocalFile;
    }

    const knownLocalFile: LocalFileKnown = {
      path: filePath || "",
      internalPath:
        this._getInternalPath(relativeFilePath, elementDescription.path) || "",
      category: fileClassification.category,
      captured: fileClassification.captured,
      element: elementDescription,
      origin: FILE_ORIGINS_MAP.LOCAL,
      isIgnored: false,
      isUnknown: false,
    };
    return knownLocalFile;
  }

  private _describeFile(
    filePath?: string,
    dependencySource?: string
  ): FileDescription {
    const normalizedFilePath = filePath ? normalizePath(filePath) : filePath;
    const isOutsideRootPath = normalizedFilePath
      ? this._isOutsideRootPath(normalizedFilePath)
      : false;
    const relativeFilePath = normalizedFilePath
      ? this._toRelativePath(normalizedFilePath)
      : normalizedFilePath;
    const cacheKey = `${String(dependencySource)}::${String(normalizedFilePath)}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }

    const elementDescription =
      this._elementsDescriptor.describeElement(relativeFilePath);

    const fileClassification = this._resolveFileClassification(
      relativeFilePath,
      isOutsideRootPath,
      dependencySource
    );

    const description = this._buildFileDescription(
      normalizedFilePath,
      relativeFilePath,
      elementDescription,
      fileClassification
    );

    this._descriptionsCache.set(cacheKey, description);
    return description;
  }

  public describeFile(
    filePath?: string,
    dependencySource?: string
  ): FileDescription {
    return this._describeFile(filePath, dependencySource);
  }
}
