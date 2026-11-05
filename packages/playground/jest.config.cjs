// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected.
  // Barrels only re-export (lint-enforced), and page objects, mocks and shared test helpers are test support
  collectCoverageFrom: [
    "src/**",
    "!src/**/index.ts",
    "!src/**/*.pom.ts",
    "!src/**/*.mock.{ts,tsx}",
    "!src/shared/testing/**",
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

  // A module name mapper for the "@/" alias of "src/", as in tsconfig.json and vite.config.js
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },

  // The playground runs only in browsers
  testEnvironment: "jsdom",

  // The glob patterns Jest uses to detect test files
  testMatch: ["<rootDir>/src/**/*.spec.{ts,tsx}"],
};
