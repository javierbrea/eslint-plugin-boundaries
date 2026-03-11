import ruleFactory from "../../../src/Rules/Dependencies";
import {
  SETTINGS,
  TYPESCRIPT_SETTINGS,
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
const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Non recognized types can import whatever
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import helpers
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
      // Components can import helpers using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import components using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options,
      },
      // Modules can import helpers using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Modules can import any helpers file using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a/HelperA.js'",
        options,
      },
      // Modules can import components using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
      },
      // Modules can import other not recognized types when alias is not set
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        settings: {
          ...settings,
          "boundaries/alias": null,
        },
      },
      // Can import internal files
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "import ModuleB from './ModuleA'",
        options,
      },
      // Modules can import modules
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b'",
        options,
      },
      // Modules can import non existent modules files
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import MyModuleB from '../../modules/module-b/foo.js'",
        options,
      },
      // Helpers can import ignored helpers
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("helpers/helper-b/**/*.js")],
        },
      },
      // Helpers can import ignored helpers using micromatch
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": ["**/helpers/helper-b/**/*"],
        },
      },
      // Invalid options
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b/foo.js'",
        options: [{ rules: undefined }],
      },
      // Invalid options
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b/foo.js'",
        options: [
          {
            rules: [
              {
                to: { type: "components" },
                allow: { from: { type: "foo" } },
              },
            ],
          },
        ],
      },
      // Invalid options
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import MyModuleB from '../../modules/module-b/foo.js'",
        options: [
          {
            rules: [
              {
                to: { type: "foo" },
                disallow: { from: { type: "components" } },
              },
            ],
          },
        ],
      },
      // No types provided in settings
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import B from '../../modules/module-b/foo.js'",
        settings: {
          ...settings,
          "boundaries/types": null,
        },
      },
      // Repeat no type provided, check that it continues working
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../../modules/module-b/foo.js'",
        settings: {
          ...settings,
          "boundaries/types": null,
        },
      },
      // Helpers cant import another helper if everything is allowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
          },
        ],
      },
      // Can import fs module
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import fs from 'fs'",
        options,
      },
      // Can import node:fs module
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import fs from 'node:fs'",
        options,
      },
    ],
    invalid: [
      // Helpers can't import another if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
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
                file: '"helpers" and elementName "helper-a"',
                dep: '"helpers" and elementName "helper-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import another helper
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: '"helpers" and elementName "helper-a"',
                dep: '"helpers" and elementName "helper-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import a component:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: '"helpers" and elementName "helper-a"',
                dep: '"components" and elementName "component-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import a module:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: '"helpers" and elementName "helper-a"',
                dep: '"modules" and elementName "module-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Components can't import a module:
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: '"components" and elementName "component-a"',
                dep: '"modules" and elementName "module-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*",
      },
      {
        type: "components",
        pattern: "components/*",
      },
      {
        type: "modules",
        pattern: "modules/*",
      },
    ],
  } as RuleTesterSettings,
  [
    {
      default: "allow",
      rules: [
        {
          to: [
            { type: "modules" },
            { type: "components" },
            { type: "helpers" },
          ],
          disallow: { from: { type: "helpers" } },
        },
        {
          to: { type: "modules" },
          disallow: { from: { type: "components" } },
        },
        {
          to: { type: "modules", captured: { elementName: "module-b" } },
          allow: {
            from: {
              type: "components",
              captured: { elementName: "component-a" },
            },
          },
        },
      ],
    },
  ],
  {
    0: elementTypesNoRuleMessage({
      file: '"helpers"',
      dep: '"helpers"',
    }),
    1: 'Dependencies to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 0',
    2: 'Dependencies to elements of type "components" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies to elements of type "modules" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies to elements of type "modules" are not allowed in elements of type "components". Denied by rule at index 1',
  }
);

// micromatch-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          to: { type: "h*" },
          allow: {
            from: { type: ["c*", "m*"] },
          },
        },
        {
          to: { type: "c*" },
          allow: { from: { type: ["c*", "m*"] } },
        },
        {
          to: { type: "m*" },
          allow: { from: { type: ["m*"] } },
        },
      ],
    },
  ],
  {}
);

// dependency-only top-level selector
createRuleTester({
  ...TYPESCRIPT_SETTINGS.oneLevel,
  // @ts-expect-error Wrong typing in tests
  "boundaries/elements": [
    {
      type: "components",
      pattern: ["components/*/*"],
      capture: ["family", "elementName"],
    },
    {
      type: "helpers",
      pattern: "(helpers)/*",
      capture: ["family", "elementName"],
    },
  ],
}).run(RULE, rule, {
  valid: [
    {
      filename: absoluteFilePath("components/atoms/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              dependency: { kind: "value" },
              allow: { from: { type: "components" } },
            },
          ],
        },
      ],
    },
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import type { HelperB } from 'helpers/helper-b'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              dependency: { kind: "type" },
              allow: { from: { type: "helpers" } },
            },
          ],
        },
      ],
    },
    {
      filename: absoluteFilePath("components/atoms/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              dependency: { kind: "value" },
              allow: {
                dependency: { nodeKind: "import" },
                from: { type: "components" },
              },
            },
          ],
        },
      ],
    },
    {
      filename: absoluteFilePath("components/atoms/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              dependency: { kind: "value" },
              allow: {
                dependency: { nodeKind: "import" },
              },
            },
          ],
        },
      ],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
      code: "import HelperB from 'helpers/helper-b'",
      options: [
        {
          default: "allow",
          rules: [
            {
              dependency: { kind: "value" },
              disallow: { from: { type: "helpers" } },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies with kind "value" are not allowed in elements of type "helpers". Denied by rule at index 0',
          type: "Literal",
        },
      ],
    },
    {
      filename: absoluteFilePath("components/atoms/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              dependency: { kind: "value" },
              disallow: { dependency: { nodeKind: "import" } },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by rule at index 0',
          type: "Literal",
        },
      ],
    },
    {
      filename: absoluteFilePath("components/atoms/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: { type: "components" },
              disallow: {
                from: { captured: { elementName: "component-a" } },
              },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies are not allowed in elements of type "components" and elementName "component-a". Denied by rule at index 0',
          type: "Literal",
        },
      ],
    },
    {
      filename: absoluteFilePath("components/atoms/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              to: { type: "helpers" },
              disallow: {
                to: { captured: { elementName: "helper-a" } },
              },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies to elements of type "helpers" and elementName "helper-a" are not allowed. Denied by rule at index 0',
          type: "Literal",
        },
      ],
    },
    {
      filename: absoluteFilePath("components/atoms/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              to: { captured: { family: "helpers" } },
              disallow: {
                to: { captured: { elementName: "helper-a" } },
              },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies to elements of family "helpers" and elementName "helper-a" are not allowed. Denied by rule at index 0',
          type: "Literal",
        },
      ],
    },
  ],
});

// combination-based options
runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { type: "components" },
          dependency: { kind: "value" },
          allow: { to: { type: ["helpers", "components"] } },
        },
        {
          from: { type: "modules" },
          to: { type: ["helpers", "components"] },
          allow: { dependency: { kind: "value" } },
        },
        {
          to: { type: "helpers" },
          dependency: { kind: "value" },
          allow: { from: { type: ["components", "modules"] } },
        },
        {
          from: { type: "modules" },
          to: { type: "modules" },
          dependency: { kind: "value" },
          allow: { dependency: { nodeKind: "import" } },
        },
      ],
    },
  ],
  {}
);
