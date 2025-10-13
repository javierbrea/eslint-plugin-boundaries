// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "eslint/config";
// Eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
import { createConfig } from "eslint-plugin-boundaries/config";
// eslint-disable-next-line import/no-unresolved
import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

/** @type {import('eslint').Linter.Config[]} */
const config = defineConfig([
  createConfig({
    rules: /** @type {import('eslint-plugin-boundaries').Rules} */ ({
      ...recommendedBoundariesConfig.rules,
      ...baseBasicFixtureConfig.rules,
    }),
    settings: /** @type {import('eslint-plugin-boundaries').Settings} */ ({
      ...recommendedBoundariesConfig.settings,
      ...baseBasicFixtureConfig.settings,
    }),
  }),
]);

export default config;
