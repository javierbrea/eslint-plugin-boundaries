import type Mod from "node:module";

import isCoreModule from "is-core-module";

import { CacheManager, CacheManagerDisabled } from "../../Cache";
import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";
import { normalizePath, isNullish } from "../../Shared";
import type { MicromatchPattern } from "../../Shared";
import { PathHelper } from "../Shared";

import type { ModuleDescription } from "./ModuleDescription.types";
import { ORIGINS_MAP } from "./ModuleDescription.types";
import type { ModulesDescriptorSerializedCache } from "./ModuleDescriptor.types";

const SCOPED_PACKAGE_REGEX = /^@[^/]*\/?[^/]+/;
const EXTERNAL_PATH_REGEX = /^\w/;

/**
 * Class describing entity modules.
 */
export class ModulesDescriptor {
  private _mod: typeof Mod | null = null;
  /**
   * Cache to store previously described modules.
   */
  private readonly _descriptionsCache:
    | CacheManager<string, ModuleDescription>
    | CacheManagerDisabled<string, ModuleDescription>;

  /**
   * Configuration instance for this descriptor.
   */
  private readonly _config: DescriptorOptionsNormalized;

  /** Micromatch instance for path matching */
  private readonly _micromatch: Micromatch;

  /** Shared path helper providing root-path utilities */
  private readonly _pathHelper: PathHelper;

  /**
   * The configuration options for this descriptor.
   * @param configOptions The configuration options.
   * @param micromatch The micromatch instance for path matching.
   */
  constructor(
    configOptions: DescriptorOptionsNormalized,
    micromatch: Micromatch
  ) {
    this._micromatch = micromatch;
    this._config = configOptions;
    this._pathHelper = new PathHelper(configOptions, micromatch);
    this._descriptionsCache = this._config.cache
      ? new CacheManager<string, ModuleDescription>()
      : new CacheManagerDisabled<string, ModuleDescription>();
    this._loadModuleInNode();
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
      const moduleWithoutPrefix = baseDependencySource.startsWith("node:")
        ? baseDependencySource.slice(5)
        : baseDependencySource;
      return this._mod.builtinModules.includes(moduleWithoutPrefix);
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
  private _getExternalOrCoreSourceModule(dependencySource: string): string {
    if (this._dependencySourceIsScoped(dependencySource)) {
      const [scope, packageName] = dependencySource.split("/");
      return `${scope}/${packageName}`;
    }
    const [pkg] = dependencySource.split("/");
    return pkg;
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
  private _isExternal(
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
   * Serializes the origins cache to a plain object.
   * @returns The serialized origins cache.
   */
  public serializeCache(): ModulesDescriptorSerializedCache {
    return {
      descriptions: this._descriptionsCache.serialize(),
    };
  }

  /**
   * Sets the origins cache from a serialized object.
   * @param serializedCache The serialized origins cache.
   */
  public setCacheFromSerialized(
    serializedCache: ModulesDescriptorSerializedCache
  ): void {
    this._descriptionsCache.setFromSerialized(serializedCache.descriptions);
  }

  /**
   * Clears the origins cache.
   */
  public clearCache(): void {
    this._descriptionsCache.clear();
  }

  /**
   * Gets the module description for a given relative path and source.
   * @param relativePath The relative path of the file.
   * @param dependencySource The source of the dependency (e.g., the import statement or require call).
   * @returns The description of the file's module.
   */
  private _getDependencyModuleDescription(
    isOutsideRootPath: boolean,
    dependencySource: string,
    relativePath?: string
  ): ModuleDescription {
    const baseDependencySource =
      this._getExternalOrCoreSourceModule(dependencySource);
    const moduleInternalPath = dependencySource.startsWith(
      `${baseDependencySource}/`
    )
      ? dependencySource.slice(baseDependencySource.length + 1)
      : null;

    // Determine if the dependency source is a core module
    const isCore = this._dependencySourceIsCoreModule(
      dependencySource,
      baseDependencySource
    );

    if (isCore) {
      return {
        origin: ORIGINS_MAP.CORE,
        source: baseDependencySource,
        internalPath: moduleInternalPath,
      };
    }

    const isExternal = this._isExternal(
      relativePath || null,
      isOutsideRootPath,
      dependencySource
    );

    if (isExternal) {
      return {
        origin: ORIGINS_MAP.EXTERNAL,
        source: baseDependencySource,
        internalPath: moduleInternalPath,
      };
    }

    return {
      origin: ORIGINS_MAP.LOCAL,
      source: null,
      internalPath: null,
    };
  }

  /**
   * Gets the module description for a file that is not imported as a dependency.
   * @param isOutsideRootPath Indicates if the file is outside the configured root path.
   * @param relativePath The relative path of the file.
   * @returns The description of the file's module.
   */
  private _getFileModuleDescription(
    isOutsideRootPath: boolean,
    relativePath?: string
  ): ModuleDescription {
    const isExternal = this._isExternal(
      relativePath || null,
      isOutsideRootPath
    );
    if (isExternal) {
      return {
        origin: ORIGINS_MAP.EXTERNAL,
        source: null,
        internalPath: null,
      };
    }
    return {
      origin: ORIGINS_MAP.LOCAL,
      source: null,
      internalPath: null,
    };
  }

  /**
   * Gets the origin description for a given relative path and source.
   * @param relativePath The relative path of the file.
   * @param source The source of the dependency (e.g., the import statement or require call).
   * @param isOutsideRootPath Whether the file path is outside the configured root path.
   * @returns The description of the file's module.
   */
  private _getModuleDescription(
    isOutsideRootPath: boolean,
    relativePath?: string,
    source?: string
  ): ModuleDescription {
    if (source) {
      return this._getDependencyModuleDescription(
        isOutsideRootPath,
        source,
        relativePath
      );
    }
    return this._getFileModuleDescription(isOutsideRootPath, relativePath);
  }

  /**
   * Describes the module of a file path given its dependency source and the file path itself.
   * @param filePath The absolute path of the file to describe
   * @param source The source of the dependency (e.g., the import statement or require call)
   * @returns The description of the file's module, including its origin, and module if applicable
   */
  public describeModule(filePath?: string, source?: string): ModuleDescription {
    const cacheKey = `${filePath}::${source}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }
    const normalizedFilePath = filePath ? normalizePath(filePath) : filePath;
    const isOutsideRootPath = normalizedFilePath
      ? this._pathHelper.isOutsideRootPath(normalizedFilePath)
      : true;
    const relativePath =
      normalizedFilePath && this._config.rootPath
        ? this._pathHelper.toRelativePath(normalizedFilePath)
        : normalizedFilePath;
    const moduleDescription = this._getModuleDescription(
      isOutsideRootPath,
      relativePath,
      source
    );
    this._descriptionsCache.set(cacheKey, moduleDescription);
    return moduleDescription;
  }
}
