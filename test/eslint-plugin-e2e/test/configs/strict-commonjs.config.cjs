// A CommonJS config, which loads the plugin and its strict config with require()
const boundaries = require("@boundaries/eslint-plugin");
const strictBoundariesConfig = require("@boundaries/eslint-plugin/strict");

const {
  default: baseBasicFixtureConfig,
} = require("./baseBasicFixture.config.js");

/** @type {import('@boundaries/eslint-plugin').Config} */
const boundariesConfig = {
  ...baseBasicFixtureConfig,
  plugins: { boundaries },
  rules: {
    ...strictBoundariesConfig.rules,
    ...baseBasicFixtureConfig.rules,
  },
};

/** @type {import('eslint').Linter.Config[]} */
module.exports = [boundariesConfig];
