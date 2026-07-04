import { resolve } from "node:path";

import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage } from "../../support/messages";

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const rule = ruleFactory();

function fileCategoriesNoRuleMessage({
  file,
  dep,
}: {
  file: string;
  dep: string;
}) {
  return `There is no policy allowing dependencies from file of category ${file} to file of category ${dep}`;
}

const defaultSettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    {
      type: "code",
      pattern: "helpers/*",
      capture: ["elementName"],
    },
    {
      type: "code",
      pattern: ["components/*"],
      capture: ["elementName"],
    },
    {
      type: "code",
      pattern: "modules/*",
      capture: ["elementName"],
    },
  ],
  "boundaries/files": [
    { category: "helpers", pattern: "**/helpers/*/**" },
    { category: "components", pattern: ["**/components/*/**"] },
    { category: "modules", pattern: "**/modules/*/**" },
  ],
} as RuleTesterSettings;

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
                from: { file: { categories: "foo" } },
                allow: { to: { file: { categories: "components" } } },
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
                from: { file: { categories: "components" } },
                disallow: { to: { file: { categories: "foo" } } },
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
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-a"',
                dep: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-b"',
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
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-a"',
                dep: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-b"',
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
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-a"',
                dep: '"components" belonging to elements of type "code" and captured values: elementName="component-a"',
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
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-a"',
                dep: '"modules" belonging to elements of type "code" and captured values: elementName="module-a"',
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
              fileCategoriesNoRuleMessage({
                file: '"components" belonging to elements of type "code" and captured values: elementName="component-a"',
                dep: '"modules" belonging to elements of type "code" and captured values: elementName="module-a"',
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
              fileCategoriesNoRuleMessage({
                file: '"components" belonging to elements of type "code" and captured values: elementName="component-a"',
                dep: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-b"',
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
              fileCategoriesNoRuleMessage({
                file: '"components" belonging to elements of type "code" and captured values: elementName="component-a"',
                dep: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-b"',
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
              fileCategoriesNoRuleMessage({
                file: '"components" belonging to elements of type "code" and captured values: elementName="component-b"',
                dep: '"components" belonging to elements of type "code" and captured values: elementName="component-a"',
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
              fileCategoriesNoRuleMessage({
                file: '"modules" belonging to elements of type "code" and captured values: elementName="module-a"',
                dep: '"helpers" belonging to elements of type "code" and captured values: elementName="helper-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// settings with no capture option
runTest(
  {
    ...defaultSettings,
    "boundaries/elements": [
      {
        type: "code",
        pattern: "helpers/*",
      },
      {
        type: "code",
        pattern: "components/*",
      },
      {
        type: "code",
        pattern: "modules/*",
      },
    ],
  } as RuleTesterSettings,
  [
    {
      default: "allow",
      policies: [
        {
          from: { file: { categories: "helpers" } },
          disallow: {
            to: [
              { file: { categories: "modules" } },
              { file: { categories: "components" } },
              { file: { categories: "helpers" } },
            ],
          },
        },
        {
          from: { file: { categories: "components" } },
          disallow: { to: { file: { categories: "modules" } } },
        },
        {
          from: {
            file: { categories: "components" },
            element: { captured: { elementName: "component-a" } },
          },
          allow: {
            to: {
              file: { categories: "modules" },
              element: { captured: { elementName: "module-b" } },
            },
          },
        },
      ],
    },
  ],
  {
    0: 'There is no policy allowing dependencies from file of category "helpers" belonging to elements of type "code" to file of category "helpers" belonging to elements of type "code"',
    1: 'Dependencies to file of category "helpers" are not allowed in file of category "helpers". Denied by policy at index 0',
    2: 'Dependencies to file of category "components" are not allowed in file of category "helpers". Denied by policy at index 0',
    3: 'Dependencies to file of category "modules" are not allowed in file of category "helpers". Denied by policy at index 0',
    4: 'Dependencies to file of category "modules" are not allowed in file of category "components". Denied by policy at index 1',
  }
);

// root-path absolute setting

runTest(
  {
    ...defaultSettings,
    "boundaries/root-path": resolve(__dirname, "..", "..", ".."),
  } as RuleTesterSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "components" } },
          allow: {
            to: [
              { file: { categories: "helpers" } },
              { file: { categories: "components" } },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              { file: { categories: "helpers" } },
              { file: { categories: "components" } },
              { file: { categories: "modules" } },
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
  defaultSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              { file: { categories: "h*" } },
              { file: { categories: "c*" } },
            ],
          },
        },
        {
          from: { file: { categories: "m*" } },
          allow: {
            to: [
              { file: { categories: "h*" } },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
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
  defaultSettings,
  [
    {
      default: "allow",
      policies: [
        {
          from: { file: { categories: "helpers" } },
          disallow: {
            to: [
              { file: { categories: "modules" } },
              { file: { categories: "components" } },
              { file: { categories: "helpers" } },
            ],
          },
        },
        {
          from: { file: { categories: "components" } },
          disallow: { to: [{ file: { categories: "modules" } }] },
        },
      ],
    },
  ],
  {
    1: 'Dependencies to file of category "helpers" are not allowed in file of category "helpers". Denied by policy at index 0',
    2: 'Dependencies to file of category "components" are not allowed in file of category "helpers". Denied by policy at index 0',
    3: 'Dependencies to file of category "modules" are not allowed in file of category "helpers". Denied by policy at index 0',
    4: 'Dependencies to file of category "modules" are not allowed in file of category "components". Denied by policy at index 1',
  }
);

// capture options

testCapture(
  defaultSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "components" } },
          allow: {
            to: [
              {
                file: { categories: "helpers" },
                element: { captured: { elementName: "helper-a" } },
              },
              { file: { categories: "components" } },
            ],
          },
          disallow: {
            to: [
              {
                file: { categories: "components" },
                element: { captured: { elementName: "component-a" } },
              },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "helpers" },
                element: { captured: { elementName: "helper-a" } },
              },
              { file: { categories: "components" } },
              { file: { categories: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to file of category "components" belonging to elements of captured values: elementName="component-a" are not allowed in file of category "components". Denied by policy at index 0',
  }
);

// capture options with micromatch negative expression

testCapture(
  defaultSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "components" } },
          allow: {
            to: [
              {
                file: { categories: "helpers" },
                element: { captured: { elementName: "helper-a" } },
              },
              {
                file: { categories: "components" },
                element: { captured: { elementName: "!component-a" } },
              },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "helpers" },
                element: { captured: { elementName: "helper-a" } },
              },
              { file: { categories: "components" } },
              { file: { categories: "modules" } },
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
  defaultSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              {
                file: { categories: "helpers" },
                element: { captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
            ],
          },
          disallow: {
            to: [
              {
                file: { categories: "c*" },
                element: { captured: { elementName: "*-a" } },
              },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "h*" },
                element: { captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to file of category "components" belonging to elements of captured values: elementName="component-a" are not allowed in file of category "components". Denied by policy at index 0',
  }
);

// Custom error message

testCapture(
  defaultSettings,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.file.categories.[0]}} with name {{to.element.captured.elementName}} is not allowed in {{from.file.categories.[0]}} with name {{from.element.captured.elementName}}",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              {
                file: { categories: "helpers" },
                element: { captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
            ],
          },
          disallow: {
            to: [
              {
                file: { categories: "c*" },
                element: { captured: { elementName: "*-a" } },
              },
            ],
          },
          message:
            "Do not import {{to.file.categories.[0]}} named {{to.element.captured.elementName}} from {{from.file.categories.[0]}} named {{from.element.captured.elementName}}. Repeat: Do not import {{to.file.categories.[0]}} named {{to.element.captured.elementName}} from {{from.file.categories.[0]}} named {{from.element.captured.elementName}}.",
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "h*" },
                element: { captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
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
  defaultSettings,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.file.categories.[0]}} with name {{to.element.captured.elementName}} is not allowed in {{from.file.categories.[0]}} with name {{from.element.captured.elementName}}",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              {
                file: { categories: "helpers" },
                element: { captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
            ],
          },
          disallow: {
            to: {
              file: { categories: "c*" },
              element: { captured: { elementName: "*-a" } },
            },
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "h*" },
                element: { captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
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

const objectSelectorPropertiesSettings = {
  ...defaultSettings,
  "boundaries/elements": [
    {
      type: "code",
      pattern: "helpers/*",
      capture: ["elementName"],
    },
    {
      type: "code",
      pattern: ["components/*"],
      capture: ["elementName"],
    },
    {
      type: "code",
      pattern: "modules/*",
      capture: ["elementName"],
    },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                allow: {
                  to: [{ file: { categories: "helpers" } }],
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
            policies: [
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
            policies: [
              {
                allow: {
                  to: { file: { isIgnored: false, isUnknown: false } },
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
            policies: [
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
            policies: [
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
            policies: [
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { relationship: { to: "foo" } },
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
                from: { file: { categories: "helpers" } },
                disallow: { to: [{ file: { categories: "helpers" } }] },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { path: "**/helpers/helper-b/**" } }],
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: { to: [{ file: { isIgnored: false } }] },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: { to: [{ file: { isUnknown: false } }] },
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
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
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { nodeKind: "import" },
                },
                message: "blocked-node-kind",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-node-kind", type: "Literal" }],
      },
    ],
  }
);
