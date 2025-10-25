import type { MicromatchPattern } from "../Config";
import type {
  DependencyKind,
  // DependencyRelationship, TODO: Enable relationship filtering when migrating the "no-private" rule. This would require to add relationship both to file elements and dependency elements in dependencyData
  ElementOrigin,
  ELEMENT_ORIGINS_MAP,
  LocalElementKnown,
  CoreDependencyElement,
  ExternalDependencyElement,
  LocalDependencyElementKnown,
} from "../Descriptor";

/**
 * Elements that can return a match when using an element selector.
 */
export type SelectableElements =
  | LocalElementKnown
  | CoreDependencyElement
  | ExternalDependencyElement
  | LocalDependencyElementKnown;

/**
 * Selector for matching captured values in element selectors.
 * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
 */
export type CapturedValuesSelector = Record<string, MicromatchPattern>;

/**
 * Data to pass to captured patterns when they are rendered using templates before matching.
 */
export type CapturedValuesTemplatesData = Record<string, unknown>;

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
 * Element selector by type or category, which can be either by type, by category, or by both type and category.
 */
export type ElementSelectorByTypeOrCategory =
  | ElementSelectorByType
  | ElementSelectorByCategory
  | ElementSelectorByTypeAndCategory;

/**
 * Selector for file elements, including captured values for dynamic matching.
 */
export type BaseElementSelectorData = ElementSelectorByTypeOrCategory & {
  /** Captured values selector for dynamic matching */
  captured?: CapturedValuesSelector;
  /** Micromatch pattern(s) to match internal paths within the file */
  internalPath?: MicromatchPattern;
  /** Relationship of the file element with the dependency declared in it */
  // TODO: Enable relationship filtering when migrating the "no-private" rule. This would require to add relationship both to file elements and dependency elements in dependencyData
  //relationship?: DependencyRelationship | DependencyRelationship[];
  /** Origin of the element */
  origin?: typeof ELEMENT_ORIGINS_MAP.LOCAL;
};

/**
 * Selector for dependency elements, including kind, specifier, and node kind filters.
 */
export type DependencyElementSelectorData = Omit<
  BaseElementSelectorData,
  "origin"
> & {
  /** Relationship of the dependency element with the file originating the dependency */
  // TODO: Enable relationship filtering when migrating the "no-private" rule. This would require to add relationship both to file elements and dependency elements in dependencyData
  // relationship?: DependencyRelationship | DependencyRelationship[];
  /** Origin of the element */
  origin?: ElementOrigin | ElementOrigin[];
  /** Dependency kind to filter elements */
  kind?: DependencyKind;
  // TODO: Pass specifier to DependencyData
  /** Micromatch pattern(s) to match only specific imports/exports */
  specifier?: MicromatchPattern;
  /** Node kind to filter elements */
  nodeKind?: MicromatchPattern;
};

/**
 * Element selector data, which may be a file element selector or a dependency element selector.
 */
export type ElementSelectorData =
  | BaseElementSelectorData
  | DependencyElementSelectorData;

/**
 * Generic Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use ElementSelector defining an object with type and/or category and the rest of properties directly instead.
 */
export type ElementSelectorWithOptions =
  | [ElementSelectorData, CapturedValuesSelector]
  | [SimpleElementSelectorByType, CapturedValuesSelector];

/**
 * File Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use FileElementSelectorData defining an object with type and/or category and the rest of properties directly instead.
 */
export type FileElementSelectorWithOptions =
  | [BaseElementSelectorData, CapturedValuesSelector]
  | [SimpleElementSelectorByType, CapturedValuesSelector];

/**
 * Dependency Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use DependencyElementSelectorData defining an object with type and/or category and the rest of properties directly instead.
 */
export type DependencyElementSelectorWithOptions =
  | [DependencyElementSelectorData, CapturedValuesSelector]
  | [SimpleElementSelectorByType, CapturedValuesSelector];

/**
 * Element selector, which can be a simple string, object with type and/or category, or an element selector with options.
 */
export type ElementSelector =
  | SimpleElementSelectorByType
  | ElementSelectorData
  | ElementSelectorWithOptions;

/**
 * File Element selector, which can be a simple string, object with type and/or category, or a file element selector with options.
 */
export type FileElementSelector =
  | SimpleElementSelectorByType
  | BaseElementSelectorData
  | FileElementSelectorWithOptions;

/**
 * Dependency Element selector, which can be a simple string, object with type and/or category, or a dependency element selector with options.
 */
export type DependencyElementSelector =
  | SimpleElementSelectorByType
  | DependencyElementSelectorData
  | DependencyElementSelectorWithOptions;

/** File elements selector, which can be a single file element selector or an array of file element selectors. */
export type FileElementsSelector = FileElementSelector | FileElementSelector[];

/** Dependency elements selector, which can be a single dependency element selector or an array of dependency element selectors. */
export type DependencyElementsSelector =
  | DependencyElementSelector
  | DependencyElementSelector[];

/**
 * Elements selector, which can be a single element selector or an array of element selectors.
 */
export type ElementsSelector =
  | FileElementsSelector
  | DependencyElementsSelector;

/**
 * Element selectors, which can be a single element selector or an array of element selectors.
 * @deprecated Use ElementsSelector instead.
 */
export type ElementSelectors = ElementsSelector;

/**
 * Dependency selector, which includes optional 'from' and 'to' elements selectors.
 */
export type DependencySelector = {
  /** Selector for the dependant elements. The file originating the dependency */
  from?: FileElementsSelector;
  /** Selector for the dependency elements. The element being imported/exported */
  to?: DependencyElementsSelector;
};

/**
 * Dependency selector with only origin elements selector.
 */
export type DependencySelectorWithOrigin = DependencySelector & {
  /** Selector for the dependant elements. The file originating the dependency */
  from: FileElementsSelector;
  /** Selector for the dependency elements. The element being imported/exported */
  to: never;
};

/**
 * Dependency selector with only target elements selector.
 */
export type DependencySelectorWithTarget = DependencySelector & {
  /** Selector for the dependant elements. The file originating the dependency */
  from: never;
  /** Selector for the dependency elements. The element being imported/exported */
  to: DependencyElementsSelector;
};

/**
 * Dependency selector with both origin and target elements selectors.
 */
export type DependencySelectorWithOriginAndTarget = DependencySelector & {
  /** Selector for the dependant elements. The file originating the dependency */
  from: FileElementsSelector;
  /** Selector for the dependency elements. The element being imported/exported */
  to: DependencyElementsSelector;
};

/**
 * Options for selecting external libraries, including path patterns and optional specifiers.
 * If specifiers are provided, they will be used to match specific imports from the external library.
 */
export type ExternalLibrarySelectorOptions = {
  /**
   * Micromatch pattern(s) to match only one or more specific subpaths of the external library.
   */
  path?: MicromatchPattern;
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
