const { NO_UNKNOWN_FILES: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);

const settings = SETTINGS.deprecated;
const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const ruleTester = createRuleTester(settings);

const FOO_CODE = "export default {}";
const ERROR_MESSAGE = "File does not belong to any known element type";

ruleTester.run(RULE, rule, {
  valid: [
    // Components files are valid
    {
      filename: absoluteFilePath("components/component-a/index.js"),
      code: FOO_CODE,
    },
    // Modules files are valid
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: FOO_CODE,
    },
    // Helpers files are valid
    {
      filename: absoluteFilePath("helpers/helper-a/index.js"),
      code: FOO_CODE,
    },
    // Helpers non existant files are valid
    {
      filename: absoluteFilePath("helpers/non-existant/index.js"),
      code: FOO_CODE,
    },
    // Ignored files are valid
    {
      filename: absoluteFilePath("foo/index.js"),
      code: FOO_CODE,
      settings: {
        ...settings,
        "boundaries/ignore": [codeFilePath("foo/*.js")],
      },
    },
  ],
  invalid: [
    // Not under type folder
    {
      filename: absoluteFilePath("foo/index.js"),
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
      filename: absoluteFilePath("helpers/index.js"),
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
