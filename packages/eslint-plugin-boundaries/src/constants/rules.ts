import { PLUGIN_NAME } from "./plugin";

export const ELEMENT_TYPES = "element-types";
export const ENTRY_POINT = "entry-point";
export const EXTERNAL = "external";
export const NO_IGNORED = "no-ignored";
export const NO_PRIVATE = "no-private";
export const NO_UNKNOWN_FILES = "no-unknown-files";
export const NO_UNKNOWN = "no-unknown";

/**
 * Mapping of all rule names
 */
export const RULES_MAP = {
  ELEMENT_TYPES,
  ENTRY_POINT,
  EXTERNAL,
  NO_IGNORED,
  NO_PRIVATE,
  NO_UNKNOWN_FILES,
  NO_UNKNOWN,
} as const;

/**
 * List of all rule names
 */
export const RULE_NAMES = [
  `${PLUGIN_NAME}/${RULES_MAP.ELEMENT_TYPES}`,
  `${PLUGIN_NAME}/${RULES_MAP.ENTRY_POINT}`,
  `${PLUGIN_NAME}/${RULES_MAP.EXTERNAL}`,
  `${PLUGIN_NAME}/${RULES_MAP.NO_IGNORED}`,
  `${PLUGIN_NAME}/${RULES_MAP.NO_PRIVATE}`,
  `${PLUGIN_NAME}/${RULES_MAP.NO_UNKNOWN_FILES}`,
  `${PLUGIN_NAME}/${RULES_MAP.NO_UNKNOWN}`,
] as const;

export type RuleName = (typeof RULE_NAMES)[number];

export type RuleNames = typeof RULE_NAMES;
