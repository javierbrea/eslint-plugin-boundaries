// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected.
  // Only the files that have unit tests, listed one by one: Jest reports a listed file that no spec loads with no coverage, so a missing spec fails the threshold
  collectCoverageFrom: [
    "src/data/site/googleAnalyticsMode.ts",
    "src/client/consent-options.ts",
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: ["<rootDir>/src/**/*.spec.ts"],

  // The Babel options are inline because Docusaurus, with its SWC loader, warns on every build about a babel.config.js in the site folder
  transform: {
    "^.+\\.ts$": [
      "babel-jest",
      {
        configFile: false,
        babelrc: false,
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
        ],
      },
    ],
  },
};
