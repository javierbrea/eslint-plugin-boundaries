import localRules from "eslint-plugin-local-rules";

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
  typescriptConfig,
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jsBaseConfig,
  {
    files: ["**/*.ts"],
    plugins: {
      "local-rules": localRules,
    },
  },
  {
    files: ["src/**/*.ts"],

    settings: {
      "boundaries/dependency-nodes": [
        "require",
        "import",
        "dynamic-import",
        "export",
      ],

      "boundaries/elements": [
        {
          type: "@boundaries/elements",
          mode: "folder",
          pattern: "**/packages/elements/dist",
        },
        {
          type: "config-utils",
          mode: "file",
          pattern: ["src/configs/config.ts"],
          capture: ["name"],
        },
        {
          type: "config",
          mode: "file",
          pattern: ["src/configs/*.ts", "(package.json)"],
          capture: ["name"],
        },
        {
          type: "constants",
          mode: "file",
          pattern: "src/constants/*.ts",
          capture: ["name"],
        },
        {
          type: "core",
          mode: "file",
          pattern: "src/core/*.ts",
          capture: ["name"],
        },
        {
          type: "helper",
          mode: "file",
          pattern: "src/helpers/*.ts",
          capture: ["name"],
        },
        {
          type: "rule",
          mode: "file",
          pattern: "src/rules/*.ts",
          capture: ["name"],
        },
        {
          type: "rule-factory",
          mode: "file",
          pattern: "src/rules-factories/*.ts",
          capture: ["name"],
        },
        {
          type: "plugin",
          mode: "full",
          pattern: ["src/index.ts"],
        },
        {
          type: "types",
          mode: "file",
          pattern: "src/types/*.ts",
          capture: ["name"],
        },
      ],
    },

    rules: {
      "local-rules/boundaries/element-types": [
        2,
        {
          default: "disallow",

          rules: [
            {
              from: "*",
              allow: ["@boundaries/elements"],
            },
            {
              from: "config-utils",
              allow: ["plugin", "config", "constants", "types"],
            },
            {
              from: "plugin",
              allow: ["constants", "config", "rule", "types", "helper"],
            },
            {
              from: "config",
              allow: ["constants", "config"],
            },
            {
              from: "constants",
              allow: ["constants"],
            },
            {
              from: "core",
              allow: ["constants", "helper", "core"],
            },
            {
              from: "helper",
              allow: ["constants", "helper"],
            },
            {
              from: "rule",
              allow: ["constants", "helper", "core", "rule-factory"],
            },
            {
              from: "rule-factory",
              allow: ["constants", "helper", "core", "rule-factory"],
            },
            {
              from: "types",
              allow: ["types", "constants", "config"],
            },
          ],
        },
      ],

      "local-rules/boundaries/no-unknown": [2],
      "local-rules/boundaries/no-unknown-files": [2],
    },
  },
  {
    ...jestConfig,
    files: ["test/**/*.js", "test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": [0],
    },
  },
];
