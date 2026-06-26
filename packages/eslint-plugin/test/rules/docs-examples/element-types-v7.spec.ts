import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("docs-examples");

const settings = SETTINGS.docsExamplesV7;

const options = [
  {
    // disallow all local imports by default
    default: "disallow",
    rules: [
      {
        // from helper elements
        from: { file: { categories: "helpers" } },
        // allow importing helper elements
        allow: { to: { file: { categories: "helpers" } } },
      },
      {
        // from component elements
        from: { element: { type: "components" } },
        allow: {
          to: [
            // allow importing components of the same family
            {
              element: {
                type: "components",
                captured: { family: "{{ family }}" },
              },
            },
            // allow importing helpers with captured category "data"
            {
              file: {
                categories: "helpers",
                captured: { category: "data" },
              },
            },
          ],
        },
      },
      {
        // from components with captured family "molecule"
        from: {
          element: { type: "components", captured: { family: "molecule" } },
        },
        allow: {
          to: [
            // allow importing components with captured family "atom"
            {
              element: { type: "components", captured: { family: "atom" } },
            },
          ],
        },
      },
      {
        // from modules
        from: { element: { type: "modules" } },
        allow: {
          to: [
            { file: { categories: "helpers" } },
            { element: { type: "components" } },
            { element: { type: "modules" } },
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
            'There is no rule allowing dependencies from file of category "helpers" and captured values: restOfPath="test/fixtures/docs-examples", category="permissions", elementName="roles" to elements of type "components" and captured values: family="atoms", elementName="atom-a"',
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
            'There is no rule allowing dependencies from file of category "helpers" and captured values: restOfPath="test/fixtures/docs-examples", category="permissions", elementName="roles" to elements of type "modules" and captured values: elementName="module-a"',
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
            'There is no rule allowing dependencies from elements of type "components" and captured values: family="atoms", elementName="atom-a" to elements of type "components" and captured values: family="molecules", elementName="molecule-a"',
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
            'There is no rule allowing dependencies from elements of type "components" and captured values: family="atoms", elementName="atom-a" to file of category "helpers" and captured values: restOfPath="test/fixtures/docs-examples", category="permissions", elementName="roles"',
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
            'There is no rule allowing dependencies from elements of type "components" and captured values: family="atoms", elementName="atom-a" to elements of type "modules" and captured values: elementName="module-a"',
          type: "Literal",
        },
      ],
    },
  ],
});
