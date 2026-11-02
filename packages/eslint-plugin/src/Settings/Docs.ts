import { ruleDocsUrl } from "@boundaries/config";
import type { Rule } from "eslint";

import type { RuleName } from "../Shared";

/**
 * Builds the ESLint `meta.deprecated` info object for a rule replaced by another rule name
 * (e.g. a rename), so editors/tools can surface the deprecation without relying on the
 * runtime `warnOnce` message.
 * @param replacedByRuleName - The rule name that replaces the deprecated one.
 * @returns The `deprecated` metadata object consumed by ESLint's rule `meta`.
 */
export function deprecatedRuleInfo(
  replacedByRuleName: RuleName
): Rule.RuleMetaData["deprecated"] {
  return {
    message: `Use "${replacedByRuleName}" instead.`,
    url: ruleDocsUrl(replacedByRuleName),
    replacedBy: [
      {
        rule: {
          name: replacedByRuleName,
          url: ruleDocsUrl(replacedByRuleName),
        },
      },
    ],
  };
}
