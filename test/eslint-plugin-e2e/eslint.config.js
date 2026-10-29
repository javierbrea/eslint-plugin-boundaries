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
    // A Node.js script that runs the e2e tests, not a Jest spec
    files: ["test/e2e.spec.js"],
    rules: {
      "sonarjs/no-empty-test-file": 0,
    },
  },
  {
    ignores: [
      "test/configs-ts/**/*.js",
      "test/fixtures/performance/src/**/*.js",
    ],
  },
];
