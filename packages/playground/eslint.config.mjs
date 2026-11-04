import boundaries from "eslint-plugin-boundaries";

import {
  defaultConfigWithoutTypescript,
  typescriptConfig,
  jestConfig,
  reactConfig,
  reactHooksConfig,
  createBrowserConfig,
} from "../../support/eslint-config/index.js";

export default [
  ...defaultConfigWithoutTypescript,
  jestConfig,
  {
    ...typescriptConfig,
    languageOptions: {
      ...typescriptConfig.languageOptions,
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
  },
  reactConfig,
  reactHooksConfig,
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "react/prop-types": "off",
    },
  },
  createBrowserConfig(
    "The playground runs only in browsers; the host passes what it needs through the contract."
  ),
  // The host owns the page, so the playground never imports from one
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@docusaurus/*",
                "@theme/*",
                "@theme-original/*",
                "@theme-init/*",
                "@generated/*",
                "@site/*",
                "infima",
                "infima/*",
              ],
              message:
                "The playground is host-agnostic: it receives what it needs through its props.",
            },
          ],
        },
      ],
    },
  },
  // The package's own layering, enforced with the workspace eslint-plugin-boundaries
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "contract", pattern: "src/contract" },
        { type: "sketch", pattern: "src/sketch" },
        { type: "engine", pattern: "src/engine" },
        { type: "examples", pattern: "src/examples" },
        // The state of an instance and its hooks: the panes depend on it, never the other way round
        { type: "ui-state", pattern: "src/ui/state" },
        // Presentational pieces that every pane uses, which know nothing of the state
        { type: "ui-shared", pattern: "src/ui/{common,icons}" },
        // A pane and its parts, such as the project pane or the problems panel
        { type: "ui-pane", pattern: "src/ui/*", capture: ["pane"] },
        // The workbench, which creates the state and lays out the panes
        { type: "ui-root", pattern: "src/ui" },
        { type: "theme", pattern: "src/theme" },
      ],
      "boundaries/files": [
        // The fixtures hold what only specs load, such as captured data and the stubs of browser APIs
        {
          pattern: ["**/*.spec.{ts,tsx}", "**/__fixtures__/**"],
          category: "test",
        },
        { pattern: "src/index.ts", category: "entry" },
        { pattern: "src/Playground.tsx", category: "app" },
      ],
      // The workspace packages resolve to their folders outside node_modules, so checkUnknownLocals would report them as unknown local files
      "boundaries/flag-as-external": {
        customSourcePatterns: ["@boundaries/*"],
      },
    },
    rules: {
      ...boundaries.configs.recommended.rules,
      // Every source file belongs to an element or a file category, so a new folder is classified before it is used
      "boundaries/no-unknown-files": [2],
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          // A relative import out of src/, such as one into the website, reaches no element, and is reported instead of skipped
          checkUnknownLocals: true,
          policies: [
            // External, core and same-element imports are skipped with the default options (checkAllOrigins and checkInternals off); these keep them allowed if either option is enabled
            { allow: { to: { module: { origin: ["external", "core"] } } } },
            { allow: { dependency: { relationship: { to: "internal" } } } },
            {
              from: { file: { categories: "entry" } },
              allow: {
                to: [
                  { file: { categories: "app" } },
                  { element: { type: ["contract", "examples"] } },
                ],
              },
            },
            {
              from: { file: { categories: "app" } },
              allow: {
                to: { element: { type: ["contract", "ui-root", "theme"] } },
              },
            },
            {
              from: { element: { type: "ui-root" } },
              allow: {
                to: {
                  element: {
                    type: ["contract", "ui-state", "ui-shared", "ui-pane"],
                  },
                },
              },
            },
            {
              from: { element: { type: "ui-pane" } },
              allow: {
                to: {
                  element: {
                    type: [
                      "contract",
                      "sketch",
                      "engine",
                      "theme",
                      "ui-state",
                      "ui-shared",
                    ],
                  },
                },
              },
            },
            // The node pane shows the config with the editor of the config pane
            {
              from: {
                element: { type: "ui-pane", captured: { pane: "node" } },
              },
              allow: {
                to: {
                  element: { type: "ui-pane", captured: { pane: "config" } },
                },
              },
            },
            {
              from: { element: { type: "ui-state" } },
              allow: {
                to: {
                  element: {
                    type: ["contract", "sketch", "engine", "ui-shared"],
                  },
                },
              },
            },
            {
              from: { element: { type: "ui-shared" } },
              allow: { to: { element: { type: ["theme", "ui-shared"] } } },
            },
            // The pure layers: operations on a sketch, its evaluation and the examples read the contract
            {
              from: { element: { type: ["sketch", "engine", "examples"] } },
              allow: { to: { element: { type: "contract" } } },
            },
            // The engine also reads the sketch, so that both agree on which nodes are files
            {
              from: { element: { type: "engine" } },
              allow: { to: { element: { type: "sketch" } } },
            },
            // Test files are never imported from source code
            {
              disallow: { to: { file: { categories: "test" } } },
              message: "Do not import test files from source code",
            },
            // A test file may import anything it needs to test
            {
              from: { file: { categories: "test" } },
              allow: {
                to: [
                  { element: { type: "*" } },
                  { file: { categories: ["entry", "app"] } },
                ],
              },
            },
          ],
        },
      ],
    },
  },
];
