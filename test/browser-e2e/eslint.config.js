import config, {
  createBrowserConfig,
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
      // Node.js and the browsers load the scenarios as ES modules, which need the file extensions
      "import/extensions": 0,
    },
  },
  {
    // The scenarios run in Node.js and in the browsers
    ...createBrowserConfig(
      "The scenarios must return the same results in Node.js and in the browsers."
    ),
    files: ["src/**/*.js"],
  },
  {
    ignores: ["test-results/**"],
  },
];
