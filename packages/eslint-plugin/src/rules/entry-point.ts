import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo } from "../constants/ElementsInfo.types";
import type {
  EntryPointRuleOptions,
  RuleResult,
  EntryPointRule,
  ElementTypesRule,
} from "../constants/Options.types";
import { PLUGIN_NAME, PLUGIN_ISSUES_URL } from "../constants/plugin";
import { SETTINGS } from "../constants/settings";
import { elements } from "../elements/elements";
import {
  customErrorMessage,
  ruleElementMessage,
  elementMessage,
  dependencyUsageKindMessage,
} from "../helpers/messages";
import { rulesOptionsSchema } from "../helpers/validations";
import dependencyRule from "../rules-factories/dependency-rule";

import { elementRulesAllowDependency } from "./element-types";

const { RULE_ENTRY_POINT } = SETTINGS;

function errorMessage(
  ruleData: RuleResult,
  file: FileInfo,
  dependency: DependencyInfo
) {
  const ruleReport = ruleData.ruleReport;
  if (!ruleReport) {
    return `No detailed rule report available. This is likely a bug in ${PLUGIN_NAME}. Please report it at ${PLUGIN_ISSUES_URL}`;
  }

  if (ruleReport.message) {
    return customErrorMessage(ruleReport.message, file, dependency);
  }
  if (ruleReport.isDefault) {
    return `No rule allows the entry point '${
      dependency.internalPath
    }' in dependencies ${elementMessage(dependency)}`;
  }
  return `The entry point '${dependency.internalPath}' is not allowed in ${ruleElementMessage(
    ruleReport.disallow,
    dependency.capturedValues
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
    template.replace(/\${target\./g, "${to.")
  );
}

function modifyRules(rules: EntryPointRule[]): ElementTypesRule[] {
  const newRules: ElementTypesRule[] = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const newTargets = elements.normalizeElementsSelector(rule.target);

    const ruleHasDisallow = !!rule.disallow;
    const ruleHasAllow = !!rule.allow;
    let internalPathPatterns: string[] | undefined = undefined;
    let allowPattern: string[] | undefined = undefined;
    let disallowPattern: string[] | undefined = undefined;

    if (ruleHasDisallow && ruleHasAllow) {
      // Workaround to support both allow and disallow in the same rule
      newRules.push({
        to: newTargets.map((target) => {
          return {
            ...target,
            internalPath: modifyTemplates(rule.allow)!,
          };
        }),
        allow: ["*"],
        importKind: rule.importKind,
        message: rule.message,
        // @ts-expect-error Workaround to support both allow and disallow in the same entry point rule
        originalRuleIndex: i,
      });

      newRules.push({
        to: newTargets.map((target) => {
          return {
            ...target,
            internalPath: modifyTemplates(rule.disallow)!,
          };
        }),
        disallow: ["*"],
        importKind: rule.importKind,
        message: rule.message,
        // @ts-expect-error Workaround to support both allow and disallow in the same entry point rule
        originalRuleIndex: i,
      });
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
  function ({ dependency, file, node, context, options }) {
    if (!dependency.isIgnored && dependency.type && !dependency.isInternal) {
      const adaptedRuleOptions = {
        ...options,
        rules: options && options.rules ? modifyRules(options.rules) : [],
      };

      const ruleData = elementRulesAllowDependency(
        dependency.originalDescription,
        adaptedRuleOptions
      );
      if (!ruleData.result) {
        context.report({
          message: errorMessage(ruleData, file, dependency),
          node: node,
        });
      }
    }
  },
  {
    // TODO: Define main keys in a map
    validateRules: { onlyMainKey: true, mainKey: "target" },
  }
);
