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
  createBrowserConfig(
    "Read it from globalThis, like the helpers in src/Shared/Platform.ts do."
  ),
];
