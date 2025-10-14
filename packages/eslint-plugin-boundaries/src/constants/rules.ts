import { PLUGIN_NAME } from "./plugin";

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
 * Type guard to check if a value is a valid rule name including the default plugin prefix.
 * @param value - The value to check.
 * @returns True if the value is a valid rule name with the default plugin prefix, false otherwise.
 */
export function isRuleName(value: unknown): value is RuleName {
  return RULE_NAMES.includes(value as RuleName);
}

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
 * Type guard to check if a value is a valid rule short name.
 * @param value - The value to check.
 * @returns True if the value is a valid rule short name, false otherwise.
 */
export function isRuleShortName(value: unknown): value is RuleShortName {
  return RULE_SHORT_NAMES.includes(value as RuleShortName);
}
