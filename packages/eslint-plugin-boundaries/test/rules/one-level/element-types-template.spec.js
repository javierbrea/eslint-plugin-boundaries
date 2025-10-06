const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} = require("../../support/helpers");
const {
  customErrorMessage,
  elementTypesNoRuleMessage,
} = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const { absoluteFilePath } = pathResolvers("one-level");

const testCapture = (settings, options, errorMessages) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Components can import helper-a
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
      // Components can import helper-a using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import component-b using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options,
      },
      // Component A can import internal files
      {
        filename: absoluteFilePath("components/component-a/index.js"),
        code: "import ComponentA from './ComponentA'",
        options,
      },
      // Modules can import helper-a using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Module A can import module-a-helpers
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import Helper1 from 'module-a-helpers/helper-1'",
        options,
      },
      // Module A can import helper with name module-a
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import Helper from 'helpers/module-a'",
        options,
      },
    ],
    invalid: [
      // Components can't import helper-b
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperB from '../../helpers/helper-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'components' with elementName 'component-a'",
                dep: "'helpers' with elementName 'helper-b'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // Components can't import helper-b using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: "'components' with elementName 'component-a'",
                dep: "'helpers' with elementName 'helper-b'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // Components can't import component-a
      {
        filename: absoluteFilePath("components/component-b/ComponentB.js"),
        code: "import ComponentB from 'components/component-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: "'components' with elementName 'component-b'",
                dep: "'components' with elementName 'component-a'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can't import helper-b
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "'helpers' with elementName 'helper-b'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // Module B can't import module-a-helpers
      {
        filename: absoluteFilePath("modules/module-b/ModuleB.js"),
        code: "import Helper1 from 'module-a-helpers/helper-1'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: "'modules' with elementName 'module-b'",
                dep: "'module-a-helpers' with elementName 'helper-1'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // Module B can't import helper with name module-a
      {
        filename: absoluteFilePath("modules/module-b/ModuleB.js"),
        code: "import Helper from 'helpers/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: "'modules' with elementName 'module-b'",
                dep: "'helpers' with elementName 'module-a'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// capture options

testCapture(
  {
    ...SETTINGS.oneLevel,
    ...{
      "boundaries/elements": [
        {
          type: "helpers",
          pattern: "helpers/*",
          capture: ["elementName"],
        },
        {
          type: "module-a-helpers",
          pattern: "module-a-helpers/*",
          capture: ["elementName"],
        },
        {
          type: "components",
          pattern: ["components/*"],
          capture: ["elementName"],
        },
        {
          type: "modules",
          pattern: "modules/*",
          capture: ["elementName"],
        },
      ],
    },
  },
  [
    {
      default: "disallow",
      rules: [
        {
          from: "components",
          allow: [["helpers", { elementName: "helper-a" }], "components"],
          disallow: [["components", { elementName: "component-a" }]],
        },
        {
          from: "modules",
          allow: [
            ["helpers", { elementName: "helper-a" }],
            "components",
            "modules",
          ],
        },
        {
          from: [["modules", { elementName: "*-a" }]],
          allow: [
            ["helpers", { elementName: "${from.elementName}" }],
            "components",
            "modules",
          ],
        },
        {
          from: [["modules", { elementName: "*-a" }]],
          allow: ["${from.elementName}-helpers", "components", "modules"],
        },
      ],
    },
  ],
  {
    2: "Importing elements of type 'components' with elementName 'component-a' is not allowed in elements of type 'components'. Disallowed in rule 1",
  },
);
