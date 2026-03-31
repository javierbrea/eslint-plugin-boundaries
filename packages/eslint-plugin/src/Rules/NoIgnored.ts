import { SETTINGS } from "../Shared";

import { dependencyRule } from "./Support";

const { RULE_NO_IGNORED } = SETTINGS;

export default dependencyRule(
  {
    schema: [],
    ruleName: RULE_NO_IGNORED,
    description: `Prevent dependencies to ignored files from recognized elements`,
  },
  function ({ dependency, node, context }) {
    if (dependency.to.file.isIgnored) {
      context.report({
        message: `Dependencies to ignored files are not allowed`,
        node: node,
      });
    }
  },
  {
    validate: false,
  }
);
