import {
  defaultConfigWithoutTypescript,
  typescriptConfig,
  jestConfig,
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
];
