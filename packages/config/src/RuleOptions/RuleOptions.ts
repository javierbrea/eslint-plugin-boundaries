import type { MicromatchPatternNullable } from "@boundaries/elements";
import {
  isEntitySelector,
  isLegacyEntitySelector,
  isDependencyInfoSelector,
  isLegacyDependencyInfoSelector,
  isDependencySelector,
  isLegacyDependencySelector,
  isLegacySimpleElementSingleSelectorByType,
  isLegacySimpleElementSingleSelectorByTypeWithOptions,
  isLegacyEntitySingleSelector,
  isBaseDependencySingleSelector,
} from "@boundaries/elements";

import { DiagnosticsBuilder } from "../Diagnostics";
import type { Diagnostic } from "../Diagnostics";
import {
  getRuleDocsPath,
  migrationToV6GuideLink,
  migrationToV7GuideLink,
  moreInfoLink,
  moreInfoSelectorsLink,
} from "../Docs";
import { validateRuleOptionsList } from "../Schemas";
import {
  isArray,
  isUndefined,
  isString,
  isNull,
  isNullish,
  isObject,
  RULE_EFFECT_ALLOW,
  RULE_EFFECT_DISALLOW,
  RULE_NAMES,
  RULE_SHORT_NAMES,
  RULE_NAMES_MAP,
} from "../Shared";
import type {
  RuleOptionsPolicies,
  RuleOptionsWithPolicies,
  RuleShortName,
  RuleEffect,
  RuleName,
} from "../Shared";

import type { RuleOptionsValidation } from "./RuleOptions.types";

/**
 * Type guard to check if a value is a valid RuleEffect.
 * @param value - The value to check.
 * @returns True if the value is a valid RuleEffect, false otherwise.
 */
export function isRuleEffect(value: unknown): value is RuleEffect {
  return (
    isString(value) &&
    (value === RULE_EFFECT_ALLOW || value === RULE_EFFECT_DISALLOW)
  );
}

/**
 * Type guard to check if a value is a valid RuleEffect.
 * @deprecated Use `isRuleEffect` instead.
 * @param value - The value to check.
 * @returns True if the value is a valid RuleEffect, false otherwise.
 */
export const isRulePolicy = isRuleEffect;

/**
 * Type guard to check if a value is a valid rule name including the default plugin prefix.
 * @param value - The value to check.
 * @returns True if the value is a valid rule name with the default plugin prefix, false otherwise.
 */
export function isRuleName(value: unknown): value is RuleName {
  return RULE_NAMES.includes(value as RuleName);
}

/**
 * Type guard to check if a value is a valid rule short name.
 * @param value - The value to check.
 * @returns True if the value is a valid rule short name, false otherwise.
 */
export function isRuleShortName(value: unknown): value is RuleShortName {
  return RULE_SHORT_NAMES.includes(value as RuleShortName);
}

/**
 * Checks if a string contains legacy template syntax ${...}.
 * @param value - The value to check.
 * @returns True if the value contains legacy template syntax, false otherwise.
 */
function hasLegacyTemplateSyntax(value: string): boolean {
  return value.includes("${");
}

/**
 * Recursively checks if a selector contains legacy template syntax.
 * @param micromatchPattern - The value to check (can be string, object, array, etc.).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
function checkForLegacyTemplateSyntax(
  micromatchPattern:
    | MicromatchPatternNullable
    | Record<string, MicromatchPatternNullable>
): boolean {
  if (isString(micromatchPattern)) {
    return hasLegacyTemplateSyntax(micromatchPattern);
  }

  if (isArray(micromatchPattern)) {
    return micromatchPattern.some(checkForLegacyTemplateSyntax);
  }

  if (isNull(micromatchPattern) || !isObject(micromatchPattern)) {
    return false;
  }

  return Object.values(micromatchPattern).some(checkForLegacyTemplateSyntax);
}

/**
 * Detects if legacy template syntax is used in selectors.
 * @param micromatchPattern - The selector to check (can be a single selector or an array of selectors).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
export function detectLegacyTemplateSyntax(
  micromatchPattern:
    | MicromatchPatternNullable
    | Record<string, MicromatchPatternNullable>
): boolean {
  return checkForLegacyTemplateSyntax(micromatchPattern);
}

type RuleWarningIndexes = {
  rulesWithLegacyStringSelector: number[];
  rulesWithLegacyTupleSelector: number[];
  rulesWithLegacyFlatElementSelector: number[];
  rulesWithUnclassifiedLegacySelector: number[];
  rulesWithUnwrappedPolicyTarget: number[];
  rulesWithLegacyTemplate: number[];
  rulesWithDeprecatedImportKind: number[];
  rulesWithDeprecatedV7SelectorProps: number[];
  rulesWithDeprecatedDependencyModule: number[];
  rulesWithDeprecatedInternalPath: number[];
};

const LEGACY_SELECTOR_KINDS_MAP = {
  STRING: "string",
  TUPLE: "tuple",
  FLAT_ELEMENT: "flat-element",
} as const;

/** A specific legacy selector syntax form, used to pick the right warning and migration link. */
type LegacySelectorKind =
  (typeof LEGACY_SELECTOR_KINDS_MAP)[keyof typeof LEGACY_SELECTOR_KINDS_MAP];

const ALWAYS_SCANNED_SELECTOR_FIELDS = [
  "from",
  "to",
  "target",
  "dependency",
] as const;

const RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW: Set<RuleName> = new Set([
  RULE_NAMES_MAP.DEPENDENCIES,
  RULE_NAMES_MAP.ELEMENT_TYPES,
]);

/**
 * Determines whether a value is a valid `from`/`to` entity selector, in either its
 * modern (`{ element, file, module }`) or backward-compatible legacy shape.
 *
 * @param value - The `from`/`to` property value to check.
 * @returns True if the value is a valid entity selector, false otherwise.
 */
function isValidEntitySelectorValue(value: unknown): boolean {
  return isEntitySelector(value) || isLegacyEntitySelector(value);
}

/**
 * Determines whether a value is a valid `dependency` selector.
 *
 * @param value - The `dependency` property value to check.
 * @returns True if the value is a valid dependency information selector, false otherwise.
 */
function isValidDependencyInfoSelectorValue(value: unknown): boolean {
  return (
    isDependencyInfoSelector(value) || isLegacyDependencyInfoSelector(value)
  );
}

/**
 * Determines whether a value is a valid `allow`/`disallow` policy target: either a
 * dependency selector (`{ from, to, dependency }`) or a bare entity selector, kept for
 * backward compatibility, or an array of either.
 *
 * @param value - The `allow`/`disallow` property value to check.
 * @returns True if the value is a valid policy target, false otherwise.
 */
function isValidPolicyTargetValue(value: unknown): boolean {
  if (isArray(value)) {
    return value.every(isValidPolicyTargetValue);
  }
  return (
    isDependencySelector(value) ||
    isLegacyDependencySelector(value) ||
    isValidEntitySelectorValue(value)
  );
}

/** The policy properties checked for a recognized selector shape, in message display order. */
const INVALID_SELECTOR_PROPERTIES = [
  "from",
  "to",
  "dependency",
  "allow",
  "disallow",
] as const;

type InvalidSelectorProperty = (typeof INVALID_SELECTOR_PROPERTIES)[number];

type InvalidSelectorsResult = {
  indexes: number[];
  properties: Set<InvalidSelectorProperty>;
};

/**
 * Collects indices of policy entries whose `from`/`to`/`dependency`/`allow`/`disallow`
 * selectors do not match any shape recognized by the `@boundaries/elements` type guards,
 * together with which of those properties were actually invalid across all entries.
 *
 * This replaces the deep AJV schema that used to validate these selector shapes: JSON
 * schema now only checks the pure ESLint option shape (which top-level properties are
 * allowed), while the actual selector structure is validated here at runtime.
 *
 * @param rules - Rule list to inspect.
 * @returns Indices of rule entries with an unrecognized selector shape, and the set of
 * properties found invalid.
 */
function collectRulesWithInvalidSelectors(
  rules: RuleOptionsPolicies[]
): InvalidSelectorsResult {
  const indexes: number[] = [];
  const properties = new Set<InvalidSelectorProperty>();

  for (const [index, rule] of rules.entries()) {
    const ruleRecord = rule as unknown as Record<string, unknown>;

    const propertyValidity: [InvalidSelectorProperty, boolean][] = [
      [
        "from",
        isUndefined(ruleRecord.from) ||
          isValidEntitySelectorValue(ruleRecord.from),
      ],
      [
        "to",
        isUndefined(ruleRecord.to) || isValidEntitySelectorValue(ruleRecord.to),
      ],
      [
        "dependency",
        isUndefined(ruleRecord.dependency) ||
          isValidDependencyInfoSelectorValue(ruleRecord.dependency),
      ],
      [
        "allow",
        isUndefined(ruleRecord.allow) ||
          isValidPolicyTargetValue(ruleRecord.allow),
      ],
      [
        "disallow",
        isUndefined(ruleRecord.disallow) ||
          isValidPolicyTargetValue(ruleRecord.disallow),
      ],
    ];

    let hasInvalidProperty = false;
    for (const [property, isValid] of propertyValidity) {
      if (!isValid) {
        hasInvalidProperty = true;
        properties.add(property);
      }
    }

    if (hasInvalidProperty) {
      indexes.push(index);
    }
  }

  return { indexes, properties };
}

/**
 * Joins property names into a natural-language, single-quoted list (e.g. `'from'`,
 * `'from' and 'to'`, `'from', 'to' and 'allow'`).
 *
 * @param properties - Property names to join, already in display order.
 * @returns The joined, human-readable list.
 */
function joinQuotedPropertyNames(properties: string[]): string {
  const quoted = properties.map((property) => `'${property}'`);
  const last = quoted.slice(-1).join("");
  const rest = quoted.slice(0, -1);
  return rest.length === 0 ? last : `${rest.join(", ")} and ${last}`;
}

/**
 * Visits the value of each of a rule's selector fields.
 *
 * `allow`/`disallow` are only visited for `dependencies`/`element-types` rules
 * because in other rules those fields hold external library names or file globs
 * that legitimately use string syntax.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be visited.
 * @param visitor - Callback invoked with each defined selector field value.
 */
function forEachRuleSelectorFieldValue(
  rule: RuleOptionsPolicies,
  ruleName: RuleName,
  visitor: (value: unknown) => void
): void {
  const ruleRecord = rule as unknown as Record<string, unknown>;

  const fields: readonly string[] = RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW.has(
    ruleName
  )
    ? [...ALWAYS_SCANNED_SELECTOR_FIELDS, "allow", "disallow"]
    : ALWAYS_SCANNED_SELECTOR_FIELDS;

  for (const field of fields) {
    const value = ruleRecord[field];
    if (!isUndefined(value)) {
      visitor(value);
    }
  }
}

/**
 * Determines whether any of a rule's selector fields satisfies a predicate.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @param predicate - Predicate evaluated against each selector field value.
 * @returns True if any scanned selector field satisfies the predicate, false otherwise.
 */
function ruleSelectorFieldMatches(
  rule: RuleOptionsPolicies,
  ruleName: RuleName,
  predicate: (value: unknown) => boolean
): boolean {
  let matches = false;
  forEachRuleSelectorFieldValue(rule, ruleName, (value) => {
    if (!matches && predicate(value)) {
      matches = true;
    }
  });
  return matches;
}

const DEPRECATED_V7_ELEMENT_SELECTOR_PROPS = [
  "category",
  "elementPath",
  "filePath",
] as const;

/**
 * Recursively determines whether a value contains any deprecated v7 element
 * selector property (`category`, `elementPath`, `filePath`).
 *
 * @param value - Value to inspect.
 * @returns True if a deprecated v7 selector property was detected, false otherwise.
 */
function hasDeprecatedV7SelectorProp(value: unknown): boolean {
  if (isArray(value)) {
    return value.some(hasDeprecatedV7SelectorProp);
  }
  if (!isObject(value)) {
    return false;
  }
  for (const prop of DEPRECATED_V7_ELEMENT_SELECTOR_PROPS) {
    if (
      prop in value &&
      !isUndefined((value as Record<string, unknown>)[prop])
    ) {
      return true;
    }
  }
  // Do not recurse into `captured` — its keys are capture value names defined by
  // the element pattern (e.g. `captured: { category: "atoms" }`) and must never
  // be treated as deprecated selector properties.
  const record = value as Record<string, unknown>;
  return Object.entries(record)
    .filter(([key]) => key !== "captured")
    .map(([, val]) => val)
    .some(hasDeprecatedV7SelectorProp);
}

/**
 * Recursively determines whether a value contains the deprecated `module`
 * property used in dependency info selectors.
 *
 * @param value - Value to inspect.
 * @returns True if a deprecated `module` property was detected, false otherwise.
 */
function hasDeprecatedDependencyModuleProp(value: unknown): boolean {
  if (isArray(value)) {
    return value.some(hasDeprecatedDependencyModuleProp);
  }
  if (!isObject(value)) {
    return false;
  }
  return (
    "module" in value &&
    !isUndefined((value as Record<string, unknown>)["module"])
  );
}

/**
 * Returns true when a value used in an element-selector context contains
 * the deprecated `internalPath` property (→ `fileInternalPath`).
 *
 * @param value - Element selector or array of element selectors to inspect.
 * @returns True if any element selector object has `internalPath` set.
 */
function elementSelectorHasDeprecatedInternalPath(value: unknown): boolean {
  if (isArray(value)) {
    return value.some(elementSelectorHasDeprecatedInternalPath);
  }
  if (!isObject(value)) {
    return false;
  }
  return (
    "internalPath" in value &&
    !isUndefined((value as Record<string, unknown>)["internalPath"])
  );
}

/**
 * Context-aware scan for deprecated `internalPath` in entity-selector values.
 *
 * `internalPath` on a flat element selector (legacy v7) is deprecated; use
 * `fileInternalPath` or the `module` sub-selector instead.
 * `internalPath` inside a `module` sub-selector is modern and must NOT be flagged.
 *
 * @param value - Entity selector or array of entity selectors to inspect.
 * @returns True if a deprecated element-level `internalPath` is detected.
 */
function entitySelectorHasDeprecatedInternalPath(value: unknown): boolean {
  if (isArray(value)) {
    return value.some(entitySelectorHasDeprecatedInternalPath);
  }
  if (!isObject(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  // Flat element selector at entity level (no entity sub-selector keys present).
  const hasEntitySubKey =
    !isUndefined(record["element"]) ||
    !isUndefined(record["file"]) ||
    !isUndefined(record["module"]);
  if (!hasEntitySubKey) {
    return "internalPath" in record && !isUndefined(record["internalPath"]);
  }
  // Modern entity selector — only descend into `element`; `module.internalPath` is valid.
  if (!isUndefined(record["element"])) {
    return elementSelectorHasDeprecatedInternalPath(record["element"]);
  }
  return false;
}

/**
 * Determines whether a rule contains legacy template syntax (`${...}`)
 * in any of its selector fields.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @returns True if any selector field contains legacy template syntax, false otherwise.
 */
function ruleHasLegacyTemplateSyntax(
  rule: RuleOptionsPolicies,
  ruleName: RuleName
): boolean {
  if (
    ruleSelectorFieldMatches(rule, ruleName, (value) =>
      detectLegacyTemplateSyntax(value as MicromatchPatternNullable)
    )
  ) {
    return true;
  }
  return isString(rule.message) && detectLegacyTemplateSyntax(rule.message);
}

/**
 * Determines whether a rule contains legacy string/tuple selector syntax, or an element
 * selector used directly as an entity-selector value (e.g. `{ type: "components" }`
 * instead of `{ element: { type: "components" } }`), in any of its selector fields.
 *
 * `isLegacyEntitySelector` already covers both cases: it is true for legacy string/tuple
 * selectors and for bare (backward-compatible) element-selector objects, and false for a
 * properly wrapped modern entity selector.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @returns True if any selector field uses legacy selector syntax, false otherwise.
 */
function ruleHasLegacySelectorSyntax(
  rule: RuleOptionsPolicies,
  ruleName: RuleName
): boolean {
  return ruleSelectorFieldMatches(rule, ruleName, isLegacyEntitySelector);
}

/**
 * Recursively collects which legacy selector kinds (string, tuple, or element selector
 * used directly as an entity selector) are present in a selector value.
 *
 * Order matters: a tuple selector is also an array, so it must be checked before generic
 * array recursion; a bare string must be checked before the flat-element check, since
 * `isLegacyEntitySingleSelector` also matches strings.
 *
 * @param value - Selector value to inspect.
 * @param kinds - Set accumulating the legacy kinds found so far.
 */
function collectLegacySelectorKinds(
  value: unknown,
  kinds: Set<LegacySelectorKind>
): void {
  if (
    isArray(value) &&
    value.length === 2 &&
    isLegacySimpleElementSingleSelectorByTypeWithOptions(value)
  ) {
    kinds.add(LEGACY_SELECTOR_KINDS_MAP.TUPLE);
    return;
  }
  if (isArray(value)) {
    for (const item of value) {
      collectLegacySelectorKinds(item, kinds);
    }
    return;
  }
  if (isLegacySimpleElementSingleSelectorByType(value)) {
    kinds.add(LEGACY_SELECTOR_KINDS_MAP.STRING);
    return;
  }
  if (isLegacyEntitySingleSelector(value)) {
    kinds.add(LEGACY_SELECTOR_KINDS_MAP.FLAT_ELEMENT);
  }
}

/**
 * Collects the legacy selector kinds present across all of a rule's selector fields.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @returns The set of legacy selector kinds detected in the rule.
 */
function ruleLegacySelectorKinds(
  rule: RuleOptionsPolicies,
  ruleName: RuleName
): Set<LegacySelectorKind> {
  const kinds = new Set<LegacySelectorKind>();
  forEachRuleSelectorFieldValue(rule, ruleName, (value) => {
    collectLegacySelectorKinds(value, kinds);
  });
  return kinds;
}

/**
 * Determines whether an `allow`/`disallow` entry, or any entry of an array of entries, is a
 * bare entity/dependency-info selector missing the `from`/`to`/`dependency` wrapper required
 * since v6 (e.g. `{ type: "helper" }` or `"helper"` instead of `{ to: { type: "helper" } }`).
 *
 * @param value - The `allow`/`disallow` property value to inspect.
 * @returns True if any entry lacks the wrapper, false otherwise.
 */
function hasUnwrappedPolicyTargetEntry(value: unknown): boolean {
  if (isArray(value)) {
    return value.some(hasUnwrappedPolicyTargetEntry);
  }
  return (
    isValidPolicyTargetValue(value) && !isBaseDependencySingleSelector(value)
  );
}

/**
 * Determines whether a rule's `allow`/`disallow` properties contain an entry missing the
 * `from`/`to`/`dependency` wrapper. Only `allow`/`disallow` are checked, and only for rules
 * that support entity selectors there (`dependencies`, `element-types`) — for other rules
 * those fields hold external library names or file globs, not selectors.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` apply.
 * @returns True if `allow` or `disallow` contains an unwrapped entry, false otherwise.
 */
function ruleHasUnwrappedPolicyTarget(
  rule: RuleOptionsPolicies,
  ruleName: RuleName
): boolean {
  if (!RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW.has(ruleName)) {
    return false;
  }
  const ruleRecord = rule as unknown as Record<string, unknown>;
  for (const field of ["allow", "disallow"] as const) {
    const value = ruleRecord[field];
    if (!isUndefined(value) && hasUnwrappedPolicyTargetEntry(value)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the singular or plural noun used to describe the affected policy count in a
 * warning summary.
 *
 * @param count - Number of policies affected.
 * @returns "policy" when `count` is 1, "policies" otherwise.
 */
function policyNoun(count: number): string {
  return count === 1 ? "policy" : "policies";
}

/**
 * Classifies a single rule's legacy selector kinds into `indexes`, at `index`, including the
 * "unclassified" fallback when the rule has legacy selector syntax that could not be assigned
 * to any specific kind.
 *
 * @param rule - Single rule entry to inspect.
 * @param ruleName - The full rule name, used to decide whether `allow`/`disallow` should be scanned.
 * @param index - The rule's index within its `policies` array.
 * @param indexes - Accumulator mutated in place with the matched indices.
 */
function pushLegacySelectorKindIndexes(
  rule: RuleOptionsPolicies,
  ruleName: RuleName,
  index: number,
  indexes: RuleWarningIndexes
): void {
  if (!ruleHasLegacySelectorSyntax(rule, ruleName)) {
    return;
  }

  const kinds = ruleLegacySelectorKinds(rule, ruleName);

  if (kinds.has(LEGACY_SELECTOR_KINDS_MAP.STRING)) {
    indexes.rulesWithLegacyStringSelector.push(index);
  }
  if (kinds.has(LEGACY_SELECTOR_KINDS_MAP.TUPLE)) {
    indexes.rulesWithLegacyTupleSelector.push(index);
  }
  if (kinds.has(LEGACY_SELECTOR_KINDS_MAP.FLAT_ELEMENT)) {
    indexes.rulesWithLegacyFlatElementSelector.push(index);
  }
  if (kinds.size === 0) {
    indexes.rulesWithUnclassifiedLegacySelector.push(index);
  }
}

/**
 * Determines whether a rule's `dependency` selector uses the deprecated `dependency.module`
 * property.
 *
 * @param rule - Single rule entry to inspect.
 * @returns True if the rule's `dependency` selector uses `dependency.module`, false otherwise.
 */
function ruleHasDeprecatedDependencyModule(rule: RuleOptionsPolicies): boolean {
  const ruleRecord = rule as unknown as Record<string, unknown>;
  return (
    !isUndefined(ruleRecord["dependency"]) &&
    hasDeprecatedDependencyModuleProp(ruleRecord["dependency"])
  );
}

/**
 * Single-rule deprecation detectors evaluated for every rule, keyed by the
 * {@link RuleWarningIndexes} bucket their matches are collected into.
 */
const RULE_WARNING_DETECTORS: {
  key: keyof Omit<
    RuleWarningIndexes,
    | "rulesWithLegacyStringSelector"
    | "rulesWithLegacyTupleSelector"
    | "rulesWithLegacyFlatElementSelector"
    | "rulesWithUnclassifiedLegacySelector"
  >;
  matches: (rule: RuleOptionsPolicies, ruleName: RuleName) => boolean;
}[] = [
  {
    key: "rulesWithUnwrappedPolicyTarget",
    matches: ruleHasUnwrappedPolicyTarget,
  },
  { key: "rulesWithLegacyTemplate", matches: ruleHasLegacyTemplateSyntax },
  {
    key: "rulesWithDeprecatedImportKind",
    matches: (rule) => !isUndefined(rule.importKind),
  },
  {
    key: "rulesWithDeprecatedV7SelectorProps",
    matches: (rule, ruleName) =>
      ruleSelectorFieldMatches(rule, ruleName, hasDeprecatedV7SelectorProp),
  },
  {
    key: "rulesWithDeprecatedDependencyModule",
    matches: (rule) => ruleHasDeprecatedDependencyModule(rule),
  },
  {
    key: "rulesWithDeprecatedInternalPath",
    matches: (rule, ruleName) =>
      ruleSelectorFieldMatches(
        rule,
        ruleName,
        entitySelectorHasDeprecatedInternalPath
      ),
  },
];

/**
 * Collects indices of rules using deprecated selector/template/importKind syntax.
 *
 * @param rules - Rule list to inspect.
 * @param ruleName - Rule name used to scope `allow`/`disallow` scanning.
 * @returns Rule indices grouped by deprecated syntax type.
 */
export function collectRuleWarningIndexes(
  rules: RuleOptionsPolicies[],
  ruleName: RuleName
): RuleWarningIndexes {
  const indexes: RuleWarningIndexes = {
    rulesWithLegacyStringSelector: [],
    rulesWithLegacyTupleSelector: [],
    rulesWithLegacyFlatElementSelector: [],
    rulesWithUnclassifiedLegacySelector: [],
    rulesWithUnwrappedPolicyTarget: [],
    rulesWithLegacyTemplate: [],
    rulesWithDeprecatedImportKind: [],
    rulesWithDeprecatedV7SelectorProps: [],
    rulesWithDeprecatedDependencyModule: [],
    rulesWithDeprecatedInternalPath: [],
  };

  for (const [index, rule] of rules.entries()) {
    pushLegacySelectorKindIndexes(rule, ruleName, index, indexes);

    for (const { key, matches } of RULE_WARNING_DETECTORS) {
      if (matches(rule, ruleName)) {
        indexes[key].push(index);
      }
    }
  }

  return indexes;
}

/**
 * Adds a diagnostic, for `dependencies`/`element-types` rules, when one or more policy entries have a `from`/`to`/`dependency`/`allow`/`disallow` value that does not match any shape recognized by the `@boundaries/elements` type guards.
 *
 * @param policies - The rule's `policies` (or `rules`) entries to inspect.
 * @param policiesKey - The option that holds the entries, `policies` or `rules`.
 * @param ruleName - Rule name displayed in the diagnostic title, and used to decide whether this rule supports `allow`/`disallow`.
 * @param diagnostics - Builder that collects the diagnostics.
 */
function checkSelectorShapes(
  policies: RuleOptionsPolicies[],
  policiesKey: string,
  ruleName: RuleName,
  diagnostics: DiagnosticsBuilder
): void {
  if (!RULE_NAMES_WITH_ENTITY_ALLOW_DISALLOW.has(ruleName)) {
    return;
  }

  const { indexes: invalidIndexes, properties: invalidProperties } =
    collectRulesWithInvalidSelectors(policies);
  if (invalidIndexes.length === 0) {
    return;
  }

  const orderedInvalidProperties = INVALID_SELECTOR_PROPERTIES.filter(
    (property) => invalidProperties.has(property)
  );
  const propertyNoun =
    orderedInvalidProperties.length === 1 ? "property" : "properties";
  diagnostics.warning(
    `[${ruleName}] Detected an unrecognized selector shape in ${
      invalidIndexes.length
    } ${policyNoun(invalidIndexes.length)} at indices: ${invalidIndexes.join(", ")}.`,
    `Check the ${joinQuotedPropertyNames(orderedInvalidProperties)} ${propertyNoun}. ${moreInfoLink(getRuleDocsPath(ruleName))}`,
    invalidIndexes.map((index) => [policiesKey, index])
  );
}

/**
 * Adds a diagnostic when the deprecated `rules` option alias is used instead of `policies`, with a different message depending on whether `policies` is also defined (in which case `rules` is ignored entirely).
 *
 * @param options - Rule options possibly containing the deprecated `rules` alias.
 * @param ruleName - Rule name displayed in the diagnostic title.
 * @param diagnostics - Builder that collects the diagnostics.
 */
function checkDeprecatedRulesOption(
  options: RuleOptionsWithPolicies,
  ruleName: RuleName,
  diagnostics: DiagnosticsBuilder
): void {
  if (!options.rules) {
    return;
  }

  if (options.policies) {
    diagnostics.warning(
      `[${ruleName}] The 'rules' option is deprecated and will be ignored because 'policies' is also defined.`,
      `You can safely remove the 'rules' option. ${migrationToV7GuideLink("rules-option-renamed-to-policies")}`,
      [["rules"]]
    );
  } else {
    diagnostics.deprecation(
      `[${ruleName}] The 'rules' option is deprecated.`,
      `Please use 'policies' instead. ${migrationToV7GuideLink("rules-option-renamed-to-policies")}`,
      [["rules"]]
    );
  }
}

/**
 * Adds a diagnostic for each deprecated selector, template or `importKind` syntax found in the policies, and for the deprecated `rules` option alias.
 *
 * @param options - Rule options containing `policies` (or the deprecated `rules` alias) entries.
 * @param policies - The entries of `policies`, or of `rules` when `policies` is not set.
 * @param policiesKey - The option that holds the entries, `policies` or `rules`.
 * @param ruleName - Rule name displayed in the diagnostic titles.
 * @param diagnostics - Builder that collects the diagnostics.
 */
function checkLegacySyntax(
  options: RuleOptionsWithPolicies,
  policies: RuleOptionsPolicies[],
  policiesKey: string,
  ruleName: RuleName,
  diagnostics: DiagnosticsBuilder
): void {
  checkDeprecatedRulesOption(options, ruleName, diagnostics);

  const ruleWarningIndexes = collectRuleWarningIndexes(policies, ruleName);

  const legacySyntaxWarnings: {
    indexes: number[];
    summary: (count: number, indexList: string) => string;
    detail: string;
  }[] = [
    {
      indexes: ruleWarningIndexes.rulesWithLegacyStringSelector,
      summary: (count, indexList) =>
        `[${ruleName}] Detected legacy string element selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Replace "your-type" with an entity selector, e.g. { element: { type: "your-type" } }. ${migrationToV6GuideLink("object-based-elements-selector-syntax")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithLegacyTupleSelector,
      summary: (count, indexList) =>
        `[${ruleName}] Detected legacy tuple element selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Replace ["your-type", { family: "data" }] with { element: { type: "your-type", captured: { family: "data" } } }. ${migrationToV6GuideLink("object-based-elements-selector-syntax")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithLegacyFlatElementSelector,
      summary: (count, indexList) =>
        `[${ruleName}] Detected element selectors used directly as entity selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Wrap them in an entity selector: use { element: { type: "your-type" } } instead of { type: "your-type" }. ${migrationToV7GuideLink("entity-selectors")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithUnclassifiedLegacySelector,
      summary: (count, indexList) =>
        `[${ruleName}] Detected legacy selector syntax in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Consider migrating to entity selectors ({ element: { ... } }). ${migrationToV7GuideLink("entity-selectors")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithUnwrappedPolicyTarget,
      // cspell:ignore allowdisallow -- documentation anchor for the deprecated bare allow/disallow selector
      summary: (count, indexList) =>
        `[${ruleName}] Detected "allow"/"disallow" entries without a "from"/"to" wrapper in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Use allow: [{ to: { element: { type: "your-type" } } }] or [{ from: ... }] instead of a bare element selector. ${migrationToV6GuideLink("to-property-in-allowdisallow-rules-is-now-required")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithLegacyTemplate,
      summary: (count, indexList) =>
        `[${ruleName}] Detected legacy template syntax \${...} in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Consider migrating to {{...}} syntax. ${migrationToV6GuideLink("new-template-syntax")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithDeprecatedImportKind,
      summary: (count, indexList) =>
        `[${ruleName}] Detected deprecated rule-level "importKind" in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Use selector-level "dependency.kind" instead. When both are defined, "dependency.kind" takes precedence. ${migrationToV6GuideLink("rule-level-importkind-is-deprecated")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithDeprecatedV7SelectorProps,
      summary: (count, indexList) =>
        `[${ruleName}] Detected deprecated selector properties (category, elementPath, filePath) in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Rename elementPath → path, filePath → fileInternalPath, and remove category (use file descriptors instead). ${moreInfoSelectorsLink("deprecated-element-selector-properties")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithDeprecatedDependencyModule,
      // cspell:ignore dependencymodule -- documentation anchor for the deprecated dependency.module property
      summary: (count, indexList) =>
        `[${ruleName}] Detected deprecated "dependency.module" property in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Use "to.module.source" instead. ${migrationToV7GuideLink("deprecated-dependencymodule")}`,
    },
    {
      indexes: ruleWarningIndexes.rulesWithDeprecatedInternalPath,
      summary: (count, indexList) =>
        `[${ruleName}] Detected deprecated "internalPath" in element selectors in ${count} ${policyNoun(count)} at indices: ${indexList}.`,
      detail: `Use "fileInternalPath" for local element paths, or the module sub-selector "internalPath" for external modules. ${moreInfoSelectorsLink("deprecated-element-selector-properties")}`,
    },
  ];

  for (const { indexes, summary, detail } of legacySyntaxWarnings) {
    if (indexes.length > 0) {
      diagnostics.deprecation(
        summary(indexes.length, indexes.join(", ")),
        detail,
        indexes.map((index) => [policiesKey, index])
      );
    }
  }

  if (
    isString(options.message) &&
    detectLegacyTemplateSyntax(options.message)
  ) {
    diagnostics.deprecation(
      `[${ruleName}] Detected legacy template syntax \${...} in the rule's general 'message'.`,
      `Consider migrating to {{...}} syntax. ${migrationToV6GuideLink("new-template-syntax")}`,
      [["message"]]
    );
  }
}

/**
 * Validates the options of a rule entry: against the rule schema, as ESLint does, and then, for the rules with policies, the shape of their selectors and, when `legacyWarnings` is true, their deprecated syntax.
 *
 * @param ruleName - The name of the rule, with the default plugin prefix.
 * @param options - The options object of the rule entry.
 * @param validation - What to validate.
 * @param validation.legacyWarnings - Whether to report the deprecated syntax of the policies, as the `boundaries/legacy-warnings` setting does.
 * @param validation.schema - Whether to validate the options against the rule schema, as ESLint does with the rule `meta.schema`. Default `true`; a host that already runs ESLint passes `false`.
 * @returns The problems found, with paths from the root of the options object. When the schema validation fails, only its error, because ESLint never runs a rule whose options fail it.
 */
export function validateRuleOptions(
  ruleName: RuleName,
  options: unknown,
  { legacyWarnings, schema = true }: RuleOptionsValidation
): Diagnostic[] {
  const diagnostics = new DiagnosticsBuilder();

  if (schema) {
    const schemaError = validateRuleOptionsList(
      ruleName,
      isUndefined(options) ? [] : [options]
    );
    if (schemaError) {
      diagnostics.error(
        schemaError.title,
        schemaError.detail,
        // The paths start at the options list; the first segment is the index of the options object in it
        schemaError.paths.map((path) => path.slice(1))
      );
      return diagnostics.build();
    }
  }

  if (!isObject(options)) {
    return diagnostics.build();
  }

  const ruleOptions = options as RuleOptionsWithPolicies;
  const policiesKey = isNullish(ruleOptions.policies) ? "rules" : "policies";
  const policies = ruleOptions.policies ?? ruleOptions.rules;

  if (!policies || !isArray(policies)) {
    return diagnostics.build();
  }

  checkSelectorShapes(policies, policiesKey, ruleName, diagnostics);

  if (legacyWarnings) {
    checkLegacySyntax(
      ruleOptions,
      policies,
      policiesKey,
      ruleName,
      diagnostics
    );
  }

  return diagnostics.build();
}
