import boundaries from "@boundaries/eslint-plugin";
import type { Config } from "@boundaries/eslint-plugin";
import recommendedBoundariesConfig from "@boundaries/eslint-plugin/recommended";

import baseBasicFixtureConfig from "./baseBasicFixtureLegacy.config.js";

const config: Config = {
  ...baseBasicFixtureConfig,
  plugins: {
    boundaries,
  },
  rules: {
    ...recommendedBoundariesConfig.rules,
    ...baseBasicFixtureConfig.rules,
  },
};

export default [config];
