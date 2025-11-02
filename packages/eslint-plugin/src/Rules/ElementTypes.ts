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
} from "@boundaries/elements";
import type { Rule } from "eslint";
import micromatch from "micromatch";

import { getElementsMatcher } from "../Elements";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyImportKindMessage,
} from "../Messages";
import type { ElementTypesRuleOptions, RuleResult } from "../Settings";
import {
  PLUGIN_NAME,
  PLUGIN_ISSUES_URL,
  SETTINGS,
  rulesOptionsSchema,
} from "../Settings";
import { isString } from "../Support";

import { dependencyRule } from "./Support";

const { RULE_ELEMENT_TYPES } = SETTINGS;

export function getRulesResults(
  ruleOptions: ElementTypesRuleOptions,
  dependencyDescription: DependencyDescription,
  matcher: Matcher
) {
  if (!ruleOptions.rules) {
    return [];
  }

  const isMatch = (
    dependencySelector: DependencySelector,
    extraTemplateData: TemplateData,
    dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals
  ) => {
    // Just in case selectors are invalid, we catch errors here to avoid breaking the whole rule evaluation. It should not happen due to options schema validation.
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
      // TODO: Use debug logger instead of console.error
      console.error("Error occurred while matching dependency:", error);
      return {
        isMatch: false,
      };
    }
  };

  return ruleOptions.rules.map((rule, index) => {
    const targetElementDirection = rule.from ? "from" : "to"; // Set priority when both from and to are defined, which should not happen due to schema validation
    const policyElementDirection = rule.from ? "to" : "from";
    // @ts-expect-error TODO: Support "deny" in rules
    const denyKeyToUse = rule.deny ? "deny" : "disallow"; // Support new key "deny" and also deprecated "disallow" for backward compatibility

    const capturedValuesTemplateData =
      targetElementDirection === "from"
        ? {
            ...dependencyDescription.from.capturedValues,
            from: dependencyDescription.from.capturedValues,
            to: dependencyDescription.to.capturedValues,
          }
        : {
            ...dependencyDescription.to.capturedValues,
            from: dependencyDescription.from.capturedValues, // TODO: Add an option to use new templates instead of old ones. In that case, we shouldn't pass any value here. Only default properties passed in Elements should be used.
            to: dependencyDescription.to.capturedValues,
          };

    // TODO: Deprecate importKind at first level of rule and only support it inside selectors
    const dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals =
      rule.importKind
        ? {
            kind: rule.importKind,
          }
        : {};

    const targetElementSelector = rule[targetElementDirection];

    // @ts-expect-error TODO: Support "deny" in rules
    const disallowPolicyMatches = rule[denyKeyToUse]
      ? isMatch(
          {
            [targetElementDirection]: targetElementSelector,
            // @ts-expect-error TODO: Support "deny" in rules
            [policyElementDirection]: rule[denyKeyToUse],
          },
          capturedValuesTemplateData,
          dependencySelectorsGlobals
        )
      : {
          isMatch: false,
        };
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
        : {
            isMatch: false,
          };

    const result = {
      index,
      // @ts-expect-error Workaround to support both allow and disallow in the same entry point rule
      originalRuleIndex: rule.originalRuleIndex,
      selectorsMatching: {
        selectors: {
          [targetElementDirection]:
            disallowPolicyMatches.isMatch || allowPolicyMatches.isMatch
              ? targetElementSelector
              : null,
          [policyElementDirection]: disallowPolicyMatches.isMatch
            ? // @ts-expect-error TODO: Support "deny" in rules
              rule[denyKeyToUse]
            : allowPolicyMatches.isMatch
              ? rule.allow
              : null,
        },
        selectorsData: disallowPolicyMatches.isMatch
          ? disallowPolicyMatches
          : allowPolicyMatches.isMatch
            ? allowPolicyMatches
            : null,
      },
      ruleHasImportKind: !!rule.importKind,
      allowPolicyMatches: allowPolicyMatches,
      denyPolicyMatches: disallowPolicyMatches,
    };

    return result;
  });
}

export function elementRulesAllowDependency(
  dependency: DependencyDescription,
  ruleOptions: ElementTypesRuleOptions = {},
  context: Rule.RuleContext
): RuleResult {
  let isAllowed = ruleOptions.default === "allow";
  let ruleIndexMatching: number | null = null;
  const matcher = getElementsMatcher(context);
  const rulesResults = getRulesResults(ruleOptions, dependency, matcher);

  for (const ruleResult of rulesResults) {
    if (ruleResult.denyPolicyMatches.isMatch) {
      isAllowed = false;
      ruleIndexMatching = ruleResult.index;
    } else if (ruleResult.allowPolicyMatches.isMatch) {
      isAllowed = true;
      ruleIndexMatching = ruleResult.index;
    }
  }

  const message =
    (ruleIndexMatching !== null
      ? ruleOptions.rules?.[ruleIndexMatching]?.message
      : ruleOptions.message) || ruleOptions.message;

  const getSpecifiersMatching = () => {
    if (ruleIndexMatching === null) return null;
    const selectorDataSpecifiers: string | string[] | undefined =
      // @ts-expect-error TODO: Align types. At this point, selectorsData.to must always be defined, because otherwise isMatch would be false
      rulesResults[ruleIndexMatching].selectorsMatching?.selectorsData?.to
        ?.specifiers;

    if (!selectorDataSpecifiers) {
      return null;
    }

    if (isString(selectorDataSpecifiers)) {
      return dependency.dependency.specifiers?.some((specifier) =>
        micromatch.isMatch(specifier, selectorDataSpecifiers)
      )
        ? [selectorDataSpecifiers]
        : null;
    }

    return selectorDataSpecifiers.filter((pattern) => {
      return dependency.dependency.specifiers?.some((specifier) =>
        micromatch.isMatch(specifier, pattern)
      );
    });
  };

  const result: RuleResult = {
    result: isAllowed,
    ruleReport:
      ruleIndexMatching !== null
        ? {
            message,
            isDefault: ruleIndexMatching === null,
            importKind: rulesResults[ruleIndexMatching].ruleHasImportKind
              ? dependency.dependency.kind
              : undefined,
            disallow:
              rulesResults[ruleIndexMatching].selectorsMatching?.selectors.to,
            element:
              rulesResults[ruleIndexMatching].selectorsMatching?.selectors.from,
            index:
              rulesResults[ruleIndexMatching].originalRuleIndex ??
              ruleIndexMatching,
          }
        : {
            message,
            isDefault: true,
            importKind: undefined,
            disallow: dependency.to,
            element: dependency.from,
            index: -1,
          },
    // TODO: Improve report data. This was added to support custom error messages in external rule only. It returns data about specifiers and path that matched the rule, for printing in the error message.
    report: {
      // GET specifiers matching the rule, not all specifiers, because message is printing only those in the dependency that matched the rule
      specifiers: getSpecifiersMatching() || undefined,
      path:
        ruleIndexMatching !== null &&
        // @ts-expect-error TODO: Align types. At this point, selectorsData should always be defined
        rulesResults[ruleIndexMatching].selectorsMatching?.selectorsData?.to
          ?.internalPath
          ? // @ts-expect-error TODO: Align types. Ignored elements never reach this point
            dependency.to.internalPath
          : undefined,
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
    dependency.from.capturedValues
  )} is not allowed in ${ruleElementMessage(
    ruleReport.element,
    dependency.from.capturedValues
  )}. Disallowed in rule ${ruleReport.index + 1}`;
}

export default dependencyRule<ElementTypesRuleOptions>(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  },
  function ({ dependency, node, context, options }) {
    // TODO: Remove these checks when allowing to use more selectors in ESLint rules
    if (
      isLocalElement(dependency.to) &&
      !isIgnoredElement(dependency.to) &&
      !isUnknownLocalElement(dependency.to) &&
      !isInternalDependency(dependency)
    ) {
      const ruleData = elementRulesAllowDependency(
        dependency,
        options,
        context
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
