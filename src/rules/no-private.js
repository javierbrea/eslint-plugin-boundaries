const { RULE_NO_PRIVATE } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { dependencyLocation } = require("../helpers/rules");

module.exports = dependencyRule(
  {
    ruleName: RULE_NO_PRIVATE,
    description: `Prevent importing private elements of another element`,
    schema: [
      {
        type: "object",
        properties: {
          allowUncles: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  function ({ dependency, node, context, options }) {
    if (
      !dependency.isIgnored &&
      dependency.isLocal &&
      dependency.type &&
      dependency.parents.length &&
      dependency.relationship !== "internal" &&
      dependency.relationship !== "child" &&
      dependency.relationship !== "brother" &&
      (!options || !options.allowUncles || dependency.relationship !== "uncle")
    ) {
      context.report({
        message: `Dependency is private of another element`,
        node: node,
        ...dependencyLocation(node, context),
      });
    }
  },
  {
    validate: false,
  }
);
