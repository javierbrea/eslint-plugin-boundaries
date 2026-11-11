import boundaries from "eslint-plugin-boundaries";

import config, {
  createFixedWaitConfig,
  jestConfig,
  reactConfig,
  reactHooksConfig,
} from "../../support/eslint-config/index.js";

// The Playwright page objects of the site and the `./playwright` entry that exports them. They run in Node.js, inside the Playwright runner, and never in the site
const PLAYWRIGHT_FILES = ["src/playwright.ts", "src/**/*.playwright.ts"];
const PLAYWRIGHT_CATEGORIES = ["playwright", "playwright-entry"];

// Every dependency has a module with one of these three origins, so the selector matches any dependency, which the policies of the element that holds the file would otherwise allow
const PLAYWRIGHT_ANYTHING = {
  to: { module: { origin: ["local", "external", "core"] } },
};

// The modules that only Playwright files import: the test runner and the `./playwright` entry of the playground, whose source is its package name and whose internal path is the entry
const PLAYWRIGHT_MODULES = [
  { module: { origin: "external", source: "@playwright/test" } },
  {
    module: {
      origin: "external",
      source: "@boundaries/playground",
      internalPath: "playwright",
    },
  },
];

export default [
  ...config,
  {
    ignores: [".docusaurus/**"],
  },
  {
    // The social card is rendered from an http origin that no request reaches, because a route answers them from the website files
    files: ["scripts/social-card.mjs"],
    rules: {
      "sonarjs/no-clear-text-protocols": "off",
    },
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
  // The main entry of the playground loads only in its own chunk, so no file imports a value from it statically; the docs components import `@boundaries/playground/share`, its light entry, statically
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        2,
        {
          paths: [
            {
              name: "@boundaries/playground",
              allowTypeImports: true,
              message:
                "Load the playground with import() inside React.lazy, so that only its page requests the chunk.",
            },
          ],
        },
      ],
    },
  },
  // The Playwright files never wait with a fixed wait, on a selector or on the network
  createFixedWaitConfig(PLAYWRIGHT_FILES),
  // The site's own layering, enforced with the workspace eslint-plugin-boundaries
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
        {
          type: "docs-component",
          pattern: [
            "src/components/CodeDiff",
            "src/components/OpenInPlayground",
          ],
        },
        { type: "data", pattern: "src/data/*" },
        { type: "prism", pattern: "src/prism" },
      ],
      "boundaries/files": [
        { pattern: "src/**/*.constants.ts", category: "constants" },
        // The Playwright page objects, beside the component or the page they describe: every `*.playwright.ts` file, as the builds, the routes and the wait guards take them
        { pattern: "src/**/*.playwright.ts", category: "playwright" },
        // The `./playwright` entry of the package, which exports them
        { pattern: "src/playwright.ts", category: "playwright-entry" },
      ],
      // The workspace packages resolve to their folders outside node_modules, so they would be unknown local files instead of the external packages that the policies name
      "boundaries/flag-as-external": {
        customSourcePatterns: ["@boundaries/**"],
      },
    },
    rules: {
      ...boundaries.configs.recommended.rules,
      // Every source file belongs to an element, so a new folder is classified before it is used
      "boundaries/no-unknown-files": [2],
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          // An import of a file of the same element is checked too, since a page object lives in the element of the page it describes and must stay out of its code
          checkInternals: true,
          // External and core modules are checked too: only Playwright files import the packages of the browser tests
          checkAllOrigins: true,
          policies: [
            // External, core and same-element imports are skipped with the default options (checkAllOrigins and checkInternals off); these keep them allowed if either option is enabled
            { allow: { to: { module: { origin: ["external", "core"] } } } },
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
              allow: { to: { element: { type: ["prism", "ui", "data"] } } },
            },
            // The Playwright files run in Node.js, in the Playwright runner, and never in the site: only they import each other, the entry and the packages of the browser tests. Each of them imports only those packages, the page objects of the site and constants files, so that its build holds no React, Docusaurus or component. These come last because the last policy that matches wins
            {
              disallow: { to: { file: { categories: PLAYWRIGHT_CATEGORIES } } },
              message:
                "Only the Playwright page objects and the ./playwright entry import a Playwright page object. The site never does",
            },
            {
              disallow: { to: PLAYWRIGHT_MODULES },
              message:
                "Only the Playwright page objects and the ./playwright entry import @playwright/test and @boundaries/playground/playwright: they run in Node.js, in the Playwright runner",
            },
            {
              from: { file: { categories: PLAYWRIGHT_CATEGORIES } },
              disallow: PLAYWRIGHT_ANYTHING,
              message:
                "A Playwright page object imports only @playwright/test, @boundaries/playground/playwright, other Playwright page objects and constants files. The ./playwright entry imports only the page objects. They load no React, Docusaurus or component",
            },
            {
              from: { file: { categories: "playwright" } },
              allow: {
                to: [
                  ...PLAYWRIGHT_MODULES,
                  { file: { categories: ["playwright", "constants"] } },
                ],
              },
            },
            {
              from: { file: { categories: "playwright-entry" } },
              allow: { to: { file: { categories: "playwright" } } },
            },
          ],
        },
      ],
    },
  },
];
