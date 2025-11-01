import type { MicromatchPattern } from "../Config";
import type {
  LocalElementKnown,
  CoreDependencyElement,
  ExternalDependencyElement,
  LocalDependencyElementKnown,
  DescriptorsSerializedCache,
  IgnoredElement,
  LocalElementUnknown,
} from "../Descriptor";

/**
 * Result of matching an element selector against an element.
 */
export type DependencyMatchResult = {
  /** The selector matching result for the 'from' element. */
  from: ElementSelectorData | null;
  /** The selector matching result for the 'to' element. */
  to: ElementSelectorData | null;
  /** Whether the dependency matches all the selector properties provided */
  isMatch: boolean;
};

/**
 * Serialized cache of elements matcher.
 */
export type ElementsMatcherSerializedCache = Record<
  string,
  ElementSelectorData | null
>;

/**
 * Serialized cache of dependencies matcher.
 */
export type DependenciesMatcherSerializedCache = Record<
  string,
  DependencyMatchResult
>;

export type MatcherSerializedCache = {
  descriptors: DescriptorsSerializedCache;
  elementsMatcher: ElementsMatcherSerializedCache;
  dependenciesMatcher: DependenciesMatcherSerializedCache;
};

/**
 * Elements that can return a match when using an element selector.
 */
export type SelectableElement =
  | IgnoredElement
  | LocalElementKnown
  | LocalElementUnknown
  | CoreDependencyElement
  | ExternalDependencyElement
  | LocalDependencyElementKnown;

/**
 * Selector for matching captured values in element selectors.
 * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
 */
export type CapturedValuesSelector = Record<string, MicromatchPattern>;

/**
 * Data to pass to selector templates when they are rendered before matching.
 */
export type TemplateData = Record<string, unknown>;

/**
 * Options for elements and dependencies matchers.
 */
export type MatcherOptionsDependencySelectorsGlobals = {
  /** The kind of the dependency */
  kind?: MicromatchPattern;
};

/**
 * Options for elements and dependencies matchers.
 */
export type MatcherOptions = {
  /** Extra data to pass to captured values templates. By default, data from the element and dependency being matched is passed as to/from. */
  extraTemplateData?: TemplateData;
  /**
   * Properties to add to all dependency selectors used in the matcher. Added for backwards compatibility, because eslint-plugin rules defined importKind at the top level of the rule options.
   * @deprecated Use 'kind' property directly in the dependency element selectors instead.
   **/
  dependencySelectorsGlobals?: MatcherOptionsDependencySelectorsGlobals;
};

/*
 * Simple element selector by type, represented as a string matching the element type.
 */
export type SimpleElementSelectorByType = string;

/**
 * Selector for base elements, including captured values for dynamic matching.
 */
export type BaseElementSelectorData = {
  /** Micromatch pattern(s) to match the path of the element */
  path?: MicromatchPattern;
  /** Micromatch pattern(s) to match the path of the element containing the file */
  elementPath?: MicromatchPattern;
  /** Micromatch pattern(s) to match internal paths within the file or dependency, relative to the element path */
  internalPath?: MicromatchPattern;
  /** Type of the element */
  type?: MicromatchPattern;
  /** Category of the element */
  category?: MicromatchPattern;
  /** Captured values selector for dynamic matching */
  captured?: CapturedValuesSelector;
  /** Origin of the element */
  origin?: MicromatchPattern;
  /** Micromatch pattern(s) to match the source of the dependency */
  source?: MicromatchPattern;
  /** Base source of the element, e.g., the import path of a dependency */
  baseSource?: MicromatchPattern;
  /** Whether the element is ignored */
  isIgnored?: boolean;
  /** Whether the element is unknown */
  isUnknown?: boolean;
};

/**
 * Selector for dependency elements, including kind, specifier, and node kind filters.
 */
export type DependencyElementSelectorData = BaseElementSelectorData & {
  /**
   * Relationship of the file element with the dependency declared in it
   * It only applies when used in external dependencies
   */
  relationship?: MicromatchPattern;
  /** Dependency kind to filter elements */
  kind?: MicromatchPattern;
  // TODO: Pass specifier to DependencyData
  /** Micromatch pattern(s) to match only specific imports/exports */
  specifiers?: MicromatchPattern;
  /** Node kind to filter elements */
  nodeKind?: MicromatchPattern;
};

/**
 * File Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use FileElementSelectorData defining an object with type and/or category and the rest of properties directly instead.
 */
export type BaseElementSelectorWithOptions = [
  SimpleElementSelectorByType,
  CapturedValuesSelector,
];

/**
 * Dependency Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use DependencyElementSelectorData defining an object with type and/or category and the rest of properties directly instead.
 */
export type DependencyElementSelectorWithOptions = [
  SimpleElementSelectorByType,
  CapturedValuesSelector,
];

/**
 * Base Element selector, which can be a simple string, object with type and/or category, or a base element selector with options.
 */
export type BaseElementSelector =
  | SimpleElementSelectorByType
  | BaseElementSelectorData
  | BaseElementSelectorWithOptions;

/**
 * Dependency Element selector, which can be a simple string, object with type and/or category, or a dependency element selector with options.
 */
export type DependencyElementSelector =
  | SimpleElementSelectorByType
  | DependencyElementSelectorData
  | DependencyElementSelectorWithOptions;

/** Base elements selector, which can be a single base element selector or an array of base element selectors. */
export type BaseElementsSelector = BaseElementSelector | BaseElementSelector[];

/** Dependency elements selector, which can be a single dependency element selector or an array of dependency element selectors. */
export type DependencyElementsSelector =
  | DependencyElementSelector
  | DependencyElementSelector[];

/**
 * Element selector data, which may be a base element selector or a dependency element selector.
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
export type ElementSelectorWithOptions = [
  SimpleElementSelectorByType,
  CapturedValuesSelector,
];

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
export type ElementsSelector =
  | BaseElementsSelector
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
  from?: BaseElementsSelector;
  /** Selector for the dependency elements. The element being imported/exported */
  to?: DependencyElementsSelector;
};

/**
 * Normalized dependency selector, where 'from' and 'to' are always arrays or null.
 */
export type DependencySelectorNormalized = {
  /** Selector for the dependant elements. The file originating the dependency */
  from: BaseElementSelectorData[] | null;
  /** Selector for the dependency elements. The element being imported/exported */
  to: DependencyElementSelectorData[] | null;
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
