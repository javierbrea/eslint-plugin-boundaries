import { ELEMENT_TYPES as RULE } from "../../../src/constants/rules";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import { elementTypesNoRuleMessage } from "../../support/messages";

const rule = require(`../../../src/rules/${RULE}`).default;

const { absoluteFilePath } = pathResolvers("docs-examples");

const settings = SETTINGS.docsExamples;

const options = [
  {
    // disallow all local imports by default
    default: "disallow",
    rules: [
      {
        // from helper elements
        from: ["helpers"],
        // allow importing helper elements
        allow: ["helpers"],
      },
      {
        // from component elements
        from: ["components"],
        allow: [
          // allow importing components of the same family
          ["components", { family: "${family}" }],
          // allow importing helpers with captured category "data"
          ["helpers", { category: "data" }],
        ],
      },
      {
        // from components with captured family "molecule"
        from: [["components", { family: "molecule" }]],
        allow: [
          // allow importing components with captured family "atom"
          ["components", { family: "atom" }],
        ],
      },
      {
        // from modules
        from: ["modules"],
        allow: ["helpers", "components", "modules"],
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
          message: elementTypesNoRuleMessage({
            file: "'helpers' with category 'permissions' and elementName 'roles'",
            dep: "'components' with family 'atoms' and elementName 'atom-a'",
          }),
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
          message: elementTypesNoRuleMessage({
            file: "'helpers' with category 'permissions' and elementName 'roles'",
            dep: "'modules' with elementName 'module-a'",
          }),
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
          message: elementTypesNoRuleMessage({
            file: "'components' with family 'atoms' and elementName 'atom-a'",
            dep: "'components' with family 'molecules' and elementName 'molecule-a'",
          }),
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
          message: elementTypesNoRuleMessage({
            file: "'components' with family 'atoms' and elementName 'atom-a'",
            dep: "'helpers' with category 'permissions' and elementName 'roles'",
          }),
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
          message: elementTypesNoRuleMessage({
            file: "'components' with family 'atoms' and elementName 'atom-a'",
            dep: "'modules' with elementName 'module-a'",
          }),
          type: "Literal",
        },
      ],
    },
  ],
});
