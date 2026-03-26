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
};

/**
 * Simple element selector by type, represented as a string matching the element type.
 * @deprecated Use BaseElementSelectorData or DependencyElementSelectorData instead.
 */
export type SimpleElementSelectorByType = string;

/**
 * File Element selector with options, including captured values for dynamic matching.
 * It is represented as a tuple where the first element is the element type (string)
 * and the second element is an object containing a selector for captured values.
 * @deprecated Use FileElementSelectorData defining an object with type and/or category and the rest of properties directly instead.
 */
export type SimpleElementSelectorByTypeWithOptions = [
  SimpleElementSelectorByType,
  CapturedValuesSelector,
];

/**
 * Selector for base elements, including captured values for dynamic matching.
 */
export type ElementSingleSelector = BaseSingleSelector & {
  /** Type of the element */
  type?: MicromatchPatternNullable;
  /** Internal path of the file relative to the element it belongs to, or null if it has no internal path */
  fileInternalPath?: MicromatchPatternNullable;
  /** Selector for matching the first parent element */
  parent?: ParentElementSingleSelector | null;
};

/**
 * Element selector backward compatibility type, which can be a simple string, object with type and/or category, or an element selector with options.
 * @deprecated Use ElementSingleSelector instead.
 */
export type BackwardCompatibleElementSingleSelector =
  | SimpleElementSelectorByType
  | ElementSingleSelector
  | SimpleElementSelectorByTypeWithOptions;

/**
 * Element selector, which can be a single element selector or an array of element selectors.
 */
export type ElementSelector =
  | BackwardCompatibleElementSingleSelector
  | BackwardCompatibleElementSingleSelector[];

/** Normalized element selector, being always an array of single selectors, already transformed to the new format if it was using any of the backward compatible formats */
export type ElementSelectorNormalized = ElementSingleSelector[];
