import type {
  DependencyDescription,
  DependencySelector,
  TemplateData,
  MatcherOptionsDependencySelectorsGlobals,
} from "@boundaries/elements";
import {
  isIgnoredElement,
  isInternalDependency,
  isLocalElement,
  isUnknownLocalElement,
} from "@boundaries/elements";

import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo } from "../constants/ElementsInfo.types";
import type {
  ElementTypesRuleOptions,
  RuleResult,
} from "../constants/Options.types";
import { PLUGIN_NAME, PLUGIN_ISSUES_URL } from "../constants/plugin";
import { SETTINGS } from "../constants/settings";
import { elements } from "../elements/elements";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyImportKindMessage,
} from "../helpers/messages";
import { rulesOptionsSchema } from "../helpers/validations";
import dependencyRule from "../rules-factories/dependency-rule";

const { RULE_ELEMENT_TYPES } = SETTINGS;

function getRulesResults(
  ruleOptions: ElementTypesRuleOptions,
  dependencyDescription: DependencyDescription,
) {
  if (!ruleOptions.rules) {
    return [];
  }

  const isMatch = (
    dependencySelector: DependencySelector,
    extraTemplateData: TemplateData,
    dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals,
  ) => {
    // Just in case selectors are invalid, we catch errors here to avoid breaking the whole rule evaluation. It should not happen due to options schema validation.
    try {
      return elements.isDependencyMatch(
        dependencyDescription,
        dependencySelector,
        {
          extraTemplateData,
          dependencySelectorsGlobals,
        },
      );
    } catch (error) {
      // TODO: Use debug logger instead of console.error
      console.error("Error occurred while matching dependency:", error);
      return false;
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

    const dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals =
      rule.importKind
        ? {
            kind: rule.importKind,
          }
        : {};

    // @ts-expect-error TODO: Support "to" rules
    const targetElementSelector = rule[targetElementDirection];

    // @ts-expect-error TODO: Support "deny" in rules
    const disallowPolicyMatches = rule[denyKeyToUse]
      ? isMatch(
          {
            [targetElementDirection]: targetElementSelector,
            // @ts-expect-error TODO: Support "deny" in rules
            [policyElementDirection]: rule[denyKeyToUse],
            // TODO: Pass template data
          },
          capturedValuesTemplateData,
          dependencySelectorsGlobals,
        )
      : null;
    const allowPolicyMatches =
      !disallowPolicyMatches && rule.allow
        ? isMatch(
            {
              [targetElementDirection]: targetElementSelector,
              [policyElementDirection]: rule.allow,
              // TODO: Pass template data
            },
            capturedValuesTemplateData,
            dependencySelectorsGlobals,
          )
        : null;

    return {
      index,
      [`${targetElementDirection}SelectorMatching`]:
        disallowPolicyMatches || allowPolicyMatches
          ? targetElementSelector
          : null,
      [`${policyElementDirection}SelectorMatching`]: disallowPolicyMatches
        ? // @ts-expect-error TODO: Support "deny" in rules
          rule[denyKeyToUse]
        : allowPolicyMatches
          ? rule.allow
          : null,
      ruleHasImportKind: !!rule.importKind, // NOTE: This impacts in message generation. TODO: Check also if the selector has importKind defined
      allowPolicyMatches: allowPolicyMatches,
      denyPolicyMatches: disallowPolicyMatches,
    };
  });
}

function elementRulesAllowDependency(
  dependency: DependencyDescription,
  ruleOptions: ElementTypesRuleOptions = {},
): RuleResult {
  let isAllowed = ruleOptions.default === "allow";
  let ruleIndexMatching: number | null = null;
  const rulesResults = getRulesResults(ruleOptions, dependency);

  for (const ruleResult of rulesResults) {
    if (ruleResult.denyPolicyMatches === true) {
      isAllowed = false;
      ruleIndexMatching = ruleResult.index;
      break;
    }
    if (ruleResult.allowPolicyMatches === true) {
      isAllowed = true;
      ruleIndexMatching = ruleResult.index;
      break;
    }
  }

  const message =
    (ruleIndexMatching !== null
      ? ruleOptions.rules?.[ruleIndexMatching]?.message
      : ruleOptions.message) || ruleOptions.message;

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
            disallow: rulesResults[ruleIndexMatching].toSelectorMatching,
            element: rulesResults[ruleIndexMatching].fromSelectorMatching,
            index: ruleIndexMatching,
          }
        : {
            message,
            isDefault: true,
            importKind: undefined,
            disallow: dependency.to,
            element: dependency.from,
            index: -1,
          },
    report: {
      // TODO: Use null instead of undefined when possible
      specifiers: dependency.dependency.specifiers || undefined,
      // @ts-expect-error Align types Ignored dependencies never reach this point
      path: dependency.to.internalPath,
    },
  };
  return result;
}

function errorMessage(
  ruleData: RuleResult,
  file: FileInfo,
  dependency: DependencyInfo,
) {
  const ruleReport = ruleData.ruleReport;

  if (!ruleReport) {
    return `No detailed rule report available. This is likely a bug in ${PLUGIN_NAME}. Please report it at ${PLUGIN_ISSUES_URL}`;
  }

  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, file, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allowing this dependency was found. File is ${elementMessage(
      file,
    )}. Dependency is ${elementMessage(dependency)}`;
  }
  return `Importing ${dependencyImportKindMessage(
    ruleReport.importKind,
    dependency,
  )}${ruleElementMessage(
    ruleReport.disallow,
    file.capturedValues,
  )} is not allowed in ${ruleElementMessage(
    ruleReport.element,
    file.capturedValues,
  )}. Disallowed in rule ${ruleReport.index + 1}`;
}

export default dependencyRule<ElementTypesRuleOptions>(
  {
    ruleName: RULE_ELEMENT_TYPES,
    description: `Check allowed dependencies between element types`,
    schema: rulesOptionsSchema(),
  },
  function ({ dependency, file, node, context, options }) {
    if (
      isLocalElement(dependency.originalDescription.to) &&
      !isIgnoredElement(dependency.originalDescription.to) &&
      !isUnknownLocalElement(dependency.originalDescription.to) &&
      !isInternalDependency(dependency.originalDescription)
    ) {
      const ruleData = elementRulesAllowDependency(
        dependency.originalDescription,
        options,
      );
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node,
        });
      }
    }
  },
);
