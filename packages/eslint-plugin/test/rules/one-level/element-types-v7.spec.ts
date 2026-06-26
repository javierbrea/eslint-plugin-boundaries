import { resolve } from "node:path";

import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
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
                from: { element: { type: "foo" } },
                allow: { to: { element: { type: "components" } } },
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
                from: { element: { type: "components" } },
                disallow: { to: { element: { type: "foo" } } },
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
                file: '"components" and captured values: elementName="component-a"',
                dep: '"helpers" and captured values: elementName="helper-b"',
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
                file: '"components" and captured values: elementName="component-a"',
                dep: '"helpers" and captured values: elementName="helper-b"',
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
                file: '"components" and captured values: elementName="component-b"',
                dep: '"components" and captured values: elementName="component-a"',
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
                file: '"modules" and captured values: elementName="module-a"',
                dep: '"helpers" and captured values: elementName="helper-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// deprecated settings
runTest(
  SETTINGS.deprecated,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "components" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
              { element: { type: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// settings with no capture option
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
          from: { element: { type: "helpers" } },
          disallow: {
            to: [
              { element: { type: "modules" } },
              { element: { type: "components" } },
              { element: { type: "helpers" } },
            ],
          },
        },
        {
          from: { element: { type: "components" } },
          disallow: { to: { element: { type: "modules" } } },
        },
        {
          from: {
            element: {
              type: "components",
              captured: { elementName: "component-a" },
            },
          },
          allow: {
            to: {
              element: {
                type: "modules",
                captured: { elementName: "module-b" },
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
    1: 'Dependencies to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 0',
    2: 'Dependencies to elements of type "components" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies to elements of type "modules" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies to elements of type "modules" are not allowed in elements of type "components". Denied by rule at index 1',
  }
);

// disallow-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "components" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
              { element: { type: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// root-path absolute setting

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/root-path": resolve(__dirname, "..", "..", ".."),
  } as RuleTesterSettings,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "components" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
              { element: { type: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// root-path relative setting

runTest(
  { ...SETTINGS.oneLevel, "boundaries/root-path": "." } as RuleTesterSettings,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "components" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "helpers" } },
              { element: { type: "components" } },
              { element: { type: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// micromatch-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "c*" } },
          allow: {
            to: [{ element: { type: "h*" } }, { element: { type: "c*" } }],
          },
        },
        {
          from: { element: { type: "m*" } },
          allow: {
            to: [
              { element: { type: "h*" } },
              { element: { type: "c*" } },
              { element: { type: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// allow-based options
runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "allow",
      rules: [
        {
          from: { element: { type: "helpers" } },
          disallow: {
            to: [
              { element: { type: "modules" } },
              { element: { type: "components" } },
              { element: { type: "helpers" } },
            ],
          },
        },
        {
          from: { element: { type: "components" } },
          disallow: { to: [{ element: { type: "modules" } }] },
        },
      ],
    },
  ],
  {
    1: 'Dependencies to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 0',
    2: 'Dependencies to elements of type "components" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies to elements of type "modules" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies to elements of type "modules" are not allowed in elements of type "components". Denied by rule at index 1',
  }
);

// capture options

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "components" } },
          allow: {
            to: [
              {
                element: {
                  type: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              { element: { type: "components" } },
            ],
          },
          disallow: {
            to: [
              {
                element: {
                  type: "components",
                  captured: { elementName: "component-a" },
                },
              },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              {
                element: {
                  type: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              { element: { type: "components" } },
              { element: { type: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and captured values: elementName="component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);

// capture options with micromatch negative expression

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "components" } },
          allow: {
            to: [
              {
                element: {
                  type: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              {
                element: {
                  type: "components",
                  captured: { elementName: "!component-a" },
                },
              },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              {
                element: {
                  type: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              { element: { type: "components" } },
              { element: { type: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// capture options with micromatch

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "c*" } },
          allow: {
            to: [
              {
                element: { type: "helpers", captured: { elementName: "*-a" } },
              },
              { element: { type: "c*" } },
            ],
          },
          disallow: {
            to: [{ element: { type: "c*", captured: { elementName: "*-a" } } }],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "h*", captured: { elementName: "*-a" } } },
              { element: { type: "c*" } },
              { element: { type: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and captured values: elementName="component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);

// Custom error message

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.element.types.[0]}} with name {{to.element.captured.elementName}} is not allowed in {{from.element.types.[0]}} with name {{from.element.captured.elementName}}",
      rules: [
        {
          from: { element: { type: "c*" } },
          allow: {
            to: [
              {
                element: { type: "helpers", captured: { elementName: "*-a" } },
              },
              { element: { type: "c*" } },
            ],
          },
          disallow: {
            to: [{ element: { type: "c*", captured: { elementName: "*-a" } } }],
          },
          message:
            "Do not import {{to.element.types.[0]}} named {{to.element.captured.elementName}} from {{from.element.types.[0]}} named {{from.element.captured.elementName}}. Repeat: Do not import {{to.element.types.[0]}} named {{to.element.captured.elementName}} from {{from.element.types.[0]}} named {{from.element.captured.elementName}}.",
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "h*", captured: { elementName: "*-a" } } },
              { element: { type: "c*" } },
              { element: { type: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    0: "Importing helpers with name helper-b is not allowed in components with name component-a",
    1: "Importing helpers with name helper-b is not allowed in components with name component-a",
    2: "Do not import components named component-a from components named component-b. Repeat: Do not import components named component-a from components named component-b.",
    3: "Importing helpers with name helper-b is not allowed in modules with name module-a",
  }
);

// Custom error message default

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.element.types.[0]}} with name {{to.element.captured.elementName}} is not allowed in {{from.element.types.[0]}} with name {{from.element.captured.elementName}}",
      rules: [
        {
          from: { element: { type: "c*" } },
          allow: {
            to: [
              {
                element: { type: "helpers", captured: { elementName: "*-a" } },
              },
              { element: { type: "c*" } },
            ],
          },
          disallow: {
            to: { element: { type: "c*", captured: { elementName: "*-a" } } },
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "h*", captured: { elementName: "*-a" } } },
              { element: { type: "c*" } },
              { element: { type: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    0: "Importing helpers with name helper-b is not allowed in components with name component-a",
    1: "Importing helpers with name helper-b is not allowed in components with name component-a",
    2: "Importing components with name component-a is not allowed in components with name component-b",
    3: "Importing helpers with name helper-b is not allowed in modules with name module-a",
  }
);

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "c*" } },
          allow: {
            to: [
              {
                element: { type: "helpers", captured: { elementName: "*-a" } },
              },
              { element: { type: "c*" } },
            ],
          },
          disallow: {
            to: {
              element: {
                type: "c*",
                captured: { elementName: ["*-a", "component-a", "*t-a"] },
              },
            },
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "h*", captured: { elementName: "*-a" } } },
              { element: { type: "c*" } },
              { element: { type: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and captured values: elementName="component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: [{ element: { type: "c*" } }],
          allow: {
            to: [
              {
                element: { type: "helpers", captured: { elementName: "*-a" } },
              },
              { element: { type: "c*" } },
            ],
          },
          disallow: {
            to: [
              { element: { type: "c*", captured: { elementName: ["*-a"] } } },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          allow: {
            to: [
              { element: { type: "h*", captured: { elementName: "*-a" } } },
              { element: { type: "c*" } },
              { element: { type: "m*" } },
            ],
          },
        },
        {
          from: { element: { type: "modules" } },
          disallow: {
            to: [
              { element: { type: "h*", captured: { foo: "*-a" } } },
              { element: { type: "c*" } },
              { element: { type: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and captured values: elementName="component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);

const objectSelectorPropertiesSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    {
      type: "helpers",
      pattern: "helpers/*",
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
  "boundaries/files": [
    { category: "shared", pattern: "**/helpers/*/**" },
    { category: "ui", pattern: ["**/components/*/**"] },
    { category: "domain", pattern: "**/modules/*/**" },
  ],
} as RuleTesterSettings;

createRuleTester(objectSelectorPropertiesSettings).run(
  `${RULE} object selector properties`,
  rule,
  {
    valid: [
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                allow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { module: null },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: { element: { parent: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: { element: { isIgnored: false, isUnknown: false } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  dependency: { relationship: { from: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  dependency: { relationship: { to: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  dependency: { relationship: { from: null, to: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { relationship: { to: "foo" } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: { element: { path: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: { element: { parent: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: { element: { type: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: { file: { categories: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: { element: { captured: null } },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                allow: {
                  to: {
                    element: {
                      path: null,
                      fileInternalPath: "*",
                      parent: null,
                      type: null,
                      captured: null,
                    },
                    file: { categories: null },
                  },
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
                from: { element: { type: "helpers" } },
                disallow: { to: [{ element: { type: "helpers" } }] },
                message: "blocked-type",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-type", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: { to: [{ file: { categories: "shared" } }] },
                message: "blocked-category",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-category", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { captured: { elementName: "helper-b" } } }],
                },
                message: "blocked-captured",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-captured", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: { to: [{ module: { origin: "local" } }] },
                message: "blocked-origin",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-origin", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { path: "**/helpers/helper-b/**" } }],
                },
                message: "blocked-path",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-path", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { path: "**/helpers/helper-b" } }],
                },
                message: "blocked-element-path",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-element-path", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { fileInternalPath: "index.js" } }],
                },
                message: "blocked-internal-path",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-internal-path", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: { to: [{ element: { isIgnored: false } }] },
                message: "blocked-is-ignored",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-is-ignored", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: { to: [{ element: { isUnknown: false } }] },
                message: "blocked-is-unknown",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-is-unknown", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { source: "helpers/helper-b" },
                },
                message: "blocked-source",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-source", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { kind: "value" },
                },
                message: "blocked-kind",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-kind", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { specifiers: "HelperB" },
                },
                message: "blocked-specifiers",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-specifiers", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { nodeKind: "import" },
                },
                message: "blocked-node-kind",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-node-kind", type: "Literal" }],
      },
      // Null cases
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { module: null },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with module source "null" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                disallow: {
                  to: { element: { parent: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of parent "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                disallow: {
                  to: { element: { isIgnored: false, isUnknown: false } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of isIgnored "false" and isUnknown "false" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                disallow: {
                  dependency: { relationship: { from: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with relationship from "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                disallow: {
                  dependency: { relationship: { to: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with relationship to "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                disallow: {
                  dependency: { relationship: { from: null, to: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with relationship from "null" and relationship to "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'foo'",
        options: [
          {
            checkAllOrigins: true,
            default: "allow",
            rules: [
              {
                disallow: {
                  to: { element: { path: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of path "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: { element: { path: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of path "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: { element: { parent: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of parent "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: { element: { type: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of type "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: { file: { categories: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to file of category "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: { element: { captured: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of captured "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'foo'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: {
                    element: {
                      path: null,
                      fileInternalPath: null,
                      parent: null,
                      type: null,
                      captured: null,
                    },
                    file: { categories: null },
                  },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to file of category "null" belonging to elements of path "null", fileInternalPath "null", type "null", captured "null" and parent "null" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: [{ element: { type: "helpers" } }],
                  dependency: { nodeKind: "import" },
                },
                message:
                  "Rule at index {{ rule.index }}: blocked from type {{ rule.selector.from.element.type }} to type {{ rule.selector.to.element.type }} with node kind {{ rule.selector.dependency.nodeKind }}",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              "Rule at index 0: blocked from type helpers to type helpers with node kind import",
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'foo'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: {
                    element: {
                      path: null,
                      fileInternalPath: null,
                      parent: null,
                      type: null,
                      captured: null,
                    },
                    file: { categories: null },
                  },
                  dependency: {
                    relationship: { from: null, to: null },
                  },
                },
                message:
                  "Selector at rule at index {{ rule.index }}: path={{ rule.selector.to.element.path }}, parent={{ rule.selector.to.element.parent }}, relationship.from={{ rule.selector.dependency.relationship.from }}, relationship.to={{ rule.selector.dependency.relationship.to }}",
              },
            ],
          },
        ],
        errors: [
          {
            // NOTE: Null values are not rendered by handlebars. This is a known behavior of the library, so we respect it and render null values as empty strings in the message.
            message:
              "Selector at rule at index 0: path=, parent=, relationship.from=, relationship.to=",
            type: "Literal",
          },
        ],
      },
    ],
  }
);
