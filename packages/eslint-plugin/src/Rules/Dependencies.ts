import {
  getRuleOptionsSchema,
  migrationToV6GuideLink,
} from "@boundaries/config";
import type { DependencyDescription } from "@boundaries/elements";
import {
  evaluatePolicies,
  getDependencySkipReason,
  getMatcher,
} from "@boundaries/policies";
import type { Rule } from "eslint";

import {
  printDependenciesRuleResult,
  warnDiagnostics,
  warnOnce,
} from "../Debug";
import type { EslintLiteralNode } from "../Elements";
import {
  validateAndWarnRuleOptions,
  deprecatedRuleInfo,
  getDependenciesRuleOptions,
} from "../Settings";
import type {
  DependenciesRuleOptions,
  DependenciesRuleOptionsNormalized,
  SettingsNormalized,
  RuleName,
} from "../Shared";
import { RULE_NAMES_MAP } from "../Shared";

import { dependencyRule } from "./Support";

/**
 * Evaluates the policies of a rule for a dependency and reports a violation to ESLint.
 *
 * @param params - Rule evaluation context and dependency information.
 * @param params.options - Normalized options of the dependencies rule, or the `dependencies` options that a legacy rule translates its options into.
 * @param params.settings - Normalized plugin settings.
 * @param params.context - ESLint rule context, used to report violations.
 * @param params.node - Node of the dependency source, where violations are reported.
 * @param params.dependency - Dependency description.
 */
export function evaluatePoliciesAndReport({
  options,
  dependency,
  settings,
  context,
  node,
}: {
  options: DependenciesRuleOptionsNormalized;
  settings: SettingsNormalized;
  context: Rule.RuleContext;
  node: EslintLiteralNode;
  dependency: DependencyDescription;
}): void {
  const evaluation = evaluatePolicies(settings, options, dependency);
  warnDiagnostics(evaluation.diagnostics);

  if (!evaluation.allowed) {
    printDependenciesRuleResult(
      evaluation.match,
      evaluation.policyIndex,
      dependency,
      settings,
      getMatcher(settings)
    );
    context.report({
      message: evaluation.message,
      node,
    });
  }
}

/**
 * Returns an ESLint rule definition for the dependencies rule, which checks dependencies between elements based on configured rules.
 * @param ruleName - Optional custom name for the rule.
 * @returns ESLint rule definition.
 */
export default function getDependencyRule(
  ruleName: RuleName = RULE_NAMES_MAP.DEPENDENCIES
) {
  return dependencyRule<DependenciesRuleOptions>(
    {
      ruleName,
      description: `Check dependencies between elements`,
      deprecated:
        ruleName === RULE_NAMES_MAP.ELEMENT_TYPES
          ? deprecatedRuleInfo(RULE_NAMES_MAP.DEPENDENCIES)
          : undefined,
      schema: getRuleOptionsSchema(ruleName),
    },
    function ({ dependency, node, context, settings, options }) {
      if (ruleName === RULE_NAMES_MAP.ELEMENT_TYPES) {
        warnOnce(
          `Rule name "${RULE_NAMES_MAP.ELEMENT_TYPES}" is deprecated. Use "${RULE_NAMES_MAP.DEPENDENCIES}" instead.`,
          migrationToV6GuideLink("rule-element-types-renamed-to-dependencies")
        );
      }
      // Validate and warn about deprecated rule option syntax (legacy
      // selectors, legacy templates, and rule-level importKind).
      validateAndWarnRuleOptions(options, ruleName, settings.legacyWarnings);

      // Policies are normalized only for the dependencies that the rule checks, so an invalid selector does not fail on files whose dependencies are all skipped
      if (getDependencySkipReason(options, dependency) === null) {
        evaluatePoliciesAndReport({
          options: getDependenciesRuleOptions(options),
          settings,
          context,
          node,
          dependency,
        });
      }
    }
  );
}
