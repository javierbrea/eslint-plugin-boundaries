import { normalizePath } from "../Support";

import type {
  ConfigOptions,
  MicromatchPattern,
  ConfigOptionsNormalized,
  DescriptorOptionsNormalized,
  MatchersOptionsNormalized,
  FlagAsExternalOptionsNormalized,
} from "./Config.types";

export class Config {
  /** The ignore paths */
  private readonly _ignorePaths?: MicromatchPattern;
  /** The include paths */
  private readonly _includePaths?: MicromatchPattern;
  /** Whether legacy template support is enabled */
  private readonly _legacyTemplates: boolean;
  /** Whether the cache is enabled */
  private readonly _cache: boolean;
  /** Configuration for categorizing dependencies as external or local */
  private readonly _flagAsExternal: FlagAsExternalOptionsNormalized;
  /** Root path of the project */
  private readonly _rootPath?: string;
  /**
   * Creates a new Config instance
   * @param options Configuration options
   */
  constructor(options?: ConfigOptions) {
    this._ignorePaths = options?.ignorePaths;
    this._includePaths = options?.includePaths;
    this._legacyTemplates = options?.legacyTemplates ?? true;
    this._cache = options?.cache ?? true;
    this._flagAsExternal = {
      unresolvableAlias: options?.flagAsExternal?.unresolvableAlias ?? true,
      inNodeModules: options?.flagAsExternal?.inNodeModules ?? true,
      outsideRootPath: options?.flagAsExternal?.outsideRootPath ?? false,
      customSourcePatterns: options?.flagAsExternal?.customSourcePatterns ?? [],
    };
    if (options?.rootPath) {
      const normalizedRoot = normalizePath(options.rootPath);
      this._rootPath = normalizedRoot.endsWith("/")
        ? normalizedRoot
        : `${normalizedRoot}/`;
    } else {
      this._rootPath = undefined;
    }
  }

  /**
   * The normalized configuration options
   */
  public get options(): ConfigOptionsNormalized {
    return {
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
      legacyTemplates: this._legacyTemplates,
      cache: this._cache,
      flagAsExternal: this._flagAsExternal,
      rootPath: this._rootPath,
    };
  }

  /**
   * Normalized options for descriptors
   */
  public get descriptorOptions(): DescriptorOptionsNormalized {
    return {
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
      cache: this._cache,
      flagAsExternal: this._flagAsExternal,
      rootPath: this._rootPath,
    };
  }

  /**
   * Normalized options for element matchers
   */
  public get matchersOptions(): MatchersOptionsNormalized {
    return {
      legacyTemplates: this._legacyTemplates,
    };
  }

  /**
   * Whether caching is enabled
   */
  public get cache(): boolean {
    return this._cache;
  }
}
