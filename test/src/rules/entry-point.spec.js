const { ENTRY_POINT: RULE } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, relativeFilePath, settings } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const errorMessage = (dependencyInfo, requiredEntryPoint) =>
  `Entry point of element '${relativeFilePath(dependencyInfo)}' must be '${requiredEntryPoint}'`;

const defaultOptions = [
  {
    default: "index.js",
    byType: {},
  },
];

const options = [
  {
    default: "main.js",
    byType: {
      components: "Component.js",
      modules: "Module.js",
    },
  },
];

ruleTester.run(RULE, rule, {
  valid: [
    // Non recognized types can import whatever
    {
      filename: absoluteFilePath("src/foo/index.js"),
      code: "import HelperA from 'helpers/helper-a/HelperA.js'",
      options,
    },
    // No option provided
    {
      filename: absoluteFilePath("src/helpers/helper-b/HelperB.js"),
      code: "import HelperA from 'helpers/helper-a/HelperA.js'",
    },
    // Ignored files can import whatever
    {
      filename: absoluteFilePath("src/helpers/helper-b/HelperB.js"),
      code: "import HelperA from 'helpers/helper-a/HelperA.js'",
      options,
      settings: {
        ...settings,
        "boundaries/ignore": [relativeFilePath("src/helpers/helper-b/**/*.js")],
      },
    },
    // import index with default option
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from '../component-b/index'",
      options: defaultOptions,
    },
    // import folder with default option
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from '../component-b'",
      options: defaultOptions,
    },
    // import alias folder with default option
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from 'components/component-b'",
      options: defaultOptions,
    },
    // import default file with custom config
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from 'helpers/helper-b/main'",
      options,
    },
    // import type file with custom config
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from 'components/component-b/Component'",
      options,
    },
  ],
  invalid: [
    // Not index.js with default config
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from '../component-b/ComponentB.js'",
      options: defaultOptions,
      errors: [
        {
          message: errorMessage("src/components/component-b", "index.js"),
          type: "ImportDeclaration",
        },
      ],
    },
    // folder with config not set to index.js
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options,
      errors: [
        {
          message: errorMessage("src/helpers/helper-a", "main.js"),
          type: "ImportDeclaration",
        },
      ],
    },
    // index.js with another default config
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a/index.js'",
      options,
      errors: [
        {
          message: errorMessage("src/helpers/helper-a", "main.js"),
          type: "ImportDeclaration",
        },
      ],
    },
    // default option but not type option
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentB from 'components/component-b/main.js'",
      options,
      errors: [
        {
          message: errorMessage("src/components/component-b", "Component.js"),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
