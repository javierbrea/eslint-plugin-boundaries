import eslintPluginEslintPlugin from "eslint-plugin-eslint-plugin";
import localRules from "eslint-plugin-local-rules";

import config, { jestConfig } from "../../support/eslint-config/index.js";

export default [
  ...config,
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
          type: "rule-support",
          mode: "file",
          pattern: "src/Rules/Support/*.ts",
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
              from: "*",
              allow: ["@boundaries/elements", "elements"],
            },
            {
              from: "rule",
              allow: ["rule", "rule-support", "settings", "support"],
            },
            {
              from: "elements",
              allow: ["elements", "settings", "support"],
            },
            {
              from: "messages",
              allow: ["messages", "settings", "support"],
            },
            {
              from: "config-utils",
              allow: ["config-utils", "settings", "config", "public", "plugin"],
            },
            {
              from: "plugin",
              allow: ["settings", "support", "config", "rule"],
            },
            {
              from: "config",
              allow: ["config", "settings", "support"],
            },
            {
              from: "rule",
              allow: ["rule", "messages", "settings", "support"],
            },
            {
              from: "rule-support",
              allow: ["rule-support", "settings", "support"],
            },
            {
              from: "settings",
              allow: ["settings", "support"],
            },
            {
              from: "support",
              // TODO: Cyclic dependency detected between settings and support. Fix it.
              allow: ["support", "settings"],
            },
            {
              from: "public",
              allow: ["public", "settings", "config"],
            },
            {
              from: "plugin",
              allow: ["settings", "support", "config", "rule", "public"],
            },
          ],
        },
      ],

      "local-rules/boundaries/no-unknown": [2],
      "local-rules/boundaries/no-unknown-files": [2],
      "local-rules/boundaries/no-ignored": [2],
    },
  },
  {
    ...jestConfig,
    files: ["test/**/*.js", "test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": [0],
    },
  },
  {
    files: ["src/**/*.ts", "test/**/*.spec.ts"],
    plugins: {
      "eslint-plugin": eslintPluginEslintPlugin,
    },
    rules: {
      ...eslintPluginEslintPlugin.configs["rules-recommended"].rules,
      "eslint-plugin/prefer-message-ids": [0], // NOTE: Messages are not static, they depend on runtime data and configuration.
      "eslint-plugin/require-meta-type": [0], // NOTE: Handled by custom rule meta helper.
      "eslint-plugin/require-meta-schema": [0],
    },
  },
];
