import boundaries from "eslint-plugin-boundaries";
// eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
import strictBoundariesConfig from "eslint-plugin-boundaries/strict";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

export default [
  {
    ...baseBasicFixtureConfig,
    plugins: {
      boundaries,
    },
    rules: {
      ...strictBoundariesConfig.rules,
      ...baseBasicFixtureConfig.rules,
    },
  },
];
