jest.mock("../../../src/Debug", () => ({
  ...jest.requireActual("../../../src/Debug"),
  warnOnce: jest.fn(),
}));

import { moreInfoSettingsLink } from "@boundaries/config";
import * as typescriptParser from "@typescript-eslint/parser"; // eslint-disable-line import/no-namespace
import { Linter } from "eslint";

import { warnOnce } from "../../../src/Debug";
import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const rule = ruleFactory();
const warnOnceMock = jest.mocked(warnOnce);

const { absoluteFilePath } = pathResolvers("one-level");
const HELPER_A_JS = absoluteFilePath("helpers/helper-a/HelperA.js");
const HELPER_A_TS = absoluteFilePath("helpers/helper-a/HelperA.ts");

const settings = {
  ...SETTINGS.oneLevel,
  parserOptions: {
    // Due to dynamic import usage
    ecmaVersion: 2020,
    sourceType: "module",
  },
} as RuleTesterSettings;
const typescriptSettings = TYPESCRIPT_SETTINGS.oneLevel;
const additionalDependencyNodesSettings = {
  "boundaries/additional-dependency-nodes": [
    {
      // mock(`source`)
      selector: "CallExpression[callee.name=mock] > TemplateLiteral",
      kind: "value",
      name: "mock",
    },
    {
      // mock('source' as string)
      selector: "CallExpression[callee.name=mock] > TSAsExpression",
      kind: "value",
      name: "mock",
    },
    {
      // mock`source`
      selector: "TaggedTemplateExpression[tag.name=mock] > TemplateLiteral",
      kind: "value",
      name: "mock",
    },
  ],
};

const HELPERS_TO_MODULES_MESSAGE =
  'Dependencies to elements of type "modules" are not allowed in elements of type "helpers". Denied by policy at index 0';

const options = [
  {
    default: "allow",
    policies: [
      {
        from: { element: { type: "helpers" } },
        disallow: { to: { element: { type: "modules" } } },
      },
    ],
  },
];

const typeKindOptions = [
  {
    default: "allow",
    policies: [
      {
        from: { element: { type: "helpers" } },
        disallow: {
          to: { element: { type: "modules" } },
          dependency: { kind: "type" },
        },
        message: "blocked-type-kind",
      },
    ],
  },
];

const nodeKindOptions = [
  {
    default: "allow",
    policies: [
      {
        from: { element: { type: "helpers" } },
        disallow: {
          to: { element: { type: "modules" } },
          dependency: { nodeKind: "require" },
        },
        message: "blocked-require-node-kind",
      },
      {
        from: { element: { type: "helpers" } },
        disallow: {
          to: { element: { type: "modules" } },
          dependency: { nodeKind: "dynamic-import" },
        },
        message: "blocked-dynamic-import-node-kind",
      },
    ],
  },
];

// Static sources in JavaScript
createRuleTester(settings).run(RULE, rule, {
  valid: [
    // Templates with substitutions are only known at runtime
    {
      filename: HELPER_A_JS,
      code: "const name = 'module-a'; require(`modules/${name}`)",
      options,
    },
    {
      filename: HELPER_A_JS,
      code: "const name = 'module-a'; import(`modules/${name}`)",
      options,
    },
    // Concatenations are only known at runtime
    {
      filename: HELPER_A_JS,
      code: "import('modules/' + 'module-a')",
      options,
    },
  ],
  invalid: [
    {
      filename: HELPER_A_JS,
      code: "require(`modules/module-a`)",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TemplateLiteral" },
      ],
    },
    {
      filename: HELPER_A_JS,
      code: "import(`modules/module-a`)",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TemplateLiteral" },
      ],
    },
  ],
});

// Static sources in TypeScript
createRuleTester(typescriptSettings).run(RULE, rule, {
  valid: [
    // Assertions around other expressions are only known at runtime
    {
      filename: HELPER_A_TS,
      code: "const name = 'modules/module-a'; import(name as string)",
      options,
    },
    {
      filename: HELPER_A_TS,
      code: "const name = 'modules/module-a'; require(name as string)",
      options,
    },
    // Assertions around the options of a dynamic import are not dependency sources
    {
      filename: HELPER_A_TS,
      code: "const opts = {}; import('helpers/helper-b', opts as ImportCallOptions)",
      options,
    },
    // The type arguments of an import type are not dependency sources
    {
      filename: HELPER_A_TS,
      code: "type T = import('helpers/helper-b').HelperB<'modules/module-a'>",
      options,
    },
    // Templates with substitutions inside assertions are only known at runtime
    {
      filename: HELPER_A_TS,
      code: "const name = 'module-a'; import(`modules/${name}` as string)",
      options,
    },
  ],
  invalid: [
    {
      filename: HELPER_A_TS,
      code: "import(`modules/module-a`, { with: {} })",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TemplateLiteral" },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "import('modules/module-a' as string)",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "TSAsExpression" }],
    },
    {
      filename: HELPER_A_TS,
      code: "require('modules/module-a' as string)",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "TSAsExpression" }],
    },
    {
      filename: HELPER_A_TS,
      code: "import('modules/module-a' satisfies string)",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TSSatisfiesExpression" },
      ],
    },
    // The error starts at the "<" of the assertion
    {
      filename: HELPER_A_TS,
      code: "import(<string>'modules/module-a')",
      options,
      errors: [
        {
          message: HELPERS_TO_MODULES_MESSAGE,
          type: "TSTypeAssertion",
          column: 8,
        },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "import('modules/module-a'!)",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TSNonNullExpression" },
      ],
    },
    // Nested assertions
    {
      filename: HELPER_A_TS,
      code: "import('modules/module-a' as unknown as string)",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "TSAsExpression" }],
    },
    {
      filename: HELPER_A_TS,
      code: "require((`modules/module-a` as string)!)",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TSNonNullExpression" },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "import ModuleA = require('modules/module-a')",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "Literal" }],
    },
    {
      filename: HELPER_A_TS,
      code: "import type ModuleA = require('modules/module-a')",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "Literal" }],
    },
    {
      filename: HELPER_A_TS,
      code: "type T = typeof import('modules/module-a')",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "Literal" }],
    },
    {
      filename: HELPER_A_TS,
      code: "type T = import('modules/module-a').ModuleA",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "Literal" }],
    },
  ],
});

// Kind of the dependencies
createRuleTester(typescriptSettings).run(RULE, rule, {
  valid: [
    {
      filename: HELPER_A_TS,
      code: "import ModuleA = require('modules/module-a')",
      options: typeKindOptions,
    },
    {
      filename: HELPER_A_TS,
      code: "require(`modules/module-a`)",
      options: typeKindOptions,
    },
    {
      filename: HELPER_A_TS,
      code: "import('modules/module-a' as string)",
      options: typeKindOptions,
    },
  ],
  invalid: [
    {
      filename: HELPER_A_TS,
      code: "import type ModuleA = require('modules/module-a')",
      options: typeKindOptions,
      errors: [{ message: "blocked-type-kind", type: "Literal" }],
    },
    {
      filename: HELPER_A_TS,
      code: "type T = typeof import('modules/module-a')",
      options: typeKindOptions,
      errors: [{ message: "blocked-type-kind", type: "Literal" }],
    },
  ],
});

// Node kind of the dependencies
createRuleTester(typescriptSettings).run(RULE, rule, {
  valid: [
    {
      filename: HELPER_A_TS,
      code: "import ModuleA from 'modules/module-a'",
      options: nodeKindOptions,
    },
  ],
  invalid: [
    {
      filename: HELPER_A_TS,
      code: "require(`modules/module-a`)",
      options: nodeKindOptions,
      errors: [
        { message: "blocked-require-node-kind", type: "TemplateLiteral" },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "require('modules/module-a' as string)",
      options: nodeKindOptions,
      errors: [
        { message: "blocked-require-node-kind", type: "TSAsExpression" },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "import ModuleA = require('modules/module-a')",
      options: nodeKindOptions,
      errors: [{ message: "blocked-require-node-kind", type: "Literal" }],
    },
    {
      filename: HELPER_A_TS,
      code: "import(`modules/module-a`)",
      options: nodeKindOptions,
      errors: [
        {
          message: "blocked-dynamic-import-node-kind",
          type: "TemplateLiteral",
        },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "import('modules/module-a' as string)",
      options: nodeKindOptions,
      errors: [
        { message: "blocked-dynamic-import-node-kind", type: "TSAsExpression" },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "type T = typeof import('modules/module-a')",
      options: nodeKindOptions,
      errors: [
        { message: "blocked-dynamic-import-node-kind", type: "Literal" },
      ],
    },
  ],
});

// Additional dependency nodes
createRuleTester({
  ...typescriptSettings,
  ...additionalDependencyNodesSettings,
}).run(RULE, rule, {
  valid: [
    {
      filename: HELPER_A_TS,
      code: "const name = 'module-a'; mock(`modules/${name}`)",
      options,
    },
    // Tagged templates with invalid escapes have no value
    {
      filename: HELPER_A_TS,
      code: "mock`modules/module-a\\unicode`",
      options,
    },
  ],
  invalid: [
    {
      filename: HELPER_A_TS,
      code: "mock(`modules/module-a`)",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TemplateLiteral" },
      ],
    },
    {
      filename: HELPER_A_TS,
      code: "mock('modules/module-a' as string)",
      options,
      errors: [{ message: HELPERS_TO_MODULES_MESSAGE, type: "TSAsExpression" }],
    },
    {
      filename: HELPER_A_TS,
      code: "mock`modules/module-a`",
      options,
      errors: [
        { message: HELPERS_TO_MODULES_MESSAGE, type: "TemplateLiteral" },
      ],
    },
  ],
});

/**
 * Lints a TypeScript file of a helper with the dependencies rule and the given additional dependency node selectors. `RuleTester` cannot expect a warning, so the file is linted with `Linter`.
 * @param code - The code of the file.
 * @param selectors - The selectors of the additional dependency nodes.
 * @returns The messages of the lint.
 */
function lintHelper(code: string, selectors: string[]) {
  const linter = new Linter();
  return linter.verify(
    code,
    {
      files: ["**/*.ts"],
      plugins: { boundaries: { rules: { dependencies: rule } } },
      languageOptions: { parser: typescriptParser },
      settings: {
        ...(SETTINGS.oneLevel as unknown as Record<string, unknown>),
        "boundaries/additional-dependency-nodes": selectors.map((selector) => ({
          selector,
          kind: "value",
          name: "mock",
        })),
      },
      rules: { "boundaries/dependencies": [2, options[0]] },
    },
    HELPER_A_TS
  );
}

describe("dependencies - dependency nodes without a static source", () => {
  it("warns and skips the node when a selector matches an identifier", () => {
    const messages = lintHelper(
      "const source = 'modules/module-a'; mock(source)",
      ["CallExpression[callee.name=mock] > Identifier[name=source]"]
    );

    expect(messages).toEqual([]);
    expect(warnOnceMock).toHaveBeenCalledTimes(1);
    expect(warnOnceMock).toHaveBeenCalledWith(
      "Dependency node value is not a string, skipping node.",
      `Please check your boundaries/additional-dependency-nodes setting. ${moreInfoSettingsLink()}`
    );
  });

  it("warns and skips the node when a selector matches a literal that is not a string", () => {
    const messages = lintHelper("mock(1)", [
      "CallExpression[callee.name=mock] > Literal",
    ]);

    expect(messages).toEqual([]);
    expect(warnOnceMock).toHaveBeenCalledTimes(1);
    expect(warnOnceMock).toHaveBeenCalledWith(
      "Dependency node value is not a string, skipping node.",
      `Please check your boundaries/additional-dependency-nodes setting. ${moreInfoSettingsLink()}`
    );
  });

  it("skips the node without warning when its source is only known at runtime", () => {
    const messages = lintHelper(
      "const name = 'module-a'; mock(`modules/${name}`); mock`modules/module-a\\unicode`; import(name as string); require(`modules/${name}` as string)",
      [
        "CallExpression[callee.name=mock] > TemplateLiteral",
        "TaggedTemplateExpression[tag.name=mock] > TemplateLiteral",
      ]
    );

    expect(messages).toEqual([]);
    expect(warnOnceMock).not.toHaveBeenCalled();
  });
});
