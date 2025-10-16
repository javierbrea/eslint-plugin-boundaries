// Eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
import { createConfig } from "@boundaries/eslint-plugin/config";
// eslint-disable-next-line import/no-unresolved
import recommendedBoundariesConfig from "@boundaries/eslint-plugin/recommended";
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "eslint/config";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

/** @type {import('eslint').Linter.Config[]} */
const config = defineConfig([
  createConfig({
    rules: /** @type {import('@boundaries/eslint-plugin').Rules} */ ({
      ...recommendedBoundariesConfig.rules,
      ...baseBasicFixtureConfig.rules,
    }),
    settings: /** @type {import('@boundaries/eslint-plugin').Settings} */ ({
      ...recommendedBoundariesConfig.settings,
      ...baseBasicFixtureConfig.settings,
    }),
  }),
]);

export default config;
