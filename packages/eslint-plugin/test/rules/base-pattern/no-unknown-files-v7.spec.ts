import rule from "../../../src/Rules/NoUnknownFiles";
import { NO_UNKNOWN_FILES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const settings = SETTINGS.basePatternV7;
const { absoluteFilePath } = pathResolvers("base-pattern");

const FOO_CODE = "export default {}";
const ERROR_MESSAGE =
  "File does not match any file pattern and does not belong to any known element";

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // Module whose path matches basePattern is a known element
    {
      filename: absoluteFilePath(
        "domains/domain-a/modules/module-a/ModuleA.js"
      ),
      code: FOO_CODE,
    },
  ],
  invalid: [
    // Module whose path matches pattern but not basePattern is not a known element
    // (regression test for https://github.com/javierbrea/eslint-plugin-boundaries/issues/495)
    {
      filename: absoluteFilePath("legacy/modules/module-x/ModuleX.js"),
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
