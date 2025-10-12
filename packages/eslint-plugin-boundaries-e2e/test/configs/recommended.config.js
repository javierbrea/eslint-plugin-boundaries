import boundaries from "eslint-plugin-boundaries";
// eslint-disable-next-line import/no-unresolved
import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended"; // Eslint disabled because eslint-plugin-import seems not to be resolving exports defined in package.json

import baseBasicFixtureConfig from "./base-basic-fixture.config.js";

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
