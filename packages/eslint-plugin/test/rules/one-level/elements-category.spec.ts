import ruleFactory from "../../../src/Rules/Dependencies";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage } from "../../support/messages";

const { resolve } = require("path");

const { ELEMENT_TYPES: RULE } = require("../../../src/Shared");

const rule = ruleFactory();

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

function elementCategoriesNoRuleMessage({
  file,
  dep,
}: {
  file: string;
  dep: string;
}) {
  return `There is no rule allowing dependencies from elements of category ${file} to elements of category ${dep}`;
}

const defaultSettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    {
      category: "helpers",
      pattern: "helpers/*",
      capture: ["elementName"],
    },
    {
      category: "components",
      pattern: ["components/*"],
      capture: ["elementName"],
    },
    {
      category: "modules",
      pattern: "modules/*",
      capture: ["elementName"],
    },
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
                from: { category: "foo" },
                allow: { to: { category: "components" } },
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
                from: { category: "components" },
                disallow: { to: { category: "foo" } },
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
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
              elementCategoriesNoRuleMessage({
                file: '"modules" and elementName "module-a"',
                dep: '"helpers" and elementName "helper-b"',
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
        category: "helpers",
        pattern: "helpers/*",
      },
      {
        category: "components",
        pattern: "components/*",
      },
      {
        category: "modules",
        pattern: "modules/*",
      },
    ],
  } as RuleTesterSettings,
  [
    {
      default: "allow",
      rules: [
        {
          from: { category: "helpers" },
          disallow: {
            to: [
              { category: "modules" },
              { category: "components" },
              { category: "helpers" },
            ],
          },
        },
        {
          from: { category: "components" },
          disallow: { to: { category: "modules" } },
        },
        {
          from: {
            category: "components",
            captured: { elementName: "component-a" },
          },
          allow: {
            to: { category: "modules", captured: { elementName: "module-b" } },
          },
        },
      ],
    },
  ],
  {
    0: 'There is no rule allowing dependencies from elements of category "helpers" to elements of category "helpers"',
    1: 'Dependencies to elements of category "helpers" are not allowed in elements of category "helpers". Denied by rule at index 0',
    2: 'Dependencies to elements of category "components" are not allowed in elements of category "helpers". Denied by rule at index 0',
    3: 'Dependencies to elements of category "modules" are not allowed in elements of category "helpers". Denied by rule at index 0',
    4: 'Dependencies to elements of category "modules" are not allowed in elements of category "components". Denied by rule at index 1',
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
      rules: [
        {
          from: { category: "components" },
          allow: { to: [{ category: "helpers" }, { category: "components" }] },
        },
        {
          from: { category: "modules" },
          allow: {
            to: [
              { category: "helpers" },
              { category: "components" },
              { category: "modules" },
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
      rules: [
        {
          from: { category: "c*" },
          allow: { to: [{ category: "h*" }, { category: "c*" }] },
        },
        {
          from: { category: "m*" },
          allow: {
            to: [{ category: "h*" }, { category: "c*" }, { category: "m*" }],
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
      rules: [
        {
          from: { category: "helpers" },
          disallow: {
            to: [
              { category: "modules" },
              { category: "components" },
              { category: "helpers" },
            ],
          },
        },
        {
          from: { category: "components" },
          disallow: { to: [{ category: "modules" }] },
        },
      ],
    },
  ],
  {
    1: 'Dependencies to elements of category "helpers" are not allowed in elements of category "helpers". Denied by rule at index 0',
    2: 'Dependencies to elements of category "components" are not allowed in elements of category "helpers". Denied by rule at index 0',
    3: 'Dependencies to elements of category "modules" are not allowed in elements of category "helpers". Denied by rule at index 0',
    4: 'Dependencies to elements of category "modules" are not allowed in elements of category "components". Denied by rule at index 1',
  }
);

// capture options

testCapture(
  defaultSettings,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { category: "components" },
          allow: {
            to: [
              { category: "helpers", captured: { elementName: "helper-a" } },
              { category: "components" },
            ],
          },
          disallow: {
            to: [
              {
                category: "components",
                captured: { elementName: "component-a" },
              },
            ],
          },
        },
        {
          from: { category: "modules" },
          allow: {
            to: [
              { category: "helpers", captured: { elementName: "helper-a" } },
              { category: "components" },
              { category: "modules" },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of category "components" and elementName "component-a" are not allowed in elements of category "components". Denied by rule at index 0',
  }
);

// capture options with micromatch negative expression

testCapture(
  defaultSettings,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { category: "components" },
          allow: {
            to: [
              { category: "helpers", captured: { elementName: "helper-a" } },
              {
                category: "components",
                captured: { elementName: "!component-a" },
              },
            ],
          },
        },
        {
          from: { category: "modules" },
          allow: {
            to: [
              { category: "helpers", captured: { elementName: "helper-a" } },
              { category: "components" },
              { category: "modules" },
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
      rules: [
        {
          from: { category: "c*" },
          allow: {
            to: [
              { category: "helpers", captured: { elementName: "*-a" } },
              { category: "c*" },
            ],
          },
          disallow: {
            to: [{ category: "c*", captured: { elementName: "*-a" } }],
          },
        },
        {
          from: { category: "modules" },
          allow: {
            to: [
              { category: "h*", captured: { elementName: "*-a" } },
              { category: "c*" },
              { category: "m*" },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of category "components" and elementName "component-a" are not allowed in elements of category "components". Denied by rule at index 0',
  }
);

// Custom error message

testCapture(
  defaultSettings,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.category}} with name {{to.captured.elementName}} is not allowed in {{from.category}} with name {{from.captured.elementName}}",
      rules: [
        {
          from: { category: "c*" },
          allow: {
            to: [
              { category: "helpers", captured: { elementName: "*-a" } },
              { category: "c*" },
            ],
          },
          disallow: {
            to: [{ category: "c*", captured: { elementName: "*-a" } }],
          },
          message:
            "Do not import {{to.category}} named {{to.captured.elementName}} from {{from.category}} named {{from.captured.elementName}}. Repeat: Do not import {{to.category}} named {{to.captured.elementName}} from {{from.category}} named {{from.captured.elementName}}.",
        },
        {
          from: { category: "modules" },
          allow: {
            to: [
              { category: "h*", captured: { elementName: "*-a" } },
              { category: "c*" },
              { category: "m*" },
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
        "Importing {{to.category}} with name {{to.captured.elementName}} is not allowed in {{from.category}} with name {{from.captured.elementName}}",
      rules: [
        {
          from: { category: "c*" },
          allow: {
            to: [
              { category: "helpers", captured: { elementName: "*-a" } },
              { category: "c*" },
            ],
          },
          disallow: {
            to: { category: "c*", captured: { elementName: "*-a" } },
          },
        },
        {
          from: { category: "modules" },
          allow: {
            to: [
              { category: "h*", captured: { elementName: "*-a" } },
              { category: "c*" },
              { category: "m*" },
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
      category: "helpers",
      pattern: "helpers/*",
      capture: ["elementName"],
    },
    {
      category: "components",
      pattern: ["components/*"],
      capture: ["elementName"],
    },
    {
      category: "modules",
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
            rules: [
              {
                from: { category: "helpers" },
                allow: {
                  to: [{ category: "helpers" }],
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
                  to: { parent: null },
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
                  to: { isIgnored: false, isUnknown: false },
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
                from: { category: "helpers" },
                disallow: {
                  to: [{ category: "helpers" }],
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
            rules: [
              {
                from: { category: "helpers" },
                disallow: { to: [{ category: "helpers" }] },
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
                from: { category: "helpers" },
                disallow: {
                  to: [{ captured: { elementName: "helper-b" } }],
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
                from: { category: "helpers" },
                disallow: { to: [{ origin: "local" }] },
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
                from: { category: "helpers" },
                disallow: { to: [{ path: "**/helpers/helper-b/**" }] },
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
                from: { category: "helpers" },
                disallow: { to: [{ elementPath: "**/helpers/helper-b" }] },
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
                from: { category: "helpers" },
                disallow: { to: [{ internalPath: "index.js" }] },
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
                from: { category: "helpers" },
                disallow: { to: [{ isIgnored: false }] },
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
                from: { category: "helpers" },
                disallow: { to: [{ isUnknown: false }] },
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
                from: { category: "helpers" },
                disallow: {
                  to: [{ category: "helpers" }],
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
                from: { category: "helpers" },
                disallow: {
                  to: [{ category: "helpers" }],
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
                from: { category: "helpers" },
                disallow: {
                  to: [{ category: "helpers" }],
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
                from: { category: "helpers" },
                disallow: {
                  to: [{ category: "helpers" }],
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
