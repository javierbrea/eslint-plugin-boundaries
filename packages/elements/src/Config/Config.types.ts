/**
 * Type representing a micromatch pattern, which can be a string or an array of strings.
 */
export type MicromatchPattern = string | string[];

/**
 * Options for configuring the global cache
 */
export type GlobalCacheOptions = {
  /** Whether to enable global caching */
  micromatchPathRegexps?: boolean;
  /** Whether to enable micromatch captures caching */
  micromatchCaptures?: boolean;
  /** Whether to enable micromatch matching results caching */
  micromatchMatchingResults?: boolean;
  /** Whether to enable normalized elements selectors caching */
  elementSelectorsNormalization?: boolean;
  /** Whether to enable Handlebars templates caching */
  handlebarsTemplates?: boolean;
};

/**
 * Options for configuring the global cache, with default values
 */
export type GlobalCacheOptionsNormalized = {
  /** Whether to enable global caching */
  micromatchPathRegexps: boolean;
  /** Whether to enable micromatch captures caching */
  micromatchCaptures: boolean;
  /** Whether to enable micromatch matching results caching */
  micromatchMatchingResults: boolean;
  /** Whether to enable normalized elements selectors caching */
  elementSelectorsNormalization: boolean;
  /** Whether to enable Handlebars templates caching */
  handlebarsTemplates: boolean;
};

/**
 * Options for configuring the descriptors cache
 */
export type DescriptorsCacheOptions = {
  /** Whether to enable local elements descriptors caching */
  files?: boolean;
  /** Whether to enable elements descriptors caching */
  elements?: boolean;
  /** Whether to enable dependencies descriptors caching */
  dependencies?: boolean;
};

/**
 * Options for configuring the descriptors cache, with default values
 */
export type DescriptorsCacheOptionsNormalized = {
  /** Whether to enable local elements descriptors caching */
  files: boolean;
  /** Whether to enable elements descriptors caching */
  elements: boolean;
  /** Whether to enable dependencies descriptors caching */
  dependencies: boolean;
};

/**
 * Options for configuring the matchers cache
 */
export type MatcherCacheOptions = {
  /** Whether to enable dependencies matching results caching */
  dependencies?: boolean;
  /** Whether to enable elements matching results caching */
  elements?: boolean;
};

/**
 * Options for configuring the matchers cache, with default values
 */
export type MatcherCacheOptionsNormalized = {
  /** Whether to enable dependencies matching results caching */
  dependencies: boolean;
  /** Whether to enable elements matching results caching */
  elements: boolean;
};

/**
 * Options for configuring the cache
 */
export type CacheOptions = {
  /** Whether to enable caching. If false, it disables all other caching options */
  enabled?: boolean;
  /** Global cache options */
  global?: GlobalCacheOptions;
  /** Descriptor cache options */
  descriptor?: DescriptorsCacheOptions;
  /** Matcher cache options */
  matcher?: MatcherCacheOptions;
};

/**
 * Options for configuring the cache, with default values
 */
export type CacheOptionsNormalized = {
  /** Global cache options */
  global: GlobalCacheOptionsNormalized;
  /** Descriptor cache options */
  descriptor: DescriptorsCacheOptionsNormalized;
  /** Matcher cache options */
  matcher: MatcherCacheOptionsNormalized;
};

/** Configuration options for the Config class */
export type ConfigOptions = {
  /** An array of path patterns to include when resolving elements. Defaults to all files if not specified */
  includePaths?: MicromatchPattern;
  /** An array of path patterns to ignore when resolving elements */
  ignorePaths?: MicromatchPattern;
  /**
   * Whether to enable legacy template support (default: true)
   * When enabled, it supports using "${...}" syntax in templates.
   **/
  legacyTemplates?: boolean;
  /**
   * Options for configuring the cache
   */
  cache?: CacheOptions;
};

export type ConfigOptionsNormalized = Omit<ConfigOptions, "legacyTemplates"> & {
  /** Whether to enable legacy template support */
  legacyTemplates: boolean;
  /** Cache configuration options */
  cache: CacheOptionsNormalized;
};

/** Options for descriptors */
export type DescriptorOptionsNormalized = Pick<
  ConfigOptionsNormalized,
  "includePaths" | "ignorePaths"
> & {
  cache: DescriptorsCacheOptionsNormalized;
  cacheGlobal: GlobalCacheOptionsNormalized;
};

/** Options for element matchers */
export type MatchersOptionsNormalized = Pick<
  ConfigOptionsNormalized,
  "legacyTemplates"
> & {
  cache: MatcherCacheOptionsNormalized;
  cacheGlobal: GlobalCacheOptionsNormalized;
};
