import { ORIGINS_MAP } from "@boundaries/elements";

import { warnOnce } from "../Debug";
import { migrationToV7GuideLink, deprecatedRuleInfo } from "../Settings";
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
 * The `require` option controls which classification axes the target must be known
 * on for the dependency to be considered valid:
 * - `"any"` (default): known on at least one axis (element or file) is enough.
 *   Reported only when the target is unknown on both axes.
 * - `"element"`: the element axis must be known, regardless of the file axis.
 *   Reported when the target element is unknown.
 * - `"file"`: the file axis must be known, regardless of the element axis.
 *   Reported when the target file is unknown.
 * - `"all"`: both axes must be known. Reported when either axis is unknown.
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
      deprecated:
        ruleName === RULE_NAMES_MAP.NO_UNKNOWN
          ? deprecatedRuleInfo(RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES)
          : undefined,
      schema: [
        {
          type: "object",
          properties: {
            require: {
              type: "string",
              enum: ["any", "element", "file", "all"],
              description:
                "Which classification axes the dependency target must be known on to be valid. " +
                '"any" (default): known on at least one axis is enough; reports only when unknown on both. ' +
                '"element": the element axis must be known; reports when the element is unknown. ' +
                '"file": the file axis must be known; reports when the file is unknown. ' +
                '"all": both axes must be known; reports when either is unknown.',
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

      const requireMode = options?.require ?? "any";
      const elementUnknown = dependency.to.element.isUnknown;
      const fileUnknown = dependency.to.file.isUnknown;

      let onUnknownElement = false;
      let onUnknownFile = false;
      switch (requireMode) {
        case "any":
          // Report only when the target is unknown on BOTH axes.
          if (elementUnknown && fileUnknown) {
            onUnknownElement = true;
            onUnknownFile = true;
          }
          break;
        case "all":
          // Report when the target is unknown on EITHER axis.
          onUnknownElement = elementUnknown;
          onUnknownFile = fileUnknown;
          break;
        case "element":
          onUnknownElement = elementUnknown;
          break;
        case "file":
          onUnknownFile = fileUnknown;
          break;
      }

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
