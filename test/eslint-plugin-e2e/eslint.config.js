import config, {
  jsBaseConfig,
  typescriptConfig,
} from "../../support/eslint-config/index.js";

export default [
  ...config,
  typescriptConfig,
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
