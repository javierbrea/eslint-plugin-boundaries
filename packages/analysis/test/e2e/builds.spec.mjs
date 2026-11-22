import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { build } from "esbuild";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const requireFromPackage = createRequire(import.meta.url);

/** The packages that the sources import, which a bundle of this package leaves out or bundles too */
const DEPENDENCIES_NAMES = [
  "@boundaries/config",
  "@boundaries/elements",
  "@boundaries/policies",
];

const dependencyRoots = DEPENDENCIES_NAMES.map((name) =>
  dirname(requireFromPackage.resolve(`${name}/package.json`))
);

// The package loads itself by name, so each build is resolved through the conditions of its exports field, as it is for its consumers
const nodeCjsBuild = requireFromPackage("@boundaries/analysis");
// eslint-disable-next-line import/no-unresolved -- the import resolver does not resolve a package by its own name
const nodeEsmBuild = await import("@boundaries/analysis");

/**
 * The configuration of the quick-start guide of the docs, with a custom message that renders the type of the element that has the dependency.
 */
const QUICK_START_CONFIG = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", pattern: "components/*/*" },
      { type: "module", pattern: "modules/*" },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" },
    ],
  },
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

const FORMAT = "src/helpers/format/index.js";
const PRICE = "src/components/atoms/Price/index.js";
const PRICE_SPEC = "src/components/atoms/Price/Price.spec.js";
const CART = "src/modules/cart/index.js";

/**
 * Builds an `import` of a value with no names.
 * @param {string} from The file that has it.
 * @param {object} target What it points to.
 * @param {string} source The source its statement writes.
 * @returns {object} The dependency.
 */
function importOf(from, target, source) {
  return {
    from,
    target,
    syntax: "import",
    importKind: "value",
    specifiers: [],
    source,
  };
}

/**
 * The files of the quick-start example and their dependencies: a helper importing a component, a component importing a helper, a module importing a test file, and a component importing an external package.
 */
const PROJECT = {
  files: [FORMAT, PRICE, PRICE_SPEC, CART],
  dependencies: [
    importOf(
      FORMAT,
      { kind: "file", path: PRICE },
      "../../components/atoms/Price"
    ),
    importOf(PRICE, { kind: "file", path: FORMAT }, "../../../helpers/format"),
    importOf(
      CART,
      { kind: "file", path: PRICE_SPEC },
      "../../components/atoms/Price/Price.spec"
    ),
    importOf(PRICE, { kind: "external", name: "react" }, "react"),
  ],
};

const OPTIONS_PATH = ["rules", "boundaries/dependencies", 1];

/**
 * Analyzes the config of the quick-start example and evaluates its project with a build of the package.
 * @param {typeof nodeEsmBuild} api The public API of a build of the package.
 * @returns {any} The analysis of the project, converted to plain JSON values, so results from other realms can be compared. Its files, which are a `Map`, are converted to their entries.
 */
function getResults(api) {
  const analysis = api.evaluateProject(
    api.analyzeConfig(QUICK_START_CONFIG),
    PROJECT
  );
  return JSON.parse(
    JSON.stringify({ ...analysis, files: [...analysis.files] })
  );
}

/**
 * Reads the files that a bundle includes.
 * @param {import("esbuild").Metafile} metafile The metafile of the bundle.
 * @returns {string[]} The absolute paths of its inputs.
 */
function getInputs(metafile) {
  return Object.keys(metafile.inputs).map((input) =>
    resolve(packageRoot, input)
  );
}

/**
 * Bundles an entry with esbuild for browsers, without aliases or polyfills of Node.js modules and globals.
 * @param {string} contents The contents of the entry, which imports the package by name.
 * @param {string} browserBuild The file of the browser builds of this package and of the packages it imports that the entry has to resolve, so the test fails if the bundle falls back to a Node.js build.
 * @returns {Promise<string>} The code of the bundle, which assigns the entry exports to the `analysis` global.
 */
async function bundleForBrowsers(contents, browserBuild) {
  const result = await build({
    stdin: { contents, resolveDir: packageRoot, sourcefile: "entry.js" },
    absWorkingDir: packageRoot,
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "analysis",
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  assert.deepEqual(result.warnings, []);
  const inputs = getInputs(result.metafile);
  for (const root of [packageRoot, ...dependencyRoots]) {
    const buildPath = join(root, "dist", browserBuild);
    assert.ok(
      inputs.includes(buildPath),
      `The bundle does not include ${buildPath}`
    );
  }
  return result.outputFiles[0].text;
}

/**
 * Bundles an entry with esbuild for a platform that is neither Node.js nor a browser, so the package is resolved through the `default` condition of its exports field. The packages it imports are left out of the bundle and required at run time.
 * @param {string} contents The contents of the entry, which imports the package by name.
 * @param {string} defaultBuild The file of this package that the entry has to resolve.
 * @returns {Promise<string>} The code of the bundle, a CommonJS module.
 */
async function bundleWithDefaultCondition(contents, defaultBuild) {
  const result = await build({
    stdin: { contents, resolveDir: packageRoot, sourcefile: "entry.js" },
    absWorkingDir: packageRoot,
    bundle: true,
    platform: "neutral",
    format: "cjs",
    external: DEPENDENCIES_NAMES,
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  assert.deepEqual(result.warnings, []);
  const inputs = getInputs(result.metafile);
  const buildPath = join(packageRoot, "dist", defaultBuild);
  assert.deepEqual(
    inputs.filter((input) => input.startsWith(join(packageRoot, "dist"))),
    [buildPath],
    `The bundle does not include only ${buildPath}`
  );
  return result.outputFiles[0].text;
}

/**
 * Runs a bundle in a context without Node.js globals, like `process` or `require`.
 * @param {string} code The code of the bundle.
 * @returns {typeof nodeEsmBuild} The exports of the bundle.
 */
function runWithoutNodeGlobals(code) {
  const context = vm.createContext({});
  // eslint-disable-next-line sonarjs/code-eval -- The code is the bundle that the test builds from the package
  vm.runInContext(code, context);
  // eslint-disable-next-line sonarjs/code-eval -- The code checks a global of the context that runs the bundle
  assert.equal(vm.runInContext("typeof process", context), "undefined");
  // eslint-disable-next-line sonarjs/code-eval -- The code checks a global of the context that runs the bundle
  assert.equal(vm.runInContext("typeof require", context), "undefined");
  return context.analysis;
}

/**
 * Runs a CommonJS bundle in a context whose `require` loads the packages it leaves out.
 * @param {string} code The code of the bundle.
 * @returns {typeof nodeEsmBuild} The exports of the bundle.
 */
function runWithRequire(code) {
  const bundleModule = { exports: {} };
  const context = vm.createContext({
    module: bundleModule,
    exports: bundleModule.exports,
    require: requireFromPackage,
  });
  // eslint-disable-next-line sonarjs/code-eval -- The code is the bundle that the test builds from the package
  vm.runInContext(code, context);
  return bundleModule.exports;
}

describe("builds", () => {
  const expectedResults = getResults(nodeCjsBuild);

  it("should describe the files of the quick-start example with the Node.js CommonJS build", () => {
    assert.deepEqual(
      expectedResults.files.map(([path, { element, file }]) => [
        path,
        element.types,
        file.categories,
      ]),
      [
        [FORMAT, ["helper"], null],
        [PRICE, ["component"], null],
        [PRICE_SPEC, ["component"], ["test"]],
        [CART, ["module"], null],
      ]
    );
  });

  it("should evaluate the dependencies of the quick-start example with the Node.js CommonJS build", () => {
    assert.deepEqual(
      expectedResults.dependencies.map(({ verdict }) => verdict),
      [
        {
          status: "disallowed",
          policy: { index: null, path: [...OPTIONS_PATH, "default"] },
          message:
            'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
          level: "error",
        },
        {
          status: "allowed",
          policy: { index: 0, path: [...OPTIONS_PATH, "policies", 0] },
        },
        {
          status: "disallowed",
          policy: { index: 2, path: [...OPTIONS_PATH, "policies", 2] },
          message: "Do not import test files from modules",
          level: "error",
        },
        { status: "not-checked", reason: "not-local" },
      ]
    );
  });

  it("should count the files and the decisions of the quick-start example with the Node.js CommonJS build", () => {
    assert.deepEqual(
      {
        elementTypes: expectedResults.elementTypes.map(({ type, files }) => [
          type,
          files,
        ]),
        fileCategories: expectedResults.fileCategories.map(
          ({ category, files }) => [category, files]
        ),
        policies: expectedResults.policies.map(
          ({ index, decided, disallowed, errors }) => [
            index,
            decided,
            disallowed,
            errors,
          ]
        ),
      },
      {
        elementTypes: [
          ["helper", 1],
          ["component", 2],
          ["module", 1],
        ],
        fileCategories: [
          ["test", 1],
          ["style", 0],
        ],
        policies: [
          [0, 1, 0, 0],
          [1, 0, 0, 0],
          [2, 1, 1, 1],
          [null, 1, 1, 1],
        ],
      }
    );
  });

  it("should return the same results with the Node.js ES module build", () => {
    assert.deepEqual(getResults(nodeEsmBuild), expectedResults);
  });

  it("should return the same results with the browser build imported without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'export * from "@boundaries/analysis";',
      "index.browser.mjs"
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });

  it("should return the same results with the browser build required without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'module.exports = require("@boundaries/analysis");',
      "index.browser.js"
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });

  it("should return the same results with the build that the default condition imports", async () => {
    const code = await bundleWithDefaultCondition(
      'export * from "@boundaries/analysis";',
      "index.mjs"
    );

    assert.deepEqual(getResults(runWithRequire(code)), expectedResults);
  });

  it("should return the same results with the build that the default condition requires", async () => {
    const code = await bundleWithDefaultCondition(
      'module.exports = require("@boundaries/analysis");',
      "index.js"
    );

    assert.deepEqual(getResults(runWithRequire(code)), expectedResults);
  });
});
