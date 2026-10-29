// A CommonJS config, which loads the plugin and its recommended config with require()
const boundaries = require("@boundaries/eslint-plugin");
const recommendedBoundariesConfig = require("@boundaries/eslint-plugin/recommended");

const {
  default: baseBasicFixtureConfig,
} = require("./baseBasicFixture.config.js");

/** @type {import('@boundaries/eslint-plugin').Config} */
const boundariesConfig = {
  ...baseBasicFixtureConfig,
  plugins: { boundaries },
  rules: {
    ...recommendedBoundariesConfig.rules,
    ...baseBasicFixtureConfig.rules,
  },
};

/** @type {import('eslint').Linter.Config[]} */
module.exports = [boundariesConfig];
