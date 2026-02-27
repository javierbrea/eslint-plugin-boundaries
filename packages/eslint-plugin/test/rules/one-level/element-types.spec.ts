import rule from "../../../src/Rules/ElementTypes";
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

const { resolve } = require("path");

const { ELEMENT_TYPES: RULE } = require("../../../src/Settings");

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
                from: { type: "foo" },
                allow: { to: { type: "components" } },
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
                from: { type: "components" },
                disallow: { to: { type: "foo" } },
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
                file: "'helpers' with elementName 'helper-a'",
                dep: "'helpers' with elementName 'helper-b'",
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
                file: "'helpers' with elementName 'helper-a'",
                dep: "'helpers' with elementName 'helper-b'",
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
                file: "'helpers' with elementName 'helper-a'",
                dep: "'components' with elementName 'component-a'",
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
                file: "'helpers' with elementName 'helper-a'",
                dep: "'modules' with elementName 'module-a'",
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
                file: "'components' with elementName 'component-a'",
                dep: "'modules' with elementName 'module-a'",
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
                file: "'components' with elementName 'component-a'",
                dep: "'helpers' with elementName 'helper-b'",
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
                file: "'components' with elementName 'component-a'",
                dep: "'helpers' with elementName 'helper-b'",
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
                file: "'components' with elementName 'component-b'",
                dep: "'components' with elementName 'component-a'",
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
                file: "'modules' with elementName 'module-a'",
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

// deprecated settings
runTest(
  SETTINGS.deprecated,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { type: "components" },
          allow: { to: [{ type: "helpers" }, { type: "components" }] },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "helpers" },
              { type: "components" },
              { type: "modules" },
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
          from: { type: "helpers" },
          disallow: {
            to: [
              { type: "modules" },
              { type: "components" },
              { type: "helpers" },
            ],
          },
        },
        {
          from: { type: "components" },
          disallow: { to: { type: "modules" } },
        },
        {
          from: {
            type: "components",
            captured: { elementName: "component-a" },
          },
          allow: {
            to: { type: "modules", captured: { elementName: "module-b" } },
          },
        },
      ],
    },
  ],
  {
    0: elementTypesNoRuleMessage({
      file: "'helpers'",
      dep: "'helpers'",
    }),
    1: "Importing elements of type 'modules', or elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    2: "Importing elements of type 'modules', or elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    3: "Importing elements of type 'modules', or elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    4: "Importing elements of type 'modules' is not allowed in elements of type 'components'. Disallowed in rule 2",
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
          from: { type: "components" },
          allow: { to: [{ type: "helpers" }, { type: "components" }] },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "helpers" },
              { type: "components" },
              { type: "modules" },
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
          from: { type: "components" },
          allow: { to: [{ type: "helpers" }, { type: "components" }] },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "helpers" },
              { type: "components" },
              { type: "modules" },
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
          from: { type: "components" },
          allow: { to: [{ type: "helpers" }, { type: "components" }] },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "helpers" },
              { type: "components" },
              { type: "modules" },
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
          from: { type: "c*" },
          allow: { to: [{ type: "h*" }, { type: "c*" }] },
        },
        {
          from: { type: "m*" },
          allow: { to: [{ type: "h*" }, { type: "c*" }, { type: "m*" }] },
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
          from: { type: "helpers" },
          disallow: {
            to: [
              { type: "modules" },
              { type: "components" },
              { type: "helpers" },
            ],
          },
        },
        {
          from: { type: "components" },
          disallow: { to: [{ type: "modules" }] },
        },
      ],
    },
  ],
  {
    1: "Importing elements of type 'modules', or elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    2: "Importing elements of type 'modules', or elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    3: "Importing elements of type 'modules', or elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    4: "Importing elements of type 'modules' is not allowed in elements of type 'components'. Disallowed in rule 2",
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
      ],
    },
  ],
  {
    2: "Importing elements of type 'components' with elementName 'component-a' is not allowed in elements of type 'components'. Disallowed in rule 1",
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
          from: { type: "components" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "helper-a" } },
              { type: "components", captured: { elementName: "!component-a" } },
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
          from: { type: "c*" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "*-a" } },
              { type: "c*" },
            ],
          },
          disallow: { to: [{ type: "c*", captured: { elementName: "*-a" } }] },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "h*", captured: { elementName: "*-a" } },
              { type: "c*" },
              { type: "m*" },
            ],
          },
        },
      ],
    },
  ],
  {
    2: "Importing elements of type 'c*' with elementName '*-a' is not allowed in elements of type 'c*'. Disallowed in rule 1",
  }
);

// Custom error message

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.type}} with name {{to.captured.elementName}} is not allowed in {{from.type}} with name {{from.captured.elementName}}",
      rules: [
        {
          from: { type: "c*" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "*-a" } },
              { type: "c*" },
            ],
          },
          disallow: { to: [{ type: "c*", captured: { elementName: "*-a" } }] },
          message:
            "Do not import {{to.type}} named {{to.captured.elementName}} from {{from.type}} named {{from.captured.elementName}}. Repeat: Do not import {{to.type}} named {{to.captured.elementName}} from {{from.type}} named {{from.captured.elementName}}.",
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "h*", captured: { elementName: "*-a" } },
              { type: "c*" },
              { type: "m*" },
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
        "Importing {{to.type}} with name {{to.captured.elementName}} is not allowed in {{from.type}} with name {{from.captured.elementName}}",
      rules: [
        {
          from: { type: "c*" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "*-a" } },
              { type: "c*" },
            ],
          },
          disallow: { to: { type: "c*", captured: { elementName: "*-a" } } },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "h*", captured: { elementName: "*-a" } },
              { type: "c*" },
              { type: "m*" },
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
          from: { type: "c*" },
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "*-a" } },
              { type: "c*" },
            ],
          },
          disallow: {
            to: {
              type: "c*",
              captured: { elementName: ["*-a", "component-a", "*t-a"] },
            },
          },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "h*", captured: { elementName: "*-a" } },
              { type: "c*" },
              { type: "m*" },
            ],
          },
        },
      ],
    },
  ],
  {
    2: "Importing elements of type 'c*' with elementName '*-a', 'component-a' or '*t-a' is not allowed in elements of type 'c*'. Disallowed in rule 1",
  }
);

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: [{ type: "c*" }],
          allow: {
            to: [
              { type: "helpers", captured: { elementName: "*-a" } },
              { type: "c*" },
            ],
          },
          disallow: {
            to: [{ type: "c*", captured: { elementName: ["*-a"] } }],
          },
        },
        {
          from: { type: "modules" },
          allow: {
            to: [
              { type: "h*", captured: { elementName: "*-a" } },
              { type: "c*" },
              { type: "m*" },
            ],
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: [
              { type: "h*", captured: { foo: "*-a" } },
              { type: "c*" },
              { type: "m*" },
            ],
          },
        },
      ],
    },
  ],
  {
    2: "Importing elements of type 'c*' with elementName '*-a' is not allowed in elements of type 'c*'. Disallowed in rule 1",
  }
);

const objectSelectorPropertiesSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    {
      type: "helpers",
      category: "shared",
      pattern: "helpers/*",
      capture: ["elementName"],
    },
    {
      type: "components",
      category: "ui",
      pattern: ["components/*"],
      capture: ["elementName"],
    },
    {
      type: "modules",
      category: "domain",
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
                from: { type: "helpers" },
                allow: {
                  to: [{ type: "helpers" }],
                  dependency: { baseSource: null },
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
                from: { type: "helpers" },
                disallow: {
                  to: [{ type: "helpers" }],
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
                from: { type: "helpers" },
                disallow: { to: [{ type: "helpers" }] },
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
                from: { type: "helpers" },
                disallow: { to: [{ category: "shared" }] },
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
                from: { type: "helpers" },
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
                from: { type: "helpers" },
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
                from: { type: "helpers" },
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
                from: { type: "helpers" },
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
                from: { type: "helpers" },
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
                from: { type: "helpers" },
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
                from: { type: "helpers" },
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
                from: { type: "helpers" },
                disallow: {
                  to: [{ type: "helpers" }],
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
                from: { type: "helpers" },
                disallow: {
                  to: [{ type: "helpers" }],
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
                from: { type: "helpers" },
                disallow: {
                  to: [{ type: "helpers" }],
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
                from: { type: "helpers" },
                disallow: {
                  to: [{ type: "helpers" }],
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
