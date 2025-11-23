import type {
  DependencyKind,
  ElementDescriptors,
  ElementsSelector,
  CapturedValues,
  ExternalLibrariesSelector,
} from "@boundaries/elements";
import type { ESLint, Linter, Rule } from "eslint";

// Plugin constants
export const PLUGIN_NAME = "boundaries" as const;
export const PLUGIN_ENV_VARS_PREFIX = "ESLINT_PLUGIN_BOUNDARIES" as const;
export const REPO_URL =
  "https://github.com/javierbrea/eslint-plugin-boundaries" as const;
export const WEBSITE_URL = "https://www.jsboundaries.dev" as const;
export const PLUGIN_ISSUES_URL = `${REPO_URL}/issues` as const;

export const DEPENDENCY_NODE_REQUIRE = "require" as const;
export const DEPENDENCY_NODE_IMPORT = "import" as const;
export const DEPENDENCY_NODE_DYNAMIC_IMPORT = "dynamic-import" as const;
export const DEPENDENCY_NODE_EXPORT = "export" as const;

// Rule short names
export const ELEMENT_TYPES = "element-types" as const;
export const ENTRY_POINT = "entry-point" as const;
export const EXTERNAL = "external" as const;
export const NO_IGNORED = "no-ignored" as const;
export const NO_PRIVATE = "no-private" as const;
export const NO_UNKNOWN_FILES = "no-unknown-files" as const;
export const NO_UNKNOWN = "no-unknown" as const;

/**
 * Map of all rule short names, without the plugin prefix.
 */
export const RULE_SHORT_NAMES_MAP = {
  ELEMENT_TYPES,
  ENTRY_POINT,
  EXTERNAL,
  NO_IGNORED,
  NO_PRIVATE,
  NO_UNKNOWN_FILES,
  NO_UNKNOWN,
} as const;

const ELEMENT_TYPES_FULL = `${PLUGIN_NAME}/${ELEMENT_TYPES}` as const;
const ENTRY_POINT_FULL = `${PLUGIN_NAME}/${ENTRY_POINT}` as const;
const EXTERNAL_FULL = `${PLUGIN_NAME}/${EXTERNAL}` as const;
const NO_IGNORED_FULL = `${PLUGIN_NAME}/${NO_IGNORED}` as const;
const NO_PRIVATE_FULL = `${PLUGIN_NAME}/${NO_PRIVATE}` as const;
const NO_UNKNOWN_FILES_FULL = `${PLUGIN_NAME}/${NO_UNKNOWN_FILES}` as const;
const NO_UNKNOWN_FULL = `${PLUGIN_NAME}/${NO_UNKNOWN}` as const;

/**
 * Map of all rule names, including the default plugin prefix.
 */
export const RULE_NAMES_MAP = {
  ELEMENT_TYPES: ELEMENT_TYPES_FULL,
  ENTRY_POINT: ENTRY_POINT_FULL,
  EXTERNAL: EXTERNAL_FULL,
  NO_IGNORED: NO_IGNORED_FULL,
  NO_PRIVATE: NO_PRIVATE_FULL,
  NO_UNKNOWN_FILES: NO_UNKNOWN_FILES_FULL,
  NO_UNKNOWN: NO_UNKNOWN_FULL,
} as const;

/**
 * List of all rule names
 */
export const RULE_NAMES = [...Object.values(RULE_NAMES_MAP)] as const;

/**
 * Type representing all valid rule names, including the default plugin prefix.
 */
export type RuleName = (typeof RULE_NAMES)[number];

/**
 * List of all rule names, including the default plugin prefix.
 */
export type RuleNames = typeof RULE_NAMES;

/**
 * List of all rule short names, without the plugin prefix.
 */
export const RULE_SHORT_NAMES = [
  ...Object.values(RULE_SHORT_NAMES_MAP),
] as const;

/**
 * Type representing all valid rule short names, without the plugin prefix.
 */
export type RuleShortName = (typeof RULE_SHORT_NAMES)[number];

/**
 * List of all rule short names, without the plugin prefix.
 */
export type RuleShortNames = typeof RULE_SHORT_NAMES;

/**
 * Main key used in rule definitions.
 */
export const FROM = "from" as const;

/**
 * Different types of dependency nodes supported by the plugin by default.
 * Each type corresponds to a common way of importing or requiring modules in JavaScript/TypeScript.
 */
export const DEPENDENCY_NODE_KEYS_MAP = {
  /**
   * CommonJS require statements, e.g., `const module = require('module')`.
   */
  REQUIRE: DEPENDENCY_NODE_REQUIRE,
  /**
   * ES6 import statements, e.g., `import module from 'module'`.
   */
  IMPORT: DEPENDENCY_NODE_IMPORT,
  /**
   * Dynamic import statements, e.g., `import('module')`.
   */
  DYNAMIC_IMPORT: DEPENDENCY_NODE_DYNAMIC_IMPORT,
  /**
   * Export statements, e.g., `export { module } from 'source'`.
   */
  EXPORT: DEPENDENCY_NODE_EXPORT,
} as const;

/**
 * Keys of the different types of dependency nodes supported by the plugin by default.
 */
export type DependencyNodeKey =
  (typeof DEPENDENCY_NODE_KEYS_MAP)[keyof typeof DEPENDENCY_NODE_KEYS_MAP];

/**
 * Additional custom dependency node selector to consider when analyzing dependencies.
 * Each entry defines a selector and its kind (either 'type' or 'value').
 * This allows for extending the default dependency nodes with project-specific patterns.
 */
export type DependencyNodeSelector = {
  /** A selector string to identify the dependency node in the AST */
  selector: string;
  /** The kind of import, either 'type' or 'value' */
  kind: DependencyKind;
  /** Name to assign to the dependency node. Useful to identify the kind of node selector in rules */
  name?: string;
};

export const SETTINGS = {
  // settings
  ELEMENTS: `${PLUGIN_NAME}/elements`,
  IGNORE: `${PLUGIN_NAME}/ignore`,
  INCLUDE: `${PLUGIN_NAME}/include`,
  ROOT_PATH: `${PLUGIN_NAME}/root-path`,
  DEPENDENCY_NODES: `${PLUGIN_NAME}/dependency-nodes`,
  ADDITIONAL_DEPENDENCY_NODES: `${PLUGIN_NAME}/additional-dependency-nodes`,
  LEGACY_TEMPLATES: `${PLUGIN_NAME}/legacy-templates`,
  CACHE: `${PLUGIN_NAME}/cache`,

  // env vars
  DEBUG: `${PLUGIN_ENV_VARS_PREFIX}_DEBUG`,
  ENV_ROOT_PATH: `${PLUGIN_ENV_VARS_PREFIX}_ROOT_PATH`,

  // rules
  RULE_ELEMENT_TYPES: `${PLUGIN_NAME}/${ELEMENT_TYPES}`,
  RULE_ENTRY_POINT: `${PLUGIN_NAME}/${ENTRY_POINT}`,
  RULE_EXTERNAL: `${PLUGIN_NAME}/${EXTERNAL}`,
  RULE_NO_IGNORED: `${PLUGIN_NAME}/${NO_IGNORED}`,
  RULE_NO_PRIVATE: `${PLUGIN_NAME}/${NO_PRIVATE}`,
  RULE_NO_UNKNOWN_FILES: `${PLUGIN_NAME}/${NO_UNKNOWN_FILES}`,
  RULE_NO_UNKNOWN: `${PLUGIN_NAME}/${NO_UNKNOWN}`,

  // deprecated settings
  TYPES: `${PLUGIN_NAME}/types`,
  ALIAS: `${PLUGIN_NAME}/alias`,

  // elements settings properties,
  VALID_MODES: ["folder", "file", "full"],

  VALID_DEPENDENCY_NODE_KINDS: ["value", "type", "typeof"],
  DEFAULT_DEPENDENCY_NODES: {
    [DEPENDENCY_NODE_KEYS_MAP.REQUIRE]: [
      // Note: detects "require('source')"
      {
        selector: "CallExpression[callee.name=require] > Literal",
        kind: "value",
      },
    ],
    [DEPENDENCY_NODE_KEYS_MAP.IMPORT]: [
      // Note: detects "import x from 'source'"
      {
        selector: "ImportDeclaration:not([importKind=type]) > Literal",
        kind: "value",
      },
      // Note: detects "import type x from 'source'"
      {
        selector: "ImportDeclaration[importKind=type] > Literal",
        kind: "type",
      },
    ],
    [DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT]: [
      // Note: detects "import('source')"
      { selector: "ImportExpression > Literal", kind: "value" },
    ],
    [DEPENDENCY_NODE_KEYS_MAP.EXPORT]: [
      // Note: detects "export * from 'source'";
      {
        selector: "ExportAllDeclaration:not([exportKind=type]) > Literal",
        kind: "value",
      },
      // Note: detects "export type * from 'source'";
      {
        selector: "ExportAllDeclaration[exportKind=type] > Literal",
        kind: "type",
      },
      // Note: detects "export { x } from 'source'";
      {
        selector: "ExportNamedDeclaration:not([exportKind=type]) > Literal",
        kind: "value",
      },
      // Note: detects "export type { x } from 'source'";
      {
        selector: "ExportNamedDeclaration[exportKind=type] > Literal",
        kind: "type",
      },
    ],
  },
} as const;

/**
 * Map of the valid keys for the plugin settings.
 */
export const SETTINGS_KEYS_MAP = {
  ELEMENTS: SETTINGS.ELEMENTS,
  IGNORE: SETTINGS.IGNORE,
  INCLUDE: SETTINGS.INCLUDE,
  ROOT_PATH: SETTINGS.ROOT_PATH,
  DEPENDENCY_NODES: SETTINGS.DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES: SETTINGS.ADDITIONAL_DEPENDENCY_NODES,
  LEGACY_TEMPLATES: SETTINGS.LEGACY_TEMPLATES,
  /** @deprecated Use 'ELEMENTS' instead */
  TYPES: SETTINGS.TYPES,
  /** @deprecated Use import/resolver settings instead */
  ALIAS: SETTINGS.ALIAS,
  CACHE: SETTINGS.CACHE,
} as const;

/**
 * Default value for the legacy templates setting.
 */
export const LEGACY_TEMPLATES_DEFAULT = true as const;

/**
 * Default value for the cache setting.
 */
export const CACHE_DEFAULT = true as const;

/**
 * Valid keys for the plugin settings.
 */
export type SettingsKey =
  (typeof SETTINGS_KEYS_MAP)[keyof typeof SETTINGS_KEYS_MAP];

/**
 * List of glob patterns to include when analyzing dependencies.
 * If specified, only files matching these patterns will be included in the plugin analysis.
 */
export type IncludeSetting = string | string[];

/**
 * List of glob patterns to ignore when analyzing dependencies.
 * Files matching these patterns will be excluded from the plugin analysis.
 */
export type IgnoreSetting = string | string[];

/**
 * Root path of the project. This is used to resolve relative paths in element patterns.
 * Can also be set via the ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH environment variable.
 */
export type RootPathSetting = string;

/**
 * Alias settings to define path aliases for module resolution.
 * Each key is an alias and its value is the corresponding path.
 * @deprecated Use "import/resolver" settings instead
 */
export type AliasSetting = Record<string, string>;

/**
 * Settings for the eslint-plugin-boundaries plugin.
 */
export type Settings = {
  /**
   * Element descriptors to define the different elements (or layers) in your project.
   * Each element descriptor includes a type, a pattern to match files, and optional settings like mode and capture groups.
   */
  [SETTINGS_KEYS_MAP.ELEMENTS]?: ElementDescriptors;
  /**
   * List of glob patterns to ignore when analyzing dependencies.
   * Files matching these patterns will be excluded from the plugin analysis.
   */
  [SETTINGS_KEYS_MAP.IGNORE]?: IgnoreSetting;
  /**
   * List of glob patterns to include when analyzing dependencies.
   * If specified, only files matching these patterns will be included in the plugin analysis.
   */
  [SETTINGS_KEYS_MAP.INCLUDE]?: IncludeSetting;
  /**
   * Root path of the project. This is used to resolve relative paths in element patterns.
   * Can also be set via the ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH environment variable.
   */
  [SETTINGS_KEYS_MAP.ROOT_PATH]?: RootPathSetting;
  /**
   * Specifies which dependency nodes (import types) to consider when analyzing dependencies.
   * Each key corresponds to a type of dependency node (e.g., import, require, dynamic-import, export) and maps to an array of selectors defining how to identify those nodes in the AST.
   * If not specified, only 'import' nodes will be considered by default.
   */
  [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]?: DependencyNodeKey[];
  /**
   * Additional custom dependency node selectors to consider when analyzing dependencies.
   * Each entry defines a selector and its kind (either 'type' or 'value').
   * This allows for extending the default dependency nodes with project-specific patterns.
   */
  [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]?: DependencyNodeSelector[];
  /**
   * Whether to enable legacy template syntax support (default: `true`, but it will be `false` in future major releases).
   * This enables:
   * - Using `${variable}` syntax in templates for backward compatibility
   * - Passing captured values from elements to template data at first object level. This might override existing keys in the elements data objects.
   */
  [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]?: boolean;
  /** @deprecated Use "boundaries/elements" setting instead */
  [SETTINGS_KEYS_MAP.TYPES]?: ElementDescriptors;
  /** @deprecated Use "import/resolver" setting instead */
  [SETTINGS_KEYS_MAP.ALIAS]?: AliasSetting;
  /** Whether to enable caching for the plugin analysis */
  [SETTINGS_KEYS_MAP.CACHE]?: boolean;
};

/**
 * Normalized settings for the eslint-plugin-boundaries plugin.
 * All settings have default values applied.
 */
export type SettingsNormalized = {
  /** Element descriptors */
  elementDescriptors: ElementDescriptors;
  /** Element type names extracted from the descriptors. Used to validate selectors defined as strings in rules */
  elementTypeNames: string[];
  /** List of glob patterns to ignore when analyzing dependencies */
  ignorePaths: string[] | undefined;
  /** List of glob patterns to include when analyzing dependencies */
  includePaths: string[] | undefined;
  /** Root path of the project */
  rootPath: string;
  /** Dependency nodes to consider when analyzing dependencies */
  dependencyNodes: DependencyNodeSelector[];
  /** Whether legacy template syntax support is enabled */
  legacyTemplates: boolean;
  /** Whether caching is enabled */
  cache: boolean;
};

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

export type RuleMetaDefinition = {
  type?: Rule.RuleMetaData["type"];
  /** The description of the rule */
  description: string;
  /** The name of the rule */
  ruleName: RuleName;
  /** The schema of the rule options */
  schema?: Rule.RuleMetaData["schema"];
};

export const RULE_POLICY_ALLOW = "allow" as const;
export const RULE_POLICY_DISALLOW = "disallow" as const;

/**
 * Map containing the available rule policies.
 */
export const RULE_POLICIES_MAP = {
  ALLOW: RULE_POLICY_ALLOW,
  DISALLOW: RULE_POLICY_DISALLOW,
} as const;

/**
 * Policy for rules, either allowing or disallowing certain dependencies.
 */
export type RulePolicy =
  (typeof RULE_POLICIES_MAP)[keyof typeof RULE_POLICIES_MAP];

/**
 * Base options for some rules, including default policy and custom message.
 */
export type RuleBaseOptions = {
  /** Default policy for all the rules (allow or disallow) */
  default?: RulePolicy;
  /** Custom message for all rule violations. It can be overridden at the rule level. */
  message?: string;
};

export type RuleReport = {
  message?: string;
  isDefault?: boolean;
  importKind?: DependencyKind;
  disallow?: ElementsSelector;
  element: ElementsSelector;
  index: number;
};

export type RuleResultReport = {
  path: string | null;
  specifiers?: string[];
};

export type RuleResult = {
  result: boolean;
  ruleReport: RuleReport | null;
  report: RuleResultReport | null;
};

export type RuleMatcherElementsCapturedValues = {
  from: CapturedValues;
  target: CapturedValues;
};

/**
 * Rule that defines allowed or disallowed dependencies between different element types.
 */
export type ElementTypesRule = {
  /** Selectors of the source elements that the rule applies to (the elements importing) */
  from?: ElementsSelector;
  /** Selectors of the target elements that are disallowed to be imported */
  to?: ElementsSelector;
  /** Selectors of the elements that are disallowed to be imported */
  disallow?: ElementsSelector;
  /** Selectors of the elements that are allowed to be imported */
  allow?: ElementsSelector;
  /** Kind of import that the rule applies to (e.g., "type", "value") */
  importKind?: DependencyKind;
  /** Custom message for rule violations */
  message?: string;
};

/**
 * Options for the element-types rule, including default policy and specific rules.
 */
export type ElementTypesRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  /** Specific rules for defining boundaries between elements */
  rules?: ElementTypesRule[];
};

/**
 * Rule that defines entry points for specific element types, controlling which files can be imported.
 */
export type EntryPointRule = {
  /** Selectors of the elements that the rule applies to (the elements being imported) */
  target: ElementsSelector;
  /** Micromatch patterns of the files that are disallowed to import from other elements. Relative to the element path */
  disallow?: string[];
  /** Micromatch patterns of the files that are allowed to import from other elements. Relative to the element path */
  allow?: string[];
  /** Kind of import that the rule applies to (e.g., "type", "value") */
  importKind?: DependencyKind;
  /** Custom message for rule violations */
  message?: string;
};

/**
 * Options for the entry-point rule, including default policy and specific rules.
 */
export type EntryPointRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  /** Specific rules for defining entry points between elements */
  rules?: EntryPointRule[];
};

/**
 * Rule that defines allowed or disallowed external library imports for specific element types.
 */
export type ExternalRule = {
  /** Selectors of the source elements that the rule applies to (the elements importing) */
  from: ElementsSelector;
  /** Selectors of the external libraries that are disallowed to be imported */
  disallow?: ExternalLibrariesSelector;
  /** Selectors of the external libraries that are allowed to be imported */
  allow?: ExternalLibrariesSelector;
  /** Kind of import that the rule applies to (e.g., "type", "value") */
  importKind?: DependencyKind;
  /** Custom message for rule violations */
  message?: string;
};

/**
 * Options for the external rule, including default policy and specific rules.
 */
export type ExternalRuleOptions = Omit<RuleBaseOptions, "rules"> & {
  /** Specific rules for defining allowed or disallowed external library imports */
  rules?: ExternalRule[];
};

/**
 * Options for the no-private rule, which restricts imports of private elements.
 * Private elements are those that are children of another elements in the folder structure.
 * This rules enables that private elements can't be used by anyone except its parent (or any other descendant of the parent when `allowUncles` option is enabled)
 */
export type NoPrivateOptions = {
  /** Whether to allow imports from "uncle" elements (elements sharing the same ancestor) */
  allowUncles?: boolean;
  /** Custom message for rule violations */
  message?: string;
};

export type RuleOptionsWithRules =
  | ExternalRuleOptions
  | EntryPointRuleOptions
  | ElementTypesRuleOptions;

export type RuleOptions = RuleOptionsWithRules | NoPrivateOptions;

export type RuleOptionsRules = ExternalRule | EntryPointRule | ElementTypesRule;

export type RuleMainKey = "from" | "to" | "target";

export type ValidateRulesOptions = {
  mainKey?: RuleMainKey;
  onlyMainKey?: boolean;
};
