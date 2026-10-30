import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { build } from "esbuild";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const requireFromPackage = createRequire(import.meta.url);
const configRoot = dirname(
  requireFromPackage.resolve("@boundaries/config/package.json")
);
const elementsRoot = dirname(
  requireFromPackage.resolve("@boundaries/elements/package.json")
);

// The package loads itself by name, so each build is resolved through the conditions of its exports field, as it is for its consumers
const nodeCjsBuild = {
  ...requireFromPackage("@boundaries/policies"),
  normalizeConfig: requireFromPackage("@boundaries/config").normalizeConfig,
};
const nodeEsmBuild = {
  // eslint-disable-next-line import/no-unresolved -- the import resolver does not resolve a package by its own name
  ...(await import("@boundaries/policies")),
  normalizeConfig: (await import("@boundaries/config")).normalizeConfig,
};

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
            message:
              "Do not import test files from {{ from.element.types.[0] }}s",
          },
        ],
      },
    ],
  },
};

/**
 * Dependencies of the quick-start example: a helper importing a component, a component importing a helper, a module importing a test file, and a component importing an external package.
 */
const DEPENDENCIES = [
  {
    from: "/repo/src/helpers/format/index.js",
    to: "/repo/src/components/atoms/Price/index.js",
    source: "../../components/atoms/Price",
  },
  {
    from: "/repo/src/components/atoms/Price/index.js",
    to: "/repo/src/helpers/format/index.js",
    source: "../../../helpers/format",
  },
  {
    from: "/repo/src/modules/cart/index.js",
    to: "/repo/src/components/atoms/Price/Price.spec.js",
    source: "../../components/atoms/Price/Price.spec",
  },
  {
    from: "/repo/src/components/atoms/Price/index.js",
    source: "react",
  },
];

/**
 * Describes and evaluates the dependencies of the quick-start example with a build of the package.
 * @param {typeof nodeEsmBuild} api The public API of a build of the package, with the `normalizeConfig` function of the same build of `@boundaries/config`.
 * @returns {any} The results, converted to plain JSON values, so results from other realms can be compared.
 */
function getResults(api) {
  const { settings, rules } = api.normalizeConfig(QUICK_START_CONFIG, {
    rootPath: "/repo",
  }).value;
  return JSON.parse(
    JSON.stringify({
      entity: api.describeEntity(
        settings,
        "/repo/src/components/atoms/Price/Price.spec.js"
      ),
      dependencies: DEPENDENCIES.map((dependency) => {
        const description = api.describeDependency(settings, {
          ...dependency,
          kind: "value",
          nodeKind: "import",
          specifiers: [],
        });
        return {
          description,
          evaluation: api.evaluateDependency(
            settings,
            rules.dependencies.options,
            description
          ),
        };
      }),
    })
  );
}

/**
 * Bundles an entry with esbuild for browsers, without aliases or polyfills of Node.js modules and globals.
 * @param {string} contents The contents of the entry, which imports the packages by name.
 * @param {string} browserBuild The file of the browser builds of this package, of `@boundaries/config` and of `@boundaries/elements` that the entry has to resolve, so the test fails if the bundle falls back to a Node.js build.
 * @returns {Promise<string>} The code of the bundle, which assigns the entry exports to the `policies` global.
 */
async function bundleForBrowsers(contents, browserBuild) {
  const result = await build({
    stdin: { contents, resolveDir: packageRoot, sourcefile: "entry.js" },
    absWorkingDir: packageRoot,
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "policies",
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  assert.deepEqual(result.warnings, []);
  const inputs = Object.keys(result.metafile.inputs).map((input) =>
    resolve(packageRoot, input)
  );
  for (const root of [packageRoot, configRoot, elementsRoot]) {
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
  return context.policies;
}

describe("builds", () => {
  const expectedResults = getResults(nodeCjsBuild);

  it("should evaluate the dependencies of the quick-start example with the Node.js CommonJS build", () => {
    assert.deepEqual(
      expectedResults.dependencies.map(({ evaluation }) => evaluation),
      [
        {
          checked: true,
          allowed: false,
          policyIndex: null,
          match: null,
          message:
            'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
          diagnostics: [],
        },
        {
          checked: true,
          allowed: true,
          policyIndex: 0,
          match: expectedResults.dependencies[1].evaluation.match,
          diagnostics: [],
        },
        {
          checked: true,
          allowed: false,
          policyIndex: 2,
          match: expectedResults.dependencies[2].evaluation.match,
          message: "Do not import test files from modules",
          diagnostics: [],
        },
        { checked: false, reason: "not-local" },
      ]
    );
  });

  it("should return the same results with the Node.js ES module build", () => {
    assert.deepEqual(getResults(nodeEsmBuild), expectedResults);
  });

  it("should return the same results with the browser build imported without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'export * from "@boundaries/policies"; export { normalizeConfig } from "@boundaries/config";',
      "index.browser.mjs"
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });

  it("should return the same results with the browser build required without Node.js shims", async () => {
    const code = await bundleForBrowsers(
      'module.exports = { ...require("@boundaries/policies"), normalizeConfig: require("@boundaries/config").normalizeConfig };',
      "index.browser.js"
    );

    assert.deepEqual(getResults(runWithoutNodeGlobals(code)), expectedResults);
  });
});
