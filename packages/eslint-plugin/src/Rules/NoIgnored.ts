import { SETTINGS } from "../Settings";

import { dependencyRule } from "./Support";

const { RULE_NO_IGNORED } = SETTINGS;

export default dependencyRule(
  {
    ruleName: RULE_NO_IGNORED,
    description: `Prevent importing ignored files from recognized elements`,
  },
  function ({ dependency, node, context }) {
    if (dependency.to.isIgnored) {
      context.report({
        message: `Importing ignored files is not allowed`,
        node: node,
      });
    }
  },
  {
    validate: false,
  }
);
