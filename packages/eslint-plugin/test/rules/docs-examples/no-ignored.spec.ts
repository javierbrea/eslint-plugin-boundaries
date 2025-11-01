import rule from "../../../src/Rules/NoIgnored";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const { NO_IGNORED: RULE } = require("../../../src/Settings");

const settings = SETTINGS.docsExamples;
const { absoluteFilePath } = pathResolvers("docs-examples");

const ERROR_MESSAGE = "Importing ignored files is not allowed";

const runTest = (customSettings: RuleTesterSettings) => {
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
} as RuleTesterSettings);

// include other file
runTest({
  ...settings,
  "boundaries/include": ["**/foo2.js", "**/sort.js"],
} as RuleTesterSettings);

// include all other files except "foo"
runTest({
  ...settings,
  "boundaries/include": ["**/foo2.js", "**/sort.js", "**/foo.js"],
  "boundaries/ignore": ["**/foo.js"],
} as RuleTesterSettings);
