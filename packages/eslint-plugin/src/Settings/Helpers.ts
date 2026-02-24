import type { DependencyKind } from "@boundaries/elements";
import { DEPENDENCY_KINDS_MAP } from "@boundaries/elements";

import { isString } from "../Support";

import {
  DEPENDENCY_NODE_KEYS_MAP,
  SETTINGS_KEYS_MAP,
  RULE_POLICY_ALLOW,
  RULE_POLICY_DISALLOW,
  RULE_NAMES,
  RULE_SHORT_NAMES,
  FROM,
} from "./Settings.types";
import type {
  DependencyNodeKey,
  SettingsKey,
  RulePolicy,
  RuleShortName,
  RuleName,
  RuleMainKey,
} from "./Settings.types";

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
 * Type guard to check if a value is a valid DependencyNodeKey.
 * @param value The value to check.
 * @returns True if the value is a valid DependencyNodeKey, false otherwise.
 */
export function isDependencyNodeKey(
  value: unknown
): value is DependencyNodeKey {
  return (
    isString(value) &&
    Object.values(DEPENDENCY_NODE_KEYS_MAP).includes(value as DependencyNodeKey)
  );
}

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
 * Type guard to check if a value is a valid RulePolicy.
 * @param value - The value to check.
 * @returns True if the value is a valid RulePolicy, false otherwise.
 */
export function isRulePolicy(value: unknown): value is RulePolicy {
  return (
    isString(value) &&
    (value === RULE_POLICY_ALLOW || value === RULE_POLICY_DISALLOW)
  );
}

/**
 * Type guard to check if a value is a valid rule name including the default plugin prefix.
 * @param value - The value to check.
 * @returns True if the value is a valid rule name with the default plugin prefix, false otherwise.
 */
export function isRuleName(value: unknown): value is RuleName {
  return RULE_NAMES.includes(value as RuleName);
}

/**
 * Type guard to check if a value is a valid rule short name.
 * @param value - The value to check.
 * @returns True if the value is a valid rule short name, false otherwise.
 */
export function isRuleShortName(value: unknown): value is RuleShortName {
  return RULE_SHORT_NAMES.includes(value as RuleShortName);
}

export function isLegacyType(type: unknown): type is string {
  return isString(type);
}

/**
 * Type guard to check if a value is a legacy element selector (string or tuple format).
 * @param value - The value to check.
 * @returns True if the value is a legacy element selector, false otherwise.
 */
export function isLegacyElementSelector(
  value: unknown
): value is string | [string, Record<string, unknown>] {
  // String format: "type"
  if (isString(value)) {
    return true;
  }
  // Tuple format: ["type", { captured values }]
  if (Array.isArray(value) && value.length === 2 && isString(value[0])) {
    return true;
  }
  return false;
}

/**
 * Detects if legacy element selector syntax is used.
 * @param selector - The selector to check (can be a single selector or an array of selectors).
 * @returns True if legacy syntax was detected, false otherwise.
 */
export function detectLegacyElementSelector(selector: unknown): boolean {
  if (Array.isArray(selector)) {
    for (const sel of selector) {
      if (isLegacyElementSelector(sel)) {
        return true;
      }
    }
    return false;
  } else if (selector) {
    return isLegacyElementSelector(selector);
  }
  return false;
}

/**
 * Checks if a string contains legacy template syntax ${...}.
 * @param value - The value to check.
 * @returns True if the value contains legacy template syntax, false otherwise.
 */
function hasLegacyTemplateSyntax(value: string): boolean {
  return value.includes("${");
}

/**
 * Recursively checks if a selector contains legacy template syntax.
 * @param value - The value to check (can be string, object, array, etc.).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
function checkForLegacyTemplateSyntax(value: unknown): boolean {
  if (isString(value)) {
    if (hasLegacyTemplateSyntax(value)) {
      return true;
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      if (checkForLegacyTemplateSyntax(item)) {
        return true;
      }
    }
  } else if (typeof value === "object" && value !== null) {
    for (const val of Object.values(value)) {
      if (checkForLegacyTemplateSyntax(val)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Detects if legacy template syntax is used in selectors.
 * @param selector - The selector to check (can be a single selector or an array of selectors).
 * @returns True if legacy template syntax was detected, false otherwise.
 */
export function detectLegacyTemplateSyntax(selector: unknown): boolean {
  return checkForLegacyTemplateSyntax(selector);
}

export function rulesMainKey(key: RuleMainKey = FROM) {
  return key;
}
