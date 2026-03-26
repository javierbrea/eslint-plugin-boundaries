import type {
  ParentElementSingleSelector,
  ElementSelector,
  BackwardCompatibleElementSingleSelector,
  EntitySelector,
  EntitySingleSelector,
  DependencyInfoSingleSelector,
  DependencyInfoSelector,
  DependencySingleSelector,
  DependencySelector,
} from "../Matcher";
import {
  isEntitySelector,
  isBackwardCompatibleElementSingleSelector,
} from "../Matcher";
import {
  isArray,
  isObjectWithProperty,
  isObjectWithAnyOfProperties,
  isUndefined,
} from "../Shared";

import type {
  LegacyParentElementSingleSelector,
  LegacyParentElementSelector,
  LegacyElementSingleSelector,
  LegacyElementSelector,
  LegacyDependencyInfoSingleSelector,
  LegacyDependencyInfoSelector,
  LegacyDependencySelector,
  LegacyDependencySingleSelector,
} from "./Selector.types";

/**
 * Determines if the given selector is a legacy parent element single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy parent element single selector, false otherwise.
 */
export function isLegacyParentElementSingleSelector(
  selector: LegacyParentElementSingleSelector | ParentElementSingleSelector
): selector is LegacyParentElementSingleSelector {
  return isObjectWithProperty(selector, "elementPath");
}

/**
 * Determines if the given selector is a legacy parent element selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy parent element selector, false otherwise.
 */
export function isLegacyParentElementSelector(
  selector:
    | LegacyParentElementSelector
    | ParentElementSingleSelector
    | ParentElementSingleSelector[]
): selector is LegacyParentElementSelector {
  return isArray(selector)
    ? selector.some(isLegacyParentElementSingleSelector)
    : isLegacyParentElementSingleSelector(selector);
}

/**
 * Determines if the given selector is a legacy element single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy element single selector, false otherwise.
 */
export function isLegacyElementSingleSelector(
  selector:
    | LegacyElementSingleSelector
    | BackwardCompatibleElementSingleSelector
): selector is LegacyElementSingleSelector {
  return isObjectWithAnyOfProperties(selector, [
    "origin",
    "elementPath",
    "internalPath",
  ]);
}

/**
 * Determines if the given selector is a legacy element selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy element selector, false otherwise.
 */
export function isLegacyElementSelector(
  selector?: LegacyElementSelector | ElementSelector
): selector is LegacyElementSelector {
  if (!selector) {
    return false;
  }
  if (isBackwardCompatibleElementSingleSelector(selector)) {
    return false;
  }
  return isArray(selector)
    ? selector.some(isLegacyElementSingleSelector)
    : isLegacyElementSingleSelector(selector);
}

/**
 * Determines if the given selector is a legacy dependency info single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency info single selector, false otherwise.
 */
export function isLegacyDependencyInfoSingleSelector(
  selector: LegacyDependencyInfoSingleSelector | DependencyInfoSingleSelector
): selector is LegacyDependencyInfoSingleSelector {
  return isObjectWithAnyOfProperties(selector, ["module"]);
}

/**
 * Determines if the given selector is a legacy dependency info selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency info selector, false otherwise.
 */
export function isLegacyDependencyInfoSelector(
  selector?: LegacyDependencyInfoSelector | DependencyInfoSelector
): selector is LegacyDependencyInfoSelector {
  if (!selector) {
    return false;
  }
  return isArray(selector)
    ? selector.some(isLegacyDependencyInfoSingleSelector)
    : isLegacyDependencyInfoSingleSelector(selector);
}

/**
 * Determines if the given selector is a legacy dependency single selector. A legacy dependency single selector is one that has at least one of its properties (to, from, dependency) as a legacy selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency single selector, false otherwise.
 */
export function isLegacyDependencySingleSelector(
  selector: LegacyDependencySingleSelector | DependencySingleSelector
): selector is LegacyDependencySingleSelector {
  const isLegacyTo =
    !isEntitySelector(selector.to) && isLegacyElementSelector(selector.to);
  const isLegacyFrom =
    !isEntitySelector(selector.from) && isLegacyElementSelector(selector.from);
  const isLegacyDependencyInfo =
    !isEntitySelector(selector.dependency) &&
    isLegacyDependencyInfoSelector(selector.dependency);

  return isLegacyTo || isLegacyFrom || isLegacyDependencyInfo;
}

/**
 * Determines if the given selector is a legacy dependency selector. A legacy dependency selector is one that is either a legacy dependency single selector or an array of legacy dependency single selectors.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency selector, false otherwise.
 */
export function isLegacyDependencySelector(
  selector: LegacyDependencySelector | DependencySelector
): selector is LegacyDependencySelector {
  return isArray(selector)
    ? selector.some(isLegacyDependencySingleSelector)
    : isLegacyDependencySingleSelector(selector);
}

/**
 * Converts a legacy element single selector into the equivalent entity single selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - `origin` -> `origin.kind`
 * - `elementPath` -> `element.path`
 * - `internalPath` -> `element.fileInternalPath`
 */
function convertLegacyElementSingleSelector(
  selector: LegacyElementSingleSelector
): EntitySingleSelector {
  const { origin, elementPath, internalPath, ...elementSelector } = selector;
  const entitySelector: EntitySingleSelector = {};

  if (!isUndefined(elementPath)) {
    elementSelector.path = elementPath;
  }

  if (!isUndefined(internalPath)) {
    elementSelector.fileInternalPath = internalPath;
  }

  if (Object.keys(elementSelector).length > 0) {
    entitySelector.element = elementSelector;
  }

  if (!isUndefined(origin)) {
    entitySelector.origin = { kind: origin };
  }

  return entitySelector;
}

/**
 * Converts a legacy element selector (single or array) to entity selector format.
 */
function convertLegacyElementSelector(
  selector: LegacyElementSelector
): EntitySelector {
  if (isArray(selector)) {
    return selector.map(convertLegacyElementSingleSelector);
  }
  return convertLegacyElementSingleSelector(selector);
}

/**
 * Resolves a legacy `from` or `to` element selector to the entity selector format.
 * Returns the selector unchanged if it is already a new-format entity selector.
 * Returns undefined when the input is undefined.
 */
function resolveEntitySelector(
  selector: LegacyElementSelector | EntitySelector | undefined
): EntitySelector | undefined {
  if (isUndefined(selector)) {
    return undefined;
  }
  if (isEntitySelector(selector)) {
    return selector;
  }
  return convertLegacyElementSelector(selector);
}

/**
 * Adds `origin.module` to every single entity selector in a `to` selector.
 * When `toSelector` is undefined, produces a selector that matches only on origin.module.
 */
function addModuleToEntitySelector(
  toSelector: EntitySelector | undefined,
  modulePattern: LegacyDependencyInfoSingleSelector["module"]
): EntitySelector {
  const base: EntitySingleSelector = isArray(toSelector)
    ? {}
    : (toSelector ?? {});

  if (isArray(toSelector)) {
    return toSelector.map((single) => ({
      ...single,
      origin: { ...single.origin, module: modulePattern },
    }));
  }

  return {
    ...base,
    origin: { ...base.origin, module: modulePattern },
  };
}

/**
 * Converts a single legacy dependency info selector into its modern equivalent.
 *
 * The legacy `module` field does not belong to dependency metadata in the new model;
 * it is extracted and returned separately so the caller can place it in `to.origin.module`.
 */
function convertLegacyDependencyInfoSingleSelector(
  selector: LegacyDependencyInfoSingleSelector
): {
  dependencyInfo?: DependencyInfoSingleSelector;
  modulePattern: LegacyDependencyInfoSingleSelector["module"];
} {
  const { module: modulePattern, ...dependencyInfo } = selector;
  return {
    dependencyInfo:
      Object.keys(dependencyInfo).length > 0 ? dependencyInfo : undefined,
    modulePattern,
  };
}

/**
 * Converts a legacy dependency single selector into one or more modern dependency selectors.
 *
 * May expand to multiple selectors when `dependency` is an array with `module` entries,
 * preserving the OR semantics of each array item.
 */
function convertLegacyDependencySingleSelector(
  selector: LegacyDependencySingleSelector | DependencySingleSelector
): DependencySingleSelector[] {
  if (!isLegacyDependencySingleSelector(selector)) {
    return [selector];
  }

  const from = resolveEntitySelector(selector.from);
  const to = resolveEntitySelector(selector.to);

  if (
    isUndefined(selector.dependency) ||
    !isLegacyDependencyInfoSelector(selector.dependency)
  ) {
    const converted: DependencySingleSelector = {};
    if (!isUndefined(from)) {
      converted.from = from;
    }
    if (!isUndefined(to)) {
      converted.to = to;
    }
    if (!isUndefined(selector.dependency)) {
      converted.dependency = selector.dependency;
    }
    return [converted];
  }

  const dependencyItems = isArray(selector.dependency)
    ? selector.dependency
    : [selector.dependency];

  return dependencyItems.map((dependencyItem) => {
    const { dependencyInfo, modulePattern } =
      convertLegacyDependencyInfoSingleSelector(dependencyItem);
    const converted: DependencySingleSelector = {};
    if (!isUndefined(from)) {
      converted.from = from;
    }
    converted.to = isUndefined(modulePattern)
      ? to
      : addModuleToEntitySelector(to, modulePattern);
    if (!isUndefined(dependencyInfo)) {
      converted.dependency = dependencyInfo;
    }
    return converted;
  });
}

/**
 * Converts a dependency selector from legacy format to the new entity selector format.
 * Returns the selector unchanged if it is already in the new format.
 */
export function convertLegacyDependencySelector(
  selector: LegacyDependencySelector | DependencySelector
): DependencySelector {
  if (isArray(selector)) {
    return selector.flatMap(convertLegacyDependencySingleSelector);
  }

  return convertLegacyDependencySingleSelector(selector);
}
