const { ELEMENT_TYPES: RULE } = require("../../../dist/constants/rules");
const {
  SETTINGS,
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} = require("../../support/helpers");

const rule = require(`../../../dist/rules/${RULE}`).default;

const { absoluteFilePath } = pathResolvers("one-level");

const settings = {
  ...SETTINGS.oneLevel,
  "boundaries/dependency-nodes": ["import"],
  parserOptions: {
    // Due to dynamic import usage
    ecmaVersion: 2020,
    sourceType: "module",
  },
};
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
    },
  ],
};

const options = [
  {
    default: "allow",
    rules: [
      {
        from: "helpers",
        disallow: ["modules"],
        importKind: "*",
      },
      {
        from: "helpers",
        disallow: ["components", "helpers"],
        importKind: "value",
      },
      {
        from: "components",
        disallow: ["modules"],
        importKind: "value",
      },
      {
        from: "modules",
        disallow: ["helpers"],
        importKind: "type",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'type' from elements of type 'helpers' is not allowed in elements of type 'modules'. Disallowed in rule 4",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
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
            "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
          type: "Literal",
        },
      ],
    },
  ],
});
