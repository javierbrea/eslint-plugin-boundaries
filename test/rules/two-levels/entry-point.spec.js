const { ENTRY_POINT: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");

const rule = require(`../../../src/rules/${RULE}`);

const errorMessage = (disallowedEntryPoint, type) =>
  `Entry point '${disallowedEntryPoint}' is not allowed in '${type}'`;

const test = (settings, options, { absoluteFilePath }) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // helper-b entry-point is main.js
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import HelperA from 'helpers/helper-b/main'",
        options,
      },
      // helper-a entry-point is index.js
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import HelperA from 'helpers/helper-a/index'",
        options,
      },
      // helper-a entry-point is index.js
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // atoms entry-point is Atom*.js
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'components/atoms/atom-b/AtomB'",
        options,
      },
      // molecules entry-point is Molecule*.js
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'components/molecules/molecule-b/MoleculeB'",
        options,
      },
      // layouts entry-point is Layout*.js
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'components/layouts/layout-b/LayoutB'",
        options,
      },
      // modules entry-point is Module*.js
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'modules/domain-a/module-a/ModuleA'",
        options,
      },
      // modules pages entry-point is Page*.js
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'modules/pages/page-a/PageA'",
        options,
      },
    ],
    invalid: [
      // import index from helper-b
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import { helper } from 'helpers/helper-b/index'",
        options,
        errors: [
          {
            message: errorMessage("index.js", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import main from helper-a
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import { helper } from 'helpers/helper-a/main'",
        options,
        errors: [
          {
            message: errorMessage("main.js", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import index from AtomB
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'components/atoms/atom-b'",
        options,
        errors: [
          {
            message: errorMessage("index.js", "components"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import index from molecule-b
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'components/molecules/molecule-b'",
        options,
        errors: [
          {
            message: errorMessage("index.js", "components"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import index from layout-a
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'components/layouts/layout-a'",
        options,
        errors: [
          {
            message: errorMessage("index.js", "components"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import index from module-a
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'modules/domain-a/module-a'",
        options,
        errors: [
          {
            message: errorMessage("index.js", "modules"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import subfile from module-a
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import AtomB from 'modules/domain-a/module-a/subfolder-1/subfolder-2/ModuleA'",
        options,
        errors: [
          {
            message: errorMessage("subfolder-1/subfolder-2/ModuleA.js", "modules"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import ModuleA from page-a
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import 'modules/pages/page-a/ModuleA'",
        options,
        errors: [
          {
            message: errorMessage("ModuleA.js", "modules"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import index from page-a
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import 'modules/pages/page-a'",
        options,
        errors: [
          {
            message: errorMessage("index.js", "modules"),
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
          target: "helpers",
          allow: "main.js",
        },
        {
          target: [["helpers", { elementName: "*-a" }]],
          disallow: "*",
        },
        {
          target: [["helpers", { elementName: "*-a" }]],
          allow: "index.*",
        },
        {
          target: [["components", { category: "atoms" }]],
          allow: "Atom*.js",
        },
        {
          target: [["components", { category: "molecules" }]],
          allow: "Molecule*.js",
        },
        {
          target: [["components", { category: "layouts" }]],
          allow: "Layout*.js",
        },
        {
          target: "modules",
          allow: "Module*.js",
        },
        {
          target: [["modules", { domain: "pages" }]],
          disallow: "Module*.js",
          allow: "Page*.js",
        },
      ],
    },
  ],
  pathResolvers("two-levels")
);

test(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      default: "disallow",
      rules: [
        {
          target: "helpers",
          allow: "main.js",
        },
        {
          target: [["helpers", { elementName: "*-a" }]],
          disallow: "*",
        },
        {
          target: [["helpers", { elementName: "*-a" }]],
          allow: "index.*",
        },
        {
          target: [["components", { category: "atoms" }]],
          allow: "Atom*.js",
        },
        {
          target: [["components", { category: "molecules" }]],
          allow: "Molecule*.js",
        },
        {
          target: [["components", { category: "layouts" }]],
          allow: "Layout*.js",
        },
        {
          target: "modules",
          allow: "Module*.js",
        },
        {
          target: [["modules", { domain: "pages" }]],
          disallow: "Module*.js",
          allow: "Page*.js",
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private")
);
