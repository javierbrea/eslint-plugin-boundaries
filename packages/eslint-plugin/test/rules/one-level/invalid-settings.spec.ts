import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import {
  errorMessage,
  elementTypesNoRuleMessage,
} from "../../support/messages";

const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");

const rule = require(`../../../src/rules/${RULE}`).default;

const { absoluteFilePath } = pathResolvers("one-level");

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string> = {}
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    // Everything is valid, as settings are wrong
    valid: [
      // Helpers can't import another if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
          },
        ],
      },
      // Helpers can't import another helper
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: 'import HelperB from "helpers/helper-b"',
        options,
      },
      // Helpers can't import a component:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
      },
      // Helpers can't import a module:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
      },
      // Components can't import a module:
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
      },
    ],
    invalid: [
      // Helpers can't import another if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        settings: SETTINGS.oneLevel,
        options: [
          {
            default: "disallow",
          },
        ],
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "'helpers' with elementName 'helper-b'",
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// no element settings

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [],
  } as RuleTesterSettings,
  [
    {
      default: "disallow",
    },
  ],
  {}
);

// no type

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        pattern: "foo/*",
        capture: ["elementName"],
      },
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// no valid mode

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        mode: "foo",
      },
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// no valid capture

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        pattern: "foo/*",
        capture: "foo",
      },
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// invalid dependency nodes

runTest(
  {
    "boundaries/dependency-nodes": [
      // valid
      "import",
      "export",
      "dynamic-import",
      { selector: "Selector", kind: "value" },
      { selector: "Selector", kind: "type" },
      // invalid
      "unknown-default-node",
      { selector: "Selector", kind: "unknown-kind" },
      { selector: 0, kind: "value" },
      { kind: "value" },
      { unknown: "object" },
      0, // invalid type
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// invalid dependency nodes - not an array
runTest(
  {
    "boundaries/dependency-nodes": "invalid-value",
  } as RuleTesterSettings,
  [],
  {}
);

// invalid additional dependency nodes

runTest(
  {
    "boundaries/additional-dependency-nodes": [
      // valid
      { selector: "Selector", kind: "value" },
      { selector: "Selector", kind: "type" },
      // invalid
      { selector: "Selector", kind: "unknown-kind" },
      { selector: 0, kind: "value" },
      { kind: "value" },
      { unknown: "object" },
      "import",
      "any-string",
      0,
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// invalid additional dependency nodes - not an array
runTest(
  {
    "boundaries/additional-dependency-nodes": "invalid-value",
  } as RuleTesterSettings,
  [],
  {}
);
