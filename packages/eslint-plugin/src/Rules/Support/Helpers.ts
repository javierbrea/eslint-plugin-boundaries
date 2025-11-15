import type { Rule } from "eslint";

import { PLUGIN_NAME, REPO_URL } from "../../Settings";
import type { RuleName, RuleMetaDefinition } from "../../Settings";

/**
 * Removes the plugin namespace from a rule name.
 * @param ruleName The name of the rule.
 * @returns The rule name without the plugin namespace.
 */
function removePluginNamespace(ruleName: RuleName) {
  return ruleName.replace(`${PLUGIN_NAME}/`, "");
}

/**
 * Returns the documentation URL for an ESLint rule.
 * @param ruleName The name of the rule.
 * @returns The documentation URL for the ESLint rule.
 */
function docsUrl(ruleName: RuleName) {
  return `${REPO_URL}/blob/master/docs/rules/${removePluginNamespace(ruleName)}.md`;
}

/**
 * Returns the meta object for an ESLint rule.
 * @param param0 The rule metadata definition.
 * @returns The meta object for the ESLint rule.
 */
export function meta({
  description,
  schema = [],
  ruleName,
  type,
}: RuleMetaDefinition): Pick<Rule.RuleModule, "meta"> {
  return {
    meta: {
      // TODO: Consider changing default to "suggestion" in a future major release, because most rules are not fixing code issues, but only suggesting best practices.
      type: type || "problem",
      docs: {
        url: docsUrl(ruleName),
        description,
        category: "dependencies",
      },
      schema,
    },
  };
}
