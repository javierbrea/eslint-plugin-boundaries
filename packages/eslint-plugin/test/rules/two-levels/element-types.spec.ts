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

const { ELEMENT_TYPES: RULE } = require("../../../src/Settings");

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  {
    absoluteFilePath,
  }: {
    absoluteFilePath: ReturnType<typeof pathResolvers>["absoluteFilePath"];
  },
  errorMessages: Record<number, string> = {}
) => {
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
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js"
        ),
        code: "import HelperA from 'components/atoms/atom-a'",
        options,
      },
      // molecule components can import atoms using relative paths
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js"
        ),
        code: "import HelperA from '../../atoms/atom-a'",
        options,
      },
      // molecule components can import molecules
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js"
        ),
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
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfile-1"
        ),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a modules subfiles can import internal files
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfile-1"
        ),
        code: "import LayoutA from './subfolder-2/subfile-2'",
        options,
      },
      // domain-a modules subfiles can import internal files
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfolder-2/subfile-2"
        ),
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
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfile-1.js"
        ),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // domain-a module subfiles can import domain-a modules
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfolder-2/subfolder-2.js"
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
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfile-1"
        ),
        code: "import AtomA from 'components/atoms/atom-b'",
        options,
      },
      // module-a subfiles in domain-a can import atom-b atom component subfiles
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfile-1"
        ),
        code: "import AtomA from 'components/atoms/atom-b/subfolder-1/subfile-1'",
        options,
      },
      // module-a subfiles in domain-a can import atom-b atom component subfiles
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/subfolder-1/subfile-1"
        ),
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
            message: errorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: '"helpers" and elementName "helper-a"',
                dep: '"components", category "atoms" and elementName "atom-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: '"helpers" and elementName "helper-a"',
                dep: '"modules", domain "domain-a" and elementName "module-a"',
              })
            ),

            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: '"components", category "atoms" and elementName "atom-a"',
                dep: '"components", category "molecules" and elementName "molecule-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: '"components", category "atoms" and elementName "atom-a"',
                dep: '"components", category "layouts" and elementName "layout-a"',
              })
            ),

            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: '"components", category "atoms" and elementName "atom-a"',
                dep: '"components", category "layouts" and elementName "layout-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: '"components", category "molecules" and elementName "molecule-a"',
                dep: '"components", category "layouts" and elementName "layout-b"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              6,
              elementTypesNoRuleMessage({
                file: '"components", category "molecules" and elementName "molecule-a"',
                dep: '"modules", domain "domain-a" and elementName "module-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              7,
              elementTypesNoRuleMessage({
                file: '"components", category "layouts" and elementName "layout-a"',
                dep: '"components", category "atoms" and elementName "atom-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              8,
              elementTypesNoRuleMessage({
                file: '"components", category "layouts" and elementName "layout-a"',
                dep: '"modules", domain "domain-a" and elementName "module-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              9,
              elementTypesNoRuleMessage({
                file: '"modules", domain "pages" and elementName "page-a"',
                dep: '"components", category "atoms" and elementName "atom-b"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              10,
              elementTypesNoRuleMessage({
                file: '"modules", domain "pages" and elementName "page-a"',
                dep: '"components", category "molecules" and elementName "molecule-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              11,
              elementTypesNoRuleMessage({
                file: '"modules", domain "pages" and elementName "page-a"',
                dep: '"modules", domain "pages" and elementName "page-b"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              12,
              elementTypesNoRuleMessage({
                file: '"modules", domain "pages" and elementName "page-a"',
                dep: '"modules", domain "domain-a" and elementName "module-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              13,
              elementTypesNoRuleMessage({
                file: '"modules", domain "pages" and elementName "page-a"',
                dep: '"modules", domain "domain-a" and elementName "module-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              14,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a" and elementName "module-b"',
                dep: '"components", category "atoms" and elementName "atom-b"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              15,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a" and elementName "module-b"',
                dep: '"components", category "atoms" and elementName "atom-b"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              16,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a" and elementName "module-a"',
                dep: '"components", category "molecules" and elementName "molecule-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              17,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a" and elementName "module-a"',
                dep: '"modules", domain "pages" and elementName "page-b"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              18,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a" and elementName "module-a"',
                dep: '"modules", domain "domain-b" and elementName "module-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              19,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a" and elementName "module-a"',
                dep: '"modules", domain "domain-b" and elementName "module-b"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              20,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-b" and elementName "module-a"',
                dep: '"components", category "layouts" and elementName "layout-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              21,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-b" and elementName "module-a"',
                dep: '"components", category "molecules" and elementName "molecule-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              22,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-b" and elementName "module-a"',
                dep: '"modules", domain "pages" and elementName "page-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              23,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-b" and elementName "module-a"',
                dep: '"components", category "atoms" and elementName "atom-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              24,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a" and elementName "module-a"',
                dep: '"components", category "atoms" and elementName "atom-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

const testPrivate = (
  settings: RuleTesterSettings,
  options: unknown[],
  {
    absoluteFilePath,
  }: {
    absoluteFilePath: ReturnType<typeof pathResolvers>["absoluteFilePath"];
  },
  errorMessages: Record<number, string> = {}
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // private helpers can import helpers
      {
        filename: absoluteFilePath(
          "helpers/helper-a/helpers/helper-c/index.js"
        ),
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
          "components/molecules/molecule-a/components/molecules/molecule-c/MoleculeC.js"
        ),
        code: "import HelperA from 'components/atoms/atom-a'",
        options,
      },
      // molecule components can import atoms using relative paths
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/MoleculeC.js"
        ),
        code: "import HelperA from '../../../../../atoms/atom-a'",
        options,
      },
      // private molecule components can import molecules
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/MoleculeC.js"
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
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/ModuleC.js"
        ),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a private modules subfiles can import layout components
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/submodules/module-d/subfolder-1/subfile-1"
        ),
        code: "import LayoutA from 'components/layouts/layout-a'",
        options,
      },
      // domain-a private modules subfiles can import internal files
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/index"
        ),
        code: "import LayoutA from './subfolder-1/subfile-1'",
        options,
      },
      // domain-a private modules can import domain-a modules
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/ModuleC.js"
        ),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // domain-a private modules of private modules can import domain-a modules
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/submodules/module-d/ModuleD.js"
        ),
        code: "import ModuleB from 'modules/domain-a/module-b'",
        options,
      },
      // private module-c in domain-a can import atom-b atom component
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/ModuleC.js"
        ),
        code: "import AtomA from 'components/atoms/atom-b'",
        options,
      },
      // private module-d in domain-a can import atom-b atom component
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/submodules/module-d/index.js"
        ),
        code: "import AtomA from 'components/atoms/atom-b'",
        options,
      },
      // private helper-c can import private module d
      {
        filename: absoluteFilePath(
          "helpers/helper-a/helpers/helper-c/index.js"
        ),
        code: "import ModuleD from 'modules/domain-a/module-a/submodules/module-c/submodules/module-d'",
        options,
      },
    ],
    invalid: [
      // private helpers can't import atoms
      {
        filename: absoluteFilePath(
          "helpers/helper-a/helpers/helper-c/index.js"
        ),
        code: "import AtomA from 'components/atoms/atom-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: '"helpers" and elementName "helper-c"',
                dep: '"components", category "atoms" and elementName "atom-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // private helpers can't import modules
      {
        filename: absoluteFilePath(
          "helpers/helper-a/helpers/helper-c/index.js"
        ),
        code: "import AtomA from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: '"helpers" and elementName "helper-c"',
                dep: '"modules", domain "domain-a" and elementName "module-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: '"components", category "atoms" and elementName "atom-a"',
                dep: '"components", category "molecules" and elementName "molecule-c"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: '"components", category "atoms" and elementName "atom-a"',
                dep: '"components", category "molecules" and elementName "molecule-d"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // private molecule components can't import layout components
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/index.js"
        ),
        code: "import LayoutB from 'components/layouts/layout-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: '"components", category "molecules" and elementName "molecule-c"',
                dep: '"components", category "layouts" and elementName "layout-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // private molecule components can't import modules
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/index.js"
        ),
        code: "import ModuleA from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: '"components", category "molecules" and elementName "molecule-c"',
                dep: '"modules", domain "domain-a" and elementName "module-a"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              6,
              elementTypesNoRuleMessage({
                file: '"components", category "layouts" and elementName "layout-a"',
                dep: '"modules", domain "domain-a", ancestorsPaths "module-a" and elementName "module-c"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              7,
              elementTypesNoRuleMessage({
                file: '"modules", domain "pages" and elementName "page-a"',
                dep: '"components", category "molecules" and elementName "molecule-c"',
              })
            ),
            type: "Literal",
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
            message: errorMessage(
              errorMessages,
              8,
              elementTypesNoRuleMessage({
                file: '"modules", domain "pages" and elementName "page-a"',
                dep: '"modules", domain "domain-a", ancestorsPaths "module-a" and elementName "module-c"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // domain a private modules can't import private molecule components
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/index.js"
        ),
        code: "import Component from 'components/molecules/molecule-a/components/molecules/molecule-c'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              9,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a", ancestorsPaths "module-a" and elementName "module-c"',
                dep: '"components", category "molecules" and elementName "molecule-c"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // private domain a modules can't import page modules
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/index.js"
        ),
        code: "import PageB from 'modules/pages/page-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              10,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a", ancestorsPaths "module-a" and elementName "module-c"',
                dep: '"modules", domain "pages" and elementName "page-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // private domain a modules can't import domain b modules
      {
        filename: absoluteFilePath(
          "modules/domain-a/module-a/submodules/module-c/index.js"
        ),
        code: "import PageB from 'modules/domain-b/module-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              11,
              elementTypesNoRuleMessage({
                file: '"modules", domain "domain-a", ancestorsPaths "module-a" and elementName "module-c"',
                dep: '"modules", domain "domain-b" and elementName "module-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

runTest(
  SETTINGS.twoLevels,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { type: "helpers" },
          allow: { to: { type: "helpers" } },
        },
        {
          from: { type: "components", captured: { category: "atoms" } },
          allow: {
            to: [
              { type: "helpers" },
              { type: "components", captured: { category: "atoms" } },
            ],
          },
        },
        {
          from: { type: "components", captured: { category: "molecules" } },
          allow: {
            to: [
              { type: "components", captured: { category: "atoms" } },
              { type: "components", captured: { category: "molecules" } },
            ],
          },
        },
        {
          from: { type: "components", captured: { category: "layouts" } },
          allow: {
            to: [{ type: "components", captured: { category: "molecules" } }],
          },
        },
        {
          from: [
            { type: "modules", captured: { domain: "pages" } },
            { type: "modules", captured: { domain: "domain-a" } },
          ],
          allow: {
            to: [{ type: "components", captured: { category: "layouts" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "domain-a" } },
          allow: {
            to: [{ type: "modules", captured: { domain: "domain-a" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "domain-b" } },
          allow: {
            to: [{ type: "modules", captured: { domain: "domain-*" } }],
          },
        },
        // module b in domain b can import even atoms!
        {
          from: {
            type: "modules",
            captured: { domain: "domain-b", elementName: "module-b" },
          },
          allow: {
            to: [{ type: "components", captured: { category: "atoms" } }],
          },
        },
        // module a in domain a can import any atom *-b!
        {
          from: {
            type: "modules",
            captured: { domain: "*-a", elementName: "module-a" },
          },
          allow: {
            to: [
              {
                type: "components",
                captured: { category: "atoms", elementName: "*-b" },
              },
            ],
          },
        },
      ],
    },
  ],
  pathResolvers("two-levels"),
  {}
);

testPrivate(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      default: "disallow",
      rules: [
        {
          from: { type: "helpers" },
          allow: { to: { type: "helpers" } },
        },
        {
          from: { type: "components", captured: { category: "atoms" } },
          allow: {
            to: [
              { type: "helpers" },
              { type: "components", captured: { category: "atoms" } },
            ],
          },
        },
        {
          from: { type: "components", captured: { category: "molecules" } },
          allow: {
            to: [
              { type: "components", captured: { category: "atoms" } },
              { type: "components", captured: { category: "molecules" } },
            ],
          },
        },
        {
          from: { type: "components", captured: { category: "layouts" } },
          allow: {
            to: [{ type: "components", captured: { category: "molecules" } }],
          },
        },
        {
          from: [
            { type: "modules", captured: { domain: "pages" } },
            { type: "modules", captured: { domain: "domain-a" } },
          ],
          allow: {
            to: [{ type: "components", captured: { category: "layouts" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "domain-a" } },
          allow: {
            to: [{ type: "modules", captured: { domain: "domain-a" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "domain-b" } },
          allow: {
            to: [{ type: "modules", captured: { domain: "domain-*" } }],
          },
        },
        // module b in domain b can import even atoms!
        {
          from: {
            type: "modules",
            captured: { domain: "domain-b", elementName: "module-b" },
          },
          allow: {
            to: [{ type: "components", captured: { category: "atoms" } }],
          },
        },
        // module a in domain a can import any atom *-b!
        {
          from: {
            type: "modules",
            captured: { domain: "*-a", elementName: "module-a" },
          },
          allow: {
            to: [
              {
                type: "components",
                captured: { category: "atoms", elementName: "*-b" },
              },
            ],
          },
        },
        // private module d in domain a can import any atom *-b!
        {
          from: {
            type: "modules",
            captured: { domain: "*-a", elementName: "module-(d|c)" },
          },
          allow: {
            to: [
              {
                type: "components",
                captured: { category: "atoms", elementName: "*-b" },
              },
            ],
          },
        },
        // private helper d can import private module d!
        {
          from: { type: "helpers", captured: { elementName: "helper-c" } },
          allow: {
            to: [{ type: "modules", captured: { elementName: "*-d" } }],
          },
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private"),
  {}
);

testPrivate(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      default: "allow",
      rules: [
        {
          from: { type: "helpers", captured: { elementName: "helper-c" } },
          disallow: {
            to: [
              {
                type: "components",
                captured: { category: "atoms", elementName: "*-a" },
              },
            ],
          },
        },
        {
          from: { type: "helpers", captured: { elementName: "helper-c" } },
          disallow: {
            to: [
              {
                type: "modules",
                captured: { domain: "domain-a", elementName: "*-a" },
              },
            ],
          },
        },
        {
          from: { type: "components", captured: { category: "atoms" } },
          disallow: {
            to: [{ type: "components", captured: { category: "molecules" } }],
          },
        },
        {
          from: { type: "components", captured: { category: "molecules" } },
          disallow: {
            to: [{ type: "components", captured: { category: "layouts" } }],
          },
        },
        {
          from: { type: "components", captured: { category: "*" } },
          disallow: { to: [{ type: "modules" }] },
        },
        {
          from: { type: "modules", captured: { domain: "pages" } },
          disallow: {
            to: [{ type: "modules", captured: { domain: "domain-a" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "pages" } },
          disallow: {
            to: [{ type: "components", captured: { category: "molecules" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "domain-a" } },
          disallow: {
            to: [{ type: "components", captured: { category: "molecules" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "domain-a" } },
          disallow: {
            to: [{ type: "modules", captured: { domain: "pages" } }],
          },
        },
        {
          from: { type: "modules", captured: { domain: "domain-a" } },
          disallow: {
            to: [
              {
                type: "modules",
                captured: { domain: ["!{{ domain }}", "domain-b"] },
              },
            ],
          },
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private"),
  {
    0: 'Dependencies to elements of type "components", category "atoms" and elementName "atom-a" are not allowed in elements of type "helpers" and elementName "helper-c". Denied by rule at index 0',
    1: 'Dependencies to elements of type "modules", domain "domain-a" and elementName "module-a" are not allowed in elements of type "helpers" and elementName "helper-c". Denied by rule at index 1',
    2: 'Dependencies to elements of type "components" and category "molecules" are not allowed in elements of type "components" and category "atoms". Denied by rule at index 2',
    3: 'Dependencies to elements of type "components" and category "molecules" are not allowed in elements of type "components" and category "atoms". Denied by rule at index 2',
    4: 'Dependencies to elements of type "components" and category "layouts" are not allowed in elements of type "components" and category "molecules". Denied by rule at index 3',
    5: 'Dependencies to elements of type "modules" are not allowed in elements of type "components" and category "molecules". Denied by rule at index 4',
    6: 'Dependencies to elements of type "modules" are not allowed in elements of type "components" and category "layouts". Denied by rule at index 4',
    7: 'Dependencies to elements of type "components" and category "molecules" are not allowed in elements of type "modules" and domain "pages". Denied by rule at index 6',
    8: 'Dependencies to elements of type "modules" and domain "domain-a" are not allowed in elements of type "modules" and domain "pages". Denied by rule at index 5',
    9: 'Dependencies to elements of type "components" and category "molecules" are not allowed in elements of type "modules" and domain "domain-a". Denied by rule at index 7',
    10: 'Dependencies to elements of type "modules" and domain "pages" are not allowed in elements of type "modules" and domain "domain-a". Denied by rule at index 9',
    11: 'Dependencies to elements of type "modules" and domain "domain-b" are not allowed in elements of type "modules" and domain "domain-a". Denied by rule at index 9',
  }
);
