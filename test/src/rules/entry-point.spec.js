const { ENTRY_POINT: RULE } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, codeFilePath, settings } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const errorMessage = (disallowedEntryPoint, type) =>
  `Entry point '${disallowedEntryPoint}' is not allowed in '${type}'`;

const defaultOptions = [
  {
    default: "disallow",
    rules: [
      {
        target: "*",
        allow: "index.js",
      },
    ],
  },
];

const options = [
  {
    default: "disallow",
    rules: [
      {
        target: "helpers",
        allow: "main.js",
      },
      {
        target: "components",
        allow: "Component.js",
      },
      {
        target: "modules",
        allow: "Module.js",
      },
    ],
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
        "boundaries/ignore": [codeFilePath("src/helpers/helper-b/**/*.js")],
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
          message: errorMessage("ComponentB.js", "components"),
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
          message: errorMessage("index.js", "helpers"),
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
          message: errorMessage("index.js", "helpers"),
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
          message: errorMessage("main.js", "components"),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
