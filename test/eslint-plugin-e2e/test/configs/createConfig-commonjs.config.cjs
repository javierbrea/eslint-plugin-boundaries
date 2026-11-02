// A CommonJS config, which loads createConfig and the strict config from /config with require()
const { createConfig, strict } = require("@boundaries/eslint-plugin/config");

const {
  default: baseBasicFixtureConfig,
} = require("./baseBasicFixture.config.js");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  createConfig({
    ...baseBasicFixtureConfig,
    rules: {
      ...strict.rules,
      ...baseBasicFixtureConfig.rules,
    },
  }),
];
