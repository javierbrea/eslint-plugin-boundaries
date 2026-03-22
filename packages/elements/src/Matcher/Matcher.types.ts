import type { MicromatchPatternNullable } from "../Config";
import type {
  ElementDescription,
  DescriptorsSerializedCache,
} from "../Descriptor";

/**
 * Result of matching an element selector against an element.
 */
export type DependencyMatchResult = {
  /** The selector matching result for the 'from' element. */
  from: BaseElementSelectorData | null;
  /** The selector matching result for the 'to' element. */
  to: BaseElementSelectorData | null;
  /** The selector matching result for the dependency metadata. */
  dependency: DependencyDataSelectorData | null;
  /** Whether the dependency matches all the selector properties provided */
  isMatch: boolean;
};

/**
 * Serialized cache of elements matcher.
 */
export type ElementsMatcherSerializedCache = Record<
  string,
  BaseElementSelectorData | null
>;

/**
 * Serialized cache of dependencies matcher.
 */
export type DependenciesMatcherSerializedCache = Record<
  string,
  DependencyMatchResult
>;

/**
 * Serialized cache of matcher descriptors.
 */
export type MatcherSerializedCache = {
  descriptors: DescriptorsSerializedCache;
};

/**
 * Serialized cache of micromatch matcher.
 */
export type MicromatchSerializedCache = {
  matchingResults: Record<string, boolean>;
  captures: Record<string, string[] | null>;
};

/**
 * Elements that can return a match when using an element selector.
 */
export type SelectableElement = ElementDescription;

/**
 * Selector for matching captured values in element selectors.
 * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
 * When provided as an array, each element in the array represents an alternative (OR logic) - the selector matches if any of the array elements matches.
 */
export type CapturedValuesSelector =
  | Record<string, MicromatchPatternNullable>
  | Array<Record<string, MicromatchPatternNullable>>;

/**
 * Selector for matching the first parent element.
 */
export type ParentElementSelectorData = {
  /** Type of the first parent element */
  type?: MicromatchPatternNullable;
  /** Path of the first parent element */
  path?: MicromatchPatternNullable;
  /** Captured values from the first parent element */
  captured?: CapturedValuesSelector;
};

/**
 * Data to pass to selector templates when they are rendered before matching.
 */
export type TemplateData = Record<string, unknown>;

/**
 * Options for elements and dependencies matchers.
 */
export type MatcherOptions = {
  /** Extra data to pass to captured values templates. By default, data from the element and dependency being matched is passed as to/from. */
  extraTemplateData?: TemplateData;
};

/**
 * Simple element selector by type, represented as a string matching the element type.
 * @deprecated Use BaseElementSelectorData or DependencyElementSelectorData instead.
 */
export type SimpleElementSelectorByType = string;

/**
 * Selector for base elements, including captured values for dynamic matching.
 */
export type BaseElementSelectorData = {
  /** Micromatch pattern(s) to match the element path */
  path?: MicromatchPatternNullable;
  /** Type of the element */
  type?: MicromatchPatternNullable;
  /** Captured values selector for dynamic matching */
  captured?: CapturedValuesSelector;
  /** Selector for matching the first parent element */
  parent?: ParentElementSelectorData | null;
};

/**
 * Selector for element properties within a file selector (nested element matching).
 */
export type FileElementSelectorData = BaseElementSelectorData;

/**
 * Selector for files with file-level classifications and element references.
 */
export type FileSelectorData = {
  /** Micromatch pattern(s) to match the file path */
  path?: MicromatchPatternNullable;
  /** Micromatch pattern(s) to match internal paths within the element */
  internalPath?: MicromatchPatternNullable;
  /** Category/categories assigned to the file */
  category?: MicromatchPatternNullable;
  /** Captured values selector for file-level matches */
  captured?: CapturedValuesSelector;
  /** Element-related selectors for the containing element */
  element?: FileElementSelectorData | null;
  /** Origin of the file */
  origin?: MicromatchPatternNullable;
  /** Whether the file is ignored */
  isIgnored?: boolean;
  /** Whether the file is unknown (no element matched) */
  isUnknown?: boolean;
};

/**
 * Selector for dependency metadata.
 */
export type DependencyDataSelectorData = {
  /** Relationship between both elements, from both perspectives */
  relationship?: {
    /** Relationship from dependant element perspective */
    from?: MicromatchPatternNullable;
    /** Relationship from dependency element perspective */
    to?: MicromatchPatternNullable;
  };
  /** Dependency kind to filter elements */
  kind?: MicromatchPatternNullable;
  /** Micromatch pattern(s) to match only specific imports/exports */
  specifiers?: MicromatchPatternNullable;
  /** Node kind to filter elements */
  nodeKind?: MicromatchPatternNullable;
  /** Dependency source used in import/export statements */
  source?: MicromatchPatternNullable;
  /** Base source of the dependency for external/core modules */
  module?: MicromatchPatternNullable;
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
 * Base Element selector, which can be a simple string, object with type and/or category, or a base element selector with options.
 */
export type BaseElementSelector =
  | SimpleElementSelectorByType
  | BaseElementSelectorData
  | BaseElementSelectorWithOptions;

/**
 * Base elements selector, which can be a single base element selector or an array of base element selectors.
 */
export type BaseElementsSelector = BaseElementSelector | BaseElementSelector[];

/** Dependency metadata selector, which can be a single selector or an array of selectors. */
export type DependencyDataSelector =
  | DependencyDataSelectorData
  | DependencyDataSelectorData[];

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
  | BaseElementSelectorData
  | ElementSelectorWithOptions;

/**
 * Elements selector, which can be a single element selector or an array of element selectors.
 */
export type ElementsSelector = BaseElementsSelector;

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
  to?: BaseElementsSelector;
  /** Selector for dependency metadata */
  dependency?: DependencyDataSelector;
};

/**
 * Normalized dependency selector, where 'from' and 'to' are always arrays or null.
 */
export type DependencySelectorNormalized = {
  /** Selector for the dependant elements. The file originating the dependency */
  from: BaseElementSelectorData[] | null;
  /** Selector for the dependency elements. The element being imported/exported */
  to: BaseElementSelectorData[] | null;
  /** Selector for dependency metadata */
  dependency: DependencyDataSelectorData[] | null;
};

/**
 * @deprecated Use DependencySelectorDependencyData instead.
 */
export type DependencyElementSelectorData = DependencyDataSelectorData;

/**
 * File selector for matching files against file descriptors.
 */
export type FileSelector = FileSelectorData;

/**
 * File selector, which can be a single file selector or an array of file selectors.
 */
export type FilesSelector = FileSelector | FileSelector[];
