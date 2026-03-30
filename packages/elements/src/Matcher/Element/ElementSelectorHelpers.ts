import {
  isString,
  isArray,
  isObjectWithAnyOfProperties,
  isNull,
  isUndefined,
  isObjectWithProperty,
} from "../../Shared";
import { isCapturedValuesSelector, extendsSingleSelector } from "../Shared";

import type {
  LegacySimpleElementSingleSelectorByTypeWithOptions,
  LegacySimpleElementSingleSelectorByType,
  ElementSingleSelector,
  ElementSelector,
  BackwardCompatibleElementSingleSelector,
  ElementSelectorNormalized,
  LegacyElementSimpleSelector,
  ParentElementSingleSelector,
  ElementSingleSelectorNormalized,
  LegacyParentElementSingleSelector,
  LegacyElementSingleObjectSelector,
  LegacyElementSelector,
  LegacyElementSingleSelector,
  LegacySimpleElementSingleSelector,
  ParentElementSelectorNormalized,
  BackwardCompatibleParentElementSingleSelector,
  BackwardCompatibleParentElementSelector,
  BackwardCompatibleElementSelector,
} from "./ElementSelector.types";

/**
 * Determines if the given value is a simple element selector.
 * @param value The value to check.
 * @returns True if the value is a simple element selector, false otherwise.
 */
export function isLegacySimpleElementSingleSelectorByType(
  value: unknown
): value is LegacySimpleElementSingleSelectorByType {
  return isString(value);
}

/**
 * Determines if the given selector is a simple element selector by type with options.
 * @param value The value to check.
 * @returns True if the selector is a simple element selector by type with options, false otherwise.
 */
export function isLegacySimpleElementSingleSelectorByTypeWithOptions(
  value: unknown
): value is LegacySimpleElementSingleSelectorByTypeWithOptions {
  return (
    isArray(value) &&
    ((value.length === 2 &&
      isLegacySimpleElementSingleSelectorByType(value[0]) &&
      // NOTE: Arrays of length 2 with captured values selector as second will be treated as legacy options instead of two different selectors. We have to live with this limitation for now.
      isCapturedValuesSelector(value[1])) ||
      // NOTE: Backwards compatibility: Allow arrays of length 1 with simple element selector. Some users might defined arrays without options.
      (value.length === 1 &&
        isLegacySimpleElementSingleSelectorByType(value[0])))
  );
}

/**
 * Determines if the given selector is a legacy element simple selector, which can be a simple string, object with type and/or category, or an element selector with options.
 * @param value The value to check.
 * @returns True if the selector is a legacy element simple selector, false otherwise.
 */
export function isLegacySimpleElementSingleSelector(
  value: unknown
): value is LegacyElementSimpleSelector {
  return (
    isLegacySimpleElementSingleSelectorByType(value) ||
    isLegacySimpleElementSingleSelectorByTypeWithOptions(value)
  );
}

/**
 * Determines if the given selector is a legacy parent element single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy parent element single selector, false otherwise.
 */
export function isLegacyParentElementSingleSelector(
  selector: unknown
): selector is LegacyParentElementSingleSelector {
  return isObjectWithProperty(selector, "elementPath");
}

/**
 * Determines if the given selector is a legacy element single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy element single selector, false otherwise.
 */
export function isLegacyElementSingleObjectSelector(
  selector: unknown
): selector is LegacyElementSingleObjectSelector {
  return (
    isObjectWithAnyOfProperties(selector, [
      "origin",
      "elementPath",
      "internalPath",
    ]) ||
    (isObjectWithProperty(selector, "parent") &&
      isLegacyParentElementSingleSelector(selector.parent))
  );
}

/**
 * Determines if the given selector is a legacy element selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy element selector, false otherwise.
 */
export function isLegacyElementSingleSelector(
  selector: unknown
): selector is LegacyElementSelector {
  return (
    isLegacyElementSingleObjectSelector(selector) ||
    isLegacySimpleElementSingleSelector(selector)
  );
}

export function isLegacyElementSelector(
  selector: unknown
): selector is LegacyElementSelector {
  return (
    isLegacyElementSingleSelector(selector) ||
    (isArray(selector) && selector.some(isLegacyElementSingleSelector))
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
    isObjectWithAnyOfProperties(value, [
      "type",
      "parent",
      "category",
      "fileInternalPath",
    ]) || extendsSingleSelector<ElementSingleSelector>(value)
  );
}

/**
 * Determines if the given value is an element selector.
 * @param value The value to check.
 * @returns True if the value is an element selector, false otherwise.
 */
export function isElementSelector(value: unknown): value is ElementSelector {
  return (
    isElementSingleSelector(value) ||
    (isArray(value) && value.every(isElementSingleSelector))
  );
}

export function isBackwardCompatibleElementSingleSelector(
  selector: unknown
): selector is BackwardCompatibleElementSingleSelector {
  return (
    isLegacyElementSingleSelector(selector) || isElementSingleSelector(selector)
  );
}

export function isBackwardCompatibleElementSelector(
  selector: unknown
): selector is BackwardCompatibleElementSelector {
  return isLegacyElementSelector(selector) || isElementSelector(selector);
}

export function normalizeLegacySimpleElementSingleSelector(
  selector: LegacySimpleElementSingleSelector
): ElementSingleSelectorNormalized {
  if (isLegacySimpleElementSingleSelectorByType(selector)) {
    return { type: selector };
  }
  if (isLegacySimpleElementSingleSelectorByTypeWithOptions(selector)) {
    const objectSelector: ElementSingleSelectorNormalized = {
      type: selector[0],
    };
    if (selector[1] && isCapturedValuesSelector(selector[1])) {
      objectSelector.captured = { ...selector[1] };
    }
    return objectSelector;
  }
  throw new Error("Invalid legacy simple element single selector");
}

/**
 * Converts a legacy parent element single selector into the equivalent parent element single selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - `elementPath` -> `path`
 */
function normalizeLegacyParentElementSingleSelector(
  selector: LegacyParentElementSingleSelector
): ParentElementSingleSelector {
  const { elementPath, ...parentSelector } = selector;
  if (!isUndefined(elementPath)) {
    parentSelector.path = elementPath;
  }
  return parentSelector;
}

export function normalizeLegacyParentElementSelectors(
  selector: BackwardCompatibleParentElementSingleSelector[]
): ParentElementSelectorNormalized | null {
  return selector.map((sel) =>
    isLegacyParentElementSingleSelector(sel)
      ? normalizeLegacyParentElementSingleSelector(sel)
      : sel
  );
}

export function normalizeParentElementSelector(
  selector: BackwardCompatibleParentElementSelector | null
): ParentElementSelectorNormalized | null {
  if (isNull(selector)) {
    return null;
  }
  if (isArray(selector)) {
    return normalizeLegacyParentElementSelectors(selector);
  }
  return [
    isLegacyParentElementSingleSelector(selector)
      ? normalizeLegacyParentElementSingleSelector(selector)
      : selector,
  ];
}

export function normalizeParentInElementSingleSelector(
  selector: ElementSingleSelector
): ElementSingleSelectorNormalized {
  const { parent, ...rest } = selector;
  const normalizedSelector: ElementSingleSelectorNormalized = { ...rest };
  if (!isUndefined(parent)) {
    normalizedSelector.parent = normalizeParentElementSelector(parent);
  }
  return normalizedSelector;
}

export function normalizeLegacyElementSingleObjectSelector(
  selector: LegacyElementSingleObjectSelector
): ElementSingleSelectorNormalized {
  const { origin, elementPath, internalPath, parent, ...rest } = selector;

  if (!isUndefined(origin)) {
    throw new Error(
      `Cannot convert legacy element selector to element selector: the "origin" property is an entity-level property and cannot be represented in an element selector. Use convertLegacyElementSingleSelectorToEntitySelector instead.`
    );
  }

  const elementSelector: ElementSingleSelector = { ...rest };

  if (!isUndefined(parent)) {
    elementSelector.parent = parent;
  }

  if (!isUndefined(elementPath)) {
    elementSelector.path = elementPath;
  }

  if (!isUndefined(internalPath)) {
    elementSelector.fileInternalPath = internalPath;
  }

  return normalizeParentInElementSingleSelector(elementSelector);
}

export function normalizeLegacyElementSingleSelector(
  selector: LegacyElementSingleSelector
): ElementSingleSelectorNormalized {
  if (isLegacySimpleElementSingleSelector(selector)) {
    return normalizeLegacySimpleElementSingleSelector(selector);
  }
  if (isLegacyElementSingleObjectSelector(selector)) {
    return normalizeLegacyElementSingleObjectSelector(selector);
  }
  throw new Error("Invalid legacy element single selector");
}

/**
 * Normalizes a selector into ElementSelectorData format.
 * @param selector The selector to normalize.
 * @returns The normalized selector data.
 */
export function normalizeSingleElementSelector(
  selector: BackwardCompatibleElementSingleSelector
): ElementSingleSelectorNormalized {
  if (isLegacyElementSingleSelector(selector)) {
    return normalizeLegacyElementSingleSelector(selector);
  }
  return normalizeParentInElementSingleSelector(selector);
}

/**
 * Normalizes an ElementSelector into an array of ElementSingleSelector.
 * @param elementSelector The element selector, in any supported format.
 * @returns The normalized array of selector data.
 */
export function normalizeElementSelector(
  elementSelector: BackwardCompatibleElementSelector
): ElementSelectorNormalized {
  if (isLegacySimpleElementSingleSelectorByTypeWithOptions(elementSelector)) {
    return [normalizeSingleElementSelector(elementSelector)];
  }
  if (isArray(elementSelector)) {
    return elementSelector.map((sel) => normalizeSingleElementSelector(sel));
  }
  return [normalizeSingleElementSelector(elementSelector)];
}
