// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ["src/**"],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "src/index.ts": {
      branches: 50,
    },
    // Decrease coverage due to cache branches
    "src/core/elementsInfo.ts": {
      branches: 90,
      statements: 90,
    },
  },

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
};
