import type { DependencyKind } from "../Descriptor";

/**
 * Selector for matching captured values in element selectors.
 * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
 */
export type CapturedValuesSelector = Record<string, string>;

/*
 * Simple element selector by type, represented as a string matching the element type.
 */
export type SimpleElementSelectorByType = string;

/**
 * Element selector by type.
 */
export type ElementSelectorByType = {
  /** Type of the element */
  type: SimpleElementSelectorByType;
  /** Category of the element */
  category?: never;
};

/**
 * Element selector by category.
 */
export type ElementSelectorByCategory = {
  /** Category of the element */
  category: string;
  /** Type of the element */
  type?: never;
};

/**
 * Element selector by both type and category.
 */
export type ElementSelectorByTypeAndCategory = {
  /** Type of the element */
  type: SimpleElementSelectorByType;
  /** Category of the element */
  category: string;
};

/**
 * Extra options for element selectors, including dependency kind, specifiers, and node kinds.
 */
export type ElementSelectorExtraOptions = {
  /** Dependency kind to filter elements */
  kind?: DependencyKind;
  /** Micromatch pattern(s) to match only specific imports/exports */
  specifiers?: string | string[];
  /** Node kind to filter elements */
  nodeKinds?: string | string[];
  /** Captured values selector for dynamic matching */
  captured?: CapturedValuesSelector;
};

/**
 * Element selector by type or category, which can be either by type, by category, or by both type and category.
 */
export type ElementSelectorByTypeOrCategory =
  | ElementSelectorByType
  | ElementSelectorByCategory
  | ElementSelectorByTypeAndCategory;

/**
 * Element selector data, which includes the element selector by type or category along with extra options such as dependency kind, specifiers, etc.
 */
export type ElementSelectorData = ElementSelectorByTypeOrCategory &
  ElementSelectorExtraOptions;

/**
 * Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use ElementSelector defining an object with type and/or category with capturedValues directly instead.
 */
export type ElementSelectorWithOptions =
  | [ElementSelectorData, CapturedValuesSelector]
  | [SimpleElementSelectorByType, CapturedValuesSelector];

/**
 * Element selector, which can be a simple string, object with type and/or category, or an element selector with options.
 */
export type ElementSelector =
  | SimpleElementSelectorByType
  | ElementSelectorData
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
  /** Micromatch pattern(s) to match only specific imports/exports */
  specifiers?: string[];
};

/**
 * External library selector with options, represented as a tuple where the first element is the import path of the external library, and the second element is an object containing options for selecting only specific paths or specifiers from that library.
 */
export type ExternalLibrarySelectorWithOptions = [
  SimpleElementSelectorByType,
  ExternalLibrarySelectorOptions,
];

/**
 * External library selector, which can be a simple string (the import path) or an external library selector with options.
 */
export type ExternalLibrarySelector =
  | SimpleElementSelectorByType
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
