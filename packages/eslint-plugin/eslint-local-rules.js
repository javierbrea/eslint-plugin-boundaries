// eslint-  disable-next-line import/extensions TODO: Enable rule again
const eslintPluginBoundaries = require("./dist/index.js");

module.exports = Object.keys(eslintPluginBoundaries.rules).reduce(
  (rules, ruleName) => {
    return {
      ...rules,
      [`boundaries/${ruleName}`]: eslintPluginBoundaries.rules[ruleName],
    };
  },
  {}
);
