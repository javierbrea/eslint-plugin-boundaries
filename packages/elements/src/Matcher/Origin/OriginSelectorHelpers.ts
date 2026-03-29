import { isArray, isObjectWithAnyOfProperties } from "../../Shared";

import type {
  OriginSelector,
  OriginSelectorNormalized,
  OriginSingleSelector,
} from "./OriginSelector.types";

/**
 * Determines if the given selector is a single origin selector
 * @param value The value to check.
 * @returns True if the selector is a single origin selector, false otherwise.
 */
export function isOriginSingleSelector(
  value: unknown
): value is OriginSingleSelector {
  return isObjectWithAnyOfProperties(value, ["kind", "module"]);
}

/**
 * Determines if the given value is an origin selector.
 * @param value The value to check.
 * @returns True if the value is an origin selector, false otherwise.
 */
export function isOriginSelector(value: unknown): value is OriginSelector {
  return (
    isOriginSingleSelector(value) ||
    (isArray(value) && value.every(isOriginSingleSelector))
  );
}

/**
 * Normalizes a single origin selector, ensuring it has the correct structure and default values.
 * @param selector  The selector to normalize.
 * @returns The normalized selector.
 * @throws Error if the selector is not a valid origin single selector.
 */
export function normalizeOriginSingleSelector(
  selector: OriginSingleSelector
): OriginSingleSelector {
  if (isOriginSingleSelector(selector)) {
    return selector;
  }

  throw new Error("Invalid origin selector");
}

/**
 * Normalizes an origin selector, ensuring it has the correct structure and default values. If the selector is an array, each item will be normalized.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 * @throws Error if the selector is not a valid origin selector.
 */
export function normalizeOriginSelector(
  selector: OriginSelector
): OriginSelectorNormalized {
  if (isOriginSingleSelector(selector)) {
    return [normalizeOriginSingleSelector(selector)];
  }

  if (isArray(selector)) {
    return selector.map(normalizeOriginSingleSelector);
  }

  throw new Error("Invalid origin selector");
}
