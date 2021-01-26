const { NO_UNKNOWN: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");

const rule = require(`../../../src/rules/${RULE}`);

const settings = SETTINGS.docsExamples;
const { absoluteFilePath } = pathResolvers("docs-examples");

const ERROR_MESSAGE = "Importing unknown elements is not allowed";

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // Components can import helpers
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import index from '../../../helpers/data/parse'",
    },
    // `index.js` file can import `foo.js` file because both are unknown
    {
      filename: absoluteFilePath("index.js"),
      code: "import foo from './foo'",
    },
  ],
  invalid: [
    // Helpers can't import `foo.js` file because it is unknown
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import foo from '../../foo'",
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "ImportDeclaration",
        },
      ],
    },
    // Components can't import `index.js` file because it is unknown
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import index from '../../../index'",
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
