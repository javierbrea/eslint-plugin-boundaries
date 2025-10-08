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

export type ImportKind = "type" | "value";

export const DEPENDENCY_NODES = {
  REQUIRE: "require",
  IMPORT: "import",
  DYNAMIC_IMPORT: "dynamic-import",
  EXPORT: "export",
} as const;

export type DependencyNodeKey =
  (typeof DEPENDENCY_NODES)[keyof typeof DEPENDENCY_NODES];

export type DependencyNodeSelector = {
  selector: string;
  kind: ImportKind;
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
    [DEPENDENCY_NODES.REQUIRE]: [
      // Note: detects "require('source')"
      {
        selector: "CallExpression[callee.name=require] > Literal",
        kind: "value",
      },
    ],
    [DEPENDENCY_NODES.IMPORT]: [
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
    [DEPENDENCY_NODES.DYNAMIC_IMPORT]: [
      // Note: detects "import('source')"
      { selector: "ImportExpression > Literal", kind: "value" },
    ],
    [DEPENDENCY_NODES.EXPORT]: [
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

export const SETTINGS_KEYS = {
  ELEMENTS: SETTINGS.ELEMENTS,
  IGNORE: SETTINGS.IGNORE,
  INCLUDE: SETTINGS.INCLUDE,
  ROOT_PATH: SETTINGS.ROOT_PATH,
  DEPENDENCY_NODES: SETTINGS.DEPENDENCY_NODES,
  ADDITIONAL_DEPENDENCY_NODES: SETTINGS.ADDITIONAL_DEPENDENCY_NODES,
} as const;

export type PluginSettingsKey =
  (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

export type PluginSettings = {
  [SETTINGS_KEYS.ELEMENTS]?: unknown;
  [SETTINGS_KEYS.IGNORE]?: unknown;
  [SETTINGS_KEYS.INCLUDE]?: unknown;
  [SETTINGS_KEYS.ROOT_PATH]?: unknown;
  [SETTINGS_KEYS.DEPENDENCY_NODES]?: DependencyNodeKey[];
  [SETTINGS_KEYS.ADDITIONAL_DEPENDENCY_NODES]?: DependencyNodeSelector[];
};
