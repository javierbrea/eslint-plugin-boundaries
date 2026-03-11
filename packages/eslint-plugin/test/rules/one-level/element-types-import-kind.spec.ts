import ruleFactory from "../../../src/Rules/Dependencies";
import {
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

const { absoluteFilePath } = pathResolvers("one-level");

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string> = {}
) => {
  const localRuleTester = createRuleTester(settings);

  localRuleTester.run(RULE, rule, {
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
            message: errorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: '"helpers"',
                dep: '"helpers"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: '"helpers"',
                dep: '"helpers"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: '"helpers"',
                dep: '"components"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: '"helpers"',
                dep: '"modules"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: '"components"',
                dep: '"modules"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: '"modules"',
                dep: '"helpers"',
              })
            ),
            type: "Literal",
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
runTest(
  settingsOneLevelTypeScript,
  [
    {
      default: "allow",
      rules: [
        {
          from: {
            type: "helpers",
          },
          disallow: [{ to: { type: "modules" }, dependency: { kind: "*" } }],
        },
        {
          from: {
            type: "helpers",
          },
          disallow: [
            { to: { type: "components" }, dependency: { kind: "value" } },
            { to: { type: "helpers" }, dependency: { kind: "value" } },
          ],
        },
        {
          from: {
            type: "components",
          },
          disallow: [
            { to: { type: "modules" }, dependency: { kind: "value" } },
          ],
        },
        {
          from: {
            type: "modules",
          },
          disallow: [{ to: { type: "helpers" }, dependency: { kind: "type" } }],
        },
      ],
    },
  ],
  {
    0: elementTypesNoRuleMessage({
      file: '"helpers"',
      dep: '"helpers"',
    }),
    1: 'Dependencies with kind "value" to elements of type "helpers" are not allowed in elements of type "helpers". Denied by rule at index 1',
    2: 'Dependencies with kind "value" to elements of type "components" are not allowed in elements of type "helpers". Denied by rule at index 1',
    3: 'Dependencies with kind "value" to elements of type "modules" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies with kind "value" to elements of type "modules" are not allowed in elements of type "components". Denied by rule at index 2',
    5: 'Dependencies with kind "type" to elements of type "helpers" are not allowed in elements of type "modules". Denied by rule at index 3',
  }
);

// disallow-based options

runTest(
  settingsOneLevelTypeScript,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { type: "modules" },
          allow: [
            { to: { type: "modules" }, dependency: { kind: "*" } },
            { to: { type: "components" }, dependency: { kind: "*" } },
          ],
        },
        {
          from: { type: "modules" },
          allow: [{ to: { type: "helpers" }, dependency: { kind: "value" } }],
        },
        {
          from: { type: "components" },
          allow: [
            { to: { type: "components" }, dependency: { kind: "*" } },
            { to: { type: "helpers" }, dependency: { kind: "*" } },
          ],
        },
        {
          from: { type: "components" },
          allow: [{ to: { type: "modules" }, dependency: { kind: "type" } }],
        },
        {
          from: { type: "helpers" },
          allow: [
            { to: { type: "helpers" }, dependency: { kind: "type" } },
            { to: { type: "components" }, dependency: { kind: "type" } },
          ],
        },
      ],
    },
  ],
  {}
);

// Custom messages

runTest(
  settingsOneLevelTypeScript,
  [
    {
      default: "allow",
      rules: [
        {
          from: { type: "helpers" },
          disallow: [{ to: { type: "modules" }, dependency: { kind: "*" } }],
          message:
            "Do not import {{ dependency.kind }} from {{ to.type }} in {{ from.type }}",
        },
        {
          from: { type: "helpers" },
          disallow: [
            { to: { type: "components" }, dependency: { kind: "value" } },
            { to: { type: "helpers" }, dependency: { kind: "value" } },
          ],
          message:
            "Do not import {{ dependency.kind }} from {{ to.type }} in {{ from.type }}",
        },
        {
          from: { type: "components" },
          disallow: [
            { to: { type: "modules" }, dependency: { kind: "value" } },
          ],
          message:
            "Do not import {{ dependency.kind }} from {{ to.type }} in {{ from.type }}",
        },
        {
          from: { type: "modules" },
          disallow: [{ to: { type: "helpers" }, dependency: { kind: "type" } }],
          message:
            "Do not import {{ dependency.kind }} from {{ to.type }} in {{ from.type }}",
        },
      ],
    },
  ],
  {
    0: elementTypesNoRuleMessage({
      file: '"helpers"',
      dep: '"helpers"',
    }),
    1: "Do not import value from helpers in helpers",
    2: "Do not import value from components in helpers",
    3: "Do not import value from modules in helpers",
    4: "Do not import value from modules in components",
    5: "Do not import type from helpers in modules",
  }
);

const precedenceRuleTester = createRuleTester(settingsOneLevelTypeScript);

precedenceRuleTester.run(`${RULE} selector kind precedence`, rule, {
  valid: [
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { type: "components" },
              allow: [
                { to: { type: "helpers" }, dependency: { kind: "value" } },
              ],
              importKind: "type",
            },
          ],
        },
      ],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import type { HelperA } from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { type: "components" },
              allow: [
                { to: { type: "helpers" }, dependency: { kind: "value" } },
              ],
              importKind: "type",
            },
          ],
        },
      ],
      errors: [
        {
          message: elementTypesNoRuleMessage({
            file: '"components"',
            dep: '"helpers"',
          }),
          type: "Literal",
        },
      ],
    },
  ],
});
