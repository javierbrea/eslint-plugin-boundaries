const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const { TYPESCRIPT_SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const { customErrorMessage, elementTypesNoRuleMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const { absoluteFilePath } = pathResolvers("one-level");

const test = (settings, options, errorMessages) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Helpers cant import type from components
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import type { ComponentA } from 'components/component-a'",
        options,
      },
      // Helpers cant import value from components if everything is allowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
          },
        ],
      },
      // Components can import type from helpers
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type { HelperA } from 'helpers/helper-a'",
        options,
      },
      // Components can import value from helpers
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import type from modules
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type { ModuleA } from 'modules/module-a'",
        options,
      },
      // Components can import value from modules if everything is allowed
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleB from 'modules/module-b'",
        options: [
          {
            default: "allow",
          },
        ],
      },
      // Modules can import value from helpers
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { HelperA } from 'helpers/helper-a'",
        options,
      },
      // Modules can import type from components
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import type { ComponentA } from 'components/component-a'",
        options,
      },
      // Modules can import value from components
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { ComponentA } from 'components/component-a'",
        options,
      },
      // Modules can import type from modules
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import type { ModuleB } from '../module-b'",
        options,
      },
      // Modules can import value from modules
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b'",
        options,
      },
    ],
    invalid: [
      // Helpers can't import type from another helper if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import type { HelperB } from 'helpers/helper-b'",
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
                file: "'helpers'",
                dep: "'helpers'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helpers can't import value from another helper
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: "'helpers'",
                dep: "'helpers'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helpers can't import value from a component:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: "'helpers'",
                dep: "'components'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helpers can't import value from a module:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: "'helpers'",
                dep: "'modules'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // Components can't import value from a module:
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: "'components'",
                dep: "'modules'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // Modules can't import type from a helper:
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import type { HelperA } from 'helpers/helper-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: "'modules'",
                dep: "'helpers'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

const settingsOneLevelTypeScript = {
  ...TYPESCRIPT_SETTINGS.oneLevel,
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
};

//
test(
  settingsOneLevelTypeScript,
  [
    {
      default: "allow",
      rules: [
        {
          from: "helpers",
          disallow: ["modules"],
          importKind: "*",
        },
        {
          from: "helpers",
          disallow: ["components", "helpers"],
          importKind: "value",
        },
        {
          from: "components",
          disallow: ["modules"],
          importKind: "value",
        },
        {
          from: "modules",
          disallow: ["helpers"],
          importKind: "type",
        },
      ],
    },
  ],
  {
    0: elementTypesNoRuleMessage({
      file: "'helpers'",
      dep: "'helpers'",
    }),
    1: "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
    2: "Importing kind 'value' from elements of type 'components', or elements of type 'helpers' is not allowed in elements of type 'helpers'. Disallowed in rule 2",
    3: "Importing kind 'value' from elements of type 'modules' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    4: "Importing kind 'value' from elements of type 'modules' is not allowed in elements of type 'components'. Disallowed in rule 3",
    5: "Importing kind 'type' from elements of type 'helpers' is not allowed in elements of type 'modules'. Disallowed in rule 4",
  },
);

// disallow-based options

test(
  settingsOneLevelTypeScript,
  [
    {
      default: "disallow",
      rules: [
        {
          from: "modules",
          allow: ["modules", "components"],
          importKind: ["*"],
        },
        {
          from: "modules",
          allow: ["helpers"],
          importKind: ["value"],
        },
        {
          from: "components",
          allow: ["components", "helpers"],
          importKind: ["*"],
        },
        {
          from: "components",
          allow: ["modules"],
          importKind: "type",
        },
        {
          from: "helpers",
          allow: ["helpers", "components"],
          importKind: "type",
        },
      ],
    },
  ],
  {},
);

// Custom messages

test(
  settingsOneLevelTypeScript,
  [
    {
      default: "allow",
      rules: [
        {
          from: "helpers",
          disallow: ["modules"],
          importKind: "*",
          message: "Do not import ${dependency.importKind} from modules in helpers",
        },
        {
          from: "helpers",
          disallow: ["components", "helpers"],
          importKind: "value",
          message: "Do not import value from ${dependency.type} in helpers",
        },
        {
          from: "components",
          disallow: ["modules"],
          importKind: "value",
          message:
            "Do not import ${dependency.importKind} from ${dependency.type} in ${file.type}",
        },
        {
          from: "modules",
          disallow: ["helpers"],
          importKind: "type",
          message:
            "Do not import ${dependency.importKind} from ${dependency.type} in ${file.type}",
        },
      ],
    },
  ],
  {
    0: elementTypesNoRuleMessage({
      file: "'helpers'",
      dep: "'helpers'",
    }),
    1: "Do not import value from helpers in helpers",
    2: "Do not import value from components in helpers",
    3: "Do not import value from modules in helpers",
    4: "Do not import value from modules in components",
    5: "Do not import type from helpers in modules",
  },
);
