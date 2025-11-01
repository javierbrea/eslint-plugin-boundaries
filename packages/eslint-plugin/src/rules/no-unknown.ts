import { isLocalDependencyElement } from "@boundaries/elements";

import { SETTINGS } from "../constants/settings";
import dependencyRule from "../rules-factories/dependency-rule";
const { RULE_NO_UNKNOWN } = SETTINGS;

export default dependencyRule(
  {
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
