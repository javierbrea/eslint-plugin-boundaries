import rule from "../../../src/Rules/NoUnknown";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const { NO_UNKNOWN: RULE } = require("../../../src/Settings");

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const ERROR_MESSAGE = "Importing unknown elements is not allowed";

const runTest = (settings: RuleTesterSettings) => {
  const ruleTester = createRuleTester(settings);

  const customSettings = {
    ...settings,
    "boundaries/ignore": [codeFilePath("components/component-b/**/*.js")],
  };

  ruleTester.run(RULE, rule, {
    valid: [
      // Non recognized types can import whatever
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import Foo from './foo2/foo2'",
        settings: customSettings,
      },
      // Ignored files can import not recognized files
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import Foo from '../../foo'",
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("components/**/*.js")],
        },
      },
      // Recognized types can be imported
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
      },
      // External dependencies can be imported
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import 'chalk'",
      },
    ],
    invalid: [
      // Not recognized type
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import Foo from '../../foo'",
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

// deprecated settings
runTest(SETTINGS.deprecated);

// new settings
runTest(SETTINGS.oneLevel);
