/**
 * Type representing a micromatch pattern, which can be a string or an array of strings.
 */
export type MicromatchPattern = string | string[];

/**
 * Configuration options for categorizing dependencies as external or local.
 */
export type FlagAsExternalOptions = {
  /** When true, non-relative dependencies whose path cannot be resolved are categorized as external (default: true) */
  unresolvableAlias?: boolean;
  /** When true, non-relative paths that include node_modules are categorized as external (default: true) */
  inNodeModules?: boolean;
  /** When true, dependencies whose resolved path is outside the configured root path are categorized as external (default: false) */
  outsideRootPath?: boolean;
  /** List of patterns (using micromatch syntax) that, when matching the source of the dependency, categorize it as external (default: []) */
  customSourcePatterns?: string[];
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
  /** Whether to enable caching */
  cache?: boolean;
  /** Configuration for categorizing dependencies as external or local */
  flagAsExternal?: FlagAsExternalOptions;
  /** Root path of the project, used for determining if dependencies are outside the project */
  rootPath?: string;
};

export type FlagAsExternalOptionsNormalized = {
  /** When true, non-relative dependencies whose path cannot be resolved are categorized as external */
  unresolvableAlias: boolean;
  /** When true, non-relative paths that include node_modules are categorized as external */
  inNodeModules: boolean;
  /** When true, dependencies whose resolved path is outside the configured root path are categorized as external */
  outsideRootPath: boolean;
  /** List of patterns (using micromatch syntax) that, when matching the source of the dependency, categorize it as external */
  customSourcePatterns: string[];
};

export type ConfigOptionsNormalized = Omit<
  ConfigOptions,
  "legacyTemplates" | "cache" | "flagAsExternal"
> & {
  /** Whether to enable legacy template support */
  legacyTemplates: boolean;
  /** Cache configuration options */
  cache: boolean;
  /** Configuration for categorizing dependencies as external or local */
  flagAsExternal: FlagAsExternalOptionsNormalized;
  /** Root path of the project, already normalized, and finishing with a slash, used for determining if dependencies are outside the project */
  rootPath: string | undefined;
};

/** Options for descriptors */
export type DescriptorOptionsNormalized = Pick<
  ConfigOptionsNormalized,
  "includePaths" | "ignorePaths" | "cache" | "flagAsExternal" | "rootPath"
>;

/** Options for element matchers */
export type MatchersOptionsNormalized = Pick<
  ConfigOptionsNormalized,
  "legacyTemplates"
>;
