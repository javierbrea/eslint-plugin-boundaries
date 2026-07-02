import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

type RunTestErrorMessages = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const rule = ruleFactory();

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  {
    absoluteFilePath,
  }: {
    absoluteFilePath: ReturnType<typeof pathResolvers>["absoluteFilePath"];
  },
  errorMessages: RunTestErrorMessages
) => {
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
            message: errorMessages[0],
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
            message: errorMessages[1],
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
            message: errorMessages[2],
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
            message: errorMessages[3],
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
            message: errorMessages[4],
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
            message: errorMessages[5],
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
            message: errorMessages[6],
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
            message: errorMessages[7],
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
            message: errorMessages[8],
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
      policies: [
        {
          to: { element: { type: "helpers" } },
          allow: { to: { element: { fileInternalPath: "main.js" } } },
        },
        {
          to: {
            element: { type: "helpers", captured: { elementName: "*-a" } },
          },
          disallow: { to: { element: { fileInternalPath: "*" } } },
        },
        {
          to: {
            element: { type: "helpers", captured: { elementName: "*-a" } },
          },
          allow: { to: { element: { fileInternalPath: "index.*" } } },
        },
        {
          to: {
            element: {
              type: "components",
              captured: { category: "atoms" },
            },
          },
          allow: { to: { element: { fileInternalPath: "Atom*.js" } } },
        },
        {
          to: {
            element: {
              type: "components",
              captured: { category: "molecules" },
            },
          },
          allow: { to: { element: { fileInternalPath: "Molecule*.js" } } },
        },
        {
          to: {
            element: {
              type: "components",
              captured: { category: "layouts" },
            },
          },
          allow: { to: { element: { fileInternalPath: "Layout*.js" } } },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module*.js" } } },
        },
        {
          to: {
            element: { type: "modules", captured: { domain: "pages" } },
          },
          disallow: { to: { element: { fileInternalPath: "Module*.js" } } },
          allow: { to: { element: { fileInternalPath: "Page*.js" } } },
        },
      ],
    },
  ],
  pathResolvers("two-levels"),
  [
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-b" to elements of type "helpers" and captured values: elementName="helper-b"',
    'Dependencies to elements of type "helpers", captured values: elementName="helper-a" and fileInternalPath "main.js" are not allowed. Denied by policy at index 1',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "components" and captured values: category="atoms", elementName="atom-b"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "components" and captured values: category="molecules", elementName="molecule-b"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "components" and captured values: category="layouts", elementName="layout-a"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "modules" and captured values: domain="domain-a", elementName="module-a"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "modules" and captured values: domain="domain-a", elementName="module-a"',
    'Dependencies to elements of type "modules", captured values: domain="pages" and fileInternalPath "ModuleA.js" are not allowed. Denied by policy at index 7',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "modules" and captured values: domain="pages", elementName="page-a"',
  ]
);

runTest(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      default: "disallow",
      policies: [
        {
          to: { element: { type: "helpers" } },
          allow: { to: { element: { fileInternalPath: "main.js" } } },
        },
        {
          to: {
            element: { type: "helpers", captured: { elementName: "*-a" } },
          },
          disallow: { to: { element: { fileInternalPath: "*" } } },
        },
        {
          to: {
            element: { type: "helpers", captured: { elementName: "*-a" } },
          },
          allow: { to: { element: { fileInternalPath: "index.*" } } },
        },
        {
          to: {
            element: {
              type: "components",
              captured: { category: "atoms" },
            },
          },
          allow: { to: { element: { fileInternalPath: "Atom*.js" } } },
        },
        {
          to: {
            element: {
              type: "components",
              captured: { category: "molecules" },
            },
          },
          allow: { to: { element: { fileInternalPath: "Molecule*.js" } } },
        },
        {
          to: {
            element: {
              type: "components",
              captured: { category: "layouts" },
            },
          },
          allow: { to: { element: { fileInternalPath: "Layout*.js" } } },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module*.js" } } },
        },
        {
          to: {
            element: { type: "modules", captured: { domain: "pages" } },
          },
          disallow: { to: { element: { fileInternalPath: "Module*.js" } } },
          allow: { to: { element: { fileInternalPath: "Page*.js" } } },
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private"),
  [
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-b" to elements of type "helpers" and captured values: elementName="helper-b"',
    'Dependencies to elements of type "helpers", captured values: elementName="helper-a" and fileInternalPath "main.js" are not allowed. Denied by policy at index 1',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "components" and captured values: category="atoms", elementName="atom-b"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "components" and captured values: category="molecules", elementName="molecule-b"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "components" and captured values: category="layouts", elementName="layout-a"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "modules" and captured values: domain="domain-a", elementName="module-a"',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "modules" and captured values: domain="domain-a", elementName="module-a"',
    'Dependencies to elements of type "modules", captured values: domain="pages" and fileInternalPath "ModuleA.js" are not allowed. Denied by policy at index 7',
    'There is no policy allowing dependencies from elements of type "components" and captured values: category="atoms", elementName="atom-a" to elements of type "modules" and captured values: domain="pages", elementName="page-a"',
  ]
);
