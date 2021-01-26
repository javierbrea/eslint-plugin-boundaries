const { ENTRY_POINT: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");

const rule = require(`../../../src/rules/${RULE}`);

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

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

const test = (settings, options) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // Non recognized types can import whatever
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import HelperA from 'helpers/helper-a/HelperA.js'",
        options,
      },
      // No option provided
      {
        filename: absoluteFilePath("helpers/helper-b/HelperB.js"),
        code: "import HelperA from 'helpers/helper-a/HelperA.js'",
      },
      // Ignored files can import whatever
      {
        filename: absoluteFilePath("helpers/helper-b/HelperB.js"),
        code: "import HelperA from 'helpers/helper-a/HelperA.js'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("helpers/helper-b/**/*.js")],
        },
      },
      // import index with default option
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from '../component-b/index'",
        options: defaultOptions,
      },
      // import folder with default option
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from '../component-b'",
        options: defaultOptions,
      },
      // import alias folder with default option
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options: defaultOptions,
      },
      // import default file with custom config
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'helpers/helper-b/main'",
        options,
      },
      // import type file with custom config
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b/Component'",
        options,
      },
    ],
    invalid: [
      // Not index.js with default config
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
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
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
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
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
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
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
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
};

const testCapture = (settings, options) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // helper-a entry-point is index.js
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // helper-b entry-point is main.js
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-b/main'",
        options,
      },
    ],
    invalid: [
      // import helper-b index.js
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage("index.js", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
      // import helper-a main.js
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a/main'",
        options,
        errors: [
          {
            message: errorMessage("main.js", "helpers"),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

// deprecated settings

test(SETTINGS.deprecated, [
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
]);

// disallow based options

test(SETTINGS.oneLevel, [
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
]);

// micromatch based options

test(SETTINGS.oneLevel, [
  {
    default: "disallow",
    rules: [
      {
        target: "h*",
        allow: "main.*",
      },
      {
        target: "c*",
        allow: "C*.*",
      },
      {
        target: "m*",
        allow: "M*.*",
      },
    ],
  },
]);

// redundant options

test(SETTINGS.oneLevel, [
  {
    default: "allow",
    rules: [
      {
        target: "helpers",
        disallow: "*.js",
      },
      {
        target: "helpers",
        allow: "main.js",
      },
      {
        target: "components",
        disallow: "*.js",
      },
      {
        target: "components",
        allow: "Component.js",
      },
      {
        target: "modules",
        disallow: "*",
      },
      {
        target: "modules",
        allow: "Module.js",
      },
    ],
  },
]);

// options with capture

testCapture(SETTINGS.oneLevel, [
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
        target: "components",
        allow: "Component.js",
      },
      {
        target: "modules",
        allow: "Module.js",
      },
    ],
  },
]);
