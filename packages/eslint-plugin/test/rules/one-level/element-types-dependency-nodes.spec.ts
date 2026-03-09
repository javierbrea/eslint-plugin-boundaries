import rule from "../../../src/Rules/ElementTypes";
import {
  SETTINGS,
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const { ELEMENT_TYPES: RULE } = require("../../../src/Settings");

const { absoluteFilePath } = pathResolvers("one-level");
const settings = {
  ...SETTINGS.oneLevel,
  "boundaries/dependency-nodes": ["import"],
  parserOptions: {
    // Due to dynamic import usage
    ecmaVersion: 2020,
    sourceType: "module",
  },
} as RuleTesterSettings;
const typescriptSettings = {
  ...TYPESCRIPT_SETTINGS.oneLevel,
  "boundaries/dependency-nodes": ["import"],
};
const dependencyNodesSettings = {
  "boundaries/dependency-nodes": [
    "require",
    "import",
    "export",
    "dynamic-import",
  ],
  "boundaries/additional-dependency-nodes": [
    {
      // mock('source')
      selector: "CallExpression[callee.name=mock] > Literal",
      name: "mock",
    },
  ],
};

const options = [
  {
    default: "allow",
    rules: [
      {
        from: {
          type: "helpers",
        },
        disallow: [
          {
            to: { type: "modules" },
            dependency: {
              kind: "*",
            },
          },
        ],
      },
      {
        from: {
          type: "helpers",
        },
        disallow: [
          {
            to: { type: ["components"] },
            dependency: { kind: "value" },
          },
          {
            to: { type: ["helpers"] },
            dependency: { kind: "value" },
          },
        ],
      },
      {
        from: { type: "components" },
        disallow: [
          {
            to: { type: "modules" },
            dependency: { kind: "value" },
          },
        ],
      },
      {
        from: { type: "modules" },
        disallow: [
          {
            to: { type: "helpers" },
            dependency: { kind: "type" },
          },
        ],
      },
    ],
  },
];

const nodeKindSelectorOptions = [
  {
    default: "allow",
    rules: [
      {
        from: {
          type: "helpers",
        },
        disallow: [
          {
            to: { type: "helpers" },
            dependency: {
              nodeKind: "import",
            },
          },
        ],
        message: "blocked-import-node-kind",
      },
      {
        from: {
          type: "helpers",
        },
        disallow: [
          {
            to: { type: "helpers" },
            dependency: {
              nodeKind: "dynamic-import",
            },
          },
        ],
        message: "blocked-dynamic-import-node-kind",
      },
      {
        from: {
          type: "helpers",
        },
        disallow: [
          {
            to: { type: "helpers" },
            dependency: {
              nodeKind: "mock",
            },
          },
        ],
        message: "blocked-mock-node-kind",
      },
    ],
  },
];

// Without redefined dependency nodes
createRuleTester(settings).run(RULE, rule, {
  valid: [
    // Components can export value from helpers (unknown dependency node)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export { HelperA } from 'helpers/helper-a'",
      options,
    },
    // Components can dynamically import helpers (unknown dependency node)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import('helpers/helper-a')",
      options,
    },
    // Components can mock helpers (unknown dependency node)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "mock('helpers/helper-a')",
      options,
    },
    // Helpers can export value from another helper (unknown dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "export { HelperB } from 'helpers/helper-b'",
      options,
    },
    // Helpers can dynamically import another helper (unknown dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import('helpers/helper-b')",
      options,
    },
    // Helpers can mock another helper (unknown dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "mock('helpers/helper-b')",
      options,
    },
  ],
  invalid: [
    // Helpers can't import value from another helper (known dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import { HelperB } from 'helpers/helper-b'",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
  ],
});

// With redefined dependency nodes
createRuleTester({
  ...settings,
  ...dependencyNodesSettings,
}).run(RULE, rule, {
  valid: [
    // Components can import value from helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import { HelperA } from 'helpers/helper-a'",
      options,
    },
    // Components can export value from helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export { HelperA } from 'helpers/helper-a'",
      options,
    },
    // Components can dynamically import helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import('helpers/helper-a')",
      options,
    },
    // Components can mock helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "mock('helpers/helper-a')",
      options,
    },
    // Components can require helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "require('helpers/helper-a')",
      options,
    },
  ],
  invalid: [
    // Helpers can't export value from another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import { HelperB } from 'helpers/helper-b'",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
    // Helpers can't export value from another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "export { HelperB } from 'helpers/helper-b'",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
    // Helpers can't dynamically import another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import('helpers/helper-b')",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
    // Helpers can't mock another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "mock('helpers/helper-b')",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
    // Helpers can't require another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "require('helpers/helper-b')",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
  ],
});

// Selector kind precedence over rule-level importKind
createRuleTester(typescriptSettings).run(RULE, rule, {
  valid: [
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: { type: "components" },
              disallow: [
                {
                  to: { type: "helpers" },
                  dependency: { kind: "type" },
                },
              ],
              importKind: "value",
            },
          ],
        },
      ],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import type { HelperA } from 'helpers/helper-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: { type: "components" },
              disallow: [
                {
                  to: { type: "helpers" },
                  dependency: { kind: "type" },
                },
              ],
              importKind: "value",
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies with kind "type" to elements of type "helpers" are not allowed in elements of type "components". Denied by rule at index 0',
          type: "Literal",
        },
      ],
    },
  ],
});

// Typescript without redefined dependency nodes
createRuleTester(typescriptSettings).run(RULE, rule, {
  valid: [
    // Helpers can export type from components (unknown dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "export type { ComponentA } from 'components/component-a'",
      options,
    },
    // Components can export value from helpers (unknown dependency node)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export { HelperA } from 'helpers/helper-a'",
      options,
    },
    // Components can dynamically import helpers (unknown dependency node)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import('helpers/helper-a')",
      options,
    },
    // Components can mock helpers (unknown dependency node)
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "mock('helpers/helper-a')",
      options,
    },
    // Helpers can export value from another helper (unknown dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "export { HelperB } from 'helpers/helper-b'",
      options,
    },
    // Modules can export type from a helper (unknown dependency node)
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export type { HelperA } from 'helpers/helper-a'",
      options,
    },
    // Helpers can dynamically import another helper (unknown dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import('helpers/helper-b')",
      options,
    },
    // Helpers can mock another helper (unknown dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "mock('helpers/helper-b')",
      options,
    },
  ],
  invalid: [
    // Helpers can't import value from another helper (known dependency node)
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import { HelperB } from 'helpers/helper-b'",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
  ],
});

// Typescript with redefined dependency nodes
createRuleTester({
  ...typescriptSettings,
  ...dependencyNodesSettings,
}).run(RULE, rule, {
  valid: [
    // Helpers can export type from components
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "export type { ComponentA } from 'components/component-a'",
      options,
    },
    // Components can export value from helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "export { HelperA } from 'helpers/helper-a'",
      options,
    },
    // Components can dynamically import helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import('helpers/helper-a')",
      options,
    },
    // Components can mock helpers
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "mock('helpers/helper-a')",
      options,
    },
  ],
  invalid: [
    // Helpers can't export value from another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "export { HelperB } from 'helpers/helper-b'",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
    // Modules can't export type from a helper
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "export type { HelperA } from 'helpers/helper-a'",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "type" to elements of type "helpers" are not allowed in elements of type "modules". Denied by rule at index 3',
          type: "Literal",
        },
      ],
    },
    // Helpers can't dynamically import another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import('helpers/helper-b')",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
    // Helpers can't mock another helper
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "mock('helpers/helper-b')",
      options,
      errors: [
        {
          message:
            'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
  ],
});

// With nodeKind selector options
createRuleTester({
  ...settings,
  ...dependencyNodesSettings,
}).run(RULE, rule, {
  valid: [
    // Helpers can export value from another helper when export node kind is not disallowed
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "export { HelperB } from 'helpers/helper-b'",
      options: nodeKindSelectorOptions,
    },
    // Helpers can require another helper when require node kind is not disallowed
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "require('helpers/helper-b')",
      options: nodeKindSelectorOptions,
    },
  ],
  invalid: [
    // Helpers can't import another helper when import node kind is disallowed
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import { HelperB } from 'helpers/helper-b'",
      options: nodeKindSelectorOptions,
      errors: [{ message: "blocked-import-node-kind", type: "Literal" }],
    },
    // Helpers can't dynamically import another helper when dynamic-import node kind is disallowed
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import('helpers/helper-b')",
      options: nodeKindSelectorOptions,
      errors: [
        { message: "blocked-dynamic-import-node-kind", type: "Literal" },
      ],
    },
    // Helpers can't mock another helper when custom mock node kind is disallowed
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "mock('helpers/helper-b')",
      options: nodeKindSelectorOptions,
      errors: [{ message: "blocked-mock-node-kind", type: "Literal" }],
    },
  ],
});
