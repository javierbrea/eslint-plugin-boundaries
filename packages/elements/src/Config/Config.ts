import type {
  ConfigOptions,
  MicromatchPattern,
  ConfigOptionsNormalized,
  DescriptorOptionsNormalized,
  MatchersOptionsNormalized,
  GlobalCacheOptionsNormalized,
  DescriptorsCacheOptionsNormalized,
  MatcherCacheOptionsNormalized,
} from "./Config.types";

export class Config {
  /** The ignore paths */
  private readonly _ignorePaths?: MicromatchPattern;
  /** The include paths */
  private readonly _includePaths?: MicromatchPattern;
  /** Whether legacy template support is enabled */
  private readonly _legacyTemplates: boolean;
  /** Options for global cache */
  private readonly _globalCacheOptions: GlobalCacheOptionsNormalized;
  /** Options for descriptors cache */
  private readonly _descriptorsCacheOptions: DescriptorsCacheOptionsNormalized;
  /** Options for matchers cache */
  private readonly _matcherCacheOptions: MatcherCacheOptionsNormalized;
  /** Whether the cache is completely disabled */
  private readonly _cacheIsEnabled: boolean;
  /**
   * Creates a new Config instance
   * @param options Configuration options
   */
  constructor(options?: ConfigOptions) {
    this._ignorePaths = options?.ignorePaths;
    this._includePaths = options?.includePaths;
    this._legacyTemplates = options?.legacyTemplates ?? true;
    this._cacheIsEnabled = options?.cache?.enabled !== false;

    this._globalCacheOptions = {
      micromatchPathRegexps: this._getCacheOptionIsEnabled(
        options?.cache?.global?.micromatchPathRegexps
      ),
      micromatchCaptures: this._getCacheOptionIsEnabled(
        options?.cache?.global?.micromatchCaptures
      ),
      micromatchMatchingResults: this._getCacheOptionIsEnabled(
        options?.cache?.global?.micromatchMatchingResults
      ),
      elementSelectorsNormalization: this._getCacheOptionIsEnabled(
        options?.cache?.global?.elementSelectorsNormalization
      ),
      handlebarsTemplates: this._getCacheOptionIsEnabled(
        options?.cache?.global?.handlebarsTemplates
      ),
    };

    this._descriptorsCacheOptions = {
      files: this._getCacheOptionIsEnabled(options?.cache?.descriptor?.files),
      elements: this._getCacheOptionIsEnabled(
        options?.cache?.descriptor?.elements
      ),
      dependencies: this._getCacheOptionIsEnabled(
        options?.cache?.descriptor?.dependencies
      ),
    };

    this._matcherCacheOptions = {
      elements: this._getCacheOptionIsEnabled(
        options?.cache?.matcher?.elements
      ),
      dependencies: this._getCacheOptionIsEnabled(
        options?.cache?.matcher?.dependencies
      ),
    };

    // Testing: Enable string caches by default
    this._cacheIsEnabled = true;
    this._globalCacheOptions.handlebarsTemplates = false;
    this._globalCacheOptions.micromatchMatchingResults = false;
    this._globalCacheOptions.micromatchCaptures = false;
    this._globalCacheOptions.micromatchPathRegexps = false;
    this._descriptorsCacheOptions.elements = true; // OK
    this._descriptorsCacheOptions.files = true; // OK
    this._descriptorsCacheOptions.dependencies = true; // OK
    this._matcherCacheOptions.elements = false; // OK
    this._matcherCacheOptions.dependencies = false; // OK
  }

  /**
   * Returns the value of a cache option
   * @param value The value from the user options
   * @returns False if the cache is disabled globally or the user disabled this value, true otherwise
   */
  private _getCacheOptionIsEnabled(value?: boolean) {
    // Testing: Disable all by default
    return !this._cacheIsEnabled ? false : value === true;
  }

  /**
   * The normalized configuration options
   */
  public get options(): ConfigOptionsNormalized {
    return {
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
      legacyTemplates: this._legacyTemplates,
      cache: {
        global: this._globalCacheOptions,
        descriptor: this._descriptorsCacheOptions,
        matcher: this._matcherCacheOptions,
      },
    };
  }

  /**
   * Normalized options for descriptors
   */
  public get descriptorOptions(): DescriptorOptionsNormalized {
    return {
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
      cache: this._descriptorsCacheOptions,
      cacheGlobal: this._globalCacheOptions,
    };
  }

  /**
   * Normalized options for element matchers
   */
  public get matchersOptions(): MatchersOptionsNormalized {
    return {
      legacyTemplates: this._legacyTemplates,
      cache: this._matcherCacheOptions,
      cacheGlobal: this._globalCacheOptions,
    };
  }

  /**
   * Normalized options for global cache
   */
  public get globalCacheOptions(): GlobalCacheOptionsNormalized {
    return this._globalCacheOptions;
  }

  /**
   * Cache is globally enabled
   */
  public get cacheIsEnabled(): boolean {
    return this._cacheIsEnabled;
  }
}
