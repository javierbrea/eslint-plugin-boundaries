// A CommonJS config, which loads the plugin and its strict config with require()
const boundaries = require("@boundaries/eslint-plugin");
const strictBoundariesConfig = require("@boundaries/eslint-plugin/strict");

const {
  default: baseBasicFixtureConfig,
} = require("./baseBasicFixture.config.js");

/** @type {import('@boundaries/eslint-plugin').Config} */
const boundariesConfig = {
  ...baseBasicFixtureConfig,
  // @ts-expect-error -- The types of v7 give require() the module namespace, { default: ... } (#584)
  plugins: { boundaries },
  rules: {
    // @ts-expect-error -- The types of v7 give require() the module namespace, { default: ... } (#584)
    ...strictBoundariesConfig.rules,
    ...baseBasicFixtureConfig.rules,
  },
};

/** @type {import('eslint').Linter.Config[]} */
module.exports = [boundariesConfig];
