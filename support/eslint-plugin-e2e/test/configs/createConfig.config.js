// Eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
import { createConfig } from "@boundaries/eslint-plugin/config";
// eslint-disable-next-line import/no-unresolved
import recommendedBoundariesConfig from "@boundaries/eslint-plugin/recommended";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

export default [
  createConfig({
    rules: /** @type {import('@boundaries/eslint-plugin').Rules} */ ({
      ...recommendedBoundariesConfig.rules,
      ...baseBasicFixtureConfig.rules,
    }),
    settings: {
      ...recommendedBoundariesConfig.settings,
      ...baseBasicFixtureConfig.settings,
    },
  }),
];
