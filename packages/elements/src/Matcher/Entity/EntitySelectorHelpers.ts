import {
  isArray,
  isUndefined,
  isObjectWithAnyOfProperties,
  isObjectWithProperty,
} from "../../Shared/TypeGuards";
import { isElementSelector, normalizeElementSelector } from "../Element";
import { isFileSelector, normalizeFileSelector } from "../File";
import { isOriginSelector, normalizeOriginSelector } from "../Origin";

import type {
  EntitySelector,
  EntitySelectorNormalized,
  EntitySingleSelector,
  EntitySingleSelectorNormalized,
} from "./EntitySelector.types";

/**
 * Determines if the given selector is a single entity selector
 * @param value The value to check.
 * @returns True if the selector is a single entity selector, false otherwise.
 */
export function isEntitySingleSelector(
  value: unknown
): value is EntitySingleSelector {
  if (!isObjectWithAnyOfProperties(value, ["element", "file", "origin"])) {
    return false;
  }

  const elementIsValid =
    !isObjectWithProperty(value, "element") || isElementSelector(value.element);
  const fileIsValid =
    !isObjectWithProperty(value, "file") || isFileSelector(value.file);
  const originIsValid =
    !isObjectWithProperty(value, "origin") || isOriginSelector(value.origin);

  return elementIsValid && fileIsValid && originIsValid;
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
): EntitySingleSelectorNormalized {
  if (isEntitySingleSelector(selector)) {
    const baseSelector: EntitySingleSelectorNormalized = {};
    if (!isUndefined(selector.element)) {
      baseSelector.element = normalizeElementSelector(selector.element);
    }
    if (!isUndefined(selector.file)) {
      baseSelector.file = normalizeFileSelector(selector.file);
    }
    if (!isUndefined(selector.origin)) {
      baseSelector.origin = normalizeOriginSelector(selector.origin);
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
): EntitySelectorNormalized {
  if (isArray(entitySelector)) {
    return entitySelector.map((sel) => normalizeSingleEntitySelector(sel));
  }
  return [normalizeSingleEntitySelector(entitySelector)];
}
