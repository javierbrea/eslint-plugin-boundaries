import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { build } from "esbuild";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// The package loads itself by name, so each build is resolved through the conditions of its exports field, as it is for its consumers
const nodeCjsBuild = createRequire(import.meta.url)("@boundaries/elements");
// eslint-disable-next-line import/no-unresolved -- the import resolver does not resolve a package by its own name
const nodeEsmBuild = await import("@boundaries/elements");

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
    "node:fs/promises",
    "fs",
    "fs/promises",
    "react",
    "@scope/package/subpath",
  ].map((source) => ({
    from: "src/services/Api.ts",
    source,
    kind: "value",
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
 * Describes and matches the same files and dependencies with a build of the package.
 * @param {typeof nodeEsmBuild} api The public API of a build of the package.
 * @returns {any} The results, converted to plain JSON values, so results from other realms can be compared.
 */
function getResults(api) {
  const matcher = new api.Elements().getMatcher(DESCRIPTORS);
  return JSON.parse(
    JSON.stringify({
      elements: FILE_PATHS.map((filePath) => matcher.describeElement(filePath)),
      files: FILE_PATHS.map((filePath) => matcher.describeFile(filePath)),
      dependencies: DEPENDENCIES.map((dependency) =>
        matcher.describeDependency(dependency)
      ),
      dependencyMatches: DEPENDENCIES.map((dependency) =>
        DEPENDENCY_SELECTORS.map((selector) =>
          matcher.isDependencyMatch(dependency, selector)
        )
      ),
    })
  );
}

/**
 * Bundles an entry with esbuild for browsers, without aliases or polyfills of Node.js modules and globals.
 * @param {string} contents The contents of the entry, which imports the package by name.
 * @returns {Promise<string>} The code of the bundle, which assigns the entry exports to the `elements` global.
 */
async function bundleForBrowsers(contents) {
  const result = await build({
    stdin: { contents, resolveDir: packageRoot, sourcefile: "entry.js" },
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "elements",
    write: false,
    logLevel: "silent",
  });
  assert.deepEqual(result.warnings, []);
  return result.outputFiles[0].text;
}

/**
 * Runs a bundle in a context without Node.js globals, like `process` or `require`.
 * @param {string} code The code of the bundle.
 * @returns {typeof nodeEsmBuild} The exports of the bundle.
 */
function runWithoutNodeGlobals(code) {
  const context = vm.createContext({});
  vm.runInContext(code, context);
  assert.equal(vm.runInContext("typeof process", context), "undefined");
  assert.equal(vm.runInContext("typeof require", context), "undefined");
  return context.elements;
}

describe("builds", () => {
  const expectedResults = getResults(nodeCjsBuild);

  it("should describe node: sources as core modules with the Node.js CommonJS build", () => {
    const origins = expectedResults.dependencies.map(
      (dependency) => dependency.to.module.origin
    );

    assert.deepEqual(origins, [
      "local",
      "core",
      "core",
      "core",
      "core",
      "external",
      "external",
    ]);
  });

  it("should return the same results with the Node.js ES module build", () => {
    assert.deepEqual(getResults(nodeEsmBuild), expectedResults);
  });

  it("should return the same results with the browser build imported without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'export * from "@boundaries/elements";'
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });

  it("should return the same results with the browser build required without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'module.exports = require("@boundaries/elements");'
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });
});
