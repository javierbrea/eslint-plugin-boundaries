import { PLUGIN_NAME } from "./plugin";

export const ELEMENT_TYPES = "element-types" as const;
export const ENTRY_POINT = "entry-point" as const;
export const EXTERNAL = "external" as const;
export const NO_IGNORED = "no-ignored" as const;
export const NO_PRIVATE = "no-private" as const;
export const NO_UNKNOWN_FILES = "no-unknown-files" as const;
export const NO_UNKNOWN = "no-unknown" as const;

/**
 * Descriptor of all rule names
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

export const RULE_SHORT_NAMES = [...Object.values(RULES_MAP)] as const;

export type RuleShortName = (typeof RULE_SHORT_NAMES)[number];

export type RuleShortNames = typeof RULE_SHORT_NAMES;
