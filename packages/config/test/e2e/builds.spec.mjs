import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { build } from "esbuild";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const requireFromPackage = createRequire(import.meta.url);
const elementsRoot = dirname(
  requireFromPackage.resolve("@boundaries/elements/package.json")
);

// The package loads itself by name, so each build is resolved through the conditions of its exports field, as it is for its consumers
const nodeCjsBuild = requireFromPackage("@boundaries/config");
// eslint-disable-next-line import/no-unresolved -- the import resolver does not resolve a package by its own name
const nodeEsmBuild = await import("@boundaries/config");

/**
 * The configuration of the quick-start guide of the docs.
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
          },
        ],
      },
    ],
  },
};

/**
 * A configuration with an invalid element descriptor and a deprecated selector.
 */
const CONFIG_WITH_PROBLEMS = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { pattern: "components/*" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        policies: [
          { from: "helper", allow: { to: { element: { type: "helper" } } } },
        ],
      },
    ],
    "boundaries/no-private": [2, { allowUncles: "yes" }],
  },
};

/**
 * Normalizes and validates the same configurations and options with a build of the package.
 * @param {typeof nodeEsmBuild} api The public API of a build of the package.
 * @returns {any} The results, converted to plain JSON values, so results from other realms can be compared.
 */
function getResults(api) {
  return JSON.parse(
    JSON.stringify({
      quickStart: api.normalizeConfig(QUICK_START_CONFIG),
      withProblems: api.normalizeConfig(CONFIG_WITH_PROBLEMS, {
        rootPath: "/repo",
      }),
      ruleOptions: api.validateRuleOptions(
        "boundaries/dependencies",
        { policies: [{ allow: "*", importKind: 2 }], unknownOption: true },
        { legacyWarnings: true }
      ),
      schema: api.getRuleOptionsSchema("boundaries/external"),
    })
  );
}

/**
 * Bundles an entry with esbuild for browsers, without aliases or polyfills of Node.js modules and globals.
 * @param {string} contents The contents of the entry, which imports the package by name.
 * @param {string} browserBuild The file of the browser builds of this package and of `@boundaries/elements` that the entry has to resolve, so the test fails if the bundle falls back to a Node.js build.
 * @returns {Promise<string>} The code of the bundle, which assigns the entry exports to the `config` global.
 */
async function bundleForBrowsers(contents, browserBuild) {
  const result = await build({
    stdin: { contents, resolveDir: packageRoot, sourcefile: "entry.js" },
    absWorkingDir: packageRoot,
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "config",
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  assert.deepEqual(result.warnings, []);
  const inputs = Object.keys(result.metafile.inputs).map((input) =>
    resolve(packageRoot, input)
  );
  for (const root of [packageRoot, elementsRoot]) {
    const buildPath = join(root, "dist", browserBuild);
    assert.ok(
      inputs.includes(buildPath),
      `The bundle does not include ${buildPath}`
    );
  }
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
  return context.config;
}

describe("builds", () => {
  const expectedResults = getResults(nodeCjsBuild);

  it("should normalize the quick-start configuration without diagnostics with the Node.js CommonJS build", () => {
    assert.deepEqual(expectedResults.quickStart.diagnostics, []);
  });

  it("should return the diagnostics of a configuration with problems with the Node.js CommonJS build", () => {
    assert.deepEqual(
      expectedResults.withProblems.diagnostics.map(({ level, paths }) => ({
        level,
        paths,
      })),
      [
        {
          level: "warning",
          paths: [["settings", "boundaries/elements", 1]],
        },
        {
          level: "deprecation",
          paths: [["rules", "boundaries/dependencies", 1, "policies", 0]],
        },
        {
          level: "error",
          paths: [["rules", "boundaries/no-private", 1, "allowUncles"]],
        },
      ]
    );
  });

  it("should return the same results with the Node.js ES module build", () => {
    assert.deepEqual(getResults(nodeEsmBuild), expectedResults);
  });

  it("should return the same results with the browser build imported without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'export * from "@boundaries/config";',
      "index.browser.mjs"
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });

  it("should return the same results with the browser build required without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'module.exports = require("@boundaries/config");',
      "index.browser.js"
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });
});
