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
    valid: [],
    invalid: [
      // Null cases
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
                  to: { path: null },
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
      /* {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import react from 'react'",
        options: [
          {
            default: "allow",
            checkAllOrigins: true,
            rules: [
              {
                disallow: {
                  to: { elementPath: null },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of elementPath "null" are not allowed. Denied by rule at index 0',
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
                  to: { parent: null },
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
                  to: { type: null },
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
                  to: { category: null },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of category "null" are not allowed. Denied by rule at index 0',
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
                  to: { captured: null },
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
                    path: null,
                    internalPath: null,
                    elementPath: null,
                    parent: null,
                    type: null,
                    category: null,
                    captured: null,
                  },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of path "null", internalPath "null", elementPath "null", parent "null", type "null", category "null" and captured "null" are not allowed. Denied by rule at index 0',
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
                from: { type: "helpers" },
                disallow: {
                  to: [{ type: "helpers" }],
                  dependency: { nodeKind: "import" },
                },
                message:
                  "Rule at index {{ rule.index }}: blocked from type {{ rule.selector.from.type }} to type {{ rule.selector.to.type }} with node kind {{ rule.selector.dependency.nodeKind }}",
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
                    path: null,
                    internalPath: null,
                    elementPath: null,
                    parent: null,
                    type: null,
                    category: null,
                    captured: null,
                  },
                  dependency: {
                    relationship: { from: null, to: null },
                  },
                },
                message:
                  "Selector at rule at index {{ rule.index }}: path={{ rule.selector.to.path }}, parent={{ rule.selector.to.parent }}, relationship.from={{ rule.selector.dependency.relationship.from }}, relationship.to={{ rule.selector.dependency.relationship.to }}",
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
      }, */
    ],
  }
);
