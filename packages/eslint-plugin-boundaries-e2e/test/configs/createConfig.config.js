// Eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
import { createConfig } from "eslint-plugin-boundaries/config";
// eslint-disable-next-line import/no-unresolved
import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

export default [
  createConfig({
    rules: /** @type {import('eslint-plugin-boundaries').Rules} */ ({
      ...recommendedBoundariesConfig.rules,
      ...baseBasicFixtureConfig.rules,
    }),
    settings: {
      ...recommendedBoundariesConfig.settings,
      ...baseBasicFixtureConfig.settings,
    },
  }),
];
