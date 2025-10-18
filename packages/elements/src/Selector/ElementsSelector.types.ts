/**
 * Selector for matching captured values in element selectors.
 * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
 */
export type CapturedValuesSelector = Record<string, string>;

/*
 * Simple element selector, represented as a string matching the element type.
 */
export type SimpleElementSelector = string;

/**
 * Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 */
export type ElementSelectorWithOptions = [
  SimpleElementSelector,
  CapturedValuesSelector,
];

/**
 * Element selector, which can be a simple string or an element selector with options.
 */
export type ElementSelector =
  | SimpleElementSelector
  | ElementSelectorWithOptions;

/**
 * Elements selector, which can be a single element selector or an array of element selectors.
 */
export type ElementsSelector = ElementSelector | ElementSelector[];

/**
 * Element selectors, which can be a single element selector or an array of element selectors.
 * @deprecated Use ElementsSelector instead.
 */
export type ElementSelectors = ElementsSelector;

/**
 * Options for selecting external libraries, including path patterns and optional specifiers.
 * If specifiers are provided, they will be used to match specific imports from the external library.
 */
export type ExternalLibrarySelectorOptions = {
  /**
   * Micromatch pattern(s) to match only one or more specific subpaths of the external library.
   */
  path?: string | string[];
  /** Micromatch pattern(s) to match only specific imports from the external library. */
  specifiers?: string[];
};

/**
 * External library selector with options, represented as a tuple where the first element is the import path of the external library, and the second element is an object containing options for selecting only specific paths or specifiers from that library.
 */
export type ExternalLibrarySelectorWithOptions = [
  SimpleElementSelector,
  ExternalLibrarySelectorOptions,
];

/**
 * External library selector, which can be a simple string (the import path) or an external library selector with options.
 */
export type ExternalLibrarySelector =
  | SimpleElementSelector
  | ExternalLibrarySelectorWithOptions;

/**
 * External library selectors, which can be a single external library selector or an array of external library selectors.
 * @deprecated Use ExternalLibrariesSelector instead.
 */
export type ExternalLibrarySelectors = ExternalLibrariesSelector;

/**
 * External libraries selector, which can be a single external library selector or an array of external library selectors.
 */
export type ExternalLibrariesSelector =
  | ExternalLibrarySelector
  | ExternalLibrarySelector[];
