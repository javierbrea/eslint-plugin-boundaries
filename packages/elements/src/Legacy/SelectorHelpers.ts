import type {
  ParentElementSingleSelector,
  ElementSelector,
  BackwardCompatibleElementSingleSelector,
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
    "category",
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
  return isObjectWithAnyOfProperties(selector, [
    "category",
    "origin",
    "elementPath",
    "internalPath",
  ]);
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
