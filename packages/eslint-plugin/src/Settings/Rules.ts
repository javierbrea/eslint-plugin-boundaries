import {
  getRuleDocsPath,
  moreInfoLink,
  normalizeDependenciesRuleOptions,
  validateRuleOptions,
} from "@boundaries/config";

import { warnDiagnostics, warnOnce } from "../Debug";
import { RULE_NAMES_MAP } from "../Shared";
import type {
  DependenciesRuleOptions,
  DependenciesRuleOptionsNormalized,
  RuleOptionsWithPolicies,
  RuleName,
} from "../Shared";

const trackedWarnedRuleOptions = new WeakSet<RuleOptionsWithPolicies>();

const normalizedDependenciesRuleOptions = new WeakMap<
  DependenciesRuleOptions,
  DependenciesRuleOptionsNormalized
>();

/**
 * Normalized options of a dependencies rule entry without options.
 */
const DEFAULT_DEPENDENCIES_RULE_OPTIONS =
  normalizeDependenciesRuleOptions(undefined);

/**
 * Prints, once per options object, the problems found in the policies of a rule: unrecognized selector shapes and, when `legacyWarnings` is true, deprecated syntax. ESLint has already validated the options against the rule schema.
 *
 * @param options - Rule options containing `policies` (or the deprecated `rules` alias) entries.
 * @param ruleName - Rule name displayed in warning messages.
 * @param legacyWarnings - Whether to print the deprecated syntax warnings.
 */
export function validateAndWarnRuleOptions(
  options: RuleOptionsWithPolicies | undefined,
  ruleName: RuleName,
  legacyWarnings: boolean
): void {
  if (!options || trackedWarnedRuleOptions.has(options)) {
    return;
  }
  trackedWarnedRuleOptions.add(options);
  warnDiagnostics(
    validateRuleOptions(ruleName, options, { legacyWarnings, schema: false })
  );
}

/**
 * Returns the normalized options of a dependencies rule entry, cached by options identity.
 *
 * @param options - The options of the rule entry.
 * @returns The normalized options.
 */
export function getDependenciesRuleOptions(
  options: DependenciesRuleOptions | undefined
): DependenciesRuleOptionsNormalized {
  if (!options) {
    return DEFAULT_DEPENDENCIES_RULE_OPTIONS;
  }
  const cachedOptions = normalizedDependenciesRuleOptions.get(options);
  if (cachedOptions) {
    return cachedOptions;
  }
  const normalizedOptions = normalizeDependenciesRuleOptions(options);
  normalizedDependenciesRuleOptions.set(options, normalizedOptions);
  return normalizedOptions;
}

/**
 * Warns about the deprecation of a rule and encourages migration to the "dependencies" rule.
 * @param ruleName The name of the deprecated rule.
 */
export function warnMigrationToDependencies(ruleName: RuleName) {
  warnOnce(
    `Rule "${ruleName}" is deprecated and will be removed in future versions.`,
    `Please migrate to the "${RULE_NAMES_MAP.DEPENDENCIES}" rule with appropriate selectors. ${moreInfoLink(
      getRuleDocsPath(ruleName),
      // cspell: disable-next-line
      "migration-to-boundariesdependencies"
    )}`
  );
}
