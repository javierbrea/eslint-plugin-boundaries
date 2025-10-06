const { ENTRY_POINT: RULE } = require("../../../src/constants/rules");
const {
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} = require("../../support/helpers");
const { customErrorMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const { absoluteFilePath } = pathResolvers("one-level");

const test = (settings, options, errorMessages = {}) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // import value from main.js file from helper
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import helper from 'helpers/helper-b/main'",
        options,
      },
      // import type from Component.js file from component
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type ComponentB from 'components/component-b/Component.js'",
        options,
      },
      // import type from Module.js file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type ModuleA from 'modules/module-a/Module'",
        options,
      },
      // import value from Module.js file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a/Module'",
        options,
      },
    ],
    invalid: [
      // import type from main.js file from helper
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type HelperA from 'helpers/helper-a/main'",
        options,
        errors: [
          {
            message: customErrorMessage(errorMessages, 0, ""),
            type: "Literal",
          },
        ],
      },
      // import value from Component.js file from component
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b/Component.js'",
        options,
        errors: [
          {
            message: customErrorMessage(errorMessages, 1, ""),
            type: "Literal",
          },
        ],
      },
      // import value from not allowed file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(errorMessages, 2, ""),
            type: "Literal",
          },
        ],
      },
      // import type from not allowed file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(errorMessages, 3, ""),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// disallow based options

test(
  TYPESCRIPT_SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          target: "helpers",
          allow: "main.js",
          importKind: "value",
        },
        {
          target: "components",
          allow: "Component.js",
          importKind: "type",
        },
        {
          target: "modules",
          allow: "Module.js",
          importKind: "*",
        },
      ],
    },
  ],
  {
    0: "No rule allows the entry point 'main.js' in dependencies of type 'helpers' with elementName 'helper-a'",
    1: "No rule allows the entry point 'Component.js' in dependencies of type 'components' with elementName 'component-b'",
    2: "No rule allows the entry point 'index.js' in dependencies of type 'modules' with elementName 'module-a'",
    3: "No rule allows the entry point 'index.js' in dependencies of type 'modules' with elementName 'module-a'",
  },
);

// allow based options

test(
  TYPESCRIPT_SETTINGS.oneLevel,
  [
    {
      default: "allow",
      rules: [
        {
          target: "helpers",
          disallow: "!main.js",
          importKind: "*",
        },
        {
          target: "helpers",
          disallow: "main.js",
          importKind: "type",
        },
        {
          target: "components",
          disallow: "!Component.js",
          importKind: "*",
        },
        {
          target: "components",
          disallow: "Component.js",
          importKind: "value",
        },
        {
          target: "modules",
          disallow: "!Module.js",
          importKind: "*",
        },
      ],
    },
  ],
  {
    0: "The entry point 'main.js' is not allowed in elements of type 'helpers' when importing type. Disallowed in rule 2",
    1: "The entry point 'Component.js' is not allowed in elements of type 'components' when importing value. Disallowed in rule 4",
    2: "The entry point 'index.js' is not allowed in elements of type 'modules' when importing value. Disallowed in rule 5",
    3: "The entry point 'index.js' is not allowed in elements of type 'modules' when importing type. Disallowed in rule 5",
  },
);
