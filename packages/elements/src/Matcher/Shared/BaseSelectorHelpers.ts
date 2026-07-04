import {
  isObject,
  isString,
  isArray,
  isStringArray,
  isObjectWithAnyOfProperties,
} from "../../Shared/TypeGuards";

import type {
  CapturedValuesSelector,
  CapturedValuesSingleSelector,
  BaseSingleSelector,
} from "./BaseSelector.types";

/**
 * Determines if the given value is a captured values object selector (single object with pattern properties).
 * @param value The value to check.
 * @returns True if the value is a captured values object selector, false otherwise.
 */
export function isCapturedValuesSingleSelector(
  value: unknown
): value is CapturedValuesSingleSelector {
  if (!isObject(value)) {
    return false;
  }
  // Ensure all values are strings or string arrays
  return Object.values(value).every(
    (pattern) => isString(pattern) || isStringArray(pattern)
  );
}

/**
 * Determines if the given value is a captured values selector.
 * @param value The value to check.
 * @returns True if the value is a captured values selector, false otherwise.
 */
export function isCapturedValuesSelector(
  value: unknown
): value is CapturedValuesSelector {
  // Handle array of captured values selectors
  if (isArray(value)) {
    return value.every((item) => isCapturedValuesSingleSelector(item));
  }

  // Handle single captured values selector
  return isCapturedValuesSingleSelector(value);
}

/**
 * Determines if the given selector extends a base single selector.
 * @param value The value to check.
 * @returns True if the selector extends a base single selector, false otherwise.
 */
export function extendsSingleSelector<T extends BaseSingleSelector>(
  value: unknown
): value is T {
  return isObjectWithAnyOfProperties(value, [
    "path",
    "captured",
    "isIgnored",
    "isUnknown",
  ]);
}
