import { ORIGINS_MAP } from "@boundaries/elements";

import { SETTINGS } from "../Shared";

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
      !dependency.to.element.isIgnored &&
      dependency.to.origin.kind === ORIGINS_MAP.LOCAL &&
      dependency.to.element.isUnknown
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
