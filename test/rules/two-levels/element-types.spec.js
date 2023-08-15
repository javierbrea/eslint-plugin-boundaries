const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const { customErrorMessage, elementTypesNoRuleMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const test = (settings, options, { absoluteFilePath }, errorMessages) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // helpers can import helpers
      {
        filename: absoluteFilePath("helpers/helper-a/index.js"),
        code: "import HelperA from 'helpers/helper-b'",
        options,
      },
      // atom components can import helpers
      {
        filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // atom components can import atoms
      {
        filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
        code: "import HelperA from 'components/atoms/atom-b'",
        options,
      },
      // atom components can import atoms using relative paths
      {
        filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
        code: "import HelperA from '../atom-b'",
        options,
      },
      // molecule components can import atoms
      {
        filename: absoluteFilePath("components/molecules/molecule-a/MoleculeA.js"),
        code: "import HelperA from 'components/atoms/atom-a'",
        options,
      },
      // molecule components can import atoms using relative paths
      {
        filename: absoluteFilePath("components/molecules/molecule-a/MoleculeA.js"),
        code: "import HelperA from '../../atoms/atom-a'",
        options,
      },
      // molecule components can import molecules
      {
        filename: absoluteFilePath("components/molecules/molecule-a/MoleculeA.js"),
        code: "import MoleculeA from 'components/molecules/molecule-a'",
        options,
      },
      // layout components can import molecules
      {
        filename: absoluteFilePath("components/layouts/layout-a/LayoutA.js"),
        code: "import MoleculeA from 'components/molecules/molecule-a'",
        options,
      },
      // page modules can import layout components
      {
        filename: absoluteFilePath("modules/pages/page-a/PageA.js"),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a modules can import layout components
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a modules subfiles can import layout components
      {
        filename: absoluteFilePath("modules/domain-a/module-a/subfolder-1/subfile-1"),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a modules subfiles can import internal files
      {
        filename: absoluteFilePath("modules/domain-a/module-a/subfolder-1/subfile-1"),
        code: "import LayoutA from './subfolder-2/subfile-2'",
        options,
      },
      // domain-a modules subfiles can import internal files
      {
        filename: absoluteFilePath("modules/domain-a/module-a/subfolder-1/subfolder-2/subfile-2"),
        code: "import LayoutA from '../subfile-1'",
        options,
      },
      // domain-a modules can import domain-a modules
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // domain-a module subfiles can import domain-a modules
      {
        filename: absoluteFilePath("modules/domain-a/module-a/subfolder-1/subfile-1.js"),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // domain-a module subfiles can import domain-a modules
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfolder-2/subfolder-2.js",
        ),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // domain-b modules can import domain-b modules
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import ModuleB from 'modules/domain-b/module-b'",
        options,
      },
      // domain-b modules can import domain-a modules
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import ModuleB from 'modules/domain-a/module-a'",
        options,
      },
      // domain-b modules can import domain-a modules subfiles
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import ModuleB from 'modules/domain-a/module-a/subfolder-1/subfile-1'",
        options,
      },
      // domain-b modules can import domain-a modules subfiles
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import ModuleB from 'modules/domain-a/module-a/subfolder-1/subfolder-2/subfile-2'",
        options,
      },
      // domain-b module-b can import atom components
      {
        filename: absoluteFilePath("modules/domain-b/module-b/ModuleB.js"),
        code: "import AtomA from 'components/atoms/atom-a'",
        options,
      },
      // module-a in domain-a can import atom-b atom component
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import AtomA from 'components/atoms/atom-b'",
        options,
      },
      // module-a subfiles in domain-a can import atom-b atom component
      {
        filename: absoluteFilePath("modules/domain-a/module-a/subfolder-1/subfile-1"),
        code: "import AtomA from 'components/atoms/atom-b'",
        options,
      },
      // module-a subfiles in domain-a can import atom-b atom component subfiles
      {
        filename: absoluteFilePath("modules/domain-a/module-a/subfolder-1/subfile-1"),
        code: "import AtomA from 'components/atoms/atom-b/subfolder-1/subfile-1'",
        options,
      },
      // module-a subfiles in domain-a can import atom-b atom component subfiles
      {
        filename: absoluteFilePath("modules/domain-a/module-a/subfolder-1/subfile-1"),
        code: "import AtomA from 'components/atoms/atom-b/subfolder-1/subfolder-2/subfile-2'",
        options,
      },
    ],
    invalid: [
      // helpers can't import atoms
      {
        filename: absoluteFilePath("helpers/helper-a/index.js"),
        code: "import AtomA from 'components/atoms/atom-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "'components' with category 'atoms' and elementName 'atom-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // helpers can't import modules
      {
        filename: absoluteFilePath("helpers/helper-a/index.js"),
        code: "import AtomA from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),

            type: "ImportDeclaration",
          },
        ],
      },
      // atom components can't import molecule components
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import MoleculeA from 'components/molecules/molecule-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: "'components' with category 'atoms' and elementName 'atom-a'",
                dep: "'components' with category 'molecules' and elementName 'molecule-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // atom components can't import layout components using relative paths
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import LayoutA from '../../layouts/layout-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: "'components' with category 'atoms' and elementName 'atom-a'",
                dep: "'components' with category 'layouts' and elementName 'layout-a'",
              }),
            ),

            type: "ImportDeclaration",
          },
        ],
      },
      // atom components can't import layout components
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: "'components' with category 'atoms' and elementName 'atom-a'",
                dep: "'components' with category 'layouts' and elementName 'layout-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // molecule components can't import layout components
      {
        filename: absoluteFilePath("components/molecules/molecule-a/index.js"),
        code: "import LayoutB from 'components/layouts/layout-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: "'components' with category 'molecules' and elementName 'molecule-a'",
                dep: "'components' with category 'layouts' and elementName 'layout-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // molecule components can't import modules
      {
        filename: absoluteFilePath("components/molecules/molecule-a/index.js"),
        code: "import ModuleA from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              6,
              elementTypesNoRuleMessage({
                file: "'components' with category 'molecules' and elementName 'molecule-a'",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // layout components can't import atoms
      {
        filename: absoluteFilePath("components/layouts/layout-a/index.js"),
        code: "import ComponentA from 'components/atoms/atom-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              7,
              elementTypesNoRuleMessage({
                file: "'components' with category 'layouts' and elementName 'layout-a'",
                dep: "'components' with category 'atoms' and elementName 'atom-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // layout components can't import modules
      {
        filename: absoluteFilePath("components/layouts/layout-a/index.js"),
        code: "import ModuleA from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              8,
              elementTypesNoRuleMessage({
                file: "'components' with category 'layouts' and elementName 'layout-a'",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // page modules can't import atom components
      {
        filename: absoluteFilePath("modules/pages/page-a/index.js"),
        code: "import Component from 'components/atoms/atom-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              9,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "'components' with category 'atoms' and elementName 'atom-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // page modules can't import molecule components
      {
        filename: absoluteFilePath("modules/pages/page-a/index.js"),
        code: "import Component from 'components/molecules/molecule-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              10,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "'components' with category 'molecules' and elementName 'molecule-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // page modules can't import page modules
      {
        filename: absoluteFilePath("modules/pages/page-a/index.js"),
        code: "import PageB from 'modules/pages/page-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              11,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "'modules' with domain 'pages' and elementName 'page-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // page modules can't import domain modules
      {
        filename: absoluteFilePath("modules/pages/page-a/index.js"),
        code: "import PageB from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              12,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // page modules can't import domain modules using relative paths
      {
        filename: absoluteFilePath("modules/pages/page-a/index.js"),
        code: "import PageB from '../../domain-a/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              13,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },

      // domain a modules can't import atom components
      {
        filename: absoluteFilePath("modules/domain-a/module-b/index.js"),
        code: "import Component from 'components/atoms/atom-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              14,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a' and elementName 'module-b'",
                dep: "'components' with category 'atoms' and elementName 'atom-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain a modules can't import atom components subfiles
      {
        filename: absoluteFilePath("modules/domain-a/module-b/index.js"),
        code: "import AtomB from 'components/atoms/atom-b/subfolder-1/subfolder-2/subfile-2'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              15,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a' and elementName 'module-b'",
                dep: "'components' with category 'atoms' and elementName 'atom-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain a modules can't import molecule components
      {
        filename: absoluteFilePath("modules/domain-a/module-a/index.js"),
        code: "import Component from 'components/molecules/molecule-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              16,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a' and elementName 'module-a'",
                dep: "'components' with category 'molecules' and elementName 'molecule-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain a modules can't import page modules
      {
        filename: absoluteFilePath("modules/domain-a/module-a/index.js"),
        code: "import PageB from 'modules/pages/page-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              17,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a' and elementName 'module-a'",
                dep: "'modules' with domain 'pages' and elementName 'page-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain a modules can't import domain b modules
      {
        filename: absoluteFilePath("modules/domain-a/module-a/index.js"),
        code: "import PageB from 'modules/domain-b/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              18,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a' and elementName 'module-a'",
                dep: "'modules' with domain 'domain-b' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain a modules can't import domain b modules using relative paths
      {
        filename: absoluteFilePath("modules/domain-a/module-a/index.js"),
        code: "import PageB from '../../domain-b/module-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              19,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a' and elementName 'module-a'",
                dep: "'modules' with domain 'domain-b' and elementName 'module-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain-b modules can't import layout components
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              20,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-b' and elementName 'module-a'",
                dep: "'components' with category 'layouts' and elementName 'layout-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain-b modules can't import molecule components
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import LayoutA from 'components/molecules/molecule-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              21,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-b' and elementName 'module-a'",
                dep: "'components' with category 'molecules' and elementName 'molecule-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain-b modules can't import page modules
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import LayoutA from 'modules/pages/page-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              22,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-b' and elementName 'module-a'",
                dep: "'modules' with domain 'pages' and elementName 'page-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // module-a in domain-b can't import atom components
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import Component from 'components/atoms/atom-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              23,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-b' and elementName 'module-a'",
                dep: "'components' with category 'atoms' and elementName 'atom-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // module-a in domain-a can't import atom-a atom component
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import AtomA from 'components/atoms/atom-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              24,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a' and elementName 'module-a'",
                dep: "'components' with category 'atoms' and elementName 'atom-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

const testPrivate = (settings, options, { absoluteFilePath }, errorMessages) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // private helpers can import helpers
      {
        filename: absoluteFilePath("helpers/helper-a/helpers/helper-c/index.js"),
        code: "import HelperA from 'helpers/helper-b'",
        options,
      },
      // helpers can import private helpers
      {
        filename: absoluteFilePath("helpers/helper-a/index.js"),
        code: "import HelperA from 'helpers/helper-a/helpers/helper-c'",
        options,
      },
      // private molecule components can import atoms
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/MoleculeC.js",
        ),
        code: "import HelperA from 'components/atoms/atom-a'",
        options,
      },
      // molecule components can import atoms using relative paths
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/MoleculeC.js",
        ),
        code: "import HelperA from '../../../../../atoms/atom-a'",
        options,
      },
      // private molecule components can import molecules
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/MoleculeC.js",
        ),
        code: "import MoleculeA from 'components/molecules/molecule-a'",
        options,
      },
      // molecule components can import private molecules
      {
        filename: absoluteFilePath("components/molecules/molecule-a/index.js"),
        code: "import MoleculeA from 'components/molecules/molecule-a/components/molecules/molecule-c'",
        options,
      },
      // layout components can import private molecules
      {
        filename: absoluteFilePath("components/layouts/layout-a/LayoutA.js"),
        code: "import MoleculeA from 'components/molecules/molecule-a/components/molecules/molecule-c'",
        options,
      },
      // domain-a private modules can import layout components
      {
        filename: absoluteFilePath("modules/domain-a/module-a/submodules/module-c/ModuleC.js"),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a private modules subfiles can import layout components
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/submodules/module-d/subfolder-1/subfile-1",
        ),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a private modules subfiles can import internal files
      {
        filename: absoluteFilePath("modules/domain-a/module-a/submodules/module-c/index"),
        code: "import LayoutA from './subfolder-1/subfile-1'",
        options,
      },
      // domain-a private modules can import domain-a modules
      {
        filename: absoluteFilePath("modules/domain-a/module-a/submodules/module-c/ModuleC.js"),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // domain-a private modules of private modules can import domain-a modules
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/submodules/module-d/ModuleD.js",
        ),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // private module-c in domain-a can import atom-b atom component
      {
        filename: absoluteFilePath("modules/domain-a/module-a/submodules/module-c/ModuleC.js"),
        code: "import AtomA from 'components/atoms/atom-b'",
        options,
      },
      // private module-d in domain-a can import atom-b atom component
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/submodules/module-d/index.js",
        ),
        code: "import AtomA from 'components/atoms/atom-b'",
        options,
      },
      // private helper-c can import private module d
      {
        filename: absoluteFilePath("helpers/helper-a/helpers/helper-c/index.js"),
        code: "import ModuleD from 'modules/domain-a/module-a/submodules/module-c/submodules/module-d'",
        options,
      },
    ],
    invalid: [
      // private helpers can't import atoms
      {
        filename: absoluteFilePath("helpers/helper-a/helpers/helper-c/index.js"),
        code: "import AtomA from 'components/atoms/atom-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'helpers' with elementName 'helper-c'",
                dep: "'components' with category 'atoms' and elementName 'atom-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // private helpers can't import modules
      {
        filename: absoluteFilePath("helpers/helper-a/helpers/helper-c/index.js"),
        code: "import AtomA from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: "'helpers' with elementName 'helper-c'",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // atom components can't import private molecule components
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import MoleculeA from 'components/molecules/molecule-a/components/molecules/molecule-c'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: "'components' with category 'atoms' and elementName 'atom-a'",
                dep: "'components' with category 'molecules' and elementName 'molecule-c'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // atom components can't import private molecule components
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import MoleculeA from 'components/molecules/molecule-a/components/molecules/molecule-c/components/molecules/molecule-d'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: "'components' with category 'atoms' and elementName 'atom-a'",
                dep: "'components' with category 'molecules' and elementName 'molecule-d'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // privte molecule components can't import layout components
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/index.js",
        ),
        code: "import LayoutB from 'components/layouts/layout-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: "'components' with category 'molecules' and elementName 'molecule-c'",
                dep: "'components' with category 'layouts' and elementName 'layout-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // private molecule components can't import modules
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/index.js",
        ),
        code: "import ModuleA from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: "'components' with category 'molecules' and elementName 'molecule-c'",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // layout components can't import private modules
      {
        filename: absoluteFilePath("components/layouts/layout-a/index.js"),
        code: "import ModuleA from 'modules/domain-a/module-a/submodules/module-c'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              6,
              elementTypesNoRuleMessage({
                file: "'components' with category 'layouts' and elementName 'layout-a'",
                dep: "'modules' with domain 'domain-a', ancestorsPaths 'module-a' and elementName 'module-c'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // page modules can't import private molecule components
      {
        filename: absoluteFilePath("modules/pages/page-a/index.js"),
        code: "import Component from 'components/molecules/molecule-a/components/molecules/molecule-c'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              7,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "'components' with category 'molecules' and elementName 'molecule-c'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // page modules can't import domain private modules
      {
        filename: absoluteFilePath("modules/pages/page-a/index.js"),
        code: "import PageB from 'modules/domain-a/module-a/submodules/module-c'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              8,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'pages' and elementName 'page-a'",
                dep: "'modules' with domain 'domain-a', ancestorsPaths 'module-a' and elementName 'module-c'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // domain a private modules can't import private molecule components
      {
        filename: absoluteFilePath("modules/domain-a/module-a/submodules/module-c/index.js"),
        code: "import Component from 'components/molecules/molecule-a/components/molecules/molecule-c'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              9,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a', ancestorsPaths 'module-a' and elementName 'module-c'",
                dep: "'components' with category 'molecules' and elementName 'molecule-c'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // private domain a modules can't import page modules
      {
        filename: absoluteFilePath("modules/domain-a/module-a/submodules/module-c/index.js"),
        code: "import PageB from 'modules/pages/page-b'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              10,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a', ancestorsPaths 'module-a' and elementName 'module-c'",
                dep: "'modules' with domain 'pages' and elementName 'page-b'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
      // private domain a modules can't import domain b modules
      {
        filename: absoluteFilePath("modules/domain-a/module-a/submodules/module-c/index.js"),
        code: "import PageB from 'modules/domain-b/module-a'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              11,
              elementTypesNoRuleMessage({
                file: "'modules' with domain 'domain-a', ancestorsPaths 'module-a' and elementName 'module-c'",
                dep: "'modules' with domain 'domain-b' and elementName 'module-a'",
              }),
            ),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

test(
  SETTINGS.twoLevels,
  [
    {
      default: "disallow",
      rules: [
        {
          from: "helpers",
          allow: "helpers",
        },
        {
          from: [["components", { category: "atoms" }]],
          allow: ["helpers", ["components", { category: "atoms" }]],
        },
        {
          from: [["components", { category: "molecules" }]],
          allow: [
            ["components", { category: "atoms" }],
            ["components", { category: "molecules" }],
          ],
        },
        {
          from: [["components", { category: "layouts" }]],
          allow: [["components", { category: "molecules" }]],
        },
        {
          from: [
            ["modules", { domain: "pages" }],
            ["modules", { domain: "domain-a" }],
          ],
          allow: [["components", { category: "layouts" }]],
        },
        {
          from: [["modules", { domain: "domain-a" }]],
          allow: [["modules", { domain: "domain-a" }]],
        },
        {
          from: [["modules", { domain: "domain-b" }]],
          allow: [["modules", { domain: "domain-*" }]],
        },
        // module b in domain b can import even atoms!
        {
          from: [["modules", { domain: "domain-b", elementName: "module-b" }]],
          allow: [["components", { category: "atoms" }]],
        },
        // module a in domain a can import any atom *-b!
        {
          from: [["modules", { domain: "*-a", elementName: "module-a" }]],
          allow: [["components", { category: "atoms", elementName: "*-b" }]],
        },
      ],
    },
  ],
  pathResolvers("two-levels"),
  {},
);

testPrivate(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      default: "disallow",
      rules: [
        {
          from: "helpers",
          allow: "helpers",
        },
        {
          from: [["components", { category: "atoms" }]],
          allow: ["helpers", ["components", { category: "atoms" }]],
        },
        {
          from: [["components", { category: "molecules" }]],
          allow: [
            ["components", { category: "atoms" }],
            ["components", { category: "molecules" }],
          ],
        },
        {
          from: [["components", { category: "layouts" }]],
          allow: [["components", { category: "molecules" }]],
        },
        {
          from: [
            ["modules", { domain: "pages" }],
            ["modules", { domain: "domain-a" }],
          ],
          allow: [["components", { category: "layouts" }]],
        },
        {
          from: [["modules", { domain: "domain-a" }]],
          allow: [["modules", { domain: "domain-a" }]],
        },
        {
          from: [["modules", { domain: "domain-b" }]],
          allow: [["modules", { domain: "domain-*" }]],
        },
        // module b in domain b can import even atoms!
        {
          from: [["modules", { domain: "domain-b", elementName: "module-b" }]],
          allow: [["components", { category: "atoms" }]],
        },
        // module a in domain a can import any atom *-b!
        {
          from: [["modules", { domain: "*-a", elementName: "module-a" }]],
          allow: [["components", { category: "atoms", elementName: "*-b" }]],
        },
        // private module d in domain a can import any atom *-b!
        {
          from: [["modules", { domain: "*-a", elementName: "module-(d|c)" }]],
          allow: [["components", { category: "atoms", elementName: "*-b" }]],
        },
        // private helper d can import private module d!
        {
          from: [["helpers", { elementName: "helper-c" }]],
          allow: [["modules", { elementName: "*-d" }]],
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private"),
  {},
);

testPrivate(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      default: "allow",
      rules: [
        {
          from: [["helpers", { elementName: "helper-c" }]],
          disallow: [["components", { category: "atoms", elementName: "*-a" }]],
        },
        {
          from: [["helpers", { elementName: "helper-c" }]],
          disallow: [["modules", { domain: "domain-a", elementName: "*-a" }]],
        },
        {
          from: [["components", { category: "atoms" }]],
          disallow: [["components", { category: "molecules" }]],
        },
        {
          from: [["components", { category: "molecules" }]],
          disallow: [["components", { category: "layouts" }]],
        },
        {
          from: [["components", { category: "*" }]],
          disallow: ["modules"],
        },
        {
          from: [["modules", { domain: "pages" }]],
          disallow: [["modules", { domain: "domain-a" }]],
        },
        {
          from: [["modules", { domain: "pages" }]],
          disallow: [["components", { category: "molecules" }]],
        },
        {
          from: [["modules", { domain: "domain-a" }]],
          disallow: [["components", { category: "molecules" }]],
        },
        {
          from: [["modules", { domain: "domain-a" }]],
          disallow: [["modules", { domain: "pages" }]],
        },
        {
          from: [["modules", { domain: "domain-a" }]],
          disallow: [["modules", { domain: ["!${domain}", "domain-b"] }]],
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private"),
  {
    0: "Importing elements of type 'components' with category 'atoms' and elementName '*-a' is not allowed in elements of type 'helpers' with elementName 'helper-c'. Disallowed in rule 1",
    1: "Importing elements of type 'modules' with domain 'domain-a' and elementName '*-a' is not allowed in elements of type 'helpers' with elementName 'helper-c'. Disallowed in rule 2",
    2: "Importing elements of type 'components' with category 'molecules' is not allowed in elements of type 'components' with category 'atoms'. Disallowed in rule 3",
    3: "Importing elements of type 'components' with category 'molecules' is not allowed in elements of type 'components' with category 'atoms'. Disallowed in rule 3",
    4: "Importing elements of type 'components' with category 'layouts' is not allowed in elements of type 'components' with category 'molecules'. Disallowed in rule 4",
    5: "Importing elements of type 'modules' is not allowed in elements of type 'components' with category '*'. Disallowed in rule 5",
    6: "Importing elements of type 'modules' is not allowed in elements of type 'components' with category '*'. Disallowed in rule 5",
    7: "Importing elements of type 'components' with category 'molecules' is not allowed in elements of type 'modules' with domain 'pages'. Disallowed in rule 7",
    8: "Importing elements of type 'modules' with domain 'domain-a' is not allowed in elements of type 'modules' with domain 'pages'. Disallowed in rule 6",
    9: "Importing elements of type 'components' with category 'molecules' is not allowed in elements of type 'modules' with domain 'domain-a'. Disallowed in rule 8",
    10: "Importing elements of type 'modules' with domain '!domain-a' or 'domain-b' is not allowed in elements of type 'modules' with domain 'domain-a'. Disallowed in rule 10",
    11: "Importing elements of type 'modules' with domain '!domain-a' or 'domain-b' is not allowed in elements of type 'modules' with domain 'domain-a'. Disallowed in rule 10",
  },
);
