import eslintPluginEslintPlugin from "eslint-plugin-eslint-plugin";
import localRules from "eslint-plugin-local-rules";

import config, { jestConfig } from "../../support/eslint-config/index.js";

export default [
  ...config,
  {
    files: ["src/**/*.ts"],

    plugins: {
      "local-rules": localRules,
    },

    settings: {
      /* "boundaries/debug": {
        enabled: true,
        messages: {
          files: false,
          dependencies: false,
          violations: true,
        },
      },*/
      "boundaries/elements": [
        { type: "rule-support", pattern: "Rules/Support" },
        { type: "rule", pattern: "Rules" },
        { type: "config", pattern: "Config" },
        { type: "elements", pattern: "Elements" },
        { type: "settings", pattern: "Settings" },
        { type: "messages", pattern: "Messages" },
        { type: "debug", pattern: "Debug" },
        { type: "public", pattern: "Public" },
        { type: "shared", pattern: "Shared" },
      ],
      "boundaries/files": [
        { pattern: "**/*.spec.ts", category: "test" },
        // Only the root composition file, not the per-folder barrel index.ts files
        { pattern: "src/index.ts", category: "entry" },
      ],
    },

    rules: {
      "local-rules/boundaries/dependencies": [
        2,
        {
          default: "disallow",
          policies: [
            // External / Node core imports are unrestricted; we enforce internal layering only
            { allow: { to: { module: { origin: ["external", "core"] } } } },
            // Shared is the universal foundation: anything may import it (except public, see below)
            { allow: { to: { element: { type: "shared" } } } },
            // Same-element (same-folder) imports are always allowed
            { allow: { dependency: { relationship: { to: "internal" } } } },

            // Layered allowlist: each layer may only import strictly downward
            // (shared is omitted below, already covered by the universal policy above)
            {
              from: { element: { type: "messages" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "debug" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "settings" } },
              allow: { to: { element: { type: "debug" } } },
            },
            {
              from: { element: { type: "elements" } },
              allow: { to: { element: { type: "debug" } } },
            },
            {
              from: { element: { type: "rule-support" } },
              allow: {
                to: { element: { type: ["elements", "settings", "debug"] } },
              },
            },
            {
              from: { element: { type: "rule" } },
              allow: {
                to: {
                  element: {
                    type: [
                      "rule-support",
                      "elements",
                      "settings",
                      "messages",
                      "debug",
                    ],
                  },
                },
              },
            },
            // Public API surface: re-exports downward from messages/settings; consumed only by entry + config
            {
              from: { element: { type: "public" } },
              allow: { to: { element: { type: ["messages", "settings"] } } },
            },
            {
              from: { element: { type: "config" } },
              allow: {
                to: [
                  { element: { type: ["public", "settings"] } },
                  { file: { categories: "entry" } },
                ],
              },
            },
            // Root composition entry (src/index.ts) may import the top layers it wires together
            {
              from: { file: { categories: "entry" } },
              allow: {
                to: { element: { type: ["config", "rule", "public"] } },
              },
            },

            // Test files must never be imported from source code
            {
              disallow: { to: { file: { categories: "test" } } },
              message:
                "Do not import test files ({{to.file.categories}}) from source code",
            },
            // A test file may import anything it needs to test
            {
              from: { file: { categories: "test" } },
              allow: {
                to: [
                  { element: { type: "*" } },
                  { file: { categories: "entry" } },
                ],
              },
            },
          ],
        },
      ],
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
