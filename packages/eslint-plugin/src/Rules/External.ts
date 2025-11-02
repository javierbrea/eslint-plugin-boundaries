import {
  isExternalDependencyElement,
  isCoreDependencyElement,
  ELEMENT_ORIGINS_MAP,
} from "@boundaries/elements";
import type {
  DependencyDescription,
  ExternalLibrariesSelector,
} from "@boundaries/elements";

import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyUsageKindMessage,
} from "../Messages";
import type {
  ExternalRuleOptions,
  RuleResult,
  RuleResultReport,
} from "../Settings";
import {
  rulesOptionsSchema,
  SETTINGS,
  PLUGIN_NAME,
  PLUGIN_ISSUES_URL,
} from "../Settings";
import { isString, isArray } from "../Support";

import { elementRulesAllowDependency } from "./ElementTypes";
import { dependencyRule } from "./Support";

const { RULE_EXTERNAL } = SETTINGS;

function getErrorReportMessage(report: RuleResultReport) {
  if (report.path) {
    return report.path;
  }
  return report.specifiers && report.specifiers.length > 0
    ? report.specifiers.join(", ")
    : undefined;
}

function errorMessage(
  ruleData: RuleResult,
  dependency: DependencyDescription
): string {
  const ruleReport = ruleData.ruleReport;
  if (!ruleReport) {
    return `No detailed rule report available. This is likely a bug in ${PLUGIN_NAME}. Please report it at ${PLUGIN_ISSUES_URL}`;
  }

  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, dependency, {
      specifiers:
        ruleData.report?.specifiers && ruleData.report?.specifiers.length > 0
          ? ruleData.report?.specifiers?.join(", ")
          : undefined,
      path: ruleData.report?.path,
    });
  }
  if (ruleReport.isDefault) {
    return `No rule allows the usage of external module '${
      // @ts-expect-error could not be defined. TODO: I have to decide whether to unify properties in all elements, or to use type guards
      dependency.to.baseSource
    }' in elements ${elementMessage(dependency.from)}`;
  }

  const fileReport = `is not allowed in ${ruleElementMessage(
    ruleReport.element,
    dependency.from.capturedValues
  )}. Disallowed in rule ${ruleReport.index + 1}`;

  if (
    (ruleData.report?.specifiers && ruleData.report?.specifiers.length > 0) ||
    ruleData.report?.path
  ) {
    return `Usage of ${dependencyUsageKindMessage(
      ruleReport.importKind,
      dependency
    )}'${getErrorReportMessage(ruleData.report)}' from external module '${
      // @ts-expect-error could not be defined. TODO: I have to decide whether to unify properties in all elements, or to use type guards
      dependency.to.baseSource
    }' ${fileReport}`;
  }
  return `Usage of ${dependencyUsageKindMessage(
    ruleReport.importKind,
    dependency,
    {
      suffix: " from ",
    }
    // @ts-expect-error could not be defined. TODO: I have to decide whether to unify properties in all elements, or to use type guards
  )}external module '${dependency.to.baseSource}' ${fileReport}`;
}

function modifySelectors(selectors: ExternalLibrariesSelector): {
  baseSource?: string | string[];
  specifiers?: string | string[];
  internalPath?: string | string[];
  origin: string[];
}[] {
  const originsToMatch = [
    ELEMENT_ORIGINS_MAP.EXTERNAL,
    ELEMENT_ORIGINS_MAP.CORE,
  ];
  if (isString(selectors)) {
    return [{ baseSource: selectors, origin: originsToMatch }];
  }
  return selectors.map((selector) => {
    if (isArray(selector)) {
      return {
        origin: originsToMatch,
        baseSource: selector[0],
        specifiers: selector[1].specifiers,
        internalPath: selector[1].path,
      };
    }
    return {
      origin: originsToMatch,
      baseSource: selector as string,
    };
  });
}

export default dependencyRule<ExternalRuleOptions>(
  {
    ruleName: RULE_EXTERNAL,
    description: `Check allowed external dependencies by element type`,
    schema: rulesOptionsSchema({
      targetMatcherOptions: {
        type: "object",
        properties: {
          specifiers: {
            type: "array",
            items: {
              type: "string",
            },
          },
          path: {
            oneOf: [
              {
                type: "string",
              },
              {
                type: "array",
                items: {
                  type: "string",
                },
              },
            ],
          },
        },
        additionalProperties: false,
      },
    }),
  },
  function ({ dependency, node, context, options }) {
    if (
      isExternalDependencyElement(dependency.to) ||
      isCoreDependencyElement(dependency.to)
    ) {
      const adaptedRuleOptions = {
        ...options,
        rules:
          options && options.rules
            ? options.rules.map((rule) => ({
                ...rule,
                allow: rule.allow && modifySelectors(rule.allow),
                disallow: rule.disallow && modifySelectors(rule.disallow),
              }))
            : [],
      };

      const ruleData = elementRulesAllowDependency(
        dependency,
        adaptedRuleOptions,
        context
      );

      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, dependency),
          node: node,
        });
      }
    }
  },
  {
    validateRules: { onlyMainKey: true },
  }
);
