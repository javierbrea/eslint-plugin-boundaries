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
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jsBaseConfig,
  typescriptConfig,
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
          pattern: ["src/Config/Config.ts"],
          capture: ["name"],
        },
        {
          type: "config",
          mode: "file",
          pattern: ["src/Config/*.ts", "(package.json)"],
          capture: ["name"],
        },
        {
          type: "constants",
          mode: "file",
          pattern: "src/Constants/*.ts",
          capture: ["name"],
        },
        {
          type: "elements",
          mode: "file",
          pattern: "src/Elements/*.ts",
        },
        {
          type: "messages",
          mode: "file",
          pattern: "src/Messages/*.ts",
        },
        {
          type: "public",
          mode: "file",
          pattern: "src/Public/*.ts",
          capture: ["name"],
        },
        {
          type: "rule",
          mode: "file",
          pattern: "src/Rules/*.ts",
          capture: ["name"],
        },
        {
          type: "settings",
          mode: "file",
          pattern: "src/Settings/*.ts",
          capture: ["name"],
        },
        {
          type: "support",
          mode: "file",
          pattern: "src/Support/*.ts",
          capture: ["name"],
        },
        {
          type: "rule-support",
          mode: "file",
          pattern: "src/Rules/Support/*.ts",
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
        0,
        {
          default: "disallow",

          rules: [
            {
              from: "*",
              allow: ["@boundaries/elements", "elements"],
            },
            {
              from: "rule",
              allow: ["rule"],
            },
            {
              from: "elements",
              allow: ["constants", "helper"],
            },
            {
              from: "messages",
              allow: ["constants", "support"],
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
              allow: ["constants", "helper", "core", "rule-support"],
            },
            {
              from: "rule-support",
              allow: ["constants", "helper", "core", "rule-support"],
            },
            {
              from: "public",
              allow: ["public", "constants", "config"],
            },
          ],
        },
      ],

      "local-rules/boundaries/no-unknown": [0],
      "local-rules/boundaries/no-unknown-files": [0],
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
