import type {
  DependenciesRuleOptionsNormalized,
  RuleShortName,
  SettingsNormalized,
} from "../Shared";

/**
 * Map of the rule severities, as ESLint names them.
 */
export const RULE_SEVERITIES_MAP = {
  OFF: "off",
  WARN: "warn",
  ERROR: "error",
} as const;

/**
 * Severity of a rule entry.
 */
export type RuleSeverity =
  (typeof RULE_SEVERITIES_MAP)[keyof typeof RULE_SEVERITIES_MAP];

/**
 * Options of `normalizeConfig`.
 */
export type NormalizeConfigOptions = {
  /** The prefix of the rule names, `"boundaries"` by default */
  pluginName?: string;
  /** The root path of the project, already resolved by the host. Without it, the normalized `rootPath` is the `boundaries/root-path` setting as written */
  rootPath?: string;
};

/**
 * A rule entry of the config, normalized.
 */
export type RuleEntryNormalized<Name extends RuleShortName> = {
  /** The severity of the rule */
  severity: RuleSeverity;
  /** The options of the rule: normalized for the rules with `dependencies` policies, as written for the others */
  options: Name extends "dependencies" | "element-types"
    ? DependenciesRuleOptionsNormalized
    : unknown;
};

/**
 * The boundaries part of an ESLint config, normalized.
 */
export type ConfigNormalized = {
  /** The normalized settings */
  settings: SettingsNormalized;
  /** The rules of the plugin found in `rules`, by short name. Entries whose options fail the rule schema are left out */
  rules: {
    [Name in RuleShortName]?: RuleEntryNormalized<Name>;
  };
};
