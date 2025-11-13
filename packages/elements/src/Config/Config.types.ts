/**
 * Type representing a micromatch pattern, which can be a string or an array of strings.
 */
export type MicromatchPattern = string | string[];

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
};

export type ConfigOptionsNormalized = Omit<ConfigOptions, "legacyTemplates"> & {
  /** Whether to enable legacy template support */
  legacyTemplates: boolean;
};

/** Options for descriptors */
export type DescriptorOptionsNormalized = Pick<
  ConfigOptionsNormalized,
  "includePaths" | "ignorePaths"
>;

/** Options for element matchers */
export type MatchersOptionsNormalized = Pick<
  ConfigOptionsNormalized,
  "legacyTemplates"
>;
