import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  isLocalElement,
  type DependencyDescription,
} from "@boundaries/elements";

import { customErrorMessage, elementDescriptionMessage } from "../Messages";
import type { NoPrivateOptions } from "../Settings";
import {
  SETTINGS,
  RULE_NAMES_MAP,
  warnMigrationToElementTypes,
} from "../Settings";

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
  if (!privateParent) {
    return `Dependency is private`;
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
    warnMigrationToElementTypes(RULE_NAMES_MAP.NO_PRIVATE);
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
