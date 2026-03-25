import {
  isString,
  isArray,
  isObjectWithAnyOfProperties,
} from "../../Shared/TypeGuards";
import { isCapturedValuesSelector, extendsSingleSelector } from "../Shared";

import type {
  SimpleElementSelectorByTypeWithOptions,
  SimpleElementSelectorByType,
  ElementSingleSelector,
  ElementSelector,
  BackwardCompatibleElementSingleSelector,
} from "./ElementSelector.types";

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
 * Determines if the given selector is a simple element selector by type with options.
 * @param value The value to check.
 * @returns True if the selector is a simple element selector by type with options, false otherwise.
 */
export function isSimpleElementSelectorByTypeWithOptions(
  value: unknown
): value is SimpleElementSelectorByTypeWithOptions {
  return (
    isArray(value) &&
    ((value.length === 2 &&
      isSimpleElementSelectorByType(value[0]) &&
      // NOTE: Arrays of length 2 with captured values selector as second will be treated as legacy options instead of two different selectors. We have to live with this limitation for now.
      isCapturedValuesSelector(value[1])) ||
      // NOTE: Backwards compatibility: Allow arrays of length 1 with simple element selector. Some users might defined arrays without options.
      (value.length === 1 && isSimpleElementSelectorByType(value[0])))
  );
}

/**
 * Determines if the given selector is a single element selector
 * @param value The value to check.
 * @returns True if the selector is a single element selector, false otherwise.
 */
export function isElementSingleSelector(
  value: unknown
): value is ElementSingleSelector {
  return (
    isObjectWithAnyOfProperties(value, ["type", "parent"]) ||
    extendsSingleSelector<ElementSingleSelector>(value)
  );
}

export function isBackwardCompatibleElementSingleSelector(
  value: unknown
): value is BackwardCompatibleElementSingleSelector {
  return (
    isSimpleElementSelectorByType(value) ||
    isElementSingleSelector(value) ||
    isSimpleElementSelectorByTypeWithOptions(value)
  );
}

/**
 * Determines if the given value is an element selector.
 * @param value The value to check.
 * @returns True if the value is an element selector, false otherwise.
 */
export function isElementSelector(value: unknown): value is ElementSelector {
  return (
    isBackwardCompatibleElementSingleSelector(value) ||
    (isArray(value) && value.every(isBackwardCompatibleElementSingleSelector))
  );
}

/**
 * Normalizes a selector into ElementSelectorData format.
 * @param selector The selector to normalize.
 * @returns The normalized selector data.
 */
export function normalizeSingleElementSelector(
  selector: BackwardCompatibleElementSingleSelector
): ElementSingleSelector {
  if (isSimpleElementSelectorByType(selector)) {
    return { type: selector };
  }

  if (isSimpleElementSelectorByTypeWithOptions(selector)) {
    return {
      type: selector[0],
      captured: selector[1] ? { ...selector[1] } : undefined,
    };
  }

  if (isElementSingleSelector(selector)) {
    return { ...selector };
  }

  throw new Error("Invalid element selector");
}

/**
 * Normalizes an ElementSelector into an array of ElementSingleSelector.
 * @param elementSelector The element selector, in any supported format.
 * @returns The normalized array of selector data.
 */
export function normalizeElementSelector(
  elementSelector: ElementSelector
): ElementSingleSelector[] {
  if (isSimpleElementSelectorByTypeWithOptions(elementSelector)) {
    return [normalizeSingleElementSelector(elementSelector)];
  }
  if (isArray(elementSelector)) {
    return elementSelector.map((sel) => normalizeSingleElementSelector(sel));
  }
  return [normalizeSingleElementSelector(elementSelector)];
}
