import type { MicromatchPatternNullable } from "../../Shared";
import type { BaseSingleSelector, CapturedValuesSelector } from "../Shared";

/**
 * Selector for matching a parent element
 */
export type ParentElementSingleSelector = Pick<
  BaseSingleSelector,
  "path" | "captured"
> & {
  /** Type of the first parent element */
  type?: MicromatchPatternNullable;
  /*
   * Legacy category field for backward compatibility. This will be removed in future versions
   */
  category?: MicromatchPatternNullable;
};

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyParentElementSingleSelector = ParentElementSingleSelector & {
  /** The path of the parent element to select. */
  elementPath?: MicromatchPatternNullable;
};

export type LegacyParentElementSelector =
  | LegacyParentElementSingleSelector
  | LegacyParentElementSingleSelector[];

export type ParentElementSelector =
  | ParentElementSingleSelector
  | ParentElementSingleSelector[];

export type BackwardCompatibleParentElementSingleSelector =
  | ParentElementSingleSelector
  | LegacyParentElementSingleSelector;

export type BackwardCompatibleParentElementSelector =
  | BackwardCompatibleParentElementSingleSelector
  | BackwardCompatibleParentElementSingleSelector[];

/**
 * Normalized parent element selector, being always an array of single selectors.
 */
export type ParentElementSelectorNormalized = ParentElementSingleSelector[];

/**
 * Simple element selector by type, represented as a string matching the element type.
 * @deprecated Use BaseElementSelectorData or DependencyElementSelectorData instead.
 */
export type LegacySimpleElementSingleSelectorByType = string;

/**
 * File Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use FileElementSelectorData defining an object with type and/or category and the rest of properties directly instead.
 */
export type LegacySimpleElementSingleSelectorByTypeWithOptions = [
  LegacySimpleElementSingleSelectorByType,
  CapturedValuesSelector,
];

export type LegacySimpleElementSingleSelector =
  | LegacySimpleElementSingleSelectorByType
  | LegacySimpleElementSingleSelectorByTypeWithOptions;

/**
 * Legacy element simple selector type, which can be a simple string, object with type and/or category, or an element selector with options.
 */
export type LegacyElementSimpleSelector =
  | LegacySimpleElementSingleSelector
  | LegacySimpleElementSingleSelector[];
/**
 * Selector for base elements, including captured values for dynamic matching.
 */
export type ElementSingleSelector = BaseSingleSelector & {
  /** Type of the element */
  type?: MicromatchPatternNullable;
  /*
   * Legacy category field for backward compatibility. This will be removed in future versions in favor of using the `category` field in file selectors
   * @deprecated Use the `category` field in file selectors instead.
   */
  category?: MicromatchPatternNullable;
  /** Internal path of the file relative to the element it belongs to, or null if it has no internal path */
  fileInternalPath?: MicromatchPatternNullable;
  /*
   * Full filePath of the file related to the element, or null in case it has not related file. This is a legacy field that was used for backward compatibility with legacy mode. It will be removed in future versions.
   * @deprecated Use the `file.path` field in file selectors instead
   */
  filePath?: MicromatchPatternNullable; // For backward compatibility with legacy mode "file", where the element selector included filePath. --- IGNORE ---
  /** Selector for matching the first parent element */
  parent?: ParentElementSelector | null;
};

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyElementSingleObjectSelector = ElementSingleSelector & {
  /** The origin of the element to select. */
  origin?: MicromatchPatternNullable;
  /** The path of the element to select. */
  elementPath?: MicromatchPatternNullable;
  /** The path of the file containing the element to select. */
  internalPath?: MicromatchPatternNullable;
};

/**
 * Legacy selectors are used for backward compatibility with previous versions of the plugin. They include additional properties that were used in the old selector format
 */
export type LegacyElementObjectSelector =
  | LegacyElementSingleObjectSelector
  | LegacyElementSingleObjectSelector[];

/** Normalized single element selector, where the parent selector is always an array of single selectors. */
export type ElementSingleSelectorNormalized = ElementSingleSelector & {
  /** Normalized selector for matching the first parent element, being always an array of single selectors. */
  parent?: ParentElementSelectorNormalized | null;
};

/** A simple element selector in any legacy format */
export type LegacyElementSingleSelector =
  | LegacyElementSingleObjectSelector
  | LegacySimpleElementSingleSelector;

/**
 * A legacy element selector, which can be a single legacy element selector or an array of legacy element selectors, in any legacy format
 */
export type LegacyElementSelector =
  | LegacyElementSingleSelector
  | LegacyElementSingleSelector[];

/**
 * Element selector, which can be a single element selector or an array of element selectors.
 */
export type ElementSelector = ElementSingleSelector | ElementSingleSelector[];

/**
 * Element selector backward compatibility type, which can be a simple string, object with type and/or category, or an element selector with options.
 * @deprecated Use ElementSingleSelector instead.
 */
export type BackwardCompatibleElementSingleSelector =
  | LegacyElementSingleSelector
  | ElementSingleSelector;

/**
 * Backward compatible element selector type that can be either a legacy element single selector or a new element single selector. This type is used to allow functions that accept element single selectors to also accept legacy element single selectors for backward compatibility.
 */
export type BackwardCompatibleElementSelector =
  | BackwardCompatibleElementSingleSelector
  | BackwardCompatibleElementSingleSelector[];

/** Normalized element selector, being always an array of single selectors, already transformed to the new format if it was using any of the backward compatible formats */
export type ElementSelectorNormalized = ElementSingleSelectorNormalized[];
