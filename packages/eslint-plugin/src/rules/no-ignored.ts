import { SETTINGS } from "../constants/settings";
import dependencyRule from "../rules-factories/dependency-rule";

const { RULE_NO_IGNORED } = SETTINGS;

export default dependencyRule(
  {
    ruleName: RULE_NO_IGNORED,
    description: `Prevent importing ignored files from recognized elements`,
  },
  function ({ dependency, node, context }) {
    if (dependency.isIgnored) {
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
