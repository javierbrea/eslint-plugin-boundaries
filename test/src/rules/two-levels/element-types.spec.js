const { ELEMENT_TYPES: RULE } = require("../../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../helpers");

const rule = require(`../../../../src/rules/${RULE}`);

const { absoluteFilePath } = pathResolvers("two-levels");

const errorMessage = (fileType, dependencyType) =>
  `Usage of '${dependencyType}' is not allowed in '${fileType}'`;

const test = (settings, options) => {
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
            message: errorMessage("helpers", "components"),
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
            message: errorMessage("helpers", "modules"),
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
            message: errorMessage("components", "components"),
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
            message: errorMessage("components", "components"),
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
            message: errorMessage("components", "components"),
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
            message: errorMessage("components", "components"),
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
            message: errorMessage("components", "modules"),
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
            message: errorMessage("components", "components"),
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
            message: errorMessage("components", "modules"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "modules"),
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
            message: errorMessage("modules", "modules"),
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
            message: errorMessage("modules", "modules"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "modules"),
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
            message: errorMessage("modules", "modules"),
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
            message: errorMessage("modules", "modules"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "modules"),
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
            message: errorMessage("modules", "components"),
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
            message: errorMessage("modules", "components"),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

test(SETTINGS.twoLevels, [
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
]);
