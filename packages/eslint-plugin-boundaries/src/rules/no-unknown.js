const { RULE_NO_UNKNOWN } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

module.exports = dependencyRule(
  {
    ruleName: RULE_NO_UNKNOWN,
    description: `Prevent importing unknown elements from the known ones`,
  },
  function ({ dependency, node, context }) {
    if (!dependency.isIgnored && dependency.isLocal && !dependency.type) {
      context.report({
        message: `Importing unknown elements is not allowed`,
        node: node,
      });
    }
  },
  {
    validate: false,
  },
);
