import boundaries from "@boundaries/eslint-plugin";
import type { Config } from "@boundaries/eslint-plugin";
import recommendedBoundariesConfig from "@boundaries/eslint-plugin/recommended";
import type { Linter } from "eslint";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

const boundariesConfig: Config = {
  ...baseBasicFixtureConfig,
  plugins: {
    boundaries,
  },
  rules: {
    ...recommendedBoundariesConfig.rules,
    ...baseBasicFixtureConfig.rules,
  },
};

const config: Linter.Config[] = [boundariesConfig];

export default config;
