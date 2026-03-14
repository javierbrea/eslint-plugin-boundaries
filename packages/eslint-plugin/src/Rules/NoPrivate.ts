import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  isLocalElement,
  type DependencyDescription,
} from "@boundaries/elements";

import { customErrorMessage, elementDescriptionMessage } from "../Messages";
import { warnMigrationToDependencies } from "../Settings";
import type { NoPrivateOptions } from "../Shared";
import { SETTINGS, RULE_NAMES_MAP, PLUGIN_ISSUES_URL } from "../Shared";

import { dependencyRule } from "./Support";

const { RULE_NO_PRIVATE } = SETTINGS;

/**
 * Builds the user-facing error message for private dependency violations.
 *
 * @param dependency - Described dependency that triggered the violation.
 * @param options - Optional rule options with custom message template.
 * @returns Final error message reported by ESLint.
 */
function errorMessage(
  dependency: DependencyDescription,
  options?: NoPrivateOptions
) {
  if (options?.message) {
    return customErrorMessage(options.message, dependency);
  }
  const privateParent = dependency.to.parents?.[0];
  /* istanbul ignore next - Defensive: This should not happen */
  if (!privateParent) {
    return `Not able to create a message for this violation. Please report this at: ${PLUGIN_ISSUES_URL}`;
  }
  return `Dependency is private of ${elementDescriptionMessage(
    privateParent,
    ["type", "category", "captured"],
    { singleElement: true }
  )}`;
}

export default dependencyRule<NoPrivateOptions>(
  {
    ruleName: RULE_NO_PRIVATE,
    description: `Prevent dependencies to private elements`,
    schema: [
      {
        type: "object",
        properties: {
          allowUncles: {
            type: "boolean",
          },
          message: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  function ({ dependency, node, context, options }) {
    warnMigrationToDependencies(RULE_NAMES_MAP.NO_PRIVATE);
    if (
      !dependency.to.isIgnored &&
      isLocalElement(dependency.to) &&
      dependency.to.type &&
      dependency.to.parents.length &&
      dependency.dependency.relationship.to !==
        DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL &&
      dependency.dependency.relationship.to !==
        DEPENDENCY_RELATIONSHIPS_MAP.CHILD &&
      dependency.dependency.relationship.to !==
        DEPENDENCY_RELATIONSHIPS_MAP.SIBLING &&
      (!options?.allowUncles ||
        dependency.dependency.relationship.to !==
          DEPENDENCY_RELATIONSHIPS_MAP.UNCLE)
    ) {
      context.report({
        message: errorMessage(dependency, options),
        node: node,
      });
    }
  },
  {
    validate: false,
  }
);
