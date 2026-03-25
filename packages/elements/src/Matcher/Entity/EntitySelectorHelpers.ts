import {
  isArray,
  isNull,
  isUndefined,
  isObjectWithAnyOfProperties,
  isObjectWithProperty,
} from "../../Shared/TypeGuards";
import { isElementSelector, normalizeElementSelector } from "../Element";
import { isFileSelector, normalizeFileSelector } from "../File";

import type {
  EntitySelector,
  EntitySingleSelector,
} from "./EntitySelector.types";

/**
 * Determines if the given selector is a single entity selector
 * @param value The value to check.
 * @returns True if the selector is a single entity selector, false otherwise.
 */
export function isEntitySingleSelector(
  value: unknown
): value is EntitySingleSelector {
  if (!isObjectWithAnyOfProperties(value, ["element", "file"])) {
    return false;
  }

  const elementIsValid =
    !isObjectWithProperty(value, "element") ||
    isNull(value.element) ||
    isElementSelector(value.element);
  const fileIsValid =
    !isObjectWithProperty(value, "file") ||
    isNull(value.file) ||
    isFileSelector(value.file);

  return elementIsValid && fileIsValid;
}

/**
 * Determines if the given value is an entity selector.
 * @param value The value to check.
 * @returns True if the value is an entity selector, false otherwise.
 */
export function isEntitySelector(value: unknown): value is EntitySelector {
  return (
    isEntitySingleSelector(value) ||
    (isArray(value) && value.every(isEntitySingleSelector))
  );
}

/**
 * Normalizes a single entity selector, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeSingleEntitySelector(
  selector: EntitySingleSelector
): EntitySingleSelector {
  if (isEntitySingleSelector(selector)) {
    const baseSelector: EntitySingleSelector = {
      element: selector.element,
      file: selector.file,
    };
    if (!isUndefined(selector.element)) {
      baseSelector.element = isNull(selector.element)
        ? null
        : normalizeElementSelector(selector.element);
    }
    if (!isUndefined(selector.file)) {
      baseSelector.file = isNull(selector.file)
        ? null
        : normalizeFileSelector(selector.file);
    }
    return baseSelector;
  }

  throw new Error("Invalid entity selector");
}

/**
 * Normalizes an EntitySelector into an array of EntitySingleSelector.
 * @param entitySelector The entity selector, in any supported format.
 * @returns The normalized array of single entity selectors.
 */
export function normalizeEntitySelector(
  entitySelector: EntitySelector
): EntitySingleSelector[] {
  if (isArray(entitySelector)) {
    return entitySelector.map((sel) => normalizeSingleEntitySelector(sel));
  }
  return [normalizeSingleEntitySelector(entitySelector)];
}
