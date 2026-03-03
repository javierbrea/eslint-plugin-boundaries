import {
  normalizeElementsSelector,
  DEPENDENCY_RELATIONSHIPS_MAP,
} from "@boundaries/elements";

import type {
  EntryPointRuleOptions,
  EntryPointRule,
  ElementTypesRule,
} from "../Settings";
import {
  SETTINGS,
  RULE_NAMES_MAP,
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
} from "../Settings";

import { evaluateRulesAndReport } from "./ElementTypes";
import { dependencyRule } from "./Support";

const { RULE_ENTRY_POINT } = SETTINGS;

function modifyLegacyTemplates(
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

function transformToElementTypesRules(
  rules: EntryPointRule[]
): ElementTypesRule[] {
  const newRules: ElementTypesRule[] = [];

  for (const rule of rules) {
    const newTargets = normalizeElementsSelector(rule.target);

    for (const target of newTargets) {
      newRules.push({
        to: target,
        allow: rule.allow
          ? { to: { internalPath: modifyLegacyTemplates(rule.allow) } }
          : undefined,
        disallow: rule.disallow
          ? { to: { internalPath: modifyLegacyTemplates(rule.disallow) } }
          : undefined,
        importKind: rule.importKind,
        message: rule.message,
      });
    }
  }
  return newRules;
}

export default dependencyRule<EntryPointRuleOptions>(
  {
    ruleName: RULE_ENTRY_POINT,
    description: `Check elements entry point`,
    schema: rulesOptionsSchema({
      rulesMainKey: "target",
    }),
  },
  function ({ dependency, node, context, settings, options }) {
    // Validate and warn about legacy selector syntax
    validateAndWarnRuleOptions(options, "target", RULE_NAMES_MAP.ENTRY_POINT);

    if (
      !dependency.to.isIgnored &&
      dependency.to.type &&
      dependency.dependency.relationship.to !==
        DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL
    ) {
      const rules = transformToElementTypesRules(options?.rules ?? []);
      evaluateRulesAndReport({
        rules,
        settings,
        context,
        node,
        options,
        dependency,
      });
    }
  },
  {
    validateRules: { onlyMainKey: true, mainKey: "target" },
  }
);
