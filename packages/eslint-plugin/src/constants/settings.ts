import type { DependencyKind, ElementDescriptors } from "@boundaries/elements";
import { DEPENDENCY_KINDS_MAP } from "@boundaries/elements";

import { PLUGIN_NAME, PLUGIN_ENV_VARS_PREFIX } from "./plugin";
import {
  ELEMENT_TYPES,
  EXTERNAL,
  ENTRY_POINT,
  NO_IGNORED,
  NO_UNKNOWN,
  NO_PRIVATE,
  NO_UNKNOWN_FILES,
} from "./rules";

export function isString(object: unknown): object is string {
  return typeof object === "string";
}

export const DEPENDENCY_NODE_REQUIRE = "require" as const;
export const DEPENDENCY_NODE_IMPORT = "import" as const;
export const DEPENDENCY_NODE_DYNAMIC_IMPORT = "dynamic-import" as const;
export const DEPENDENCY_NODE_EXPORT = "export" as const;

/**
 * Type guard to check if a value is a valid DependencyKind.
 * @param value The value to check.
 * @returns True if the value is a valid DependencyKind, false otherwise.
 * @deprecated Use isDependencyKind instead.
 */
export function isImportKind(value: unknown): value is DependencyKind {
  return (
    isString(value) &&
    Object.values(DEPENDENCY_KINDS_MAP).includes(value as DependencyKind)
  );
}

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
 * Type guard to check if a value is a valid DependencyNodeKey.
 * @param value The value to check.
 * @returns True if the value is a valid DependencyNodeKey, false otherwise.
 */
export function isDependencyNodeKey(
  value: unknown,
): value is DependencyNodeKey {
  return (
    isString(value) &&
    Object.values(DEPENDENCY_NODE_KEYS_MAP).includes(value as DependencyNodeKey)
  );
}

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

  VALID_DEPENDENCY_NODE_KINDS: ["value", "type"],
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
  /** @deprecated Use 'ELEMENTS' instead */
  TYPES: SETTINGS.TYPES,
  /** @deprecated Use import/resolver settings instead */
  ALIAS: SETTINGS.ALIAS,
} as const;

/**
 * Valid keys for the plugin settings.
 */
export type SettingsKey =
  (typeof SETTINGS_KEYS_MAP)[keyof typeof SETTINGS_KEYS_MAP];

/**
 * Type guard to check if a value is a valid key for the plugin settings.
 * @param value - The value to check.
 * @returns True if the value is a valid settings key, false otherwise.
 */
export function isSettingsKey(value: unknown): value is SettingsKey {
  return (
    isString(value) &&
    Object.values(SETTINGS_KEYS_MAP).includes(value as SettingsKey)
  );
}

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
  /** @deprecated Use "boundaries/elements" setting instead */
  [SETTINGS_KEYS_MAP.TYPES]?: ElementDescriptors;
  /** @deprecated Use "import/resolver" setting instead */
  [SETTINGS_KEYS_MAP.ALIAS]?: AliasSetting;
};
