import {
  normalizeEntitySelector,
  DEPENDENCY_RELATIONSHIPS_MAP,
} from "@boundaries/elements";

import {
  rulesOptionsSchema,
  warnMigrationToDependencies,
  validateAndWarnRuleOptions,
} from "../Settings";
import type {
  EntryPointRuleOptions,
  EntryPointPolicy,
  DependenciesPolicy,
} from "../Shared";
import { SETTINGS, RULE_NAMES_MAP } from "../Shared";

import { evaluatePoliciesAndReport } from "./Dependencies";
import { dependencyRule } from "./Support";

const { RULE_ENTRY_POINT } = SETTINGS;

/**
 * Adapts legacy template placeholders from `target` to `to` notation.
 *
 * @param templates - Legacy templates from policy options.
 * @returns Normalized templates or `undefined` when not provided.
 */
function modifyLegacyTemplates(templates: string | string[]): string[] {
  const templatesArray = Array.isArray(templates) ? templates : [templates];
  return templatesArray.map((template) =>
    template.replaceAll("${target.", "${to.")
  );
}

/**
 * Converts `entry-point` legacy policies to `dependencies` policy shape.
 *
 * @param rules - Entry-point policies as defined by user configuration.
 * @returns Equivalent dependencies policies for shared evaluator.
 */
function transformToDependenciesRules(
  rules: EntryPointPolicy[]
): DependenciesPolicy[] {
  const newRules: DependenciesPolicy[] = [];

  for (const rule of rules) {
    const newTargets = normalizeEntitySelector(rule.target);

    for (const target of newTargets) {
      newRules.push({
        to: target,
        allow: rule.allow
          ? {
              to: {
                element: {
                  fileInternalPath: modifyLegacyTemplates(rule.allow),
                },
              },
            }
          : undefined,
        disallow: rule.disallow
          ? {
              to: {
                element: {
                  fileInternalPath: modifyLegacyTemplates(rule.disallow),
                },
              },
            }
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
    // Validate and warn about deprecated rule option syntax (legacy
    // selectors, legacy templates, and rule-level importKind).
    validateAndWarnRuleOptions(
      options,
      RULE_NAMES_MAP.ENTRY_POINT,
      settings.disableLegacyWarnings
    );

    if (
      !dependency.to.file.isIgnored &&
      dependency.to.element.types &&
      dependency.dependency.relationship.to !==
        DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL
    ) {
      const rules = transformToDependenciesRules(
        options?.policies ?? options?.rules ?? []
      );
      evaluatePoliciesAndReport({
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
