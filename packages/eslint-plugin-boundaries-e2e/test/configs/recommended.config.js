import boundaries from "eslint-plugin-boundaries";
// eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json
// eslint-disable-next-line import/no-unresolved
import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended";

import baseBasicFixtureConfig from "./baseBasicFixture.config.js";

export default [
  {
    ...baseBasicFixtureConfig,
    plugins: {
      boundaries,
    },
    rules: {
      ...recommendedBoundariesConfig.rules,
      ...baseBasicFixtureConfig.rules,
    },
  },
];
