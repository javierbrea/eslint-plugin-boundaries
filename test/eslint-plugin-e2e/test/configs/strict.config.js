import boundaries from "@boundaries/eslint-plugin";
// eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
import strictBoundariesConfig from "@boundaries/eslint-plugin/strict";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

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
export default [boundariesConfig];
