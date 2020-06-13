const { ALLOWED_TYPES: RULE } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, settings, relativeFilePath } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const errorMessage = (fileType, dependencyType) =>
  `Usage of '${dependencyType}' is not allowed in '${fileType}'`;

const options = [
  {
    allow: {
      helpers: [],
      components: ["helpers", "components"],
      modules: ["helpers", "components", "modules"],
    },
  },
];

ruleTester.run(RULE, rule, {
  valid: [
    // Non recognized types can import whatever
    {
      filename: absoluteFilePath("src/foo/index.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options,
    },
    // Components can import helpers
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import HelperA from 'test/fixtures/src/helpers/helper-a'",
      options,
    },
    // Components can import helpers using alias
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options,
    },
    // Components can import components using alias
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from 'components/component-b'",
      options,
    },
    // Modules can import helpers using alias
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options,
    },
    // Modules can import any helpers file using alias
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import HelperA from 'helpers/helper-a/HelperA.js'",
      options,
    },
    // Modules can import components using alias
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ComponentA from 'components/component-a'",
      options,
    },
    // Modules can import modules
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b'",
      options,
    },
    // Modules can import non existant modules files
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b/foo.js'",
      options,
    },
    // Helpers can import ignored helpers
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import HelperB from 'helpers/helper-b'",
      options,
      settings: {
        ...settings,
        "boundaries/ignore": [relativeFilePath("src/helpers/helper-b/**/*.js")],
      },
    },
    // Invalid options
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b/foo.js'",
      options: [{ allow: undefined }],
    },
    // Invalid options
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b/foo.js'",
      options: [
        {
          allow: {
            foo: ["components"],
          },
        },
      ],
    },
    // Invalid options
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b/foo.js'",
      options: [
        {
          allow: {
            components: ["foo"],
          },
        },
      ],
    },
    // Invalid options
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b/foo.js'",
      options: [
        {
          allow: {
            components: {},
          },
        },
      ],
    },
    // No types provided in settings
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b/foo.js'",
      settings: {
        ...settings,
        "boundaries/types": null,
      },
    },
    // Repeat no type provided, check that it continues working
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'test/fixtures/src/modules/module-b/foo.js'",
      settings: {
        ...settings,
        "boundaries/types": null,
      },
    },
  ],
  invalid: [
    // Helpers can't import another helper
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import HelperB from 'helpers/helper-b'",
      options,
      errors: [
        {
          message: errorMessage("helpers", "helpers"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can't import a component:
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import ComponentA from 'components/component-a'",
      options,
      errors: [
        {
          message: errorMessage("helpers", "components"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can't import a module:
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options,
      errors: [
        {
          message: errorMessage("helpers", "modules"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Components can't import a module:
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options,
      errors: [
        {
          message: errorMessage("components", "modules"),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
