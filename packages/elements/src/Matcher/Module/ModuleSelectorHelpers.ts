import { isArray, isObjectWithAnyOfProperties } from "../../Shared";

import type {
  ModuleSelector,
  ModuleSelectorNormalized,
  ModuleSingleSelector,
} from "./ModuleSelector.types";

/**
 * Determines if the given selector is a single module selector
 * @param value The value to check.
 * @returns True if the selector is a single module selector, false otherwise.
 */
export function isModuleSingleSelector(
  value: unknown
): value is ModuleSingleSelector {
  return isObjectWithAnyOfProperties(value, [
    "origin",
    "source",
    "internalPath",
  ]);
}

/**
 * Determines if the given value is a module selector.
 * @param value The value to check.
 * @returns True if the value is a module selector, false otherwise.
 */
export function isModuleSelector(value: unknown): value is ModuleSelector {
  return (
    isModuleSingleSelector(value) ||
    (isArray(value) && value.every(isModuleSingleSelector))
  );
}

/**
 * Normalizes a single module selector, ensuring it has the correct structure and default values.
 * @param selector  The selector to normalize.
 * @returns The normalized selector.
 * @throws Error if the selector is not a valid module single selector.
 */
export function normalizeModuleSingleSelector(
  selector: ModuleSingleSelector
): ModuleSingleSelector {
  if (isModuleSingleSelector(selector)) {
    return selector;
  }

  throw new Error("Invalid module selector");
}

/**
 * Normalizes a module selector, ensuring it has the correct structure and default values. If the selector is an array, each item will be normalized.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 * @throws Error if the selector is not a valid origin selector.
 */
export function normalizeModuleSelector(
  selector: ModuleSelector
): ModuleSelectorNormalized {
  if (isModuleSingleSelector(selector)) {
    return [normalizeModuleSingleSelector(selector)];
  }

  if (isArray(selector)) {
    return selector.map(normalizeModuleSingleSelector);
  }

  throw new Error("Invalid module selector");
}
