import { isLocalDependencyElement } from "@boundaries/elements";

import { SETTINGS } from "../Settings";

import { dependencyRule } from "./Support";
const { RULE_NO_UNKNOWN } = SETTINGS;

export default dependencyRule(
  {
    schema: [],
    ruleName: RULE_NO_UNKNOWN,
    description: `Prevent importing unknown elements from the known ones`,
  },
  function ({ dependency, node, context }) {
    if (
      !dependency.to.isIgnored &&
      isLocalDependencyElement(dependency.to) &&
      dependency.to.isUnknown
    ) {
      context.report({
        message: `Importing unknown elements is not allowed`,
        node: node,
      });
    }
  },
  {
    validate: false,
  }
);
