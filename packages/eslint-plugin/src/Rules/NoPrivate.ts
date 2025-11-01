import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  isLocalDependencyElement,
  type DependencyDescription,
} from "@boundaries/elements";

import { customErrorMessage, elementMessage } from "../Messages";
import type { NoPrivateOptions } from "../Settings";
import { SETTINGS } from "../Settings";

import { dependencyRule } from "./Support";

const { RULE_NO_PRIVATE } = SETTINGS;

function errorMessage(
  dependency: DependencyDescription,
  options?: NoPrivateOptions
) {
  if (options?.message) {
    return customErrorMessage(options.message, dependency);
  }
  // @ts-expect-error could not be defined. TODO: I have to decide whether to unify properties in all elements, or to use type guards
  return `Dependency is private of element ${elementMessage(dependency.to.parents?.[0])}`;
}

export default dependencyRule<NoPrivateOptions>(
  {
    ruleName: RULE_NO_PRIVATE,
    description: `Prevent importing private elements of another element`,
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
      isLocalDependencyElement(dependency.to) &&
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
