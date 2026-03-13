import { resolve } from "node:path";

import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE, RULE_NAMES_MAP } from "../../../src/Shared";
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

const rule = ruleFactory(RULE_NAMES_MAP.ELEMENT_TYPES);

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE_NAMES_MAP.ELEMENT_TYPES, rule, {
    valid: [
      // Non recognized types can import whatever
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // No options
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import HelperA from 'helpers/helper-a'",
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
                from: "foo",
                allow: ["components"],
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
                from: "components",
                disallow: ["foo"],
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
          from: "components",
          allow: ["helpers", "components"],
        },
        {
          from: "modules",
          allow: ["helpers", "components", "modules"],
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
          from: "helpers",
          disallow: ["modules", "components", "helpers"],
        },
        {
          from: "components",
          disallow: ["modules"],
        },
        {
          from: [["components", { elementName: "component-a" }]],
          allow: [["modules", { elementName: "module-b" }]],
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
    4: 'Dependencies to elements of type "modules" and captured "null" are not allowed in elements of type "components". Denied by rule at index 1',
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
          from: "components",
          allow: ["helpers", "components"],
        },
        {
          from: "modules",
          allow: ["helpers", "components", "modules"],
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
          from: "components",
          allow: ["helpers", "components"],
        },
        {
          from: "modules",
          allow: ["helpers", "components", "modules"],
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
          from: "components",
          allow: ["helpers", "components"],
        },
        {
          from: "modules",
          allow: ["helpers", "components", "modules"],
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
          from: "c*",
          allow: ["h*", "c*"],
        },
        {
          from: "m*",
          allow: ["h*", "c*", "m*"],
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
          from: "helpers",
          disallow: ["modules", "components", "helpers"],
        },
        {
          from: "components",
          disallow: ["modules"],
        },
      ],
    },
  ],
  {
    1: 'Dependencies to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 0',
    2: 'Dependencies to elements of type "components" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies to elements of type "modules" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies to elements of type "modules" and elementName "module-a" are not allowed in elements of type "components". Denied by rule at index 1',
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
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and elementName "component-a" are not allowed in elements of type "components". Denied by rule at index 0',
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
          from: "components",
          allow: [
            ["helpers", { elementName: "helper-a" }],
            ["components", { elementName: "!component-a" }],
          ],
        },
        {
          from: "modules",
          allow: [
            ["helpers", { elementName: "helper-a" }],
            "components",
            "modules",
          ],
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
          from: "c*",
          allow: [["helpers", { elementName: "*-a" }], "c*"],
          disallow: [["c*", { elementName: "*-a" }]],
        },
        {
          from: "modules",
          allow: [["h*", { elementName: "*-a" }], "c*", "m*"],
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and elementName "component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);

// Custom error message

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      message:
        "Importing ${dependency.type} with name ${dependency.elementName} is not allowed in ${file.type} with name ${file.elementName}",
      rules: [
        {
          from: "c*",
          allow: [["helpers", { elementName: "*-a" }], "c*"],
          disallow: [["c*", { elementName: "*-a" }]],
          message:
            "Do not import ${dependency.type} named ${dependency.elementName} from ${file.type} named ${file.elementName}. Repeat: Do not import ${dependency.type} named ${dependency.elementName} from ${file.type} named ${file.elementName}.",
        },
        {
          from: "modules",
          allow: [["h*", { elementName: "*-a" }], "c*", "m*"],
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
        "Importing ${dependency.type} with name ${dependency.elementName} is not allowed in ${file.type} with name ${file.elementName}",
      rules: [
        {
          from: "c*",
          allow: [["helpers", { elementName: "*-a" }], "c*"],
          disallow: [["c*", { elementName: "*-a" }]],
        },
        {
          from: "modules",
          allow: [["h*", { elementName: "*-a" }], "c*", "m*"],
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
          from: "c*",
          allow: [["helpers", { elementName: "*-a" }], "c*"],
          disallow: [["c*", { elementName: ["*-a", "component-a", "*t-a"] }]],
        },
        {
          from: "modules",
          allow: [["h*", { elementName: "*-a" }], "c*", "m*"],
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and elementName "component-a" are not allowed in elements of type "components". Denied by rule at index 0',
  }
);

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: ["c*"],
          allow: [["helpers", { elementName: "*-a" }], "c*"],
          disallow: [["c*", { elementName: ["*-a"] }]],
        },
        {
          from: "modules",
          allow: [["h*", { elementName: "*-a" }], "c*", "m*"],
        },
        {
          from: "modules",
          disallow: [["h*", { foo: "*-a" }], "c*", "m*"],
        },
      ],
    },
  ],
  {
    2: 'Dependencies to elements of type "components" and elementName "component-a" are not allowed in elements of type "components" and elementName "component-b". Denied by rule at index 0',
  }
);
