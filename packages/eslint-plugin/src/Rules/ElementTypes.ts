import {
  isIgnoredElement,
  isInternalDependency,
  isLocalElement,
  isUnknownLocalElement,
} from "@boundaries/elements";
import type {
  DependencyDescription,
  DependencySelector,
  TemplateData,
  MatcherOptionsDependencySelectorsGlobals,
  Matcher,
  ElementsSelector,
} from "@boundaries/elements";
import micromatch from "micromatch";

import { getElementsMatcher } from "../Elements";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyImportKindMessage,
} from "../Messages";
import type {
  ElementTypesRuleOptions,
  RuleResult,
  SettingsNormalized,
} from "../Settings";
import {
  PLUGIN_NAME,
  PLUGIN_ISSUES_URL,
  SETTINGS,
  rulesOptionsSchema,
} from "../Settings";
import { warnOnce, isString } from "../Support";

import { dependencyRule } from "./Support";

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
  ): PolicyMatch => {
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
      warnOnce(`Error occurred while matching dependency: ${String(error)}`);
      return { isMatch: false };
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

/**
 * Evaluates both deny and allow policy matches for a rule
 */
function evaluatePolicyMatches(
  rule: Record<string, unknown>,
  context: RuleMatchContext,
  isMatch: ReturnType<typeof createSafeMatcherFunction>
): { disallowPolicyMatches: PolicyMatch; allowPolicyMatches: PolicyMatch } {
  const {
    targetElementDirection,
    policyElementDirection,
    denyKeyToUse,
    capturedValuesTemplateData,
    dependencySelectorsGlobals,
    targetElementSelector,
  } = context;

  const disallowPolicyMatches = rule[denyKeyToUse]
    ? isMatch(
        {
          [targetElementDirection]: targetElementSelector,
          [policyElementDirection]: rule[denyKeyToUse],
        },
        capturedValuesTemplateData,
        dependencySelectorsGlobals
      )
    : { isMatch: false };

  const allowPolicyMatches =
    !disallowPolicyMatches.isMatch && rule.allow
      ? isMatch(
          {
            [targetElementDirection]: targetElementSelector,
            [policyElementDirection]: rule.allow,
          },
          capturedValuesTemplateData,
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
      [policyElementDirection]: policySelector,
    },
    selectorsData,
  };
}

export function getRulesResults(
  ruleOptions: ElementTypesRuleOptions,
  dependencyDescription: DependencyDescription,
  matcher: Matcher
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
      isMatch
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
      ruleHasImportKind: !!rule.importKind,
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
    rulesResults[ruleIndexMatching].selectorsMatching?.selectorsData?.to
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

  return {
    message,
    isDefault: false,
    importKind: rulesResults[ruleIndexMatching].ruleHasImportKind
      ? dependency.dependency.kind
      : undefined,
    disallow: rulesResults[ruleIndexMatching].selectorsMatching?.selectors.to,
    element: rulesResults[ruleIndexMatching].selectorsMatching?.selectors.from,
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

export function elementRulesAllowDependency(
  dependency: DependencyDescription,
  settings: SettingsNormalized,
  ruleOptions: ElementTypesRuleOptions = {}
): RuleResult {
  const defaultIsAllowed = ruleOptions.default === "allow";
  const matcher = getElementsMatcher(settings);
  const rulesResults = getRulesResults(ruleOptions, dependency, matcher);

  const { isAllowed, ruleIndexMatching } = determineRuleResult(rulesResults);
  const finalIsAllowed =
    ruleIndexMatching === null ? defaultIsAllowed : isAllowed;

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
    // @ts-expect-error Temporary workaround for RuleResult type until types are aligned
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
}

export default dependencyRule<ElementTypesRuleOptions>(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  },
  function ({ dependency, node, context, settings, options }) {
    // TODO: Remove these checks when allowing to use more selectors in ESLint rules
    if (
      isLocalElement(dependency.to) &&
      !isIgnoredElement(dependency.to) &&
      !isUnknownLocalElement(dependency.to) &&
      !isInternalDependency(dependency)
    ) {
      const ruleData = elementRulesAllowDependency(
        dependency,
        settings,
        options
      );
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, dependency),
          node,
        });
      }
    }
  }
);
