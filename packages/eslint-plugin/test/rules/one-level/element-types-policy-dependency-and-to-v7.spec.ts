import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
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
        options: [{ policies: undefined }],
      },
      // Invalid options
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b/foo.js'",
        options: [
          {
            policies: [
              {
                to: { element: { type: "components" } },
                allow: { from: { element: { type: "foo" } } },
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
            policies: [
              {
                to: { element: { type: "foo" } },
                disallow: { from: { element: { type: "components" } } },
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
                file: '"helpers" and captured values: elementName="helper-a"',
                dep: '"helpers" and captured values: elementName="helper-b"',
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
                file: '"helpers" and captured values: elementName="helper-a"',
                dep: '"helpers" and captured values: elementName="helper-b"',
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
                file: '"helpers" and captured values: elementName="helper-a"',
                dep: '"components" and captured values: elementName="component-a"',
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
                file: '"helpers" and captured values: elementName="helper-a"',
                dep: '"modules" and captured values: elementName="module-a"',
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
                file: '"components" and captured values: elementName="component-a"',
                dep: '"modules" and captured values: elementName="module-a"',
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
      policies: [
        {
          to: [
            { element: { type: "modules" } },
            { element: { type: "components" } },
            { element: { type: "helpers" } },
          ],
          disallow: { from: { element: { type: "helpers" } } },
        },
        {
          to: { element: { type: "modules" } },
          disallow: { from: { element: { type: "components" } } },
        },
        {
          to: {
            element: { type: "modules", captured: { elementName: "module-b" } },
          },
          allow: {
            from: {
              element: {
                type: "components",
                captured: { elementName: "component-a" },
              },
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
    1: 'Dependencies to elements of type "helpers" are not allowed in elements of type "helpers". Denied by policy at index 0',
    2: 'Dependencies to elements of type "components" are not allowed in elements of type "helpers". Denied by policy at index 0',
    3: 'Dependencies to elements of type "modules" are not allowed in elements of type "helpers". Denied by policy at index 0',
    4: 'Dependencies to elements of type "modules" are not allowed in elements of type "components". Denied by policy at index 1',
  }
);

// micromatch-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      policies: [
        {
          to: { element: { type: "h*" } },
          allow: {
            from: { element: { type: ["c*", "m*"] } },
          },
        },
        {
          to: { element: { type: "c*" } },
          allow: { from: { element: { type: ["c*", "m*"] } } },
        },
        {
          to: { element: { type: "m*" } },
          allow: { from: { element: { type: ["m*"] } } },
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
          policies: [
            {
              dependency: { kind: "value" },
              allow: { from: { element: { type: "components" } } },
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
          policies: [
            {
              dependency: { kind: "type" },
              allow: { from: { element: { type: "helpers" } } },
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
          policies: [
            {
              dependency: { kind: "value" },
              allow: {
                dependency: { nodeKind: "import" },
                from: { element: { type: "components" } },
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
          policies: [
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
          policies: [
            {
              dependency: { kind: "value" },
              disallow: { from: { element: { type: "helpers" } } },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies with kind "value" are not allowed in elements of type "helpers". Denied by policy at index 0',
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
          policies: [
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
            'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by policy at index 0',
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
          policies: [
            {
              from: { element: { type: "components" } },
              disallow: {
                from: { element: { captured: { elementName: "component-a" } } },
              },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies are not allowed in elements of type "components" and captured values: elementName="component-a". Denied by policy at index 0',
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
          policies: [
            {
              to: { element: { type: "helpers" } },
              disallow: {
                to: { element: { captured: { elementName: "helper-a" } } },
              },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies to elements of type "helpers" and captured values: elementName="helper-a" are not allowed. Denied by policy at index 0',
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
          policies: [
            {
              to: { element: { captured: { family: "helpers" } } },
              disallow: {
                to: { element: { captured: { elementName: "helper-a" } } },
              },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies to elements of captured values: family="helpers", elementName="helper-a" are not allowed. Denied by policy at index 0',
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
      policies: [
        {
          from: { element: { type: "components" } },
          dependency: { kind: "value" },
          allow: { to: { element: { type: ["helpers", "components"] } } },
        },
        {
          from: { element: { type: "modules" } },
          to: { element: { type: ["helpers", "components"] } },
          allow: { dependency: { kind: "value" } },
        },
        {
          to: { element: { type: "helpers" } },
          dependency: { kind: "value" },
          allow: { from: { element: { type: ["components", "modules"] } } },
        },
        {
          from: { element: { type: "modules" } },
          to: { element: { type: "modules" } },
          dependency: { kind: "value" },
          allow: { dependency: { nodeKind: "import" } },
        },
      ],
    },
  ],
  {}
);
