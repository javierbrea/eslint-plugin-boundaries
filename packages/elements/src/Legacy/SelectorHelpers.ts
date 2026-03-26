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
  BackwardCompatibleDependencySelector,
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
 * Adds `origin.module` to each entity single selector in `toSelector`.
 * When `toSelector` is undefined, produces `{ origin: { module } }`.
 *
 * The `dependency` array in the legacy model uses OR semantics between items, and each item
 * may pair a `source` with a `module`. Collecting all modules into a single array would break
 * that pairing, so `module` must stay bound to its own entity selector per dependency item.
 */
function addModuleToEntitySelector(
  toSelector: EntitySelector | undefined,
  modulePattern: LegacyDependencyInfoSingleSelector["module"]
): EntitySelector {
  if (isArray(toSelector)) {
    return toSelector.map((single) => ({
      ...single,
      origin: { ...single.origin, module: modulePattern },
    }));
  }

  const base: EntitySingleSelector = toSelector ?? {};
  return { ...base, origin: { ...base.origin, module: modulePattern } };
}

/**
 * Converts a legacy dependency single selector into one or more modern dependency selectors.
 *
 * When `dependency` is an array, each item produces a separate output selector to preserve
 * OR semantics and the pairing between `source` and `module` within each item. For example,
 * `[{ source: "foo", module: "x" }, { source: "bar", module: "y" }]` must not be collapsed
 * into `{ dependency: { source: ["foo","bar"] }, to: { origin: { module: ["x","y"] } } }`
 * because that would allow the combination (source "foo", module "y") which was not intended.
 */
function convertLegacyDependencySingleSelector(
  selector: LegacyDependencySingleSelector
): DependencySingleSelector[] {
  const from = isUndefined(selector.from)
    ? undefined
    : convertLegacyElementSelector(selector.from);

  const to = isUndefined(selector.to)
    ? undefined
    : convertLegacyElementSelector(selector.to);

  const dependencyItems = isUndefined(selector.dependency)
    ? []
    : isArray(selector.dependency)
      ? selector.dependency
      : [selector.dependency];

  if (dependencyItems.length === 0) {
    const converted: DependencySingleSelector = {};
    if (!isUndefined(from)) {
      converted.from = from;
    }
    if (!isUndefined(to)) {
      converted.to = to;
    }
    return [converted];
  }

  return dependencyItems.map((dependencyItem) => {
    const { module: modulePattern, ...dependencyInfo } = dependencyItem;
    const converted: DependencySingleSelector = {};
    if (!isUndefined(from)) {
      converted.from = from;
    }
    if (!isUndefined(modulePattern)) {
      converted.to = addModuleToEntitySelector(to, modulePattern);
    } else if (!isUndefined(to)) {
      converted.to = to;
    }
    if (Object.keys(dependencyInfo).length > 0) {
      converted.dependency = dependencyInfo;
    }
    return converted;
  });
}

/**
 * Asserts that a dependency selector does not mix legacy and new-format single selectors.
 * In practice all items in a selector should be either entirely legacy or entirely new-format.
 * @throws Error if legacy and new-format items are mixed in the same array.
 */
export function ensureNoMixedDependencySelector(
  selector: LegacyDependencySingleSelector[] | DependencySingleSelector[]
): LegacyDependencySingleSelector[] | never {
  const hasNew = selector.some(
    (item) => !isLegacyDependencySingleSelector(item)
  );
  if (hasNew) {
    throw new Error(
      "Dependency selectors cannot mix legacy-format elements and new-format items"
    );
  }
  return selector as LegacyDependencySingleSelector[];
}

/**
 * Converts a dependency selector from legacy format to the new entity selector format.
 * Returns the selector unchanged if it is already in the new format.
 * @throws Error if legacy and new-format items are mixed in the same array.
 */
export function convertLegacyDependencySelector(
  selector: BackwardCompatibleDependencySelector
): DependencySelector {
  if (!isLegacyDependencySelector(selector)) {
    return selector;
  }

  const selectors = isArray(selector) ? selector : [selector];
  const legacySelectors = ensureNoMixedDependencySelector(selectors);

  return legacySelectors.flatMap(convertLegacyDependencySingleSelector);
}
