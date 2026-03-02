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
  MatcherOptionsDependencySelectorsGlobals,
  Matcher,
  ElementsSelector,
  DependencyMatchResult,
} from "@boundaries/elements";
import micromatch from "micromatch";

import { getElementsMatcher } from "../Elements";
import type {
  ElementTypesRuleOptions,
  RuleResult,
  SettingsNormalized,
} from "../Settings";
import {
  SETTINGS,
  RULE_NAMES_MAP,
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
} from "../Settings";
import { warnOnce, isString, isObject, isArray } from "../Support";

import { dependencyRule, normalizeRuleLegacyOptions } from "./Support";

const { RULE_ELEMENT_TYPES } = SETTINGS;

type PolicyMatch = {
  isMatch: boolean;
  specifiers?: string | string[];
  internalPath?: string;
};

type RuleMatchContext = {
  targetElementDirection: "from" | "to";
  policyElementDirection: "from" | "to";
  denyKeyToUse: "deny" | "disallow";
  capturedValuesTemplateData: TemplateData;
  dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals;
  targetElementSelector: ElementsSelector;
};

/**
 * Safely matches a dependency selector, catching and logging any errors
 */
function createSafeMatcherFunction(
  dependencyDescription: DependencyDescription,
  matcher: Matcher
) {
  return (
    dependencySelector: DependencySelector,
    extraTemplateData: TemplateData,
    dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals
  ): DependencyMatchResult => {
    // Just in case selectors are invalid, we catch errors here to avoid breaking the whole rule evaluation
    try {
      return matcher.getSelectorMatchingDescription(
        dependencyDescription,
        dependencySelector,
        {
          extraTemplateData,
          dependencySelectorsGlobals,
        }
      );
    } catch (error) {
      warnOnce(
        `Error occurred while matching dependency with selector ${JSON.stringify(dependencySelector)}: ${String(error)}`
      );
      return { isMatch: false, from: null, to: null, dependency: null };
    }
  };
}

/**
 * Determines the rule matching context (directions, template data, etc.)
 */
function createRuleMatchContext(
  rule: Record<string, unknown>,
  dependencyDescription: DependencyDescription
): RuleMatchContext {
  const targetElementDirection = rule.from ? "from" : "to";
  const policyElementDirection = rule.from ? "to" : "from";
  const denyKeyToUse = rule.deny ? "deny" : "disallow";

  const capturedValuesTemplateData =
    targetElementDirection === "from"
      ? {
          ...dependencyDescription.from.captured,
          from: dependencyDescription.from.captured,
          to: dependencyDescription.to.captured,
        }
      : {
          ...dependencyDescription.to.captured,
          from: dependencyDescription.from.captured,
          to: dependencyDescription.to.captured,
        };

  const dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals =
    rule.importKind ? { kind: rule.importKind as string } : {};

  const targetElementSelector = rule[
    targetElementDirection
  ] as ElementsSelector;

  return {
    targetElementDirection,
    policyElementDirection,
    denyKeyToUse,
    capturedValuesTemplateData,
    dependencySelectorsGlobals,
    targetElementSelector,
  };
}

function matchSupportingMultipleSelectors(
  isMatch: ReturnType<typeof createSafeMatcherFunction>,
  targetElementSelector: ElementsSelector,
  targetElementDirection: "from" | "to",
  policyElementDirection: "from" | "to",
  ruleSelector: unknown,
  templateData: TemplateData,
  dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals
): DependencyMatchResult | { isMatch: false } {
  if (isObject(ruleSelector)) {
    return isMatch(
      {
        [targetElementDirection]: targetElementSelector,
        ...ruleSelector,
      },
      templateData,
      dependencySelectorsGlobals
    );
  }
  const hasObjectsInSelector = isArray(ruleSelector)
    ? ruleSelector.some((selector) => isObject(selector))
    : false;
  // Support arrays of new object selectors in allow/deny
  if (hasObjectsInSelector) {
    for (const selector of ruleSelector as unknown[]) {
      const matchResult = isObject(selector)
        ? isMatch(
            {
              [targetElementDirection]: targetElementSelector,
              ...selector,
            },
            templateData,
            dependencySelectorsGlobals
          )
        : isMatch(
            {
              [targetElementDirection]: targetElementSelector,
              [policyElementDirection]: ruleSelector,
            },
            templateData,
            dependencySelectorsGlobals
          );
      if (matchResult.isMatch) {
        return matchResult;
      }
    }
    return { isMatch: false };
  }
  return isMatch(
    {
      [targetElementDirection]: targetElementSelector,
      [policyElementDirection]: ruleSelector,
    },
    templateData,
    dependencySelectorsGlobals
  );
}

/**
 * Evaluates both deny and allow policy matches for a rule
 */
function evaluatePolicyMatches(
  rule: Record<string, unknown>,
  context: RuleMatchContext,
  isMatch: ReturnType<typeof createSafeMatcherFunction>,
  settings: SettingsNormalized
): { disallowPolicyMatches: PolicyMatch; allowPolicyMatches: PolicyMatch } {
  const {
    targetElementDirection,
    policyElementDirection,
    denyKeyToUse,
    capturedValuesTemplateData,
    dependencySelectorsGlobals,
    targetElementSelector,
  } = context;

  const templateData = settings.legacyTemplates
    ? capturedValuesTemplateData
    : {};

  const disallowPolicyMatches = rule[denyKeyToUse]
    ? matchSupportingMultipleSelectors(
        isMatch,
        targetElementSelector,
        targetElementDirection,
        policyElementDirection,
        rule[denyKeyToUse],
        templateData,
        dependencySelectorsGlobals
      )
    : { isMatch: false };

  const allowPolicyMatches =
    !disallowPolicyMatches.isMatch && rule.allow
      ? matchSupportingMultipleSelectors(
          isMatch,
          targetElementSelector,
          targetElementDirection,
          policyElementDirection,
          rule.allow,
          templateData,
          dependencySelectorsGlobals
        )
      : { isMatch: false };

  return { disallowPolicyMatches, allowPolicyMatches };
}

/**
 * Creates rule selectors data based on policy matches
 */
function createRuleSelectorsData(
  rule: Record<string, unknown>,
  context: RuleMatchContext,
  disallowPolicyMatches: PolicyMatch,
  allowPolicyMatches: PolicyMatch
) {
  const { targetElementDirection, policyElementDirection, denyKeyToUse } =
    context;

  const allowPolicyMatchesIsMatch = allowPolicyMatches.isMatch;
  const disallowPolicyMatchesIsMatch = disallowPolicyMatches.isMatch;

  const targetSelector =
    disallowPolicyMatchesIsMatch || allowPolicyMatchesIsMatch
      ? context.targetElementSelector
      : null;

  let policySelector: ElementsSelector | null = null;
  if (disallowPolicyMatchesIsMatch) {
    policySelector = rule[denyKeyToUse] as ElementsSelector;
  } else if (allowPolicyMatchesIsMatch) {
    policySelector = rule.allow as ElementsSelector;
  }

  let selectorsData: { isMatch: boolean } | null = null;
  if (disallowPolicyMatchesIsMatch) {
    selectorsData = disallowPolicyMatches;
  } else if (allowPolicyMatchesIsMatch) {
    selectorsData = allowPolicyMatches;
  }

  return {
    selectors: {
      [targetElementDirection]: targetSelector,
      ...(isObject(policySelector)
        ? { ...policySelector }
        : { [policyElementDirection]: policySelector }),
    },
    selectorsData,
  };
}

function ruleHasKindConstraint(
  rule: Record<string, unknown>,
  selectorsData: { dependency?: { kind?: unknown } | null } | null
): boolean {
  return !!rule.importKind || selectorsData?.dependency?.kind !== undefined;
}

export function getRulesResults(
  ruleOptions: ElementTypesRuleOptions,
  dependencyDescription: DependencyDescription,
  matcher: Matcher,
  settings: SettingsNormalized
) {
  if (!ruleOptions.rules) {
    return [];
  }

  const isMatch = createSafeMatcherFunction(dependencyDescription, matcher);

  return ruleOptions.rules.map((rule, index) => {
    const context = createRuleMatchContext(rule, dependencyDescription);
    const { disallowPolicyMatches, allowPolicyMatches } = evaluatePolicyMatches(
      rule,
      context,
      isMatch,
      settings
    );
    const selectorsMatching = createRuleSelectorsData(
      rule,
      context,
      disallowPolicyMatches,
      allowPolicyMatches
    );

    return {
      index,
      // @ts-expect-error Workaround to support both allow and disallow in the same entry point rule
      originalRuleIndex: rule.originalRuleIndex,
      selectorsMatching,
      ruleHasImportKind: ruleHasKindConstraint(
        rule,
        selectorsMatching.selectorsData as {
          dependency?: { kind?: unknown } | null;
        } | null
      ),
      allowPolicyMatches,
      denyPolicyMatches: disallowPolicyMatches,
    };
  });
}

/**
 * Determines the rule result based on policy matches
 */
function determineRuleResult(rulesResults: ReturnType<typeof getRulesResults>) {
  let isAllowed = false;
  let ruleIndexMatching: number | null = null;

  for (const ruleResult of rulesResults) {
    if (ruleResult.denyPolicyMatches.isMatch) {
      isAllowed = false;
      ruleIndexMatching = ruleResult.index;
    } else if (ruleResult.allowPolicyMatches.isMatch) {
      isAllowed = true;
      ruleIndexMatching = ruleResult.index;
    }
  }

  return { isAllowed, ruleIndexMatching };
}

/**
 * Gets the message for the rule, prioritizing rule-specific messages
 */
function getRuleMessage(
  ruleIndexMatching: number | null,
  ruleOptions: ElementTypesRuleOptions
): string | undefined {
  return (
    (ruleIndexMatching === null
      ? ruleOptions.message
      : ruleOptions.rules?.[ruleIndexMatching]?.message) || ruleOptions.message
  );
}

/**
 * Gets specifiers that match the rule for error reporting
 */
function getMatchingSpecifiers(
  ruleIndexMatching: number | null,
  rulesResults: ReturnType<typeof getRulesResults>,
  dependency: DependencyDescription
): string[] | null {
  if (ruleIndexMatching === null) return null;

  const selectorDataSpecifiers: string | string[] | undefined =
    // @ts-expect-error TODO: Align types. At this point, selectorsData.to must always be defined, because otherwise isMatch would be false
    rulesResults[ruleIndexMatching].selectorsMatching?.selectorsData?.dependency
      ?.specifiers;

  if (!selectorDataSpecifiers) {
    return null;
  }

  if (isString(selectorDataSpecifiers)) {
    const hasMatchingSpecifier = dependency.dependency.specifiers?.some(
      (specifier) => micromatch.isMatch(specifier, selectorDataSpecifiers)
    );
    return hasMatchingSpecifier ? [selectorDataSpecifiers] : null;
  }

  return selectorDataSpecifiers.filter((pattern) => {
    return dependency.dependency.specifiers?.some((specifier) =>
      micromatch.isMatch(specifier, pattern)
    );
  });
}

/**
 * Creates the rule report object
 */
function createRuleReport(
  ruleIndexMatching: number | null,
  message: string | undefined,
  dependency: DependencyDescription,
  rulesResults: ReturnType<typeof getRulesResults>
) {
  if (ruleIndexMatching === null) {
    return {
      message,
      isDefault: true,
      importKind: undefined,
      disallow: dependency.to,
      element: dependency.from,
      index: -1,
    };
  }

  let disallow =
    // @ts-expect-error TODO: Align types. At this point, selectorsMatching.selectors.to should always be defined, because otherwise isMatch would be false
    rulesResults[ruleIndexMatching].selectorsMatching?.selectors?.to;

  // Workaround: Support array of selectors in the "to" field.
  // @ts-expect-error TODO: Align types. At this point, selectorsMatching.selectors.to should always be defined, because otherwise isMatch would be false
  if (isArray(disallow) && disallow[0]?.to) {
    // @ts-expect-error TODO: Align types
    disallow = disallow.map((item) => item.to);
  }

  return {
    message,
    isDefault: false,
    importKind: rulesResults[ruleIndexMatching].ruleHasImportKind
      ? dependency.dependency.kind
      : undefined,
    disallow,
    // @ts-expect-error TODO: Align types. At this point, selectorsMatching.selectors.from should always be defined, because otherwise isMatch would be false
    element: rulesResults[ruleIndexMatching].selectorsMatching?.selectors?.from,
    index:
      rulesResults[ruleIndexMatching].originalRuleIndex ?? ruleIndexMatching,
  };
}

/**
 * Determines the report path for error reporting
 */
function getReportPath(
  ruleIndexMatching: number | null,
  rulesResults: ReturnType<typeof getRulesResults>,
  dependency: DependencyDescription
): string | null {
  return ruleIndexMatching === null ||
    // @ts-expect-error TODO: Align types. At this point, selectorsData should always be defined
    !rulesResults[ruleIndexMatching].selectorsMatching?.selectorsData?.to
      ?.internalPath
    ? null
    : dependency.to.internalPath;
}

// ---------------------------------------------------------------------------
// New simplified evaluation path
// Legacy functions above (getRulesResults, elementRulesAllowDependency, etc.)
// are kept for backward compatibility and will be removed in a future major version.
// ---------------------------------------------------------------------------

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
      /** Display index for error messages (accounts for the `originalRuleIndex` workaround). */
      ruleDisplayIndex: number | null;
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
  rules: Record<string, unknown>[],
  dep: DependencyDescription,
  matcher: Matcher,
  settings: SettingsNormalized
): EvaluateRulesResult {
  let allowed: boolean | null = null;
  let ruleIndex: number | null = null;
  let ruleDisplayIndex: number | null = null;
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

    // "deny" is an alias for "disallow" used in the entry-point rule workaround
    const denyKey = rule.deny ? "deny" : "disallow";

    let denyMatched = false;
    if (rule[denyKey]) {
      const denyMatch = evaluatePolicyEntries(
        rule[denyKey],
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
        ruleDisplayIndex =
          (rawRule.originalRuleIndex as number | undefined) ?? i;
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
        ruleDisplayIndex =
          (rawRule.originalRuleIndex as number | undefined) ?? i;
        matchResult = allowMatch;
      }
    }
  }

  if (allowed === true) return { allowed: true };
  return { allowed: false, ruleIndex, ruleDisplayIndex, matchResult };
}

/**
 * Resolves the custom error message for a violation, preferring the rule-specific message
 * over the global options message.
 */
function resolveCustomMessage(
  ruleIndex: number | null,
  ruleOptions: ElementTypesRuleOptions
): string | undefined {
  const ruleMessage =
    ruleIndex !== null
      ? ((ruleOptions.rules as Record<string, unknown>[] | undefined)?.[
          ruleIndex
        ]?.message as string | undefined)
      : undefined;
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
function buildErrorMessage({
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

export function elementRulesAllowDependency(
  dependency: DependencyDescription,
  settings: SettingsNormalized,
  ruleOptions: ElementTypesRuleOptions = {}
): RuleResult {
  const defaultIsAllowed = ruleOptions.default === "allow";
  const matcher = getElementsMatcher(settings);
  const rulesResults = getRulesResults(
    ruleOptions,
    dependency,
    matcher,
    settings
  );

  const { isAllowed, ruleIndexMatching } = determineRuleResult(rulesResults);
  const finalIsAllowed =
    ruleIndexMatching === null ? defaultIsAllowed : isAllowed;

  if (finalIsAllowed) {
    return {
      result: finalIsAllowed,
      ruleReport: null,
      report: null,
    };
  }

  const message = getRuleMessage(ruleIndexMatching, ruleOptions);
  const ruleReport = createRuleReport(
    ruleIndexMatching,
    message,
    dependency,
    rulesResults
  );
  const reportPath = getReportPath(ruleIndexMatching, rulesResults, dependency);

  const result: RuleResult = {
    result: finalIsAllowed,
    ruleReport,
    report: {
      specifiers:
        getMatchingSpecifiers(ruleIndexMatching, rulesResults, dependency) ||
        undefined,
      path: reportPath,
    },
  };

  return result;
}

/**
function errorMessage(ruleData: RuleResult, dependency: DependencyDescription) {
  const ruleReport = ruleData.ruleReport;

  if (!ruleReport) {
    return `No detailed rule report available. This is likely a bug in ${PLUGIN_NAME}. Please report it at ${PLUGIN_ISSUES_URL}`;
  }

  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allowing this dependency was found. File is ${elementMessage(
      dependency.from
    )}. Dependency is ${elementMessage(dependency.to)}`;
  }
  return `Importing ${dependencyImportKindMessage(
    ruleReport.importKind,
    dependency
  )}${ruleElementMessage(
    ruleReport.disallow,
    dependency.from.captured
  )} is not allowed in ${ruleElementMessage(
    ruleReport.element,
    dependency.from.captured
  )}. Disallowed in rule ${ruleReport.index + 1}`;
} **/

export default dependencyRule<ElementTypesRuleOptions>(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
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

    // TODO: Remove these checks when allowing to use more selectors in ESLint rules
    if (
      !isIgnoredElement(dependency.to) &&
      (checkAllOrigins || isLocalElement(dependency.to)) &&
      (checkUnknownLocals || !isUnknownLocalElement(dependency.to)) &&
      (checkInternals || !isInternalDependency(dependency))
    ) {
      const rules = (options?.rules ?? []) as Record<string, unknown>[];
      const matcher = getElementsMatcher(settings);
      const defaultAllowed = options?.default === "allow";
      const result = evaluateRules(rules, dependency, matcher, settings);
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
            ruleIndex: result.ruleDisplayIndex,
            customMessage: resolveCustomMessage(
              result.ruleIndex,
              options ?? {}
            ),
            dependency,
          }),
          node,
        });
      }
    }
  }
);
