import {
  defaultConfigWithoutTypescript,
  typescriptConfig,
  jestConfig,
  createBrowserConfig,
} from "../../support/eslint-config/index.js";

export default [
  ...defaultConfigWithoutTypescript,
  jestConfig,
  {
    ...typescriptConfig,
    languageOptions: {
      ...typescriptConfig.languageOptions,
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
  },
  createBrowserConfig("This package does not depend on the platform."),
];
