// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */

const config = {
  mutate: ["src/**/*.ts"],
  packageManager: "pnpm",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  dashboard: {
    project: "github.com/javierbrea/eslint-plugin-boundaries",
  },
  testRunner: "jest",
  coverageAnalysis: "perTest",
  plugins: ["@stryker-mutator/jest-runner"],
  thresholds: { high: 90, low: 75, break: 75 },
};

export default config;
