const { ENTRY_POINT: RULE } = require("../../../src/constants/rules");
const {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} = require("../../support/helpers");
const {
  customErrorMessage,
  entryPointNoRuleMessage,
} = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const test = (settings, options, { absoluteFilePath }, errorMessages = {}) => {
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
            message: customErrorMessage(
              errorMessages,
              0,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'helpers' with elementName 'helper-b'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              1,
              entryPointNoRuleMessage({
                entryPoint: "main.js",
                dep: "'helpers' with elementName 'helper-a'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              2,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'components' with category 'atoms' and elementName 'atom-b'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              3,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'components' with category 'molecules' and elementName 'molecule-b'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              4,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'components' with category 'layouts' and elementName 'layout-a'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              5,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              6,
              entryPointNoRuleMessage({
                entryPoint: "subfolder-1/subfolder-2/ModuleA.js",
                dep: "'modules' with domain 'domain-a' and elementName 'module-a'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              7,
              entryPointNoRuleMessage({
                entryPoint: "ModuleA.js",
                dep: "'modules' with domain 'pages' and elementName 'page-a'",
              }),
            ),
            type: "Literal",
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
            message: customErrorMessage(
              errorMessages,
              8,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'modules' with domain 'pages' and elementName 'page-a'",
              }),
            ),
            type: "Literal",
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
  pathResolvers("two-levels"),
  {
    1: "The entry point 'main.js' is not allowed in elements of type 'helpers' with elementName '*-a'. Disallowed in rule 2",
    7: "The entry point 'ModuleA.js' is not allowed in elements of type 'modules' with domain 'pages'. Disallowed in rule 8",
  },
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
  pathResolvers("two-levels-with-private"),
  {
    1: "The entry point 'main.js' is not allowed in elements of type 'helpers' with elementName '*-a'. Disallowed in rule 2",
    7: "The entry point 'ModuleA.js' is not allowed in elements of type 'modules' with domain 'pages'. Disallowed in rule 8",
  },
);
