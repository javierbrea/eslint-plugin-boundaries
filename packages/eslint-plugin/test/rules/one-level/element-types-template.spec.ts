import ruleFactory from "../../../src/Rules/Dependencies";
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

const { ELEMENT_TYPES: RULE } = require("../../../src/Settings");

const rule = ruleFactory();
const { absoluteFilePath } = pathResolvers("one-level");

const testCapture = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
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
            message: errorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: '"components" and elementName "component-a"',
                dep: '"helpers" and elementName "helper-b"',
              })
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
            message: errorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: '"components" and elementName "component-a"',
                dep: '"helpers" and elementName "helper-b"',
              })
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
            message: errorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: '"components" and elementName "component-b"',
                dep: '"components" and elementName "component-a"',
              })
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
            message: errorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: '"modules" and elementName "module-a"',
                dep: '"helpers" and elementName "helper-b"',
              })
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
            message: errorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: '"modules" and elementName "module-b"',
                dep: '"module-a-helpers" and elementName "helper-1"',
              })
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
            message: errorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: '"modules" and elementName "module-b"',
                dep: '"helpers" and elementName "module-a"',
              })
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
  } as RuleTesterSettings,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { type: "components" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "helper-a" } },
              { type: "components" },
            ],
          },
          disallow: {
            to: [
              { type: "components", captured: { elementName: "component-a" } },
            ],
          },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "helper-a" } },
              { type: "components" },
              { type: "modules" },
            ],
          },
        },
        {
          from: { type: "modules", captured: { elementName: "*-a" } },
          allow: {
            to: [
              {
                type: "helpers",
                captured: { elementName: "{{ from.captured.elementName }}" },
              },
              { type: "components" },
              { type: "modules" },
            ],
          },
        },
        {
          from: { type: "modules", captured: { elementName: "*-a" } },
          allow: {
            to: [
              { type: "{{ from.captured.elementName }}-helpers" },
              { type: "components" },
              { type: "modules" },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and elementName "component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);

// Test new templates format with captured values
testCapture(
  {
    ...SETTINGS.oneLevel,
    "boundaries/legacy-templates": false,
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
  } as RuleTesterSettings,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { type: "components" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "helper-a" } },
              { type: "components" },
            ],
          },
          disallow: [
            {
              to: {
                type: "components",
                captured: { elementName: "component-a" },
              },
            },
          ],
        },
        {
          from: { type: "modules" },
          allow: [
            { to: { type: "helpers", captured: { elementName: "helper-a" } } },
            { to: { type: "components" } },
            { to: { type: "modules" } },
          ],
        },
        {
          from: { type: "modules", captured: { elementName: "*-a" } },
          allow: {
            to: [
              {
                type: "helpers",
                captured: { elementName: "{{ from.captured.elementName }}" },
              },
              { type: "components" },
              { type: "modules" },
            ],
          },
        },
        {
          from: { type: "modules", captured: { elementName: "*-a" } },
          allow: [
            { to: { type: "{{ from.captured.elementName }}-helpers" } },
            { to: { type: "components" } },
            { to: { type: "modules" } },
          ],
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and elementName "component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);
