import { ORIGINS_MAP } from "@boundaries/elements";

import { warnOnce } from "../Debug";
import { migrationToV7GuideLink, deprecatedRuleInfo } from "../Settings";
import type { NoUnknownDependenciesOptions, RuleName } from "../Shared";
import { NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP, RULE_NAMES_MAP } from "../Shared";

import { dependencyRule } from "./Support";

/** Which axes an unknown-dependency report should mention in its message. */
interface ReportedAxes {
  element: boolean;
  file: boolean;
}

/**
 * Decides whether a dependency should be reported as unknown for the given
 * `require` mode, and which axes the report should mention.
 * @param requireMode - The `require` option value.
 * @param elementUnknown - Whether the target element is unknown.
 * @param fileUnknown - Whether the target file is unknown.
 * @returns The reported axes, or `null` if the dependency should not be reported.
 */
function getReportedAxes(
  requireMode: NoUnknownDependenciesOptions["require"],
  elementUnknown: boolean,
  fileUnknown: boolean
): ReportedAxes | null {
  switch (requireMode) {
    case NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP.ALL:
      return elementUnknown || fileUnknown
        ? { element: elementUnknown, file: fileUnknown }
        : null;
    case NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP.ELEMENT:
      return elementUnknown ? { element: true, file: false } : null;
    case NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP.FILE:
      return fileUnknown ? { element: false, file: true } : null;
    case NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP.ANY:
    default:
      return elementUnknown && fileUnknown
        ? { element: true, file: true }
        : null;
  }
}

/**
 * Builds the default error message based on which unknown axes triggered the report.
 * @param axes - Which axes triggered the report.
 * @returns The error message reported by ESLint.
 */
function unknownDependencyMessage(axes: ReportedAxes): string {
  if (axes.element && axes.file) {
    return `Dependencies to unknown elements and files are not allowed`;
  }
  if (axes.element) {
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
              enum: Object.values(NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP),
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

      const requireMode =
        options?.require ?? NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP.ANY;
      const reportedAxes = getReportedAxes(
        requireMode,
        dependency.to.element.isUnknown,
        dependency.to.file.isUnknown
      );

      if (
        reportedAxes &&
        !dependency.to.element.isIgnored &&
        !dependency.to.file.isIgnored &&
        dependency.to.module.origin === ORIGINS_MAP.LOCAL
      ) {
        context.report({
          message: unknownDependencyMessage(reportedAxes),
          node: node,
        });
      }
    },
    {
      validate: false,
    }
  );
}
