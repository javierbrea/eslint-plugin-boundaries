import { analyzeConfig, evaluateProject } from "@boundaries/analysis";

import { QUICK_START_FILES, QUICK_START_SETTINGS } from "./quick-start.js";

/** @typedef {import("./index.js").Scenario} Scenario */

/**
 * The config of the quick-start example, with a custom message on its policy of test files, which Handlebars renders.
 */
const QUICK_START_CONFIG = {
  settings: QUICK_START_SETTINGS,
  rules: {
    "boundaries/dependencies": [
      2,
      {
        default: "disallow",
        policies: [
          {
            from: { element: { type: "component" } },
            allow: { to: { element: { type: "helper" } } },
          },
          {
            from: { element: { type: "module" } },
            allow: { to: { element: { types: ["component", "helper"] } } },
          },
          {
            disallow: { to: { file: { categories: "test" } } },
            message:
              "Do not import test files from {{ from.element.types.[0] }}s",
          },
        ],
      },
    ],
  },
};

/**
 * A config with an element descriptor without a type, a deprecated selector, and a policy half written, whose selector cannot be normalized.
 */
const CONFIG_WITH_PROBLEMS = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { pattern: "components/*/*" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        policies: [
          { from: "helper", allow: { to: { element: { type: "helper" } } } },
          { disallow: {} },
        ],
      },
    ],
  },
};

const [HELPER, BUTTON, BUTTON_SPEC, BUTTON_STYLE, CHECKOUT, INDEX] =
  QUICK_START_FILES;

/**
 * The dependencies of the files of the quick-start example: file and external targets, every syntax, and one dependency for each verdict of the rule.
 * @type {import("@boundaries/analysis").ProjectDependency[]}
 */
const QUICK_START_DEPENDENCIES = [
  {
    from: HELPER,
    target: { kind: "file", path: BUTTON },
    syntax: "import",
    importKind: "value",
    specifiers: [{ kind: "named", name: "Button" }],
    source: "../../components/atoms/Button",
  },
  {
    from: BUTTON,
    target: { kind: "file", path: HELPER },
    syntax: "import",
    importKind: "value",
    specifiers: [{ kind: "default", name: "default", alias: "format" }],
    source: "../../../helpers/format",
  },
  {
    from: BUTTON,
    target: { kind: "file", path: BUTTON_STYLE },
    syntax: "import",
    importKind: "value",
    specifiers: [],
    source: "./Button.css",
  },
  {
    from: BUTTON,
    target: { kind: "external", name: "react" },
    syntax: "import",
    importKind: "value",
    specifiers: [{ kind: "named", name: "useState" }],
    source: "react",
  },
  {
    from: CHECKOUT,
    target: { kind: "file", path: BUTTON },
    syntax: "export-from",
    importKind: "type",
    specifiers: [{ kind: "named", name: "Button", alias: "CheckoutButton" }],
    source: "../../components/atoms/Button",
  },
  {
    from: CHECKOUT,
    target: { kind: "file", path: BUTTON_SPEC },
    syntax: "require",
    importKind: "value",
    specifiers: [],
    source: "../../components/atoms/Button/Button.spec",
  },
  {
    from: CHECKOUT,
    target: { kind: "external", name: "node:fs" },
    syntax: "dynamic-import",
    importKind: "value",
    specifiers: [],
    source: "node:fs",
  },
  {
    from: INDEX,
    target: { kind: "file", path: CHECKOUT },
    syntax: "import",
    importKind: "value",
    specifiers: [{ kind: "namespace", name: "*", alias: "checkout" }],
    source: "./modules/checkout",
  },
];

/**
 * Analyzes a config and evaluates the files and dependencies of the quick-start example against it.
 * @param {import("@boundaries/analysis").ProjectConfig} config The config.
 * @returns {unknown} The analysis of the project, with its files, which are a `Map`, as their entries, so that the comparison of the results includes them.
 */
function evaluateQuickStartProject(config) {
  const analysis = evaluateProject(analyzeConfig(config), {
    files: QUICK_START_FILES,
    dependencies: QUICK_START_DEPENDENCIES,
  });
  return { ...analysis, files: [...analysis.files] };
}

/**
 * Scenarios of `@boundaries/analysis`: the quick-start example of the docs with a custom message, and the files and dependencies of the example against a config with problems.
 * @type {Scenario[]}
 */
export const ANALYSIS_SCENARIOS = [
  {
    name: "analysis: analyzeConfig of the quick-start example with a custom message",
    run: () => analyzeConfig(QUICK_START_CONFIG),
  },
  {
    name: "analysis: evaluateProject of the quick-start example with a custom message",
    run: () => evaluateQuickStartProject(QUICK_START_CONFIG),
  },
  {
    name: "analysis: evaluateProject with an element descriptor without a type, a deprecated selector and a policy half written",
    run: () => evaluateQuickStartProject(CONFIG_WITH_PROBLEMS),
  },
];
