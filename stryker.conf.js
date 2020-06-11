const BRANCH_NAME = process.env.TRAVIS_CURRENT_BRANCH || process.env.BRANCH_NAME;
const STRYKER_DASHBOARD_API_KEY = process.env.STRYKER_DASHBOARD_API_KEY;

const BASE_CONFIG = {
  mutator: "javascript",
  files: ["*.js", "src/**/*.js", "test/**/*.js"],
  packageManager: "npm",
  thresholds: {
    high: 80,
    low: 60,
    break: 80,
  },
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "jest",
  coverageAnalysis: "off",
};

const config = {
  ...BASE_CONFIG,
  dashboard:
    BRANCH_NAME && STRYKER_DASHBOARD_API_KEY
      ? {
          project: "github.com/javierbrea/eslint-plugin-boundaries",
          version: BRANCH_NAME,
        }
      : undefined,
};

module.exports = config;
