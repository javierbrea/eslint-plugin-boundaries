import type { DependenciesPolicyNormalized } from "@boundaries/config";
import type {
  DependencyKind,
  EntitySelectorNormalized,
  DependencyInfoSelectorNormalized,
  DependencyInfoSingleSelector,
  EntitySingleSelectorNormalized,
  DependencySingleSelectorNormalized,
  ElementSingleSelectorNormalized,
  ElementSelectorNormalized,
  ParentElementSingleSelector,
  ParentElementSelectorNormalized,
  FileSelectorNormalized,
  FileSingleSelector,
  ModuleSingleSelector,
  ModuleSelectorNormalized,
} from "@boundaries/elements";
import { isDependencySelector } from "@boundaries/elements";

import { isObject, isUndefined, isNull } from "../Shared";

import type { DependenciesPolicyPrecomputed } from "./Selectors.types";

const precomputedPoliciesMap = new WeakMap<
  DependenciesPolicyNormalized,
  DependenciesPolicyPrecomputed
>();

/**
 * Builds the dependency selectors of a policy, merging its outer selectors with each entry of `allow` and `disallow`, cached by policy identity.
 * @param normalizedRule - The policy, normalized by `@boundaries/config`.
 * @returns The policy with its precomputed selectors.
 */
export const precomputePolicy = (
  normalizedRule: DependenciesPolicyNormalized
): DependenciesPolicyPrecomputed => {
  const cachedPolicy = precomputedPoliciesMap.get(normalizedRule);
  if (cachedPolicy) {
    return cachedPolicy;
  }

  const precomputedAllow = normalizedRule.allow?.map((entry) =>
    buildEntrySelector(
      normalizedRule.from,
      normalizedRule.to,
      normalizedRule.dependency,
      entry,
      normalizedRule.importKind /* legacy importKind for backward compatibility */
    )
  );
  const precomputedDisallow = normalizedRule.disallow?.map((entry) =>
    buildEntrySelector(
      normalizedRule.from,
      normalizedRule.to,
      normalizedRule.dependency,
      entry,
      normalizedRule.importKind /* legacy importKind for backward compatibility */
    )
  );

  const precomputedRule: DependenciesPolicyPrecomputed = {
    ...normalizedRule,
    precomputedAllow,
    precomputedDisallow,
  };

  precomputedPoliciesMap.set(normalizedRule, precomputedRule);
  return precomputedRule;
};

/**
 * Merges a dependency selector by adding the `importKind` field from the rule level to the `dependency.kind` field in the selector, if applicable.
 * This is needed to support the legacy `importKind` rule option, which allowed specifying the import kind at the rule level instead of the selector level.
 * @param dependencySelector - The dependency selector object to add the `importKind` to.
 * @param importKind - The legacy import kind specified at the rule level, if any.
 */

function mergeImportKind(
  dependencySelector: DependencySingleSelectorNormalized,
  importKind?: DependencyKind
): DependencySingleSelectorNormalized;
function mergeImportKind(
  dependencySelector: undefined,
  importKind?: DependencyKind
): undefined;
function mergeImportKind(
  dependencySelector?: DependencySingleSelectorNormalized | undefined,
  importKind?: DependencyKind
): DependencySingleSelectorNormalized | undefined {
  if (!importKind) {
    return dependencySelector;
  }
  if (dependencySelector?.dependency) {
    return {
      ...dependencySelector,
      dependency: dependencySelector.dependency.map((dep) => ({
        kind: importKind,
        ...dep,
      })),
    };
  }
  return {
    ...dependencySelector,
    dependency: [
      {
        kind: importKind,
      },
    ],
  };
}

/**
 * Merges two objects by combining their properties, with entry properties taking precedence over outer properties.
 * If both objects have a property that is also an object, they are merged to avoid losing any nested properties.
 * @param outer The outer object.
 * @param entry The entry object.
 * @returns The merged object.
 */
function mergeProperties<T>(
  outer: T | undefined,
  entry: T | undefined
): T | undefined {
  if (isObject(outer) && isObject(entry)) {
    return { ...outer, ...entry };
  }
  return isUndefined(entry) ? outer : entry;
}

function mergeElementSingleSelector(
  outer?: ElementSingleSelectorNormalized,
  entry?: ElementSingleSelectorNormalized
): ElementSingleSelectorNormalized | undefined {
  /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
  if (!entry) {
    return outer;
  }
  /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
  if (!outer) {
    return entry;
  }
  const result = mergeProperties(outer, entry) as
    | ElementSingleSelectorNormalized
    | undefined;
  if (result && isObject(outer.captured) && isObject(entry.captured)) {
    result.captured = { ...outer.captured, ...entry.captured };
  }
  const parent = mergeParentSelector(outer.parent, entry.parent);
  if (result && parent) {
    result.parent = parent;
  }
  return result;
}

function mergeParentSingleSelector(
  outer?: ParentElementSingleSelector,
  entry?: ParentElementSingleSelector
): ParentElementSingleSelector | undefined {
  /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
  if (!entry) {
    return outer;
  }
  /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
  if (!outer) {
    return entry;
  }
  const result = mergeProperties(outer, entry) as
    | ParentElementSingleSelector
    | undefined;
  if (result && isObject(outer.captured) && isObject(entry.captured)) {
    result.captured = { ...outer.captured, ...entry.captured };
  }
  return result;
}

function mergeParentSelector(
  outer?: ParentElementSelectorNormalized | null,
  entry?: ParentElementSelectorNormalized | null
): ParentElementSelectorNormalized | null | undefined {
  if (isNull(entry)) {
    return entry;
  }
  if (isNull(outer)) {
    return isUndefined(entry) ? outer : entry;
  }
  if (!entry) {
    return outer;
  }
  if (!outer) {
    return entry;
  }
  return outer.flatMap((outerSelector) => {
    return entry.map(
      (entrySelector) =>
        mergeParentSingleSelector(
          outerSelector,
          entrySelector
        ) as ParentElementSingleSelector
    );
  });
}

function mergeElementSelector(
  outer?: ElementSelectorNormalized,
  entry?: ElementSelectorNormalized
): ElementSelectorNormalized | undefined {
  if (!entry) {
    return outer;
  }
  if (!outer) {
    return entry;
  }
  return outer.flatMap((outerSelector) => {
    return entry.map(
      (entrySelector) =>
        mergeElementSingleSelector(
          outerSelector,
          entrySelector
        ) as ElementSingleSelectorNormalized
    );
  });
}

function mergeFileSingleSelector(
  outer?: FileSingleSelector,
  entry?: FileSingleSelector
): FileSingleSelector | undefined {
  /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
  if (!entry) {
    return outer;
  }
  /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
  if (!outer) {
    return entry;
  }
  const result = mergeProperties(outer, entry) as
    | FileSingleSelector
    | undefined;
  if (result && isObject(outer.captured) && isObject(entry.captured)) {
    result.captured = { ...outer.captured, ...entry.captured };
  }
  return result;
}

function mergeFileSelector(
  outer?: FileSelectorNormalized,
  entry?: FileSelectorNormalized
): FileSelectorNormalized | undefined {
  if (!entry) {
    return outer;
  }
  if (!outer) {
    return entry;
  }
  return outer.flatMap((outerSelector) => {
    return entry.map(
      (entrySelector) =>
        mergeFileSingleSelector(
          outerSelector,
          entrySelector
        ) as FileSingleSelector
    );
  });
}

function mergeModuleSingleSelector(
  outer?: ModuleSingleSelector,
  entry?: ModuleSingleSelector
): ModuleSingleSelector | undefined {
  /* istanbul ignore next -- Defensive: callers always pass a defined entry through flatMap; preserved for type safety */
  if (!entry) {
    return outer;
  }
  /* istanbul ignore next -- Defensive: callers always pass a defined outer through flatMap; preserved for type safety */
  if (!outer) {
    return entry;
  }
  return mergeProperties(outer, entry) as ModuleSingleSelector | undefined;
}

function mergeModuleSelector(
  outer?: ModuleSelectorNormalized,
  entry?: ModuleSelectorNormalized
): ModuleSelectorNormalized | undefined {
  if (!entry) {
    return outer;
  }
  if (!outer) {
    return entry;
  }
  return outer.flatMap((outerSelector) => {
    return entry.map(
      (entrySelector) =>
        mergeModuleSingleSelector(
          outerSelector,
          entrySelector
        ) as ModuleSingleSelector
    );
  });
}

/**
 * Merges two element selectors by merging their fields, with entry fields taking precedence over outer fields.
 * If both selectors have a `captured` field, they are merged separately to avoid losing any captured values.
 * @param outer The selector of the rule-level field.
 * @param entry The selector of the policy entry.
 */
function mergeEntitySingleSelector(
  outer: EntitySingleSelectorNormalized,
  entry: EntitySingleSelectorNormalized
): EntitySingleSelectorNormalized {
  const merged: EntitySingleSelectorNormalized = {};
  const mergedElement = mergeElementSelector(outer.element, entry.element);
  if (mergedElement) {
    merged.element = mergedElement;
  }
  const mergedFile = mergeFileSelector(outer.file, entry.file);
  if (mergedFile) {
    merged.file = mergedFile;
  }
  const mergedModule = mergeModuleSelector(outer.module, entry.module);
  if (mergedModule) {
    merged.module = mergedModule;
  }
  return merged;
}

function mergeDependencyInfoSingleSelector(
  outer: DependencyInfoSingleSelector,
  entry: DependencyInfoSingleSelector
): DependencyInfoSingleSelector {
  const result = { ...outer, ...entry };
  const relationship = mergeProperties(outer.relationship, entry.relationship);
  if (!isUndefined(relationship)) {
    result.relationship = relationship;
  }
  return result;
}

/**
 * Merges the outer selector with the entry selector(s) for a policy, composing the final
 * selector(s) by merging all fields in all combinations.
 * For example, a rule with `to: { type: "helper" }` and an dependency entry with `allow: { to: [{ internalPath: "index.js" }, { internalPath: "foo.js" }] }`,
 * it would produce the merged selectors `[{ to: { type: "helper", internalPath: "index.js" } }, { to: { type: "helper", internalPath: "foo.js" } }]`.
 * @param outerElementSelector The outer selector defined at the rule level.
 * @param entryElementSelector The entry selector(s) defined at the policy level.
 * @returns The merged selector(s) as an array of `BaseElementSelectorData` objects.
 */
function mergeEntitySelector(
  outerElementSelector: EntitySelectorNormalized | undefined,
  entryElementSelector: EntitySelectorNormalized | undefined
): EntitySelectorNormalized | undefined {
  if (!entryElementSelector) {
    return outerElementSelector;
  }
  if (!outerElementSelector) {
    return entryElementSelector;
  }

  return outerElementSelector?.flatMap((outerSelector) => {
    return entryElementSelector.map((entrySelector) =>
      mergeEntitySingleSelector(outerSelector, entrySelector)
    );
  });
}

/**
 * Merges the outer dependency selector with the entry dependency selector, composing the final selector by merging all fields in all combinations.
 * For example, a rule with `dependency: { kind: "import" }` and an dependency entry with `allow: { dependency: [{ module: "react" }, { module: "lodash" }] }`,
 * it would produce the merged selectors `[{ dependency: { kind: "import", module: "react" } }, { dependency: { kind: "import", module: "lodash" } }]`.
 * @param outerDependencySelector The outer dependency selector defined at the rule level.
 * @param entryDependencySelector The entry dependency selector(s) defined at the policy level.
 * @returns The merged dependency selector(s) as an array of `DependencyInfoSelectorNormalized` objects.
 */
function mergeDependencyInfoSelectors(
  outerDependencySelector: DependencyInfoSelectorNormalized | undefined,
  entryDependencySelector: DependencyInfoSelectorNormalized | undefined
): DependencyInfoSelectorNormalized | undefined {
  if (!entryDependencySelector) {
    return outerDependencySelector;
  }
  if (!outerDependencySelector) {
    return entryDependencySelector;
  }
  return outerDependencySelector.flatMap((outerSelector) => {
    return entryDependencySelector.map((entrySelector) =>
      mergeDependencyInfoSingleSelector(outerSelector, entrySelector)
    );
  });
}

/**
 * Builds the final {@link DependencySelector} by merging the outer rule-level fields
 * (`from`, `to`, `dependency`) with a single policy entry.
 *
 * - **Object entry** — each of `from`, `to` and `dependency` is merged field by field,
 *   with entry fields taking precedence over outer fields. This allows composing criteria:
 *   `{ to: { type: "helper" }, allow: { to: { internalPath: "index.js" } } }` →
 *   selector `{ to: { type: "helper", internalPath: "index.js" } }`.
 * - **Legacy entry** (string or array without objects) — interpreted as the element selector
 *   for the "other" direction (opposite to the direction defined at the rule level).
 * @param outerFrom The rule-level `from` selector.
 * @param outerTo The rule-level `to` selector.
 * @param outerDependency The rule-level `dependency` selector.
 * @param entry The policy entry to merge with the rule-level fields.
 * @param legacyImportKind The rule-level `importKind` of a legacy policy, if any.
 */
function buildEntrySelector(
  outerFrom: EntitySelectorNormalized | undefined,
  outerTo: EntitySelectorNormalized | undefined,
  outerDependency: DependencyInfoSelectorNormalized | undefined,
  entry: DependencySingleSelectorNormalized | EntitySingleSelectorNormalized,
  legacyImportKind?: DependencyKind
): DependencySingleSelectorNormalized {
  if (isDependencySelector(entry)) {
    const entryObj = entry;

    const mergedFrom = mergeEntitySelector(outerFrom, entryObj.from);
    const mergedTo = mergeEntitySelector(outerTo, entryObj.to);
    const mergedDependency = mergeDependencyInfoSelectors(
      outerDependency,
      entryObj.dependency
    );

    const selectorResult: DependencySingleSelectorNormalized = {};
    if (!isUndefined(mergedFrom)) selectorResult.from = mergedFrom;
    if (!isUndefined(mergedTo)) selectorResult.to = mergedTo;
    if (!isUndefined(mergedDependency))
      selectorResult.dependency = mergedDependency;

    return mergeImportKind(selectorResult, legacyImportKind);
  }

  // Legacy entry: string or legacy array → becomes the "other direction" element selector
  // They are not merged because legacy entries are not objects but strings/arrays, so they
  // can not express criteria in the same direction as the outer selector but only in the opposite direction.
  // When neither `from` nor `to` is fixed at the policy level, there is no "other direction"
  // to infer from — `allow`/`disallow` have always scoped the dependency target, so the
  // entry fills `to` (see the v5-to-v6 migration guide's `to` requirement), leaving `from`
  // unconstrained.
  const hasFrom = !isUndefined(outerFrom);
  const hasTo = !isUndefined(outerTo);
  const result: DependencySingleSelectorNormalized = {};
  if (hasTo && !hasFrom) {
    result.to = outerTo;
    result.from = [entry];
  } else {
    // `@boundaries/elements` treats a present-but-`undefined` property as an invalid
    // selector shape, so `from` is only set when `outerFrom` actually has a value.
    if (hasFrom) result.from = outerFrom;
    result.to = [entry];
  }
  return mergeImportKind(result, legacyImportKind);
}
