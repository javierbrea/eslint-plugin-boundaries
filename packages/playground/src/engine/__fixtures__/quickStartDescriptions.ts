import type { EntityDescription } from "@boundaries/elements";

/**
 * What `@boundaries/eslint-plugin` describes for each file of the quick-start project: the six files of `QUICK_START_FILES` in `test/browser-e2e/src/scenarios/quick-start.js`, with the settings of `QUICK_START_SETTINGS` in the same file. It is data only: the engine spec checks that `evaluate` describes the files the same way.
 *
 * Captured on 2026-11-04 with `@boundaries/eslint-plugin` 7.4.1, from the workspace build at `packages/eslint-plugin/dist`, and ESLint 9.39.5. To capture it again, create the six files in an empty folder, lint each one with the `ESLint` class (`cwd` in the folder, a flat config whose `files` match the JS and CSS files, with the plugin, the quick-start settings plus `"boundaries/debug": { enabled: true }`, and the rule `"boundaries/no-unknown-files": 2`, which describes every file it lints), with `FORCE_COLOR=0`, and copy the JSON that follows each `Description of file "<path>":` line that the plugin prints.
 */
export const QUICK_START_DESCRIPTIONS: Readonly<
  Record<string, EntityDescription>
> = {
  "src/helpers/format/index.js": {
    element: {
      filePath: "src/helpers/format/index.js",
      path: "src/helpers/format",
      fileInternalPath: "index.js",
      types: ["helper"],
      category: null,
      captured: null,
      isIgnored: false,
      isUnknown: false,
      parents: [],
    },
    file: {
      path: "src/helpers/format/index.js",
      categories: null,
      isIgnored: false,
      isUnknown: true,
      captured: null,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  },
  "src/components/atoms/Button/index.js": {
    element: {
      filePath: "src/components/atoms/Button/index.js",
      path: "src/components/atoms/Button",
      fileInternalPath: "index.js",
      types: ["component"],
      category: null,
      captured: null,
      isIgnored: false,
      isUnknown: false,
      parents: [],
    },
    file: {
      path: "src/components/atoms/Button/index.js",
      categories: null,
      isIgnored: false,
      isUnknown: true,
      captured: null,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  },
  "src/components/atoms/Button/Button.spec.js": {
    element: {
      filePath: "src/components/atoms/Button/Button.spec.js",
      path: "src/components/atoms/Button",
      fileInternalPath: "Button.spec.js",
      types: ["component"],
      category: null,
      captured: null,
      isIgnored: false,
      isUnknown: false,
      parents: [],
    },
    file: {
      path: "src/components/atoms/Button/Button.spec.js",
      categories: ["test"],
      isIgnored: false,
      isUnknown: false,
      captured: null,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  },
  "src/components/atoms/Button/Button.css": {
    element: {
      filePath: "src/components/atoms/Button/Button.css",
      path: "src/components/atoms/Button",
      fileInternalPath: "Button.css",
      types: ["component"],
      category: null,
      captured: null,
      isIgnored: false,
      isUnknown: false,
      parents: [],
    },
    file: {
      path: "src/components/atoms/Button/Button.css",
      categories: ["style"],
      isIgnored: false,
      isUnknown: false,
      captured: null,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  },
  "src/modules/checkout/index.js": {
    element: {
      filePath: "src/modules/checkout/index.js",
      path: "src/modules/checkout",
      fileInternalPath: "index.js",
      types: ["module"],
      category: null,
      captured: null,
      isIgnored: false,
      isUnknown: false,
      parents: [],
    },
    file: {
      path: "src/modules/checkout/index.js",
      categories: null,
      isIgnored: false,
      isUnknown: true,
      captured: null,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  },
  "src/index.js": {
    element: {
      path: null,
      fileInternalPath: null,
      filePath: null,
      parents: [],
      types: null,
      category: null,
      captured: null,
      isIgnored: false,
      isUnknown: true,
    },
    file: {
      path: "src/index.js",
      categories: null,
      isIgnored: false,
      isUnknown: true,
      captured: null,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  },
};
