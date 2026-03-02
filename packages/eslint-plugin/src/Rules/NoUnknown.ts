import { isLocalElement } from "@boundaries/elements";

import { SETTINGS } from "../Settings";

import { dependencyRule } from "./Support";
const { RULE_NO_UNKNOWN } = SETTINGS;

export default dependencyRule(
  {
    schema: [],
    ruleName: RULE_NO_UNKNOWN,
    description: `Prevent dependencies to unknown elements`,
  },
  function ({ dependency, node, context }) {
    if (
      !dependency.to.isIgnored &&
      isLocalElement(dependency.to) &&
      dependency.to.isUnknown
    ) {
      context.report({
        message: `Dependencies to unknown elements are not allowed`,
        node: node,
      });
    }
  },
  {
    validate: false,
  }
);
