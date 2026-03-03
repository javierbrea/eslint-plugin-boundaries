import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  isLocalElement,
  type DependencyDescription,
} from "@boundaries/elements";

import { legacyCustomErrorMessage, legacyElementMessage } from "../Messages";
import type { NoPrivateOptions } from "../Settings";
import { SETTINGS } from "../Settings";

import { dependencyRule } from "./Support";

const { RULE_NO_PRIVATE } = SETTINGS;

function errorMessage(
  dependency: DependencyDescription,
  options?: NoPrivateOptions
) {
  if (options?.message) {
    return legacyCustomErrorMessage(options.message, dependency);
  }
  const privateParent = dependency.to.parents?.[0];
  if (!privateParent) {
    return `Dependency is private`;
  }
  return `Dependency is private of element ${legacyElementMessage(privateParent)}`;
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
