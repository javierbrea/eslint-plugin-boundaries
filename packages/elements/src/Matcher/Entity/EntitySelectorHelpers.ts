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
import { isModuleSelector, normalizeModuleSelector } from "../Module";

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
  if (!isObjectWithAnyOfProperties(value, ["element", "file", "module"])) {
    return false;
  }

  const elementIsValid =
    !isObjectWithProperty(value, "element") || isElementSelector(value.element);
  const fileIsValid =
    !isObjectWithProperty(value, "file") || isFileSelector(value.file);
  const moduleIsValid =
    !isObjectWithProperty(value, "module") || isModuleSelector(value.module);

  return elementIsValid && fileIsValid && moduleIsValid;
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
 * Strips a leading "/" from a micromatch pattern (or each entry in an array of patterns).
 * v6 stored external internalPath with a leading slash on `element.fileInternalPath`; v7
 * stores it without leading slash on `module.internalPath`. When mapping legacy selectors
 * to the new module-based location we normalize accordingly so user patterns keep matching.
 */
function stripLeadingSlash(
  pattern: MicromatchPatternNullable
): MicromatchPatternNullable {
  const stripOne = (entry: string | null): string | null => {
    if (entry === null) {
      return null;
    }
    return entry.startsWith("/") ? entry.slice(1) : entry;
  };
  if (isArray(pattern)) {
    return pattern.map(stripOne);
  }
  return stripOne(pattern);
}

/**
 * Converts a legacy element single selector into the equivalent entity single selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - `origin` -> `module.origin`
 * - `elementPath` -> `element.path`
 * - `internalPath` -> `element.fileInternalPath` -> `module.internalPath` (with leading slash stripped to preserve matching with legacy patterns)
 * - `parent.elementPath` -> `element.parent.path`
 *
 * When the legacy selector contains `internalPath`, a second OR entry is appended that
 * routes `internalPath` to `module.internalPath` instead. In v7 external entities no
 * longer have an `element`, so the v6 mapping to `element.fileInternalPath` never
 * matched externals. The extra entry preserves the rest of the legacy constraints as
 * AND, so it only relaxes matching for entities that lack the discarded element
 * constraints (i.e. externals when only `internalPath`/`origin` are present).
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

    const baseModule = isUndefined(sourceOrigin)
      ? undefined
      : { origin: sourceOrigin };

    const elementEntitySelector: EntitySingleSelectorNormalized = {};
    if (Object.keys(sourceElementSelector).length > 0) {
      elementEntitySelector.element = [sourceElementSelector];
      if (!isUndefined(originalSelectorPathProperty)) {
        elementEntitySelector.element[0].filePath =
          originalSelectorPathProperty;
      }
    }
    if (!isUndefined(baseModule)) {
      elementEntitySelector.module = [baseModule];
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
  const elementSelector: ElementSingleSelectorNormalized =
    Object.keys(rest).length === 0
      ? (rest as ElementSingleSelectorNormalized)
      : normalizeSingleElementSelector(rest);

  const baseResult = toEntitySelectors(elementSelector, origin);

  const legacyInternalPath = (selector as LegacyElementSingleObjectSelector)
    .internalPath;
  if (!isUndefined(legacyInternalPath)) {
    const moduleFallbackEntry: EntitySingleSelectorNormalized = {};
    const elementWithoutFileInternalPath: ElementSingleSelectorNormalized = {
      ...elementSelector,
    };
    delete elementWithoutFileInternalPath.fileInternalPath;

    if (Object.keys(elementWithoutFileInternalPath).length > 0) {
      moduleFallbackEntry.element = [elementWithoutFileInternalPath];
      if (!isUndefined(originalSelectorPathProperty)) {
        moduleFallbackEntry.element[0].filePath = originalSelectorPathProperty;
      }
    }
    moduleFallbackEntry.module = [
      {
        ...(isUndefined(origin) ? {} : { origin }),
        internalPath: stripLeadingSlash(legacyInternalPath),
      },
    ];
    baseResult.push(moduleFallbackEntry);
  }

  return baseResult;
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
    if (!isUndefined(selector.module)) {
      baseSelector.module = normalizeModuleSelector(selector.module);
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
