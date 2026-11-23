import boundaries from "eslint-plugin-boundaries";

import {
  defaultConfigWithoutTypescript,
  typescriptConfig,
  jestConfig,
  createBrowserConfig,
} from "../../support/eslint-config/index.js";

// Each element is a folder of src/. Patterns are anchored at the package root, so that a folder of the same name elsewhere is never taken for an element
const ELEMENTS = [
  { type: "shared", pattern: "src/Shared", partialMatch: false },
  { type: "written-config", pattern: "src/WrittenConfig", partialMatch: false },
  { type: "config", pattern: "src/Config", partialMatch: false },
  { type: "evaluation", pattern: "src/Evaluation", partialMatch: false },
];

const FILES = [
  // The file that an element exposes to the others. Any index.ts matches, so policies also check `fileInternalPath`
  { pattern: "src/**/index.ts", category: "entry" },
  // The public interface of the package
  { pattern: "src/index.ts", category: "package-entry" },
  { pattern: "src/**/*.spec.ts", category: "test" },
];

// The element types that each element type may import, always through their entry
const LAYER_TARGETS = {
  shared: [],
  "written-config": ["shared"],
  config: ["shared", "written-config"],
  // The evaluation never reads the config as written, only what the config element made of it
  evaluation: ["config"],
};

const ELEMENT_TYPES = Object.keys(LAYER_TARGETS);

// The only external modules that the sources import, which run in browsers too
const PACKAGES = [
  "@boundaries/config",
  "@boundaries/policies",
  "@boundaries/elements",
];

// The entry of an element. `entry` matches any index.ts, and `fileInternalPath` keeps a nested one private to its element
const entryOf = (types) => ({
  element: { type: types, fileInternalPath: "index.ts" },
  file: { categories: "entry" },
});

const POLICIES = [
  // An element may always import itself. The restriction on test files comes after and overrides this
  { allow: { dependency: { relationship: { to: "internal" } } } },

  // The layers: each type imports only the entries of the types it lists
  ...Object.entries(LAYER_TARGETS)
    .filter(([, targets]) => targets.length > 0)
    .map(([type, targets]) => ({
      from: { element: { type } },
      allow: { to: entryOf(targets) },
    })),

  // External modules: only the packages of the evaluation, so that no element depends on the platform
  {
    from: { element: { type: ELEMENT_TYPES } },
    allow: { to: { module: { origin: "external", source: PACKAGES } } },
  },

  // The package entry exposes only what the config and the evaluation elements export
  {
    from: { file: { categories: "package-entry" } },
    allow: { to: entryOf(["config", "evaluation"]) },
  },

  // Nothing imports a test file, not even another spec
  {
    disallow: { to: { file: { categories: "test" } } },
    message: "Do not import test files from source code",
  },

  // A spec may import the entry of any element, the package entry and any external module
  {
    from: { file: { categories: "test" } },
    allow: {
      to: [
        entryOf(ELEMENT_TYPES),
        { file: { categories: "package-entry" } },
        { module: { origin: "external" } },
      ],
    },
  },
];

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
  createBrowserConfig("This package does not depend on the platform."),
  // The module functions of @boundaries/policies keep every matcher and what it caches for the life of the module, so the sources describe and evaluate through the Policies instance of the settings of an analysis, which is freed with the analysis. Specs may call them to compute what they expect
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@boundaries/policies",
              importNames: [
                "getMatcher",
                "describeEntity",
                "describeDependency",
                "evaluatePolicies",
                "evaluateDependency",
              ],
              message:
                "It keeps what it builds for the life of the module. Describe and evaluate with the Policies instance that getPolicies of src/Evaluation/PoliciesInstances.ts returns for the settings of the analysis.",
            },
          ],
        },
      ],
    },
  },
  // The package's own layering, enforced with the workspace eslint-plugin-boundaries
  {
    files: ["src/**/*.ts"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": ELEMENTS,
      "boundaries/files": FILES,
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
          // A relative import of a file that no element or category classifies is reported instead of skipped
          checkUnknownLocals: true,
          // External and core modules are checked too, so that only the listed packages are imported
          checkAllOrigins: true,
          // An import of a file of the same element is checked too, so that source code never imports a spec
          checkInternals: true,
          policies: POLICIES,
        },
      ],
    },
  },
];
