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
  CapturedValuesSelector,
  SimpleElementSelectorByType,
  DependencySelector,
  DependencyDataSelector,
  DependencyDataSelectorData,
  BaseElementSelector,
  BaseElementSelectorData,
  BaseElementsSelector,
  ElementsSelector,
  FileSelector,
  FileSelectorData,
  FilesSelector,
} from "./Matcher.types";

/**
 * Determines if the given value is a captured values object selector (single object with pattern properties).
 * @param value The value to check.
 * @returns True if the value is a captured values object selector, false otherwise.
 */
function isCapturedValuesObjectSelector(
  value: unknown
): value is Record<string, string | string[]> {
  if (!isObject(value) || isArray(value)) {
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
    return value.every((item) => isCapturedValuesObjectSelector(item));
  }

  // Handle single captured values selector
  return isCapturedValuesObjectSelector(value);
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
function hasOnlyAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: string[]
): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isParentElementSelectorData(value: unknown): boolean {
  if (value === null) {
    return true;
  }
  if (!isObject(value)) {
    return false;
  }
  const allowedKeys = ["type", "path", "captured"];
  return (
    isObjectWithAnyOfProperties(value, allowedKeys) &&
    hasOnlyAllowedKeys(value, allowedKeys)
  );
}

export function isBaseElementSelectorData(
  value: unknown
): value is BaseElementSelectorData {
  if (!isObject(value)) {
    return false;
  }

  const allowedKeys = ["path", "type", "captured", "parent"];
  const hasBaseKeys = isObjectWithAnyOfProperties(value, allowedKeys);

  if (!hasBaseKeys || !hasOnlyAllowedKeys(value, allowedKeys)) {
    return false;
  }

  if (!isObjectWithProperty(value, "parent")) {
    return true;
  }

  return isParentElementSelectorData(value.parent);
}

/**
 * Determines if the given selector is an element or dependency element selector data.
 * @param value The value to check.
 * @returns True if the selector is an element or dependency element selector data, false otherwise.
 */
export function isElementSelectorData(
  value: unknown
): value is BaseElementSelectorData {
  return isBaseElementSelectorData(value);
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
    ((value.length === 2 &&
      isSimpleElementSelectorByType(value[0]) &&
      // NOTE: Arrays of length 2 with captured values selector as second element having a key "type" or "category" will be treated as legacy options instead of two different selectors. We have to live with this limitation for now.
      isCapturedValuesSelector(value[1])) ||
      // NOTE: Backwards compatibility: Allow arrays of length 1 with simple element selector. Some users might defined arrays without options.
      (value.length === 1 && isSimpleElementSelectorByType(value[0])))
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
 * Normalizes a selector into ElementSelectorData format.
 * @param selector The selector to normalize.
 * @returns The normalized selector data.
 */
export function normalizeElementSelector(
  selector: BaseElementSelector
): BaseElementSelectorData;
export function normalizeElementSelector(
  selector: ElementSelector
): BaseElementSelectorData {
  if (isSimpleElementSelectorByType(selector)) {
    return { type: selector };
  }

  if (isElementSelectorData(selector)) {
    return { ...selector };
  }

  if (isElementSelectorWithLegacyOptions(selector)) {
    return {
      type: selector[0],
      captured: selector[1] ? { ...selector[1] } : undefined,
    };
  }
  throw new Error("Invalid element selector");
}

/**
 * Normalizes an ElementsSelector into an array of ElementSelectorData.
 * @param elementsSelector The elements selector, in any supported format.
 * @returns The normalized array of selector data.
 */
export function normalizeElementsSelector(
  elementsSelector: BaseElementsSelector
): BaseElementSelectorData[];
export function normalizeElementsSelector(
  elementsSelector: ElementsSelector
): BaseElementSelectorData[] {
  if (isArray(elementsSelector)) {
    if (isElementSelectorWithLegacyOptions(elementsSelector)) {
      return [normalizeElementSelector(elementsSelector)];
    }
    return elementsSelector.map((sel) => normalizeElementSelector(sel));
  }
  return [normalizeElementSelector(elementsSelector)];
}

/**
 * Determines if the given value is file selector data.
 * @param value The value to check.
 * @returns True if the value is file selector data.
 */
export function isFileSelectorData(value: unknown): value is FileSelectorData {
  return isObjectWithAnyOfProperties(value, [
    "path",
    "internalPath",
    "category",
    "captured",
    "element",
    "origin",
    "isIgnored",
    "isUnknown",
  ]);
}

/**
 * Determines if the given value is a file selector.
 * @param value The value to check.
 * @returns True if the value is a file selector.
 */
export function isFileSelector(value: unknown): value is FileSelector {
  return isFileSelectorData(value);
}

/**
 * Determines if the given value is a files selector.
 * @param value The value to check.
 * @returns True if the value is a files selector.
 */
export function isFilesSelector(value: unknown): value is FilesSelector {
  return (
    isFileSelector(value) ||
    (isArray(value) && !isEmptyArray(value) && value.every(isFileSelector))
  );
}

/**
 * Normalizes a file selector into FileSelectorData format.
 * @param selector The file selector to normalize.
 * @returns The normalized selector data.
 */
export function normalizeFileSelector(
  selector: FileSelector
): FileSelectorData {
  if (isFileSelectorData(selector)) {
    return { ...selector };
  }
  throw new Error("Invalid file selector");
}

/**
 * Normalizes a files selector into an array of FileSelectorData.
 * @param filesSelector The files selector to normalize.
 * @returns The normalized array of selector data.
 */
export function normalizeFilesSelector(
  filesSelector: FilesSelector
): FileSelectorData[] {
  if (isArray(filesSelector)) {
    return filesSelector.map((selector) => normalizeFileSelector(selector));
  }
  return [normalizeFileSelector(filesSelector)];
}

/**
 * Determines if the given value is a dependency selector.
 * @param value The value to check
 * @returns True if the value is a dependency selector, false otherwise.
 */
export function isDependencySelector(
  value: unknown
): value is DependencySelector {
  if (!isObjectWithAnyOfProperties(value, ["from", "to", "dependency"])) {
    return false;
  }

  const fromIsValid =
    !isObjectWithProperty(value, "from") || isElementsSelector(value.from);
  const toIsValid =
    !isObjectWithProperty(value, "to") || isElementsSelector(value.to);
  const dependencyIsValid =
    !isObjectWithProperty(value, "dependency") ||
    isDependencyDataSelector(value.dependency);

  return fromIsValid && toIsValid && dependencyIsValid;
}

/**
 * Determines if the given value is dependency metadata selector data.
 * @param value The value to check.
 * @returns True if the value is dependency metadata selector data, false otherwise.
 */
export function isDependencyDataSelectorData(
  value: unknown
): value is DependencyDataSelectorData {
  return isObjectWithAnyOfProperties(value, [
    "kind",
    "relationship",
    "specifiers",
    "nodeKind",
    "source",
    "module",
  ]);
}

/**
 * Determines if the given value is dependency metadata selector(s).
 * @param value The value to check.
 * @returns True if the value is dependency metadata selector(s), false otherwise.
 */
export function isDependencyDataSelector(
  value: unknown
): value is DependencyDataSelector {
  return (
    isDependencyDataSelectorData(value) ||
    (isArray(value) &&
      !isEmptyArray(value) &&
      value.every(isDependencyDataSelectorData))
  );
}
