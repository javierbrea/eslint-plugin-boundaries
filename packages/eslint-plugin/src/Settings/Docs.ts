import {
  PLUGIN_NAME,
  WEBSITE_URL,
  RULE_NAMES_MAP,
} from "../Shared/Settings.types";
import type { RuleName } from "../Shared/Settings.types";

/**
 * Removes the plugin namespace from a rule name.
 * @param ruleName The name of the rule.
 * @returns The rule name without the plugin namespace.
 */
function removePluginNamespace(ruleName: string): string {
  return ruleName.replace(`${PLUGIN_NAME}/`, "");
}
/**
 * Adapts the rule name to be used in a URL.
 * @param ruleName The name of the rule.
 * @returns The adapted rule name for URL usage.
 */
function adaptRuleNameToUrl(ruleName: RuleName): string {
  if (ruleName === RULE_NAMES_MAP.ELEMENT_TYPES) {
    return RULE_NAMES_MAP.DEPENDENCIES;
  }
  return ruleName;
}

/**
 * Returns the documentation URL for an ESLint rule.
 * @param ruleName The name of the rule.
 * @param anchor Optional anchor to a specific section in the documentation page.
 * @returns The documentation URL for the ESLint rule.
 */
export function docsUrl(path: string, anchor?: string): string {
  const anchorSuffix = anchor ? `#${anchor}` : "";
  return `${WEBSITE_URL}/docs/${path}/${anchorSuffix}`;
}

/**
 * Returns the documentation path for a given rule name.
 * @param ruleName The name of the rule.
 * @returns The documentation path for the given rule name.
 */
export function getRuleDocsPath(ruleName: RuleName): string {
  return `rules/${removePluginNamespace(adaptRuleNameToUrl(ruleName))}`;
}

/**
 * Returns the documentation URL for an ESLint rule.
 * @param ruleName The name of the rule.
 * @param anchor Optional anchor to a specific section in the documentation page.
 * @returns The documentation URL for the ESLint rule.
 */
export function ruleDocsUrl(ruleName: RuleName, anchor?: string): string {
  return docsUrl(getRuleDocsPath(ruleName), anchor);
}

/**
 * Returns a "more info" message with the documentation URL for a given path.
 * @param path The path to the documentation page.
 * @param anchor Optional anchor to a specific section in the documentation page.
 * @returns A message containing the documentation URL.
 */
export function moreInfoLink(path: string, anchor?: string): string {
  return `More info: ${docsUrl(path, anchor)}`;
}

/**
 * Returns a migration guide link for a specific version upgrade.
 * @param versionFrom - The version being upgraded from.
 * @param versionTo - The version being upgraded to.
 * @param anchor - Optional anchor to a specific section in the migration guide.
 * @returns A message containing the migration guide URL for the specified version upgrade.
 */
export function migrationGuideLink(
  versionFrom: string,
  versionTo: string,
  anchor?: string
): string {
  return moreInfoLink(
    `releases/migration-guides/v${versionFrom}-to-v${versionTo}`,
    anchor
  );
}

/**
 * Returns a migration guide link for upgrading from version 5 to version 6.
 * @param anchor - Optional anchor to a specific section in the migration guide.
 * @returns A message containing the migration guide URL for upgrading from version 5 to version 6.
 */
export function migrationToV6GuideLink(anchor?: string): string {
  return migrationGuideLink("5", "6", anchor);
}

/**
 * Returns a migration guide link for upgrading from version 1 to version 2.
 * @param anchor - Optional anchor to a specific section in the migration guide.
 * @returns A message containing the migration guide URL for upgrading from version 1 to version 2.
 */
export function migrationToV2GuideLink(anchor?: string): string {
  return migrationGuideLink("1", "2", anchor);
}

/**
 * Returns a settings information link for the plugin settings documentation.
 * @param anchor - Optional anchor to a specific section in the settings documentation.
 * @returns A message containing the settings information URL for the plugin settings documentation.
 */
export function moreInfoSettingsLink(anchor?: string): string {
  return moreInfoLink(`setup/settings`, anchor);
}
