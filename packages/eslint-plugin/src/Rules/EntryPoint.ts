import {
  normalizeElementsSelector,
  DEPENDENCY_RELATIONSHIPS_MAP,
} from "@boundaries/elements";

import {
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
  warnMigrationToDependencies,
} from "../Settings";
import type {
  EntryPointRuleOptions,
  EntryPointRule,
  DependenciesRule,
} from "../Shared";
import { SETTINGS, RULE_NAMES_MAP } from "../Shared";

import { evaluateRulesAndReport } from "./Dependencies";
import { dependencyRule } from "./Support";

const { RULE_ENTRY_POINT } = SETTINGS;

/**
 * Adapts legacy template placeholders from `target` to `to` notation.
 *
 * @param templates - Legacy templates from rule options.
 * @returns Normalized templates or `undefined` when not provided.
 */
function modifyLegacyTemplates(templates: string | string[]): string[] {
  const templatesArray = Array.isArray(templates) ? templates : [templates];
  return templatesArray.map((template) =>
    template.replaceAll("${target.", "${to.")
  );
}

/**
 * Converts `entry-point` legacy rules to `dependencies` rule shape.
 *
 * @param rules - Entry-point rules as defined by user configuration.
 * @returns Equivalent dependencies rules for shared evaluator.
 */
function transformToDependenciesRules(
  rules: EntryPointRule[]
): DependenciesRule[] {
  const newRules: DependenciesRule[] = [];

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
      isLegacy: true,
    }),
  },
  function ({ dependency, node, context, settings, options }) {
    warnMigrationToDependencies(RULE_NAMES_MAP.ENTRY_POINT);
    // Validate and warn about legacy selector syntax
    validateAndWarnRuleOptions(options, "target", RULE_NAMES_MAP.ENTRY_POINT);

    if (
      !dependency.to.isIgnored &&
      dependency.to.type &&
      dependency.dependency.relationship.to !==
        DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL
    ) {
      const rules = transformToDependenciesRules(options?.rules ?? []);
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
