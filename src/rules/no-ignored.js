const { RULE_NO_IGNORED } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { dependencyLocation } = require("../helpers/rules");

module.exports = dependencyRule(
  {
    ruleName: RULE_NO_IGNORED,
    description: `Prevent importing ignored files from recognized elements`,
  },
  function ({ dependency, node, context }) {
    if (dependency.isIgnored) {
      context.report({
        message: `Importing ignored files is not allowed`,
        node: node,
        ...dependencyLocation(node, context),
      });
    }
  },
  {
    validate: false,
  }
);
