import boundaries from "eslint-plugin-boundaries";

import config, {
  jestConfig,
  reactConfig,
  reactHooksConfig,
} from "../../support/eslint-config/index.js";

export default [
  ...config,
  {
    ignores: [".docusaurus/**"],
  },
  jestConfig,
  reactConfig,
  reactHooksConfig,
  {
    files: ["**/*.tsx", "**/*.ts"],
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-require-imports": [2, { allow: ["/.*\\.svg$"] }],
      "import/no-unresolved": [
        2,
        {
          ignore: ["^@theme", "^@docusaurus", "^@site"],
        },
      ],
    },
  },
  // The site's own layering, enforced with the published plugin like in any other project
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "page", pattern: "src/pages" },
        { type: "theme", pattern: "src/theme/*" },
        { type: "client", pattern: "src/client" },
        { type: "home", pattern: "src/components/home/*" },
        { type: "site", pattern: "src/components/site/*" },
        { type: "ui", pattern: "src/components/ui/*" },
        { type: "motion", pattern: "src/components/motion" },
        { type: "docs-component", pattern: "src/components/CodeDiff" },
        { type: "data", pattern: "src/data/*" },
        { type: "prism", pattern: "src/prism" },
      ],
    },
    rules: {
      ...boundaries.configs.recommended.rules,
      // Every source file belongs to an element, so a new folder is classified before it is used
      "boundaries/no-unknown-files": [2],
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          policies: [
            // External packages, Docusaurus aliases and Node core modules are unrestricted
            { allow: { to: { module: { origin: ["external", "core"] } } } },
            // Files of the same element may import each other
            { allow: { dependency: { relationship: { to: "internal" } } } },
            {
              from: { element: { type: "page" } },
              allow: {
                to: {
                  element: {
                    type: ["home", "site", "ui", "motion", "data", "prism"],
                  },
                },
              },
            },
            {
              from: { element: { type: "theme" } },
              allow: { to: { element: { type: ["site", "ui", "data"] } } },
            },
            {
              from: { element: { type: "home" } },
              allow: {
                to: { element: { type: ["ui", "motion", "data", "prism"] } },
              },
            },
            {
              from: { element: { type: "site" } },
              allow: { to: { element: { type: ["ui", "motion", "data"] } } },
            },
            {
              from: { element: { type: "ui" } },
              allow: { to: { element: { type: ["ui", "motion", "prism"] } } },
            },
            {
              from: { element: { type: "docs-component" } },
              allow: { to: { element: { type: ["prism", "ui"] } } },
            },
          ],
        },
      ],
    },
  },
];
