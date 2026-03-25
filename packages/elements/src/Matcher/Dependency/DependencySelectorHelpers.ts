import {
  isArray,
  isNull,
  isUndefined,
  isObjectWithProperty,
  isObjectWithAnyOfProperties,
} from "../../Shared";
import { isEntitySelector, normalizeEntitySelector } from "../Entity";

import type {
  DependencyInfoSingleSelector,
  DependencyInfoSelector,
  DependencySingleSelector,
  DependencySelector,
} from "./DependencySelector.types";

/**
 * Determines if the given value is dependency information selector
 * @param value The value to check.
 * @returns True if the value is dependency information selector, false otherwise.
 */
export function isDependencyInfoSingleSelector(
  value: unknown
): value is DependencyInfoSingleSelector {
  return isObjectWithAnyOfProperties(value, [
    "kind",
    "relationship",
    "specifiers",
    "nodeKind",
    "source",
    "module",
    "origin",
  ]);
}

/**
 * Determines if the given value is dependency information selector(s).
 * @param value The value to check.
 * @returns True if the value is dependency information selector(s), false otherwise.
 */
export function isDependencyInfoSelector(
  value: unknown
): value is DependencyInfoSelector {
  return (
    isDependencyInfoSingleSelector(value) ||
    (isArray(value) && value.every(isDependencyInfoSingleSelector))
  );
}

/**
 * Determines if the given value is a dependency single selector.
 * @param value The value to check
 * @returns True if the value is a dependency selector, false otherwise.
 */
export function isDependencySingleSelector(
  value: unknown
): value is DependencySingleSelector {
  if (!isObjectWithAnyOfProperties(value, ["from", "to", "dependency"])) {
    return false;
  }

  const fromIsValid =
    !isObjectWithProperty(value, "from") ||
    isNull(value.from) ||
    isEntitySelector(value.from);
  const toIsValid =
    !isObjectWithProperty(value, "to") ||
    isNull(value.to) ||
    isEntitySelector(value.to);
  const dependencyIsValid =
    !isObjectWithProperty(value, "dependency") ||
    isDependencyInfoSelector(value.dependency);

  return fromIsValid && toIsValid && dependencyIsValid;
}

/**
 * Determines if the given value is a dependency selector, which can be a single selector or an array of selectors.
 * @param value The value to check
 * @returns True if the value is a dependency selector, false otherwise.
 */
export function isDependencySelector(
  value: unknown
): value is DependencySelector {
  return (
    isDependencySingleSelector(value) ||
    (isArray(value) && value.every(isDependencySingleSelector))
  );
}

/**
 * Normalizes a single entity selector, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeSingleDependencySelector(
  selector: DependencySingleSelector
): DependencySingleSelector {
  if (isDependencySingleSelector(selector)) {
    const baseSelector: DependencySingleSelector = {
      from: selector.from,
      to: selector.to,
      dependency: selector.dependency,
    };

    if (!isUndefined(selector.from)) {
      baseSelector.from = isNull(selector.from)
        ? null
        : normalizeEntitySelector(selector.from);
    }
    if (!isUndefined(selector.to)) {
      baseSelector.to = isNull(selector.to)
        ? null
        : normalizeEntitySelector(selector.to);
    }
    return baseSelector;
  }

  throw new Error("Invalid entity selector");
}

/**
 * Normalizes a dependency selector, which can be a single selector or an array of selectors, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeDependencySelector(
  selector: DependencySelector
): DependencySelector {
  if (isDependencySingleSelector(selector)) {
    return normalizeSingleDependencySelector(selector);
  } else if (isArray(selector)) {
    return selector.map((singleSelector) =>
      normalizeSingleDependencySelector(singleSelector)
    );
  }
  throw new Error("Invalid dependency selector");
}
