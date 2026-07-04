import type { MicromatchPatternNullable } from "../../Shared";

/**
 * Selector for matching captured values in selectors.
 * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
 * When provided as an array, each element in the array represents an alternative (OR logic) - the selector matches if any of the array elements matches.
 */
export type CapturedValuesSingleSelector = Record<
  string,
  MicromatchPatternNullable
>;

/**
 * Selector for matching captured values in selectors.
 * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
 * When provided as an array, each element in the array represents an alternative (OR logic) - the selector matches if any of the array elements matches.
 */
export type CapturedValuesSelector =
  | CapturedValuesSingleSelector
  | CapturedValuesSingleSelector[];

/**
 * Common properties for file and element selectors **/
export type BaseSingleSelector = {
  /** Micromatch pattern(s) to match the path of the file */
  path?: MicromatchPatternNullable;
  /** Captured values selector for dynamic matching */
  captured?: CapturedValuesSelector;
  /** Whether the element is ignored */
  isIgnored?: boolean;
  /** Whether the element is unknown */
  isUnknown?: boolean;
};
