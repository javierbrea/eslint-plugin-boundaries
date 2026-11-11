import config, {
  createFixedWaitConfig,
  typescriptConfig,
} from "../../support/eslint-config/index.js";

// Of the workspace packages, the suite imports only their two Playwright entries, `@boundaries/playground/playwright` and `website/playwright`. `lint` and `check:types` of this project depend only on `build:playwright` of the two packages, so any other import of a workspace package resolves against a build that nothing made. The workspace packages are `website` and the `@boundaries/*` ones
const WORKSPACE_IMPORT_LIMIT = {
  regex:
    "^(@boundaries/(?!playground/playwright$)|website(/(?!playwright$)|$))",
  message:
    "Import only `@boundaries/playground/playwright` and `website/playwright` of the workspace packages: nothing builds the rest before lint and the type check run.",
};

// A spec takes `test` and `expect` from the fixtures, which add the `pageErrors` fixture that fails the test on a console error. Any other path to Playwright, such as `playwright/test`, skips it
const SPEC_IMPORT_LIMIT = {
  regex: "^(@playwright/|playwright)",
  message:
    "A spec imports `test` and `expect` from `./fixtures`, never from Playwright: the fixtures fail the test on a console error or a page error.",
};

// The `patterns` of `no-restricted-imports` cover the static imports and the re-exports with a source. A dynamic `import()` and a `require()` are covered by the same limits as syntax
const importLimits = (limits) => ({
  patterns: limits,
  syntax: limits.flatMap(({ regex, message }) => {
    const source = regex.replaceAll("/", "\\/");

    return [
      `ImportExpression[source.value=/${source}/]`,
      `CallExpression[callee.name='require'][arguments.0.value=/${source}/]`,
    ].map((selector) => ({ selector, message }));
  }),
});

const PROJECT_IMPORTS = importLimits([WORKSPACE_IMPORT_LIMIT]);
const SPEC_IMPORTS = importLimits([WORKSPACE_IMPORT_LIMIT, SPEC_IMPORT_LIMIT]);

// A test file reaches the page only through page objects, which the components own: a change in the DOM of a component updates its page objects and no test file
const PAGE_OBJECT_MESSAGE =
  "A test file holds no locator or selector: query and act through a page object, which the component owns.";

// The methods of a Playwright page that take a selector or return a locator, a frame or a handle. The `Locator` itself is never in a test file, since a page object hands out none
const PAGE_SELECTOR_METHODS = [
  "locator",
  "getBy\\w+",
  "frameLocator",
  "frame",
  "frames",
  "mainFrame",
  "\\$\\$?",
  "\\$\\$?eval",
  "check",
  "uncheck",
  "setChecked",
  "click",
  "dblclick",
  "tap",
  "hover",
  "focus",
  "fill",
  "press",
  "type",
  "selectOption",
  "setInputFiles",
  "dragAndDrop",
  "dispatchEvent",
  "getAttribute",
  "innerHTML",
  "innerText",
  "inputValue",
  "textContent",
  "isChecked",
  "isDisabled",
  "isEditable",
  "isEnabled",
  "isHidden",
  "isVisible",
  "waitForSelector",
];

// A Playwright page is the `page` fixture, a page that a test file opens, or a member of that name. The match is by the name of the variable, not by its type: a page object held in a variable named like a page, such as `playgroundPage`, is flagged when a page method is called on it, so a page object has no member named like a page method, and a variable that holds a page is called `page` or `somethingPage`
const PAGE = "/^(page|popup|\\w*Page)$/";
const METHOD = `/^(${PAGE_SELECTOR_METHODS.join("|")})$/`;

const TEST_RESTRICTED_SYNTAX = [
  `CallExpression[callee.object.name=${PAGE}][callee.property.name=${METHOD}]`,
  `CallExpression[callee.object.property.name=${PAGE}][callee.property.name=${METHOD}]`,
  `VariableDeclarator[init.name=${PAGE}] > ObjectPattern > Property[key.name=${METHOD}]`,
  "CallExpression[callee.property.name=/^querySelector(All)?$/]",
].map((selector) => ({ selector, message: PAGE_OBJECT_MESSAGE }));

export default [
  ...config,
  typescriptConfig,
  // A later config replaces the options of a rule, so each one repeats the guards of the ones above and adds its own: no file of the project waits with a fixed wait, on a selector or on the network, and imports workspace packages only by their Playwright entries; a test file holds no locator or selector; a spec never imports Playwright
  createFixedWaitConfig(["**/*.{js,cjs,mjs,ts}"], PROJECT_IMPORTS.syntax),
  createFixedWaitConfig(
    ["test/**/*.ts"],
    [...PROJECT_IMPORTS.syntax, ...TEST_RESTRICTED_SYNTAX]
  ),
  createFixedWaitConfig(
    ["test/**/*.spec.ts"],
    [...SPEC_IMPORTS.syntax, ...TEST_RESTRICTED_SYNTAX]
  ),
  {
    files: ["**/*.{js,cjs,mjs,ts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: PROJECT_IMPORTS.patterns },
      ],
    },
  },
  {
    files: ["test/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: SPEC_IMPORTS.patterns }],
    },
  },
  // No file imports another package by a relative path, which would skip the entries of its package.json. The configs of the project are the exception, since the ones of every project reach `support/` that way
  {
    files: ["**/*.{js,cjs,mjs,ts}"],
    ignores: ["*.config.{js,cjs,mjs}"],
    rules: {
      "import/no-relative-packages": "error",
    },
  },
  {
    ignores: ["test-results/**"],
  },
];
