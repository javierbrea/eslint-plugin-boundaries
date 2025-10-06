const eslintPluginBoundaries = require("./src/index.js");

module.exports = Object.keys(eslintPluginBoundaries.rules).reduce(
  (rules, ruleName) => {
    return {
      ...rules,
      [`boundaries/${ruleName}`]: eslintPluginBoundaries.rules[ruleName],
    };
  },
  {},
);
