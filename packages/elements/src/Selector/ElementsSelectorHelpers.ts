import {
  isObject,
  isString,
  isArray,
  isStringArray,
  isObjectWithProperty,
  isEmptyArray,
  isObjetWithAnyOfProperties,
} from "../Support/TypeGuards";

import type {
  ElementSelector,
  ElementSelectorWithOptions,
  ElementSelectors,
  ExternalLibrarySelector,
  ExternalLibrarySelectorWithOptions,
  ExternalLibrariesSelector,
  CapturedValuesSelector,
  ExternalLibrarySelectorOptions,
  SimpleElementSelectorByType,
  ElementSelectorByTypeAndCategory,
  ElementSelectorByCategory,
  ElementSelectorByType,
  ElementSelectorData,
} from "./ElementsSelector.types";

/**
 * Determines if the given value is a captured values selector.
 * @param value The value to check.
 * @returns True if the value is a captured values selector, false otherwise.
 */
export function isCapturedValuesSelector(
  value: unknown
): value is CapturedValuesSelector {
  if (!isObject(value) || isArray(value)) {
    return false;
  }

  // Ensure all values are strings or string arrays
  return Object.values(value).every(
    (pattern) => isString(pattern) || isStringArray(pattern)
  );
}

/**
 * Determines if the given value is a simple element selector.
 * @param value The value to check.
 * @returns True if the value is a simple element selector, false otherwise.
 */
export function isSimpleElementSelectorByType(
  value: unknown
): value is SimpleElementSelectorByType {
  return isString(value);
}

/**
 * Determines if the given value is an element selector by type.
 * @param value The value to check.
 * @returns True if the value is an element selector by type, false otherwise.
 */
export function isElementSelectorByType(
  value: unknown
): value is ElementSelectorByType {
  return (
    isObjectWithProperty(value, "type") &&
    isSimpleElementSelectorByType(value.type)
  );
}

/**
 * Determines if the given value is an element selector by category.
 * @param value The value to check.
 * @returns True if the value is an element selector by category, false otherwise.
 */
export function isElementSelectorByCategory(
  value: unknown
): value is ElementSelectorByCategory {
  return isObjectWithProperty(value, "category") && isString(value.category);
}

/**
 * Determines if the given value is an element selector by both type and category.
 * @param value The value to check.
 * @returns True if the value is an element selector by both type and category, false otherwise.
 */
export function isElementSelectorByTypeAndCategory(
  value: unknown
): value is ElementSelectorByTypeAndCategory {
  return isElementSelectorByType(value) && isElementSelectorByCategory(value);
}

/**
 * Determines if the given selector is an element selector with type or category or both, and extra options.
 * @param value The value to check.
 * @returns True if the selector is an element selector by type or category, false otherwise.
 */
export function isElementSelectorData(
  value: unknown
): value is ElementSelectorData {
  return isObjetWithAnyOfProperties(value, [
    "type",
    "category",
    "captured",
    "internalPath",
    "relationship",
    "origin",
    "baseSource",
    "kind",
    "specifiers",
    "nodeKind",
  ]);
}

/**
 * Determines if the given selector is an element selector with options.
 * @param value The value to check.
 * @returns True if the selector is an element selector with options, false otherwise.
 */
export function isElementSelectorWithLegacyOptions(
  value: unknown
): value is ElementSelectorWithOptions {
  return (
    isArray(value) &&
    value.length === 2 &&
    isSimpleElementSelectorByType(value[0]) &&
    // NOTE: Arrays of length 2 with captured values selector as second element having a key "type" or "category" will be treated as legacy options instead of two different selectors. We have to live with this limitation for now.
    // TODO: Add a note to the documentation about this limitation.
    isCapturedValuesSelector(value[1])
  );
}

/**
 * Determines if the given value is an element selector.
 * @param value The value to check.
 * @returns True if the value is an element selector, false otherwise.
 */
export function isElementSelector(value: unknown): value is ElementSelector {
  return (
    isSimpleElementSelectorByType(value) ||
    isElementSelectorData(value) ||
    isElementSelectorWithLegacyOptions(value)
  );
}

/**
 * Determines if the given value is an elements selector.
 * @param value The value to check.
 * @returns True if the value is an elements selector, false otherwise.
 */
export function isElementsSelector(value: unknown): value is ElementSelectors {
  return (
    isElementSelector(value) ||
    (isArray(value) && !isEmptyArray(value) && value.every(isElementSelector))
  );
}

/**
 * Determines if the given value is external library selector options with a path.
 * @param value The value to check.
 * @returns True if the value is external library selector options with a path, false otherwise.
 */
export function isExternalLibrarySelectorOptionsWithPath(
  value: unknown
): value is ExternalLibrarySelectorOptions & { path: string | string[] } {
  return (
    isObjectWithProperty(value, "path") &&
    (isString(value.path) || isStringArray(value.path))
  );
}

/**
 * Determines if the given value is external library selector options with specifiers.
 * @param value The value to check.
 * @returns True if the value is external library selector options with specifiers, false otherwise.
 */
export function isExternalLibrarySelectorOptionsWithSpecifiers(
  value: unknown
): value is ExternalLibrarySelectorOptions & { specifiers: string[] } {
  return (
    isObjectWithProperty(value, "specifiers") && isStringArray(value.specifiers)
  );
}

/**
 * Determines if the given value is external library selector options.
 * @param value The value to check.
 * @returns True if the value is external library selector options, false otherwise.
 */
export function isExternalLibrarySelectorOptions(
  value: unknown
): value is ExternalLibrarySelectorOptions {
  return (
    isExternalLibrarySelectorOptionsWithPath(value) ||
    isExternalLibrarySelectorOptionsWithSpecifiers(value)
  );
}

/**
 * Determines if the given value is an external library selector with options.
 * @param value The value to check.
 * @returns True if the value is an external library selector with options, false otherwise.
 */
export function isExternalLibrarySelectorWithOptions(
  value: unknown
): value is ExternalLibrarySelectorWithOptions {
  return (
    isArray(value) &&
    value.length === 2 &&
    isSimpleElementSelectorByType(value[0]) &&
    isExternalLibrarySelectorOptions(value[1])
  );
}

/**
 * Determines if the given value is an external library selector.
 * @param value The value to check.
 * @returns True if the value is an external library selector, false otherwise.
 */
export function isExternalLibrarySelector(
  value: unknown
): value is ExternalLibrarySelector {
  return (
    isSimpleElementSelectorByType(value) ||
    isExternalLibrarySelectorWithOptions(value)
  );
}

/**
 * Determines if the given value is an external libraries selector.
 * @param value The value to check.
 * @returns True if the value is an external libraries selector, false otherwise.
 */
export function isExternalLibrariesSelector(
  value: unknown
): value is ExternalLibrariesSelector {
  return (
    isExternalLibrarySelector(value) ||
    (isArray(value) &&
      !isEmptyArray(value) &&
      value.every(isExternalLibrarySelector))
  );
}
