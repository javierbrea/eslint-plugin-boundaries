const { NO_IGNORED: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");

const rule = require(`../../../src/rules/${RULE}`);

const settings = SETTINGS.docsExamples;
const { absoluteFilePath, codeFilePath } = pathResolvers("docs-examples");

const ERROR_MESSAGE = "Importing ignored files is not allowed";

const customSettings = {
  ...settings,
  "boundaries/ignore": [codeFilePath("foo.js")],
};

const ruleTester = createRuleTester(customSettings);

ruleTester.run(RULE, rule, {
  valid: [
    // `index.js` file is not recognized as any element, so it can import `foo.js`
    {
      filename: absoluteFilePath("index.js"),
      code: "import foo from './foo'",
    },
  ],
  invalid: [
    // `foo.js` file is ignored, so it can't be imported by helpers
    {
      filename: absoluteFilePath("helpers/data/sort.js"),
      code: "import foo from '../../foo'",
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
