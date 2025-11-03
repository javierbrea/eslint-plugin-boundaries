import type { DependencyDescription } from "@boundaries/elements";
import {
  normalizeElementsSelector,
  DEPENDENCY_RELATIONSHIPS_MAP,
} from "@boundaries/elements";

import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyUsageKindMessage,
} from "../Messages";
import type {
  EntryPointRuleOptions,
  RuleResult,
  EntryPointRule,
  ElementTypesRule,
} from "../Settings";
import {
  PLUGIN_NAME,
  PLUGIN_ISSUES_URL,
  SETTINGS,
  rulesOptionsSchema,
} from "../Settings";

import { elementRulesAllowDependency } from "./ElementTypes";
import { dependencyRule } from "./Support";

const { RULE_ENTRY_POINT } = SETTINGS;

function errorMessage(ruleData: RuleResult, dependency: DependencyDescription) {
  const ruleReport = ruleData.ruleReport;
  if (!ruleReport) {
    return `No detailed rule report available. This is likely a bug in ${PLUGIN_NAME}. Please report it at ${PLUGIN_ISSUES_URL}`;
  }

  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allows the entry point '${
      dependency.to.internalPath
    }' in dependencies ${elementMessage(dependency.to)}`;
  }
  return `The entry point '${dependency.to.internalPath}' is not allowed in ${ruleElementMessage(
    ruleReport.disallow,
    dependency.to.capturedValues
  )}${dependencyUsageKindMessage(ruleReport.importKind, dependency, {
    prefix: " when importing ",
    suffix: "",
  })}. Disallowed in rule ${ruleReport.index + 1}`;
}

function modifyTemplates(
  templates: string | string[] | undefined
): string[] | undefined {
  if (!templates) {
    return undefined;
  }
  const templatesArray = Array.isArray(templates) ? templates : [templates];
  return templatesArray.map((template) =>
    template.replaceAll("${target.", "${to.")
  );
}

function modifyRules(rules: EntryPointRule[]): ElementTypesRule[] {
  const newRules: ElementTypesRule[] = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const newTargets = normalizeElementsSelector(rule.target);

    const ruleHasDisallow = !!rule.disallow;
    const ruleHasAllow = !!rule.allow;
    let internalPathPatterns: string[] | undefined = undefined;
    let allowPattern: string[] | undefined = undefined;
    let disallowPattern: string[] | undefined = undefined;

    if (ruleHasDisallow && ruleHasAllow) {
      // Workaround to support both allow and disallow in the same rule
      const toAdd = [
        {
          to: newTargets.map((target) => {
            return {
              ...target,
              internalPath: modifyTemplates(rule.allow)!,
            };
          }),
          allow: ["*"],
          importKind: rule.importKind,
          message: rule.message,
          originalRuleIndex: i,
        },
        {
          to: newTargets.map((target) => {
            return {
              ...target,
              internalPath: modifyTemplates(rule.disallow)!,
            };
          }),
          disallow: ["*"],
          importKind: rule.importKind,
          message: rule.message,
          originalRuleIndex: i,
        },
      ];
      newRules.push(...toAdd);
    }

    if (ruleHasDisallow) {
      internalPathPatterns = modifyTemplates(rule.disallow);
      disallowPattern = ["*"];
    } else if (ruleHasAllow) {
      internalPathPatterns = modifyTemplates(rule.allow);
      allowPattern = ["*"];
    }

    newRules.push({
      to: newTargets.map((target) => {
        return {
          ...target,
          internalPath: internalPathPatterns,
        };
      }),
      allow: allowPattern,
      disallow: disallowPattern,
      importKind: rule.importKind,
      message: rule.message,
      // @ts-expect-error Workaround to support both allow and disallow in the same entry point rule
      originalRuleIndex: i,
    });
  }
  return newRules;
}

export default dependencyRule<EntryPointRuleOptions>(
  {
    ruleName: RULE_ENTRY_POINT,
    description: `Check entry point used for each element type`,
    schema: rulesOptionsSchema({
      rulesMainKey: "target",
    }),
  },
  function ({ dependency, node, context, options }) {
    if (
      !dependency.to.isIgnored &&
      dependency.to.type &&
      dependency.dependency.relationship.to !==
        DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL
    ) {
      const adaptedRuleOptions = {
        ...options,
        rules: options && options.rules ? modifyRules(options.rules) : [],
      };

      const ruleData = elementRulesAllowDependency(
        dependency,
        context,
        adaptedRuleOptions
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
    validateRules: { onlyMainKey: true, mainKey: "target" },
  }
);
