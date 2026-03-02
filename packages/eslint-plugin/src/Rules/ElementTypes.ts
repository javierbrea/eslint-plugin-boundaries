import {
  isIgnoredElement,
  isInternalDependency,
  isLocalElement,
  isUnknownLocalElement,
} from "@boundaries/elements";
import type {
  DependencyDescription,
  DependencyDataSelector,
  DependencySelector,
  TemplateData,
  Matcher,
  DependencyMatchResult,
} from "@boundaries/elements";
import type { Rule } from "eslint";

import type { EslintLiteralNode } from "../Elements";
import { getElementsMatcher } from "../Elements";
import type {
  RuleOptionsWithRules,
  ElementTypesRuleOptions,
  ElementTypesRule,
  SettingsNormalized,
} from "../Settings";
import {
  SETTINGS,
  RULE_NAMES_MAP,
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
} from "../Settings";
import { warnOnce, isObject, isArray } from "../Support";

import { dependencyRule } from "./Support";

const { RULE_ELEMENT_TYPES } = SETTINGS;

/**
 * Normalizes a rule that uses the legacy `importKind` option by injecting its value into
 * `dependency.kind`. If `dependency.kind` is already explicitly set in the rule, it takes
 * precedence and `importKind` is simply dropped.
 *
 * @deprecated This function exists only for backward compatibility with the `importKind` rule
 * option deprecated in v6. Remove in next major version once `importKind` is no longer supported.
 */
function normalizeRuleLegacyOptions(rule: ElementTypesRule): ElementTypesRule {
  if (!rule.importKind) {
    return rule;
  }

  const existingDependency = isObject(rule.dependency) ? rule.dependency : {};

  // If dependency.kind is already explicitly defined, it takes precedence over importKind.
  if (existingDependency.kind !== undefined) {
    return { ...rule, importKind: undefined };
  }

  return {
    ...rule,
    importKind: undefined,
    dependency: { ...existingDependency, kind: rule.importKind },
  };
}

/**
 * Wraps matcher.getSelectorMatchingDescription catching any errors to avoid breaking the rule.
 */
function safeMatch(
  dep: DependencyDescription,
  matcher: Matcher,
  selector: DependencySelector,
  extraTemplateData: TemplateData
): DependencyMatchResult {
  try {
    return matcher.getSelectorMatchingDescription(dep, selector, {
      extraTemplateData,
    });
  } catch (error) {
    warnOnce(
      `Error occurred while matching dependency with selector ${JSON.stringify(selector)}: ${String(error)}`
    );
    return { isMatch: false, from: null, to: null, dependency: null };
  }
}

function getCapturedTemplateData(
  rule: Record<string, unknown>,
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
function getPolicyEntries(policy: unknown): unknown[] {
  if (!isArray(policy)) return [policy];
  // New format: array whose items include plain objects → iterate individually
  if ((policy as unknown[]).some(isObject)) return policy as unknown[];
  // Legacy format: flat array of string matchers/tuples → one single entry
  return [policy];
}

/**
 * Merges two selector values field by field.
 * When both are plain objects, entry fields take precedence over outer fields,
 * enabling composed criteria for `from`, `to` and `dependency` alike:
 *   outer = { type: "helper" } + entry = { internalPath: "index.js" } → { type: "helper", internalPath: "index.js" }
 *   outer = { module: "react" } + entry = { kind: "type" } → { module: "react", kind: "type" }
 */
function mergeSelector(outer: unknown, entry: unknown): unknown {
  if (isObject(outer) && isObject(entry)) {
    return { ...(outer as object), ...(entry as object) };
  }
  return entry !== undefined ? entry : outer;
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
  outerFrom: unknown,
  outerTo: unknown,
  outerDependency: unknown,
  entry: unknown
): DependencySelector {
  if (isObject(entry)) {
    const entryObj = entry as Record<string, unknown>;

    const mergedFrom =
      outerFrom !== undefined || entryObj.from !== undefined
        ? mergeSelector(outerFrom, entryObj.from)
        : undefined;
    const mergedTo =
      outerTo !== undefined || entryObj.to !== undefined
        ? mergeSelector(outerTo, entryObj.to)
        : undefined;
    const mergedDependency =
      outerDependency !== undefined || entryObj.dependency !== undefined
        ? mergeSelector(outerDependency, entryObj.dependency)
        : undefined;

    const selectorResult: DependencySelector = {};
    if (mergedFrom !== undefined)
      selectorResult.from = mergedFrom as DependencySelector["from"];
    if (mergedTo !== undefined)
      selectorResult.to = mergedTo as DependencySelector["to"];
    if (mergedDependency !== undefined)
      selectorResult.dependency = mergedDependency as DependencyDataSelector;
    return selectorResult;
  }

  // Legacy entry: string or legacy array → becomes the "other direction" element selector
  const hasFrom = outerFrom !== undefined;
  const result: DependencySelector = {};
  if (hasFrom) {
    result.from = outerFrom as DependencySelector["from"];
    result.to = entry as DependencySelector["to"];
  } else {
    result.to = outerTo as DependencySelector["to"];
    result.from = entry as DependencySelector["from"];
  }
  if (outerDependency !== undefined) {
    result.dependency = outerDependency as DependencyDataSelector;
  }
  return result;
}

/**
 * Iterates the entries of a single policy value returning the first match, or null.
 */
function evaluatePolicyEntries(
  policy: unknown,
  outerFrom: unknown,
  outerTo: unknown,
  outerDependency: unknown,
  dep: DependencyDescription,
  matcher: Matcher,
  templateData: TemplateData
): DependencyMatchResult | null {
  for (const entry of getPolicyEntries(policy)) {
    const selector = buildEntrySelector(
      outerFrom,
      outerTo,
      outerDependency,
      entry
    );
    const result = safeMatch(dep, matcher, selector, templateData);
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
  rules: ElementTypesRule[],
  dep: DependencyDescription,
  matcher: Matcher,
  settings: SettingsNormalized
): EvaluateRulesResult {
  let allowed: boolean | null = null;
  let ruleIndex: number | null = null;
  let matchResult: DependencyMatchResult | null = null;

  for (let i = 0; i < rules.length; i++) {
    const rawRule = rules[i];
    const rule = normalizeRuleLegacyOptions(rawRule);
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
      const denyMatch = evaluatePolicyEntries(
        rule.disallow,
        outerFrom,
        outerTo,
        outerDependency,
        dep,
        matcher,
        templateData
      );
      if (denyMatch) {
        allowed = false;
        ruleIndex = i;
        matchResult = denyMatch;
        denyMatched = true;
      }
    }

    // Allow is only evaluated when disallow/deny did not match for this rule
    if (!denyMatched && rule.allow) {
      const allowMatch = evaluatePolicyEntries(
        rule.allow,
        outerFrom,
        outerTo,
        outerDependency,
        dep,
        matcher,
        templateData
      );
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
  ruleOptions: ElementTypesRuleOptions
): string | undefined {
  const ruleMessage =
    ruleIndex !== null ? ruleOptions.rules?.[ruleIndex]?.message : undefined;
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
 *
 * @todo Replace JSON.stringify with a proper formatted message in a future step.
 */
export function buildErrorMessage({
  matchResult,
  ruleIndex,
  customMessage,
  dependency,
}: BuildErrorMessageParams): string {
  return JSON.stringify({
    matchResult,
    ruleIndex,
    customMessage,
    dependency,
  });
}

export function evaluateRulesAndReport({
  rules,
  dependency,
  settings,
  context,
  node,
  options,
}: {
  rules: ElementTypesRule[];
  settings: SettingsNormalized;
  context: Rule.RuleContext;
  node: EslintLiteralNode;
  options?: RuleOptionsWithRules;
  dependency: DependencyDescription;
}): void {
  const matcher = getElementsMatcher(settings);
  const result = evaluateRules(rules, dependency, matcher, settings);
  const defaultAllowed = options?.default === "allow";
  const finalAllowed =
    result.allowed === true
      ? true
      : result.ruleIndex === null
        ? defaultAllowed
        : false;

  if (!finalAllowed && result.allowed === false) {
    context.report({
      message: buildErrorMessage({
        matchResult: result.matchResult,
        ruleIndex: result.ruleIndex,
        customMessage: resolveCustomMessage(result.ruleIndex, options ?? {}),
        dependency,
      }),
      node,
    });
  }
}

export default dependencyRule<ElementTypesRuleOptions>(
  {
    ruleName: RULE_ELEMENT_TYPES,
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
    // Validate and warn about legacy selector syntax
    validateAndWarnRuleOptions(options, "from", RULE_NAMES_MAP.ELEMENT_TYPES);

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
