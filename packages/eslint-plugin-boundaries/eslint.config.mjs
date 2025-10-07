import localRules from "eslint-plugin-local-rules";

import {
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jsBaseConfig,
  jestConfig,
  typescriptConfig,
} from "../eslint-config/index.js";

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
      ],
    },

    rules: {
      "local-rules/boundaries/element-types": [
        2,
        {
          default: "disallow",

          rules: [
            {
              from: "plugin",
              allow: ["constants", "config", "rule"],
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
              allow: ["constants", "helper", "core"],
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
    files: ["test/src/**/*.js"],
  },
];
