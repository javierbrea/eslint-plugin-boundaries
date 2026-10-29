import { readFileSync } from "node:fs";
import { join } from "node:path";

import recommendedConfig from "./Config/Recommended";
import strictConfig from "./Config/Strict";
import strictLegacyConfig from "./Config/StrictLegacy";
// eslint-disable-next-line import/no-namespace -- The namespace of the plugin declares every public type, so it refers to all of them
import type * as Public from "./Public";
import getDependenciesRule from "./Rules/Dependencies";
import EntryPointRule from "./Rules/EntryPoint";
import ExternalRule from "./Rules/External";
import getNoIgnoredDependenciesRule from "./Rules/NoIgnored";
import NoPrivateRule from "./Rules/NoPrivate";
import getNoUnknownDependenciesRule from "./Rules/NoUnknown";
import NoUnknownFilesRule from "./Rules/NoUnknownFiles";
import { RULE_SHORT_NAMES_MAP, SETTINGS } from "./Shared";
// import { warn } from "./Shared";

/**
 * The path to the plugin package.json file
 */
const packageJsonPath = join(__dirname, "..", "package.json");

/**
 * The content of the package.json file
 */
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

// TODO: Enable this warning in the next major release
/* if (packageJson.name !== "@boundaries/eslint-plugin") {
  warn(
    `⚠️  The "eslint-plugin-boundaries" package has been renamed to "@boundaries/eslint-plugin". Please install the new package, as this one will soon no longer receive updates`
  );
} */

const RULES = {
  [RULE_SHORT_NAMES_MAP.ENTRY_POINT]: EntryPointRule,
  /** @deprecated Use dependencies rule instead */
  [RULE_SHORT_NAMES_MAP.ELEMENT_TYPES]: getDependenciesRule(
    SETTINGS.RULE_ELEMENT_TYPES
  ),
  [RULE_SHORT_NAMES_MAP.DEPENDENCIES]: getDependenciesRule(),
  [RULE_SHORT_NAMES_MAP.EXTERNAL]: ExternalRule,
  [RULE_SHORT_NAMES_MAP.NO_IGNORED_DEPENDENCIES]:
    getNoIgnoredDependenciesRule(),
  /** @deprecated Use no-ignored-dependencies rule instead */
  [RULE_SHORT_NAMES_MAP.NO_IGNORED]: getNoIgnoredDependenciesRule(
    SETTINGS.RULE_NO_IGNORED
  ),
  [RULE_SHORT_NAMES_MAP.NO_PRIVATE]: NoPrivateRule,
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES]:
    getNoUnknownDependenciesRule(),
  /** @deprecated Use no-unknown-dependencies rule instead */
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN]: getNoUnknownDependenciesRule(
    SETTINGS.RULE_NO_UNKNOWN
  ),
  [RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES]: NoUnknownFilesRule,
};

/**
 * Eslint plugin ensuring that architecture boundaries are respected by the elements in a project
 * It enables to check the folders and files structure and the dependencies and relationships between them.
 */
const publicInterface: Public.PluginBoundaries = {
  meta: {
    name: packageJson.name as string,
    version: packageJson.version as string,
  },
  rules: RULES,
  configs: {
    recommended: recommendedConfig,
    strict: strictConfig,
    "strict-legacy": strictLegacyConfig,
  },
};

/**
 * Public types of the plugin, which `import type { Config } from "@boundaries/eslint-plugin"` reads.
 *
 * `export =` cannot be combined with other exports, so the types are declared in a namespace that merges with the plugin object. They are aliases of the types that `./Public` exports, which `@boundaries/eslint-plugin/config` also exports, and they repeat their TSDoc because editors do not show the TSDoc of the aliased type. `src/index.spec.ts` checks that both lists match.
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare, @typescript-eslint/no-namespace -- A namespace is the only way to export types next to `export =`
declare namespace publicInterface {
  /**
   * Eslint boundaries plugin rules.
   *
   * By default, rule names are prefixed with "boundaries/", but it can be customized via the `PluginName` generic parameter.
   * @template PluginName - The name of the plugin, defaults to "boundaries". It defines the prefix for the rule names.
   */
  export type Rules<PluginName extends string = typeof Public.PLUGIN_NAME> =
    Public.Rules<PluginName>;

  /**
   * ESLint configuration with optional settings and rules specific to the boundaries plugin.
   */
  export type Config<PluginName extends string = typeof Public.PLUGIN_NAME> =
    Public.Config<PluginName>;

  /**
   * ESLint plugin interface for the boundaries plugin, including metadata, rules, and configurations.
   */
  export type PluginBoundaries = Public.PluginBoundaries;

  /**
   * Element descriptor, which must define a pattern and a type. The pattern is used to match files and capture values, while the type is used to categorize the element.
   */
  export type ElementDescriptor = Public.ElementDescriptor;

  /**
   * Array of element descriptors.
   */
  export type ElementDescriptors = Public.ElementDescriptors;

  /**
   * File descriptor, which must define a pattern and a category. The pattern is used to match files and capture values, while the category is used to categorize the file.
   */
  export type FileDescriptor = Public.FileDescriptor;

  /**
   * Array of file descriptors.
   */
  export type FileDescriptors = Public.FileDescriptors;

  /**
   * Mode to interpret the pattern in an ElementDescriptor.
   */
  export type ElementDescriptorMode = Public.ElementDescriptorMode;

  /**
   * Settings for the eslint-plugin-boundaries plugin.
   */
  export type Settings = Public.Settings;

  /**
   * List of glob patterns to ignore when analyzing dependencies.
   * Files matching these patterns will be excluded from the plugin analysis.
   */
  export type IgnoreSetting = Public.IgnoreSetting;

  /**
   * List of glob patterns to include when analyzing dependencies.
   * If specified, only files matching these patterns will be included in the plugin analysis.
   */
  export type IncludeSetting = Public.IncludeSetting;

  /**
   * Root path of the project. This is used to resolve relative paths in element patterns.
   * Can also be set via the ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH environment variable.
   */
  export type RootPathSetting = Public.RootPathSetting;

  export type DebugSetting = Public.DebugSetting;

  export type DebugFilterSetting = Public.DebugFilterSetting;

  /**
   * Valid keys for the plugin settings.
   */
  export type SettingsKey = Public.SettingsKey;

  /**
   * Keys of the different types of dependency nodes supported by the plugin by default.
   */
  export type DependencyNodeKey = Public.DependencyNodeKey;

  /**
   * Additional custom dependency node selector to consider when analyzing dependencies.
   * Each entry defines a selector and its kind (either 'type' or 'value').
   * This allows for extending the default dependency nodes with project-specific patterns.
   */
  export type DependencyNodeSelector = Public.DependencyNodeSelector;

  /**
   * Alias settings to define path aliases for module resolution.
   * Each key is an alias and its value is the corresponding path.
   * @deprecated Use "import/resolver" settings instead
   */
  export type AliasSetting = Public.AliasSetting;

  /**
   * Kind of dependency, either a type dependency or a value dependency
   */
  export type DependencyKind = Public.DependencyKind;

  /**
   * Selector for matching captured values in selectors.
   * It is a record where the keys are the names of the captured values and the values are the patterns to match on those captured values.
   * When provided as an array, each element in the array represents an alternative (OR logic) - the selector matches if any of the array elements matches.
   */
  export type CapturedValuesSelector = Public.CapturedValuesSelector;

  /**
   * Element selector, which can be a single element selector or an array of element selectors.
   */
  export type ElementSelector = Public.ElementSelector;

  /**
   * File Element selector with options, including captured values for dynamic matching.
   * It is represented as a tuple where the first element is the element type (string) and the second element is an object containing a selector for captured values.
   * @deprecated Use FileElementSelectorData defining an object with type and/or category and the rest of properties directly instead.
   */
  export type LegacySimpleElementSingleSelectorByTypeWithOptions =
    Public.LegacySimpleElementSingleSelectorByTypeWithOptions;

  /**
   * Configuration options for categorizing entities as external or local.
   */
  export type FlagAsExternalOptions = Public.FlagAsExternalOptions;

  /**
   * Effect of a policy, either allowing or disallowing certain dependencies.
   */
  export type RuleEffect = Public.RuleEffect;

  /**
   * Policy for rules, either allowing or disallowing certain dependencies.
   * @deprecated Use `RuleEffect` instead.
   */
  export type RulePolicy = Public.RulePolicy;

  /**
   * Base options for some rules, including default effect and custom message.
   */
  export type RuleBaseOptions = Public.RuleBaseOptions;

  /**
   * Policy that defines allowed or disallowed dependencies between different element types.
   */
  export type DependenciesPolicy = Public.DependenciesPolicy;

  /**
   * Policy that defines allowed or disallowed dependencies between different element types.
   * @deprecated Use `DependenciesPolicy` instead.
   */
  export type DependenciesRule = Public.DependenciesRule;

  /**
   * Options for the dependencies rule, including default effect and specific policies.
   */
  export type DependenciesRuleOptions = Public.DependenciesRuleOptions;

  /**
   * Policy that defines entry points for specific element types, controlling which files can be imported.
   */
  export type EntryPointPolicy = Public.EntryPointPolicy;

  /**
   * @deprecated Use `EntryPointPolicy` instead.
   */
  export type EntryPointRule = Public.EntryPointRule;

  /**
   * Options for the entry-point rule, including default effect and specific policies.
   */
  export type EntryPointRuleOptions = Public.EntryPointRuleOptions;

  /**
   * Policy that defines allowed or disallowed external library imports for specific element types.
   */
  export type ExternalPolicy = Public.ExternalPolicy;

  /**
   * @deprecated Use `ExternalPolicy` instead.
   */
  export type ExternalRule = Public.ExternalRule;

  /**
   * Options for the external rule, including default effect and specific policies.
   */
  export type ExternalRuleOptions = Public.ExternalRuleOptions;

  /**
   * Options for the no-private rule, which restricts imports of private elements.
   * Private elements are those that are children of another elements in the folder structure.
   * This rules enables that private elements can't be used by anyone except its parent (or any other descendant of the parent when `allowUncles` option is enabled)
   */
  export type NoPrivateOptions = Public.NoPrivateOptions;

  /**
   * Options for the no-unknown-dependencies rule, which prevents dependencies to targets that are not recognized by any element or file descriptor.
   *
   * The `require` option controls which classification axes the target must be known on to be valid. With the default (`require: "any"`), known on at least one axis is enough, so the rule reports only when the target is unknown on both axes.
   */
  export type NoUnknownDependenciesOptions =
    Public.NoUnknownDependenciesOptions;

  /**
   * Which classification axes a dependency target must be "known" on for the no-unknown-dependencies rule to consider it valid.
   * - `"any"` (default): known on at least one axis (element or file) is enough. Reported only when the target is unknown on both axes.
   * - `"element"`: the element axis must be known, regardless of the file axis. Reported when the target element is unknown.
   * - `"file"`: the file axis must be known, regardless of the element axis. Reported when the target file is unknown.
   * - `"all"`: both axes must be known. Reported when either axis is unknown.
   */
  export type NoUnknownDependenciesRequire =
    Public.NoUnknownDependenciesRequire;

  /**
   * Type representing all valid rule short names, without the plugin prefix.
   */
  export type RuleShortName = Public.RuleShortName;

  /**
   * Type representing all valid rule names, including the default plugin prefix.
   */
  export type RuleName = Public.RuleName;

  /**
   * Kind of import that the rule applies to (e.g., "type", "value")
   * @deprecated Use DependencyKind instead
   */
  export type ImportKind = Public.ImportKind;

  export type CustomMessageTemplatePolicyContext =
    Public.CustomMessageTemplatePolicyContext;

  /**
   * Context about the rule that matched the dependency, if any.
   * @deprecated Use `CustomMessageTemplatePolicyContext` instead.
   */
  export type CustomMessageTemplateRuleContext =
    Public.CustomMessageTemplateRuleContext;

  /**
   * Context received by custom message templates
   */
  export type CustomMessageTemplateContext =
    Public.CustomMessageTemplateContext;
}

// `export =` makes the plugin object the value of `module.exports`, which is what `require()` and the default import of an ES module receive, and declares it so
export = publicInterface;
