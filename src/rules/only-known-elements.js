const { ONLY_KNOWN_ELEMENTS } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { dependencyLocation } = require("../helpers/rules");

module.exports = dependencyRule(
  {
    ruleName: ONLY_KNOWN_ELEMENTS,
    description: `Prevent importing unknown elements from known ones`,
  },
  function ({ dependency, node, context }) {
    if (!dependency.isIgnored && dependency.isLocal && !dependency.type) {
      context.report({
        message: `Importing unknown elements is not allowed`,
        node: node,
        ...dependencyLocation(node, context),
      });
    }
  },
  {
    validate: false,
  }
);
