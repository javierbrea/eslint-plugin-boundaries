const { NO_IGNORED: RULE } = require("../../../src/constants/rules");
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const rule = require(`../../../src/rules/${RULE}`).default;

const settings = SETTINGS.docsExamples;
const { absoluteFilePath } = pathResolvers("docs-examples");

const ERROR_MESSAGE = "Importing ignored files is not allowed";

const runTest = (customSettings) => {
  const ruleTester = createRuleTester(customSettings);

  ruleTester.run(RULE, rule, {
    valid: [
      // `index.js` file is not recognized as any element, so it can import `foo.js`
      {
        filename: absoluteFilePath("index.js"),
        code: "import foo from './foo'",
      },
      // `foo2.js` file is not ignored, so it can be imported by helpers
      {
        filename: absoluteFilePath("helpers/data/sort.js"),
        code: "import foo2 from '../../foo2'",
        errors: [
          {
            message: ERROR_MESSAGE,
            type: "Literal",
          },
        ],
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
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// ignore foo
runTest({
  ...settings,
  "boundaries/ignore": ["**/foo.js"],
});

// include other file
runTest({
  ...settings,
  "boundaries/include": ["**/foo2.js", "**/sort.js"],
});

// include all other files except "foo"
runTest({
  ...settings,
  "boundaries/include": ["**/foo2.js", "**/sort.js", "**/foo.js"],
  "boundaries/ignore": ["**/foo.js"],
});
