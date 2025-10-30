import {
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jsBaseConfig,
  jestConfig,
  typescriptConfig,
  // eslint-disable-next-line import/extensions
} from "../../support/eslint-config/index.js";

export default [
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jestConfig,
  jsBaseConfig,
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
