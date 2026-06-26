import { ORIGINS_MAP } from "@boundaries/elements";

import { warnOnce } from "../Debug";
import { migrationToV7GuideLink } from "../Settings";
import type { NoUnknownDependenciesOptions, RuleName } from "../Shared";
import { RULE_NAMES_MAP } from "../Shared";

import { dependencyRule } from "./Support";

/**
 * Builds the default error message based on which unknown axes triggered the report.
 * @param onUnknownElement - Whether the report was triggered by an unknown element.
 * @param onUnknownFile - Whether the report was triggered by an unknown file.
 * @returns The error message reported by ESLint.
 */
function unknownDependencyMessage(
  onUnknownElement: boolean,
  onUnknownFile: boolean
): string {
  if (onUnknownElement && onUnknownFile) {
    return `Dependencies to unknown elements and files are not allowed`;
  }
  if (onUnknownElement) {
    return `Dependencies to unknown elements are not allowed`;
  }
  return `Dependencies to unknown files are not allowed`;
}

/**
 * Returns the `no-unknown-dependencies` rule, which prevents dependencies to targets
 * that are not recognized by any element or file descriptor.
 *
 * A dependency is reported when its target is an unknown element OR an unknown file.
 * The `allowUnknownElements` and `allowUnknownFiles` options each disable their axis:
 * - `allowUnknownElements` (default `false`): when `true`, unknown elements are allowed.
 * - `allowUnknownFiles` (default `true`): when `true`, unknown files are allowed.
 *
 * With the default options the rule reports only when the target element is unknown,
 * preserving the behavior of the deprecated `no-unknown` rule.
 *
 * @param ruleName - Rule name to build the rule for. Defaults to the canonical name.
 *   When the deprecated `no-unknown` name is used, a one-time rename warning is emitted.
 * @returns ESLint rule definition.
 */
export default function getNoUnknownDependenciesRule(
  ruleName: RuleName = RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES
) {
  return dependencyRule<NoUnknownDependenciesOptions>(
    {
      ruleName,
      description: `Prevent dependencies to unknown elements and files`,
      schema: [
        {
          type: "object",
          properties: {
            allowUnknownFiles: {
              type: "boolean",
              description:
                "When true, dependencies to unknown files (not matching any file descriptor) are allowed. Default to true.",
            },
            allowUnknownElements: {
              type: "boolean",
              description:
                "When true, dependencies to unknown elements (not matching any element descriptor) are allowed. Default to false.",
            },
          },
          additionalProperties: false,
        },
      ],
    },
    function ({ dependency, node, context, options }) {
      if (ruleName === RULE_NAMES_MAP.NO_UNKNOWN) {
        warnOnce(
          `Rule name "${RULE_NAMES_MAP.NO_UNKNOWN}" is deprecated. Use "${RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES}" instead.`,
          migrationToV7GuideLink(
            "no-unknown-renamed-to-no-unknown-dependencies"
          )
        );
      }

      const allowUnknownElements = options?.allowUnknownElements ?? false;
      const allowUnknownFiles = options?.allowUnknownFiles ?? true;

      const onUnknownElement =
        !allowUnknownElements && dependency.to.element.isUnknown;
      const onUnknownFile = !allowUnknownFiles && dependency.to.file.isUnknown;

      if (
        !dependency.to.element.isIgnored &&
        !dependency.to.file.isIgnored &&
        dependency.to.module.origin === ORIGINS_MAP.LOCAL &&
        (onUnknownElement || onUnknownFile)
      ) {
        context.report({
          message: unknownDependencyMessage(onUnknownElement, onUnknownFile),
          node: node,
        });
      }
    },
    {
      validate: false,
    }
  );
}
