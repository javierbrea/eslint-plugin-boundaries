import type { MicromatchPatternNullable } from "../../Shared";
import {
  isArray,
  isUndefined,
  isObjectWithAnyOfProperties,
  isObjectWithProperty,
} from "../../Shared/TypeGuards";
import type {
  BackwardCompatibleElementSingleSelector,
  ElementSingleSelectorNormalized,
  LegacyElementSingleObjectSelector,
} from "../Element";
import {
  isElementSelector,
  normalizeElementSelector,
  isBackwardCompatibleElementSingleSelector,
  isLegacySimpleElementSingleSelector,
  normalizeLegacySimpleElementSingleSelector,
  isLegacyElementSingleObjectSelector,
  isElementSingleSelector,
  normalizeSingleElementSelector,
} from "../Element";
import { isFileSelector, normalizeFileSelector } from "../File";
import { isOriginSelector, normalizeOriginSelector } from "../Origin";

import type {
  BackwardCompatibleEntitySelector,
  BackwardCompatibleEntitySingleSelector,
  EntitySelectorNormalized,
  EntitySingleSelector,
  EntitySingleSelectorNormalized,
  LegacyEntitySelector,
  LegacyEntitySingleSelector,
} from "./EntitySelector.types";

/**
 * Determines if the given entity selector is a legacy entity selector, in the form of a legacy element selector or an element selector
 * @param selector The selector to check.
 * @returns True if the selector is a legacy entity selector, false otherwise.
 */
export function isLegacyEntitySingleSelector(
  selector: unknown
): selector is LegacyEntitySingleSelector {
  if (isEntitySingleSelector(selector)) {
    return false;
  }
  return isBackwardCompatibleElementSingleSelector(selector);
}

/**
 * Determines if the given entity selector is a legacy entity selector, in the form of a legacy element selector or an element selector
 * @param selector The selector to check.
 * @returns True if the selector is a legacy entity selector, false otherwise.
 */
export function isLegacyEntitySelector(
  selector?: unknown
): selector is LegacyEntitySelector {
  return (
    isBackwardCompatibleElementSingleSelector(selector) ||
    (isArray(selector) &&
      selector.some(isBackwardCompatibleElementSingleSelector))
  );
}

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
export function isEntitySelector(
  value: unknown
): value is EntitySingleSelector | EntitySingleSelector[] {
  return (
    isEntitySingleSelector(value) ||
    (isArray(value) && value.every(isEntitySingleSelector))
  );
}

/**
 * Converts a legacy element single selector into the equivalent entity single selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - `origin` -> `origin.kind`
 * - `elementPath` -> `element.path`
 * - `internalPath` -> `element.fileInternalPath`
 * - `parent.elementPath` -> `element.parent.path`
 */
function normalizeBackwardCompatibleElementSingleSelectorToEntitySingleSelector(
  selector: BackwardCompatibleElementSingleSelector
): EntitySingleSelectorNormalized[] {
  let originalSelectorPathProperty: MicromatchPatternNullable | undefined =
    undefined;
  const toEntitySelectors = (
    sourceElementSelector: ElementSingleSelectorNormalized,
    sourceOrigin?: LegacyElementSingleObjectSelector["origin"]
  ): EntitySingleSelectorNormalized[] => {
    const selectors: EntitySingleSelectorNormalized[] = [];

    const baseOrigin = isUndefined(sourceOrigin)
      ? undefined
      : { kind: sourceOrigin };

    const elementEntitySelector: EntitySingleSelectorNormalized = {};
    if (Object.keys(sourceElementSelector).length > 0) {
      elementEntitySelector.element = [sourceElementSelector];
      if (!isUndefined(originalSelectorPathProperty)) {
        elementEntitySelector.element[0].filePath =
          originalSelectorPathProperty;
      }
    }
    if (!isUndefined(baseOrigin)) {
      elementEntitySelector.origin = [baseOrigin];
    }
    if (Object.keys(elementEntitySelector).length > 0) {
      selectors.push(elementEntitySelector);
    }

    return selectors;
  };

  if (isLegacySimpleElementSingleSelector(selector)) {
    return toEntitySelectors(
      normalizeLegacySimpleElementSingleSelector(selector)
    );
  }

  originalSelectorPathProperty = selector.path;
  if (
    !isLegacyElementSingleObjectSelector(selector) &&
    isElementSingleSelector(selector)
  ) {
    return [{ element: [normalizeSingleElementSelector(selector)] }];
  }

  const { origin, ...rest } = selector;
  const elementSelector = normalizeSingleElementSelector(rest);

  return toEntitySelectors(elementSelector, origin);
}

/**
 * Normalizes a single entity selector, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeSingleEntitySelector(
  selector: BackwardCompatibleEntitySingleSelector
): EntitySelectorNormalized {
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
    return [baseSelector];
  }
  if (isBackwardCompatibleElementSingleSelector(selector)) {
    return normalizeBackwardCompatibleElementSingleSelectorToEntitySingleSelector(
      selector
    );
  }

  throw new Error("Invalid entity selector");
}

/**
 * Normalizes an EntitySelector into an array of EntitySingleSelector.
 * @param entitySelector The entity selector, in any supported format.
 * @returns The normalized array of single entity selectors.
 */
export function normalizeEntitySelector(
  entitySelector: BackwardCompatibleEntitySelector
): EntitySelectorNormalized {
  if (isLegacyEntitySingleSelector(entitySelector)) {
    return normalizeSingleEntitySelector(entitySelector);
  }
  if (isArray(entitySelector)) {
    return entitySelector.flatMap((sel) => normalizeSingleEntitySelector(sel));
  }
  return normalizeSingleEntitySelector(entitySelector);
}
