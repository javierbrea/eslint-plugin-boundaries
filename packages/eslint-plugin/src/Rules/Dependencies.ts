import type {
  BaseElementSelectorData,
  DependencyDescription,
  DependencyDataSelector,
  DependencySelector,
  TemplateData,
  Matcher,
  DependencyMatchResult,
  BaseElementsSelector,
  BaseElementSelectorWithOptions,
  SimpleElementSelectorByType,
  DependencyDataSelectorData,
  DependencyKind,
} from "@boundaries/elements";
import {
  isDependencySelector,
  isElementSelectorWithLegacyOptions,
  isDependencyDataSelectorData,
  isIgnoredElement,
  isInternalDependency,
  isLocalElement,
  isUnknownLocalElement,
  normalizeElementsSelector,
} from "@boundaries/elements";
import type { Rule } from "eslint";

import { warnOnce, printDependenciesRuleResult } from "../Debug";
import type { EslintLiteralNode } from "../Elements";
import { getElementsMatcher } from "../Elements";
import {
  dependenciesRuleDefaultErrorMessage,
  customErrorMessage,
} from "../Messages";
import {
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
  migrationToV6GuideLink,
} from "../Settings";
import type {
  RuleOptionsWithRules,
  DependenciesRuleOptions,
  DependenciesRule,
  SettingsNormalized,
  RulePolicyEntry,
  RuleName,
} from "../Shared";
import {
  isObject,
  isArray,
  isString,
  isUndefined,
  isNull,
  RULE_NAMES_MAP,
  PLUGIN_ISSUES_URL,
} from "../Shared";

import { dependencyRule } from "./Support";

/**
 * Merges the legacy `importKind` field from the rule level into the `kind` field of the dependency selector, if applicable.
 * This is needed to support the legacy `importKind` rule option, which allowed specifying the import kind at the rule level instead of the selector level.
 * @param dependencyMetadata - The dependency metadata selector data to merge the `importKind` into.
 * @param importKind - The legacy import kind specified at the rule level, if any.
 * @returns The merged dependency metadata selector data with the `importKind` merged into the `kind` field.
 *
 * @deprecated This function exists only for backward compatibility with the `importKind` rule
 * option deprecated in v6. Remove in next major version once `importKind` is no longer supported.
 */
function mergeImportKindToDependencyMetadata(
  dependencyMetadata: DependencyDataSelectorData,
  importKind: DependencyKind
): DependencyDataSelectorData {
  if (!dependencyMetadata.kind) {
    return {
      kind: importKind,
      ...dependencyMetadata,
    };
  }

  if (isArray(dependencyMetadata.kind)) {
    return {
      ...dependencyMetadata,
      kind: [...dependencyMetadata.kind, importKind],
    };
  }
  return dependencyMetadata;
}

/**
 * Merges a dependency selector by adding the `importKind` field from the rule level to the `dependency.kind` field in the selector, if applicable.
 * This is needed to support the legacy `importKind` rule option, which allowed specifying the import kind at the rule level instead of the selector level.
 * @param dependencySelector - The dependency selector object to add the `importKind` to.
 * @param importKind - The legacy import kind specified at the rule level, if any.
 *
 * @deprecated This function exists only for backward compatibility with the `importKind` rule
 * option deprecated in v6. Remove in next major version once `importKind` is no longer supported.
 */
function mergeImportKind(
  dependencySelector: DependencySelector,
  importKind?: DependencyKind
): DependencySelector {
  if (!importKind) {
    return dependencySelector;
  }
  if (!dependencySelector.dependency) {
    return {
      ...dependencySelector,
      dependency: {
        kind: importKind,
      },
    };
  }
  if (isDependencyDataSelectorData(dependencySelector.dependency)) {
    return {
      ...dependencySelector,
      dependency: mergeImportKindToDependencyMetadata(
        dependencySelector.dependency,
        importKind
      ),
    };
  }

  /* istanbul ignore next - Defensive check, it should be always an array, because options are validated */
  if (!isArray(dependencySelector.dependency)) {
    return dependencySelector;
  }

  return {
    ...dependencySelector,
    dependency: dependencySelector.dependency.map((dep) => {
      return mergeImportKindToDependencyMetadata(dep, importKind);
    }),
  };
}

/**
 * Wraps matcher.getDependencySelectorMatchingDescription catching any errors to avoid breaking the rule.
 */
function safeMatch(
  dep: DependencyDescription,
  matcher: Matcher,
  selector: DependencySelector,
  extraTemplateData: TemplateData
): DependencyMatchResult {
  try {
    return matcher.getDependencySelectorMatchingDescription(dep, selector, {
      extraTemplateData,
    });
  } catch (error) /* istanbul ignore next - Defensive check */ {
    warnOnce(
      `Error occurred while matching dependency. Please report it at: ${PLUGIN_ISSUES_URL}`,
      `${JSON.stringify({
        error: isObject(error)
          ? { message: error.message, stack: error.stack }
          : String(error),
        dependency: dep,
        selector,
        extraTemplateData,
      })}.`
    );
    return { isMatch: false, from: null, to: null, dependency: null };
  }
}

/**
 * Builds template data for legacy `${...}` placeholders from captured values.
 *
 * @param rule - Rule currently being evaluated.
 * @param dep - Dependency description under evaluation.
 * @param legacyTemplates - Whether legacy template mode is enabled.
 * @returns Template data object consumed by matcher template rendering.
 */
function getCapturedTemplateData(
  rule: DependenciesRule,
  dep: DependencyDescription,
  legacyTemplates: boolean
): TemplateData {
  if (!legacyTemplates) return {};
  const targetDir = rule.from ? "from" : "to";
  return targetDir === "from"
    ? { ...dep.from.captured, from: dep.from.captured, to: dep.to.captured }
    : { ...dep.to.captured, from: dep.from.captured, to: dep.to.captured };
}

/**
 * Normalizes a policy value to an array of individual selector entries.
 * For arrays that contain objects (new format), each element is a separate entry.
 * For legacy string/array selectors the whole value is a single entry.
 */
function getPolicyEntries(
  policy: RulePolicyEntry | RulePolicyEntry[]
): (
  | SimpleElementSelectorByType
  | DependencySelector
  | BaseElementSelectorWithOptions
)[] {
  if (isString(policy)) {
    return [policy];
  }
  if (isElementSelectorWithLegacyOptions(policy)) {
    return [policy];
  }

  if (!isArray(policy)) return [policy];

  return policy;
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

/**
 * Merges two element selectors by merging their fields, with entry fields taking precedence over outer fields.
 * If both selectors have a `captured` field, they are merged separately to avoid losing any captured values.
 */
function mergeElementSelectorData(
  outer: BaseElementSelectorData,
  entry: BaseElementSelectorData
): BaseElementSelectorData {
  const result: BaseElementSelectorData = { ...outer, ...entry };
  const captured = mergeProperties(outer.captured, entry.captured);
  if (!isUndefined(captured)) {
    result.captured = captured;
  }
  const parent = mergeProperties(outer.parent, entry.parent);
  if (!isUndefined(parent)) {
    result.parent = parent;
  }
  return result;
}

function mergeDependencySelectorData(
  outer: DependencyDataSelectorData,
  entry: DependencyDataSelectorData
): DependencyDataSelectorData {
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
function mergeElementsSelector(
  outerElementSelector: BaseElementSelectorData[] | undefined,
  entryElementSelector: BaseElementSelectorData[] | undefined
): BaseElementSelectorData[] | undefined {
  if (!entryElementSelector) {
    return outerElementSelector;
  }
  if (!outerElementSelector) {
    return normalizeElementsSelector(entryElementSelector);
  }
  const normalizedEntrySelector =
    normalizeElementsSelector(entryElementSelector);

  return outerElementSelector?.flatMap((outerSelector) => {
    return normalizedEntrySelector.map((entrySelector) =>
      mergeElementSelectorData(outerSelector, entrySelector)
    );
  });
}

/**
 * Merges the outer dependency selector with the entry dependency selector, composing the final selector by merging all fields in all combinations.
 * For example, a rule with `dependency: { kind: "import" }` and an dependency entry with `allow: { dependency: [{ module: "react" }, { module: "lodash" }] }`,
 * it would produce the merged selectors `[{ dependency: { kind: "import", module: "react" } }, { dependency: { kind: "import", module: "lodash" } }]`.
 * @param outerDependencySelector The outer dependency selector defined at the rule level.
 * @param entryDependencySelector The entry dependency selector(s) defined at the policy level.
 * @returns The merged dependency selector(s) as an array of `DependencyDataSelector` objects.
 */
function mergeDependencyDataSelectors(
  outerDependencySelector: DependencyDataSelector | undefined,
  entryDependencySelector: DependencyDataSelector | undefined
): DependencyDataSelector | undefined {
  if (!entryDependencySelector) {
    return outerDependencySelector;
  }
  if (!outerDependencySelector) {
    return entryDependencySelector;
  }
  const outer = isArray(outerDependencySelector)
    ? outerDependencySelector
    : [outerDependencySelector];
  const entry = isArray(entryDependencySelector)
    ? entryDependencySelector
    : [entryDependencySelector];
  return outer.flatMap((outerSelector) => {
    return entry.map((entrySelector) =>
      mergeDependencySelectorData(outerSelector, entrySelector)
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
 */
function buildEntrySelector(
  outerFrom: BaseElementSelectorData[] | undefined,
  outerTo: BaseElementSelectorData[] | undefined,
  outerDependency: DependencyDataSelector | undefined,
  entry:
    | string
    | BaseElementSelectorWithOptions
    | DependencySelector
    | undefined
): DependencySelector {
  if (isDependencySelector(entry)) {
    const entryObj = entry;

    const mergedFrom = mergeElementsSelector(
      outerFrom,
      entryObj.from ? normalizeElementsSelector(entryObj.from) : undefined
    );
    const mergedTo = mergeElementsSelector(
      outerTo,
      entryObj.to ? normalizeElementsSelector(entryObj.to) : undefined
    );
    const mergedDependency = mergeDependencyDataSelectors(
      outerDependency,
      entryObj.dependency
    );

    const selectorResult: DependencySelector = {};
    if (!isUndefined(mergedFrom)) selectorResult.from = mergedFrom;
    if (!isUndefined(mergedTo)) selectorResult.to = mergedTo;
    if (!isUndefined(mergedDependency))
      selectorResult.dependency = mergedDependency;
    return selectorResult;
  }

  // Legacy entry: string or legacy array → becomes the "other direction" element selector
  // They are not merged because legacy entries are not objects but strings/arrays, so they
  // can not express criteria in the same direction as the outer selector but only in the opposite direction
  const hasFrom = !isUndefined(outerFrom);
  const result: DependencySelector = {};
  if (hasFrom) {
    result.from = outerFrom;
    result.to = entry;
  } else {
    result.to = outerTo;
    result.from = entry;
  }
  return result;
}

/**
 * Iterates the entries of a single policy value returning the first match, or null.
 * @param options - The rule options object containing the policy entries and outer selectors.
 * @param options.policy - The policy value, which can be a single entry or an array of entries.
 * @param options.outerFrom - The outer `from` selector defined at the rule level, to be merged with each entry.
 * @param options.outerTo - The outer `to` selector defined at the rule level, to be merged with each entry.
 * @param options.outerDependency - The outer `dependency` selector defined at the rule level, to be merged with each entry.
 * @param options.dep - The dependency description under evaluation.
 * @param options.matcher - The elements matcher instance used to evaluate matches.
 * @param options.templateData - The template data object containing captured values for template rendering.
 * @param options.legacyImportKind - The legacy import kind at rule level, if applicable.
 * @returns The match result from the first matching entry, or null if no entries matched.
 */
function evaluatePolicyEntries({
  policy,
  outerFrom,
  outerTo,
  outerDependency,
  dep,
  matcher,
  templateData,
  legacyImportKind,
}: {
  policy: RulePolicyEntry | RulePolicyEntry[];
  outerFrom: BaseElementsSelector | undefined;
  outerTo: BaseElementsSelector | undefined;
  outerDependency: DependencyDataSelector | undefined;
  dep: DependencyDescription;
  matcher: Matcher;
  templateData: TemplateData;
  legacyImportKind?: DependencyKind;
}): DependencyMatchResult | null {
  for (const entry of getPolicyEntries(policy)) {
    const selector = buildEntrySelector(
      outerFrom ? normalizeElementsSelector(outerFrom) : undefined,
      outerTo ? normalizeElementsSelector(outerTo) : undefined,
      outerDependency,
      entry
    );
    const selectorWithImportKind = mergeImportKind(selector, legacyImportKind);
    const result = safeMatch(
      dep,
      matcher,
      selectorWithImportKind,
      templateData
    );
    if (result.isMatch) return result;
  }
  return null;
}

export type EvaluateRulesResult =
  | { allowed: true }
  | {
      allowed: false;
      /** Index into `rules[]` of the rule that produced the result, or null if no rule matched. */
      ruleIndex: number | null;
      /** The match result from the selector that triggered the outcome, or null when no rule matched. */
      matchResult: DependencyMatchResult | null;
    };

/**
 * Evaluates the configured rules against a dependency description using a simplified path
 * that delegates all matching entirely to the elements package.
 *
 * For each rule, the outer `from`/`to`/`dependency` fields are merged with each entry in
 * `allow`/`disallow` to build the final {@link DependencySelector}. Rules follow
 * **last-write-wins** semantics: the last rule that produces a match determines the outcome.
 * Within a single rule, `disallow`/`deny` takes precedence over `allow` — `allow` is not
 * evaluated when `disallow` already matched.
 */
export function evaluateRules(
  rules: DependenciesRule[],
  dep: DependencyDescription,
  matcher: Matcher,
  settings: SettingsNormalized
): EvaluateRulesResult {
  let allowed: boolean | null = null;
  let ruleIndex: number | null = null;
  let matchResult: DependencyMatchResult | null = null;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const templateData = getCapturedTemplateData(
      rule,
      dep,
      settings.legacyTemplates
    );

    const outerFrom = rule.from;
    const outerTo = rule.to;
    const outerDependency = rule.dependency;

    let denyMatched = false;
    if (rule.disallow) {
      const denyMatch = evaluatePolicyEntries({
        policy: rule.disallow,
        outerFrom,
        outerTo,
        outerDependency,
        dep,
        matcher,
        templateData,
        legacyImportKind:
          rule.importKind /* legacy importKind for backward compatibility */,
      });
      if (denyMatch) {
        allowed = false;
        ruleIndex = i;
        matchResult = denyMatch;
        denyMatched = true;
      }
    }

    // Allow is only evaluated when disallow/deny did not match for this rule
    if (!denyMatched && rule.allow) {
      const allowMatch = evaluatePolicyEntries({
        policy: rule.allow,
        outerFrom,
        outerTo,
        outerDependency,
        dep,
        matcher,
        templateData,
        legacyImportKind:
          rule.importKind /* legacy importKind for backward compatibility */,
      });
      if (allowMatch) {
        allowed = true;
        ruleIndex = i;
        matchResult = allowMatch;
      }
    }
  }

  if (allowed === true) return { allowed: true };
  return { allowed: false, ruleIndex, matchResult };
}

/**
 * Resolves the custom error message for a violation, preferring the rule-specific message
 * over the global options message.
 */
export function resolveCustomMessage(
  ruleIndex: number | null,
  ruleOptions: DependenciesRuleOptions
): string | undefined {
  const ruleMessage = isNull(ruleIndex)
    ? undefined
    : ruleOptions.rules?.[ruleIndex]?.message;
  return ruleMessage ?? ruleOptions.message;
}

type BuildErrorMessageParams = {
  matchResult: DependencyMatchResult | null;
  ruleIndex: number | null;
  customMessage: string | undefined;
  dependency: DependencyDescription;
};

/**
 * Builds the error message for a dependency violation.
 */
export function buildErrorMessage({
  matchResult,
  ruleIndex,
  customMessage,
  dependency,
}: BuildErrorMessageParams): string {
  if (customMessage) {
    return customErrorMessage(
      customMessage,
      dependency,
      ruleIndex,
      matchResult
    );
  }
  return dependenciesRuleDefaultErrorMessage(
    matchResult,
    ruleIndex,
    dependency
  );
}

/**
 * Evaluates configured rules for a dependency and reports ESLint violations.
 *
 * @param params - Rule evaluation context and dependency information.
 */
export function evaluateRulesAndReport({
  rules,
  dependency,
  settings,
  context,
  node,
  options,
}: {
  rules: DependenciesRule[];
  settings: SettingsNormalized;
  context: Rule.RuleContext;
  node: EslintLiteralNode;
  options?: RuleOptionsWithRules;
  dependency: DependencyDescription;
}): void {
  const matcher = getElementsMatcher(settings);
  const result = evaluateRules(rules, dependency, matcher, settings);
  const defaultAllowed = options?.default === "allow";
  let finalAllowed = false;
  if (result.allowed === true) {
    finalAllowed = true;
  } else if (isNull(result.ruleIndex)) {
    finalAllowed = defaultAllowed;
  }

  if (!finalAllowed && result.allowed === false) {
    printDependenciesRuleResult(
      result.matchResult,
      result.ruleIndex,
      dependency,
      settings,
      matcher
    );
    /* istanbul ignore next - Defensive check, should not happen because options are validated */
    const optionsForMessage = options ?? {};
    context.report({
      message: buildErrorMessage({
        matchResult: result.matchResult,
        ruleIndex: result.ruleIndex,
        customMessage: resolveCustomMessage(
          result.ruleIndex,
          optionsForMessage
        ),
        dependency,
      }),
      node,
    });
  }
}

/**
 * Returns an ESLint rule definition for the dependencies rule, which checks dependencies between elements based on configured rules.
 * @param customRuleName - Optional custom name for the rule.
 * @returns ESLint rule definition.
 */
export default function getDependencyRule(
  ruleName: RuleName = RULE_NAMES_MAP.DEPENDENCIES
) {
  return dependencyRule<DependenciesRuleOptions>(
    {
      ruleName,
      description: `Check dependencies between elements`,
      schema: rulesOptionsSchema({
        extraOptionsSchema: {
          checkAllOrigins: {
            type: "boolean",
            description:
              "Whether to check dependencies from all origins (including external and core) or only from local elements. Default to false (only local).",
          },
          checkUnknownLocals: {
            type: "boolean",
            description:
              "Whether to check local dependencies with unknown elements (not matching any element descriptor) or to ignore them. Default to false (ignore).",
          },
          checkInternals: {
            type: "boolean",
            description:
              "Whether to check internal dependencies (dependencies within files in the same element). Default to false (ignore).",
          },
        },
      }),
    },
    function ({ dependency, node, context, settings, options }) {
      if (ruleName === RULE_NAMES_MAP.ELEMENT_TYPES) {
        warnOnce(
          `Rule name "${RULE_NAMES_MAP.ELEMENT_TYPES}" is deprecated. Use "${RULE_NAMES_MAP.DEPENDENCIES}" instead.`,
          migrationToV6GuideLink("rule-element-types-renamed-to-dependencies")
        );
      }
      // Validate and warn about legacy selector syntax
      validateAndWarnRuleOptions(options, ruleName, "from");

      const checkAllOrigins = options?.checkAllOrigins ?? false;
      const checkUnknownLocals = options?.checkUnknownLocals ?? false;
      const checkInternals = options?.checkInternals ?? false;

      if (
        !isIgnoredElement(dependency.to) &&
        (checkAllOrigins || isLocalElement(dependency.to)) &&
        (checkUnknownLocals || !isUnknownLocalElement(dependency.to)) &&
        (checkInternals || !isInternalDependency(dependency))
      ) {
        const rules = options?.rules ?? [];
        evaluateRulesAndReport({
          rules,
          settings,
          context,
          node,
          options,
          dependency,
        });
      }
    }
  );
}
