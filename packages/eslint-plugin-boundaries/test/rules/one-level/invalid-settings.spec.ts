const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import {
  customErrorMessage,
  elementTypesNoRuleMessage,
} from "../../support/messages";

const rule = require(`../../../src/rules/${RULE}`).default;

const { absoluteFilePath } = pathResolvers("one-level");

const runTest = (settings, options, errorMessages) => {
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
            message: customErrorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "'helpers' with elementName 'helper-b'",
              }),
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
  },
  [
    {
      default: "disallow",
    },
  ],
  {},
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
  },
  [],
  {},
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
  },
  [],
  {},
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
  },
  [],
  {},
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
  },
  [],
  {},
);

// invalid dependency nodes - not an array
runTest(
  {
    "boundaries/dependency-nodes": "invalid-value",
  },
  [],
  {},
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
  },
  [],
  {},
);

// invalid additional dependency nodes - not an array
runTest(
  {
    "boundaries/additional-dependency-nodes": "invalid-value",
  },
  [],
  {},
);
