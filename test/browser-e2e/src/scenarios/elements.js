import { Elements } from "@boundaries/elements";

import { QUICK_START_FILES, QUICK_START_SETTINGS } from "./quick-start.js";

/** @typedef {import("./index.js").Scenario} Scenario */

const DESCRIPTORS = {
  elements: [
    { type: "component", pattern: "src/components/*", capture: ["name"] },
    { type: "service", pattern: "src/services/*.ts", capture: ["name"] },
  ],
  files: [{ pattern: "**/*.spec.ts", category: "test" }],
};

const FILE_PATHS = [
  "src/components/Button/index.ts",
  "src/components/Button/Button.spec.ts",
  "src/services/Api.ts",
  "src/utils/helpers.ts",
];

/** @type {import("@boundaries/elements").DependencyDescriptorOptions[]} */
const DEPENDENCIES = [
  {
    from: "src/components/Button/index.ts",
    to: "src/services/Api.ts",
    source: "../../services/Api",
    kind: "value",
    nodeKind: "ImportDeclaration",
    specifiers: ["Api"],
  },
  ...[
    "node:fs",
    "node:test",
    "node:fs/promises",
    "fs",
    "fs/promises",
    "react",
    "@scope/package/subpath",
  ].map((source) => ({
    from: "src/services/Api.ts",
    source,
    kind: /** @type {const} */ ("value"),
  })),
];

const DEPENDENCY_SELECTORS = [
  {
    from: { element: { type: "component" } },
    to: { element: { type: "service" } },
  },
  { to: { module: { origin: "core", source: "{{ dependency.source }}" } } },
  { from: { element: { type: "{{ from.element.types.[0] }}" } } },
];

/**
 * Returns a matcher of the descriptors of the browser build check of `@boundaries/elements`.
 * @returns {import("@boundaries/elements").Matcher} The matcher.
 */
function getMatcher() {
  return new Elements().getMatcher(DESCRIPTORS);
}

/**
 * Scenarios of `@boundaries/elements`: the quick-start example of the docs, and the cases of its own browser build check.
 * @type {Scenario[]}
 */
export const ELEMENTS_SCENARIOS = [
  {
    name: "elements: describes each file of the quick-start example",
    run: () => {
      const matcher = new Elements().getMatcher({
        elements: QUICK_START_SETTINGS["boundaries/elements"],
        files: QUICK_START_SETTINGS["boundaries/files"],
      });
      return QUICK_START_FILES.map((filePath) => ({
        element: matcher.describeElement(filePath),
        file: matcher.describeFile(filePath),
      }));
    },
  },
  {
    name: "elements: describeElement",
    run: () => {
      const matcher = getMatcher();
      return FILE_PATHS.map((filePath) => matcher.describeElement(filePath));
    },
  },
  {
    name: "elements: describeFile",
    run: () => {
      const matcher = getMatcher();
      return FILE_PATHS.map((filePath) => matcher.describeFile(filePath));
    },
  },
  {
    name: "elements: describeDependency, node: sources included",
    run: () => {
      const matcher = getMatcher();
      return DEPENDENCIES.map((dependency) =>
        matcher.describeDependency(dependency)
      );
    },
  },
  {
    name: "elements: isDependencyMatch with templated selectors",
    run: () => {
      const matcher = getMatcher();
      return DEPENDENCIES.map((dependency) =>
        DEPENDENCY_SELECTORS.map((selector) =>
          matcher.isDependencyMatch(dependency, selector)
        )
      );
    },
  },
];
