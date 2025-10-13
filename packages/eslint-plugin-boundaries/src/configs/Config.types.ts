import type { ESLint, Linter, Rule } from "eslint";

import type {
  ElementTypesRuleOptions,
  EntryPointRuleOptions,
  ExternalRuleOptions,
  NoPrivateOptions,
} from "../constants/Options.types";
import type { PLUGIN_NAME } from "../constants/plugin";
import type {
  RuleShortName,
  ELEMENT_TYPES,
  ENTRY_POINT,
  EXTERNAL,
  NO_IGNORED,
  NO_PRIVATE,
  NO_UNKNOWN,
  NO_UNKNOWN_FILES,
} from "../constants/rules";
import type { Settings } from "../constants/settings";

/**
 * Eslint boundaries plugin rules.
 * By default, rule names are prefixed with "boundaries/", but it can be customized via the `PluginName` generic parameter.
 *
 * @template PluginName - The name of the plugin, defaults to "boundaries". It defines the prefix for the rule names.
 */
export type Rules<PluginName extends string = typeof PLUGIN_NAME> = {
  [K in `${PluginName}/${
    | typeof ELEMENT_TYPES
    | typeof ENTRY_POINT
    | typeof EXTERNAL
    | typeof NO_IGNORED
    | typeof NO_PRIVATE
    | typeof NO_UNKNOWN_FILES
    | typeof NO_UNKNOWN}`]?: K extends `${PluginName}/${typeof ELEMENT_TYPES}`
    ? Linter.RuleEntry<ElementTypesRuleOptions[]>
    : K extends `${PluginName}/${typeof ENTRY_POINT}`
      ? Linter.RuleEntry<EntryPointRuleOptions[]>
      : K extends `${PluginName}/${typeof EXTERNAL}`
        ? Linter.RuleEntry<ExternalRuleOptions[]>
        : K extends `${PluginName}/${typeof NO_PRIVATE}`
          ? Linter.RuleEntry<NoPrivateOptions[]>
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
  };
}
