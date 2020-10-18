const { PREFER_RECOGNIZED_TYPES: RULE } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, codeFilePath, settings } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const FOO_CODE = "export default {}";
const ERROR_MESSAGE = "File does not belong to any element type";

ruleTester.run(RULE, rule, {
  valid: [
    // Components files are valid
    {
      filename: absoluteFilePath("src/components/component-a/index.js"),
      code: FOO_CODE,
    },
    // Modules files are valid
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: FOO_CODE,
    },
    // Helpers files are valid
    {
      filename: absoluteFilePath("src/helpers/helper-a/index.js"),
      code: FOO_CODE,
    },
    // Helpers non existant files are valid
    {
      filename: absoluteFilePath("src/helpers/non-existant/index.js"),
      code: FOO_CODE,
    },
    // Ignored files are valid
    {
      filename: absoluteFilePath("src/foo/index.js"),
      code: FOO_CODE,
      settings: {
        ...settings,
        "boundaries/ignore": [codeFilePath("src/foo/*.js")],
      },
    },
  ],
  invalid: [
    // Not under type folder
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
    // Not under element folder
    {
      filename: absoluteFilePath("src/helpers/index.js"),
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
