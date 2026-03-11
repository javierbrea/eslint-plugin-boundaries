import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Settings";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("docs-examples");

const settings = SETTINGS.docsExamples;

const options = [
  {
    // disallow all local imports by default
    default: "disallow",
    rules: [
      {
        // from helper elements
        from: { type: "helpers" },
        // allow importing helper elements
        allow: { to: { type: "helpers" } },
      },
      {
        // from component elements
        from: { type: "components" },
        allow: {
          to: [
            // allow importing components of the same family
            { type: "components", captured: { family: "{{ family }}" } },
            // allow importing helpers with captured category "data"
            { type: "helpers", captured: { category: "data" } },
          ],
        },
      },
      {
        // from components with captured family "molecule"
        from: { type: "components", captured: { family: "molecule" } },
        allow: {
          to: [
            // allow importing components with captured family "atom"
            { type: "components", captured: { family: "atom" } },
          ],
        },
      },
      {
        // from modules
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
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // helper can import helper
    {
      filename: absoluteFilePath("helpers/permissions/roles.js"),
      code: "import { someParser } from 'helpers/data/parse'",
      options,
    },
    // Components can import components of the same family
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options,
    },
    // Components can import helpers of "data" category
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from 'helpers/data/parse'",
      options,
    },
    // Components of family "molecule" can import components of family "atom"
    {
      filename: absoluteFilePath(
        "components/molecules/molecule-a/MoleculeA.js"
      ),
      code: "import AtomA from 'components/atoms/atoms-a'",
      options,
    },
    // Modules can import helpers
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import { someParser } from 'helpers/data/parse'",
      options,
    },
    // Modules can import components
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import AtomA from 'components/atoms/atom-a'",
      options,
    },
    // Modules can import another modules:
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'modules/module-b'",
      options,
    },
  ],
  invalid: [
    // Helpers can't import component
    {
      filename: absoluteFilePath("helpers/permissions/roles.js"),
      code: "import AtomA from 'components/atoms/atom-a'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "helpers", category "permissions" and elementName "roles" to elements of type "components", family "atoms" and elementName "atom-a"',
          type: "Literal",
        },
      ],
    },
    // Helpers can't import modules
    {
      filename: absoluteFilePath("helpers/permissions/roles.js"),
      code: "import ModuleA from 'modules/module-a'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "helpers", category "permissions" and elementName "roles" to elements of type "modules" and elementName "module-a"',
          type: "Literal",
        },
      ],
    },
    // Components can't import components of another family
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import MoleculeA from 'components/molecules/molecule-a'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "components", family "atoms" and elementName "atom-a" to elements of type "components", family "molecules" and elementName "molecule-a"',
          type: "Literal",
        },
      ],
    },
    // Components can't import helpers of a category different to "data"
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { roleHasPermissions } from 'helpers/permissions/roles'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "components", family "atoms" and elementName "atom-a" to elements of type "helpers", category "permissions" and elementName "roles"',
          type: "Literal",
        },
      ],
    },
    // Components can't import modules
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "components", family "atoms" and elementName "atom-a" to elements of type "modules" and elementName "module-a"',
          type: "Literal",
        },
      ],
    },
  ],
});
