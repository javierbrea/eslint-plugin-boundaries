const { ONLY_KNOWN_ELEMENTS: RULE } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, codeFilePath, settings } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const ERROR_MESSAGE = "Importing unknown elements is not allowed";

const customSettings = {
  ...settings,
  "boundaries/ignore": [codeFilePath("src/components/component-b/**/*.js")],
};

ruleTester.run(RULE, rule, {
  valid: [
    // Non recognized types can import whatever
    {
      filename: absoluteFilePath("src/foo/index.js"),
      code: "import Foo from './foo2/foo2'",
      settings: customSettings,
    },
    // Ignored files can import not recognized files
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import Foo from '../../foo'",
      settings: {
        ...settings,
        "boundaries/ignore": [codeFilePath("src/components/**/*.js")],
      },
    },
    // Recognized types can be imported
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from 'components/component-b'",
    },
  ],
  invalid: [
    // Not recognized type
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import Foo from '../../foo'",
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
