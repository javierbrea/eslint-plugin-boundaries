import {
  isArray,
  isObjectWithProperty,
  isObjectWithAnyOfProperties,
  isEmptyObject,
} from "../../Shared";
import type { EntitySelectorNormalized } from "../Entity";
import {
  isEntitySelector,
  isLegacyEntitySelector,
  normalizeEntitySelector,
} from "../Entity";

import type {
  DependencyInfoSingleSelector,
  DependencyInfoSelector,
  DependencyInfoSelectorNormalized,
  DependencySingleSelector,
  DependencySelector,
  DependencySelectorNormalized,
  DependencySingleSelectorNormalized,
  LegacyDependencyInfoSingleSelector,
  LegacyDependencyInfoSelector,
  LegacyDependencySingleSelector,
  LegacyDependencySelector,
  BackwardCompatibleDependencySingleSelector,
  BackwardCompatibleDependencySelector,
  BackwardCompatibleDependencyInfoSingleSelector,
  BackwardCompatibleDependencyInfoSelector,
} from "./DependencySelector.types";

/**
 * Determines if the given selector is a legacy dependency info single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency info single selector, false otherwise.
 */
export function isLegacyDependencyInfoSingleSelector(
  selector: unknown
): selector is LegacyDependencyInfoSingleSelector {
  return isObjectWithProperty(selector, "module");
}

export function isLegacyDependencyInfoSelector(
  selector: unknown
): selector is LegacyDependencyInfoSelector {
  return (
    isLegacyDependencyInfoSingleSelector(selector) ||
    (isArray(selector) && selector.some(isLegacyDependencyInfoSingleSelector))
  );
}

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

export function isBackwardCompatibleDependencyInfoSingleSelector(
  selector: unknown
): selector is BackwardCompatibleDependencyInfoSingleSelector {
  return (
    isDependencyInfoSingleSelector(selector) ||
    isLegacyDependencyInfoSingleSelector(selector)
  );
}

export function isBackwardCompatibleDependencyInfoSelector(
  selector: unknown
): selector is BackwardCompatibleDependencyInfoSelector {
  return (
    isBackwardCompatibleDependencyInfoSingleSelector(selector) ||
    (isArray(selector) &&
      selector.every(isBackwardCompatibleDependencyInfoSingleSelector))
  );
}

export function normalizeLegacyDependencyInfoSingleSelector(
  selector: LegacyDependencyInfoSingleSelector
): DependencyInfoSingleSelector {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { module: dependencyModule, ...rest } = selector;
  return rest;
}

export function isBaseDependencySingleSelector(selector: unknown): selector is {
  from?: unknown;
  to?: unknown;
  dependency?: unknown;
} {
  return isObjectWithAnyOfProperties(selector, ["from", "to", "dependency"]);
}

export function isLegacyDependencySingleSelector(
  selector: unknown
): selector is LegacyDependencySingleSelector {
  if (!isBaseDependencySingleSelector(selector)) {
    return false;
  }

  if (selector.from && isLegacyEntitySelector(selector.from)) {
    return true;
  }

  if (selector.to && isLegacyEntitySelector(selector.to)) {
    return true;
  }

  if (
    selector.dependency &&
    isLegacyDependencyInfoSelector(selector.dependency)
  ) {
    return true;
  }

  return false;
}

export function isLegacyDependencySelector(
  selector: unknown
): selector is LegacyDependencySelector {
  return (
    isLegacyDependencySingleSelector(selector) ||
    (isArray(selector) && selector.some(isLegacyDependencySingleSelector))
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
  if (!isBaseDependencySingleSelector(value)) {
    return false;
  }

  const fromIsValid =
    !isObjectWithProperty(value, "from") || isEntitySelector(value.from);
  const toIsValid =
    !isObjectWithProperty(value, "to") || isEntitySelector(value.to);
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

export function isBackwardCompatibleDependencySingleSelector(
  selector: unknown
): selector is BackwardCompatibleDependencySingleSelector {
  return (
    isDependencySingleSelector(selector) ||
    isLegacyDependencySingleSelector(selector)
  );
}

export function isBackwardCompatibleDependencySelector(
  selector: unknown
): selector is BackwardCompatibleDependencySelector {
  return (
    isBackwardCompatibleDependencySingleSelector(selector) ||
    (isArray(selector) &&
      selector.every(isBackwardCompatibleDependencySingleSelector))
  );
}

/**
 * Adds `origin.module` to each entity single selector in `toSelector`.
 * When `toSelector` is undefined, produces `{ origin: { module } }`.
 *
 * The `dependency` array in the legacy model uses OR semantics between items, and each item
 * may pair a `source` with a `module`. Collecting all modules into a single array would break
 * that pairing, so `module` must stay bound to its own entity selector per dependency item.
 */
function addModuleToEntitySelectorNormalized(
  entitySelector: EntitySelectorNormalized | undefined,
  legacyDependencySelector: LegacyDependencySingleSelector["dependency"]
): EntitySelectorNormalized {
  const legacyItems = (
    isArray(legacyDependencySelector)
      ? legacyDependencySelector
      : legacyDependencySelector !== undefined
        ? [legacyDependencySelector]
        : []
  ).filter(isLegacyDependencyInfoSingleSelector);

  if (legacyItems.length === 0) {
    return entitySelector ?? [];
  }

  const baseEntitySelectors =
    entitySelector && entitySelector.length > 0 ? entitySelector : [{}];

  return legacyItems.flatMap(({ module: modulePattern }) =>
    baseEntitySelectors.map((single) => ({
      ...single,
      origin: single.origin
        ? single.origin.map((origin) => ({ ...origin, module: modulePattern }))
        : [{ module: modulePattern }],
    }))
  );
}

/**
 * Normalizes a single dependency information selector, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeSingleDependencyInfoSelector(
  selector: BackwardCompatibleDependencyInfoSingleSelector
): DependencyInfoSingleSelector {
  if (isLegacyDependencyInfoSingleSelector(selector)) {
    return normalizeLegacyDependencyInfoSingleSelector(selector);
  }
  if (!isDependencyInfoSingleSelector(selector)) {
    throw new Error("Invalid dependency information selector");
  }

  return selector;
}

export function normalizeDependencyInfoSelector(
  selector: BackwardCompatibleDependencyInfoSelector
): DependencyInfoSelectorNormalized {
  if (isBackwardCompatibleDependencyInfoSingleSelector(selector)) {
    return [normalizeSingleDependencyInfoSelector(selector)];
  } else if (isArray(selector)) {
    return selector.map((singleSelector) =>
      normalizeSingleDependencyInfoSelector(singleSelector)
    );
  }
  throw new Error("Invalid dependency information selector");
}

export function normalizeLegacyDependencySingleSelector(
  selector: LegacyDependencySingleSelector
): DependencySelectorNormalized {
  const normalizedFrom = selector.from
    ? normalizeEntitySelector(selector.from)
    : undefined;
  const normalizedBaseTo = selector.to
    ? normalizeEntitySelector(selector.to)
    : undefined;
  const dependencyItems = isArray(selector.dependency)
    ? selector.dependency
    : selector.dependency !== undefined
      ? [selector.dependency]
      : [undefined];

  return dependencyItems.map((dependencyItem) => {
    const normalizedSelector: DependencySingleSelectorNormalized = {};

    if (normalizedFrom) {
      normalizedSelector.from = normalizedFrom;
    }

    const normalizedTo = addModuleToEntitySelectorNormalized(
      normalizedBaseTo,
      dependencyItem
    );
    if (normalizedTo.length > 0) {
      normalizedSelector.to = normalizedTo;
    }

    if (dependencyItem) {
      const normalizedDependency = normalizeDependencyInfoSelector(
        dependencyItem
      ).filter((item) => !isEmptyObject(item));
      if (normalizedDependency.length > 0) {
        normalizedSelector.dependency = normalizedDependency;
      }
    }

    return normalizedSelector;
  });
}

/**
 * Normalizes a single entity selector, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeSingleDependencySelector(
  selector: BackwardCompatibleDependencySingleSelector
): DependencySelectorNormalized {
  if (isBackwardCompatibleDependencySingleSelector(selector)) {
    return normalizeLegacyDependencySingleSelector(selector);
  }

  throw new Error("Invalid dependency selector");
}

/**
 * Normalizes a dependency selector, which can be a single selector or an array of selectors, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeDependencySelector(
  selector: BackwardCompatibleDependencySelector
): DependencySelectorNormalized {
  if (isBackwardCompatibleDependencySingleSelector(selector)) {
    return normalizeSingleDependencySelector(selector);
  } else if (isArray(selector)) {
    return selector.flatMap((singleSelector) =>
      normalizeSingleDependencySelector(singleSelector)
    );
  }
  throw new Error("Invalid dependency selector");
}
