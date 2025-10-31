import {
  isObject,
  isString,
  isArray,
  isStringArray,
  isObjectWithProperty,
  isEmptyArray,
  isObjectWithAnyOfProperties,
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
  ElementSelectorData,
  DependencySelector,
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
 * Determines if the given selector is a base element selector.
 * @param value The value to check.
 * @returns True if the selector is a base element selector
 */
export function isBaseElementSelectorData(
  value: unknown
): value is ElementSelectorData {
  return isObjectWithAnyOfProperties(value, [
    "type",
    "category",
    "captured",
    "internalPath",
    "origin",
    "baseSource",
  ]);
}

/**
 * Determines if the given selector is an element or dependency element selector data.
 * @param value The value to check.
 * @returns True if the selector is an element or dependency element selector data, false otherwise.
 */
export function isElementSelectorData(
  value: unknown
): value is ElementSelectorData {
  return (
    isBaseElementSelectorData(value) ||
    isObjectWithAnyOfProperties(value, [
      "relationship",
      "kind",
      "specifiers",
      "nodeKind",
    ])
  );
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
 * Determines if the given value is a dependency selector.
 * @param value The value to check
 * @returns True if the value is a dependency selector, false otherwise.
 */
export function isDependencySelector(
  value: unknown
): value is DependencySelector {
  return isObjectWithAnyOfProperties(value, ["from", "to"]);
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
