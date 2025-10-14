import boundaries from "eslint-plugin-boundaries";
import type { Config } from "eslint-plugin-boundaries";
import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

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
