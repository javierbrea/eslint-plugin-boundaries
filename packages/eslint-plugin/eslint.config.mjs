import eslintPluginEslintPlugin from "eslint-plugin-eslint-plugin";
// import localRules from "eslint-plugin-local-rules";

import config, { jestConfig } from "../../support/eslint-config/index.js";

export default [
  ...config,
  /*{
    files: ["** /*.ts"],
    plugins: {
      "local-rules": localRules,
    },
  },*/
  {
    files: ["src/**/*.ts"],

    settings: {
      /* "boundaries/debug": {
        enabled: true,
        messages: {
          files: false,
          dependencies: false,
          violations: true,
        },
      },

      "boundaries/elements": [
        {
          type: "@boundaries/elements",
          mode: "folder",
          pattern: "** /packages/elements/dist",
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
          type: "shared",
          mode: "file",
          pattern: "src/Shared/*.ts",
          capture: ["name"],
        },
        {
          type: "debug",
          mode: "file",
          pattern: "src/Debug/*.ts",
          capture: ["name"],
        },
        {
          type: "plugin",
          mode: "full",
          pattern: ["src/*.ts"],
        },
        {
          type: "test",
          mode: "full",
          pattern: ["src/** /*.spec.ts"],
        },
      ], */
    },

    rules: {
      /* "local-rules/boundaries/element-types": [
        2,
        {
          default: "disallow",

          rules: [
            {
              allow: [
                {
                  // Allow all elements importing the same type of element
                  to: { type: "{{ from.type }}" },
                },
                {
                  // Allow all elements importing the elements library
                  to: { type: "@boundaries/elements" },
                },
                {
                  from: { type: "test" },
                },
              ],
            },
            // Allow all elements importing settings and support
            {
              to: { type: ["settings", "shared", "debug"] },
              allow: {
                from: {
                  type: [
                    "rule",
                    "rule-support",
                    "elements",
                    "messages",
                    "plugin",
                    "config",
                    "public",
                    "config-utils",
                  ],
                },
              },
            },
            {
              from: { type: "settings" },
              allow: { to: { type: ["shared", "debug"] } },
            },
            {
              from: { type: "debug" },
              allow: [{ to: { type: ["shared"] } }],
            },
            {
              from: { type: "elements" },
              allow: { to: { type: "@boundaries/elements" } },
            },

            {
              from: { type: "rule" },
              allow: {
                to: { type: ["rule-support", "elements", "messages"] },
              },
            },
            {
              from: { type: "rule-support" },
              allow: {
                to: { type: "elements" },
              },
            },
            {
              from: { type: "config-utils" },
              allow: { to: { type: ["config", "public", "plugin"] } },
            },
            {
              from: { type: "plugin" },
              allow: { to: { type: ["config", "public", "rule"] } },
            },
            {
              from: { type: "public" },
              allow: { to: { type: ["messages"] } },
            },
          ],
        },
      ],

      "local-rules/boundaries/no-unknown": [2],
      "local-rules/boundaries/no-unknown-files": [2],
      "local-rules/boundaries/no-ignored": [2], */
    },
  },
  {
    ...jestConfig,
    files: ["test/**/*.js", "test/**/*.ts", "**/*.spec.ts"],
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
