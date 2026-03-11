import type { Rule } from "eslint";

import { ruleDocsUrl } from "../../Settings";
import type { RuleMetaDefinition } from "../../Settings";

/**
 * Returns the meta object for an ESLint rule.
 * @param options The rule metadata definition.
 * @param options.description The description of the rule.
 * @param options.schema The JSON schema for rule options validation.
 * @param options.ruleName The name of the rule.
 * @param options.type The type of the rule (problem, suggestion, or layout).
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
        url: ruleDocsUrl(ruleName),
        description,
        category: "dependencies",
      },
      schema,
    },
  };
}
