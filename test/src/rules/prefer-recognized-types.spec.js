const { PREFER_RECOGNIZED_TYPES } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, relativeFilePath, settings } = require("../helpers");

const rule = require(`../../../src/rules/${PREFER_RECOGNIZED_TYPES}`);

const ruleTester = createRuleTester();

const FOO_CODE = "export default {}";
const ERROR_MESSAGE = "File does not belong to any element type";

ruleTester.run(PREFER_RECOGNIZED_TYPES, rule, {
  valid: [
    {
      filename: absoluteFilePath("src/components/component-a/index.js"),
      code: FOO_CODE,
    },
    {
      filename: absoluteFilePath("src/foo/index.js"),
      code: FOO_CODE,
      settings: {
        ...settings,
        "boundaries/ignore": [relativeFilePath("src/foo/*.js")],
      },
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("src/foo/index.js"),
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
