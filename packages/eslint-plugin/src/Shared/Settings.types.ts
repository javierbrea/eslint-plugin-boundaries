import { SETTINGS as CONFIG_SETTINGS } from "@boundaries/config";
import type {
  DependenciesRuleOptions,
  DEPENDENCIES,
  ELEMENT_TYPES,
  ENTRY_POINT,
  EntryPointRuleOptions,
  EXTERNAL,
  ExternalRuleOptions,
  NO_IGNORED,
  NO_IGNORED_DEPENDENCIES,
  NO_PRIVATE,
  NO_UNKNOWN,
  NO_UNKNOWN_DEPENDENCIES,
  NO_UNKNOWN_FILES,
  NoPrivateOptions,
  NoUnknownDependenciesOptions,
  PLUGIN_NAME,
  RuleMainKey,
  RuleName,
  RuleShortName,
  Settings,
} from "@boundaries/config";
import type { ESLint, Linter, Rule } from "eslint";

export {
  DEPENDENCIES,
  ELEMENT_TYPES,
  ENTRY_POINT,
  EXTERNAL,
  NO_IGNORED,
  NO_IGNORED_DEPENDENCIES,
  NO_PRIVATE,
  NO_UNKNOWN,
  NO_UNKNOWN_DEPENDENCIES,
  NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP,
  NO_UNKNOWN_FILES,
  PLUGIN_ISSUES_URL,
  PLUGIN_NAME,
  RULE_NAMES_MAP,
  RULE_SHORT_NAMES_MAP,
  SETTINGS_KEYS_MAP,
} from "@boundaries/config";
export type {
  DependenciesPolicy,
  DependenciesPolicyNormalized,
  DependenciesRuleOptions,
  DependenciesRuleOptionsNormalized,
  Diagnostic,
  EntryPointPolicy,
  EntryPointRuleOptions,
  ExternalLibrariesSelector,
  ExternalLibrarySelectorWithOptions,
  ExternalPolicy,
  ExternalRuleOptions,
  NoPrivateOptions,
  NoUnknownDependenciesOptions,
  RuleName,
  RuleOptions,
  RuleOptionsWithPolicies,
  SettingsNormalized,
} from "@boundaries/config";

export const PLUGIN_ENV_VARS_PREFIX = "ESLINT_PLUGIN_BOUNDARIES" as const;

/**
 * Setting keys and rule names of `@boundaries/config`, plus the environment variables that the plugin reads.
 */
export const SETTINGS = {
  ...CONFIG_SETTINGS,

  // env vars
  DEBUG: `${PLUGIN_ENV_VARS_PREFIX}_DEBUG`,
  ENV_ROOT_PATH: `${PLUGIN_ENV_VARS_PREFIX}_ROOT_PATH`,
} as const;

/**
 * Eslint boundaries plugin rules.
 * By default, rule names are prefixed with "boundaries/", but it can be customized via the `PluginName` generic parameter.
 *
 * @template PluginName - The name of the plugin, defaults to "boundaries". It defines the prefix for the rule names.
 */
export type Rules<PluginName extends string = typeof PLUGIN_NAME> = {
  [K in `${PluginName}/${
    | typeof ELEMENT_TYPES
    | typeof DEPENDENCIES
    | typeof ENTRY_POINT
    | typeof EXTERNAL
    | typeof NO_IGNORED_DEPENDENCIES
    | typeof NO_IGNORED
    | typeof NO_PRIVATE
    | typeof NO_UNKNOWN_FILES
    | typeof NO_UNKNOWN_DEPENDENCIES
    | typeof NO_UNKNOWN}`]?: K extends `${PluginName}/${typeof ELEMENT_TYPES}`
    ? Linter.RuleEntry<DependenciesRuleOptions[]>
    : K extends `${PluginName}/${typeof DEPENDENCIES}`
      ? Linter.RuleEntry<DependenciesRuleOptions[]>
      : K extends `${PluginName}/${typeof ENTRY_POINT}`
        ? Linter.RuleEntry<EntryPointRuleOptions[]>
        : K extends `${PluginName}/${typeof EXTERNAL}`
          ? Linter.RuleEntry<ExternalRuleOptions[]>
          : K extends `${PluginName}/${typeof NO_PRIVATE}`
            ? Linter.RuleEntry<NoPrivateOptions[]>
            : K extends `${PluginName}/${
                  | typeof NO_UNKNOWN_DEPENDENCIES
                  | typeof NO_UNKNOWN}`
              ? Linter.RuleEntry<NoUnknownDependenciesOptions[]>
              : Linter.RuleEntry<never>;
};

/**
 * ESLint configuration with optional settings and rules specific to the boundaries plugin.
 */
export interface Config<PluginName extends string = typeof PLUGIN_NAME>
  extends Linter.Config {
  /**
   * Optional settings specific to the boundaries plugin.
   */
  settings?: Settings;
  /**
   * Optional rules specific to the boundaries plugin.
   */
  rules?: Rules<PluginName>;
}

/**
 * ESLint plugin interface for the boundaries plugin, including metadata, rules, and configurations.
 */
export interface PluginBoundaries extends ESLint.Plugin {
  meta: {
    name: string;
    version: string;
  };
  rules: Record<RuleShortName, Rule.RuleModule>;
  configs: {
    recommended: Config;
    strict: Config;
    "strict-legacy": Config;
  };
}

export type RuleMetaDefinition = {
  type?: Rule.RuleMetaData["type"];
  /** The description of the rule */
  description: string;
  /** The name of the rule */
  ruleName: RuleName;
  /** The schema of the rule options */
  schema?: Rule.RuleMetaData["schema"];
  /** Deprecation metadata surfaced by ESLint when the rule is deprecated */
  deprecated?: Rule.RuleMetaData["deprecated"];
};

export type ValidateRulesOptions = {
  mainKey?: RuleMainKey;
  onlyMainKey?: boolean;
};
