/**
 * Type representing a micromatch pattern, which can be a string or an array of strings.
 */
export type MicromatchPattern = string | string[];

/** Configuration options for the Config class */
export type ConfigOptions = {
  /** The root path of the project, from where ElementsDescriptor will resolve paths */
  rootPath?: string;
  /** An array of path patterns to include when resolving elements. Defaults to all files if not specified */
  includePaths?: MicromatchPattern;
  /** An array of path patterns to ignore when resolving elements */
  ignorePaths?: MicromatchPattern;
};
