import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const { NO_UNKNOWN_FILES: RULE } = require("../../../src/constants/rules");

const rule = require(`../../../src/rules/${RULE}`).default;

const settings = SETTINGS.docsExamples;
const { absoluteFilePath, codeFilePath } = pathResolvers("docs-examples");

const FOO_CODE = "export default {}";
const ERROR_MESSAGE = "File is not of any known element type";

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // Helper files are allowed
    {
      filename: absoluteFilePath("helpers/data/sort.js"),
      code: FOO_CODE,
    },
    // `index.js` file is not recognized, but it is ignored in settings
    {
      filename: absoluteFilePath("index.js"),
      code: FOO_CODE,
      settings: {
        ...settings,
        "boundaries/ignore": [codeFilePath("index.js")],
      },
    },
  ],
  invalid: [
    // `foo.js` file is not recognized, so it is not allowed
    {
      filename: absoluteFilePath("foo.js"),
      code: FOO_CODE,
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "Program",
        },
      ],
    },
    // `index.js` file is not recognized, so it is not allowed
    {
      filename: absoluteFilePath("index.js"),
      code: FOO_CODE,
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "Program",
        },
      ],
    },
  ],
});
