import {
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jsBaseConfig,
  typescriptConfig,
} from "../eslint-config/index.js";

export default [
  typescriptConfig,
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  {
    ...jsBaseConfig,
    rules: {
      ...jsBaseConfig.rules,
      "import/extensions": 0,
    },
  },
  {
    ignores: ["test/configs-ts/**/*.js"],
  },
];
