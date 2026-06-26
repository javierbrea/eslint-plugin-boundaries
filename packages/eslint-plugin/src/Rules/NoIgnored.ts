import { warnOnce } from "../Debug";
import { migrationToV7GuideLink } from "../Settings";
import type { RuleName } from "../Shared";
import { RULE_NAMES_MAP } from "../Shared";

import { dependencyRule } from "./Support";

/**
 * Returns the `no-ignored-dependencies` rule, which prevents recognized elements from
 * importing ignored files.
 *
 * @param ruleName - Rule name to build the rule for. Defaults to the canonical name.
 *   When the deprecated `no-ignored` name is used, a one-time rename warning is emitted.
 * @returns ESLint rule definition.
 */
export default function getNoIgnoredDependenciesRule(
  ruleName: RuleName = RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES
) {
  return dependencyRule(
    {
      schema: [],
      ruleName,
      description: `Prevent dependencies to ignored files from recognized elements`,
    },
    function ({ dependency, node, context }) {
      if (ruleName === RULE_NAMES_MAP.NO_IGNORED) {
        warnOnce(
          `Rule name "${RULE_NAMES_MAP.NO_IGNORED}" is deprecated. Use "${RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES}" instead.`,
          migrationToV7GuideLink(
            "no-ignored-renamed-to-no-ignored-dependencies"
          )
        );
      }
      if (dependency.to.file.isIgnored) {
        context.report({
          message: `Dependencies to ignored files are not allowed`,
          node: node,
        });
      }
    },
    {
      validate: false,
    }
  );
}
