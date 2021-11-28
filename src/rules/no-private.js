const { RULE_NO_PRIVATE } = require("../constants/settings");

const dependencyRule = require("../rules-factories/dependency-rule");

const { dependencyLocation } = require("../helpers/rules");
const { customErrorMessage, elementMessage } = require("../helpers/messages");

function errorMessage(file, dependency, options) {
  if (options.message) {
    return customErrorMessage(options.message, file, dependency);
  }
  return `Dependency is private of element ${elementMessage(dependency.parents[0])}`;
}

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
          message: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  function ({ file, dependency, node, context, options }) {
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
        message: errorMessage(file, dependency, options),
        node: node,
        ...dependencyLocation(node, context),
      });
    }
  },
  {
    validate: false,
  }
);
