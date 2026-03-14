import rule from "../../../src/Rules/EntryPoint";
import { ENTRY_POINT as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const defaultOptions = [
  {
    default: "disallow",
    rules: [
      {
        target: { type: "*" },
        allow: "index.js",
      },
    ],
  },
];

type RunTestErrorMessages = [string, string, string, string];
type TestCaptureErrorMessages = [string, string];

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: RunTestErrorMessages
) => {
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
      // Files can import ignored dependencies
      {
        filename: absoluteFilePath("helpers/helper-b/HelperB.js"),
        code: "import HelperA from 'helpers/helper-a/HelperA.js'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("helpers/helper-a/**/*.js")],
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
            message: errorMessages[0],
            type: "Literal",
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
            message: errorMessages[1],
            type: "Literal",
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
            message: errorMessages[2],
            type: "Literal",
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
            message: errorMessages[3],
            type: "Literal",
          },
        ],
      },
    ],
  });
};

const testCapture = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: TestCaptureErrorMessages
) => {
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
            message: errorMessages[0],
            type: "Literal",
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
            message: errorMessages[1],
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// deprecated settings

runTest(
  SETTINGS.deprecated,
  [
    {
      default: "disallow",
      rules: [
        {
          target: { type: "helpers" },
          allow: "main.js",
        },
        {
          target: { type: "components" },
          allow: "Component.js",
        },
        {
          target: { type: "modules" },
          allow: "Module.js",
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
  ]
);

// disallow based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          target: { type: "helpers" },
          allow: "main.js",
        },
        {
          target: { type: "components" },
          allow: "Component.js",
        },
        {
          target: { type: "modules" },
          allow: "Module.js",
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
  ]
);

// micromatch based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          target: { type: "h*" },
          allow: "main.*",
        },
        {
          target: { type: "c*" },
          allow: "C*.*",
        },
        {
          target: { type: "m*" },
          allow: "M*.*",
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
  ]
);

// redundant options

runTest(
  SETTINGS.oneLevel,
  [
    {
      default: "allow",
      rules: [
        {
          target: { type: "helpers" },
          disallow: "*.js",
        },
        {
          target: { type: "helpers" },
          allow: "main.js",
        },
        {
          target: { type: "components" },
          disallow: "*.js",
        },
        {
          target: { type: "components" },
          allow: "Component.js",
        },
        {
          target: { type: "modules" },
          disallow: "*",
        },
        {
          target: { type: "modules" },
          allow: "Module.js",
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
    'Dependencies to elements of type "helpers" and internalPath "index.js" are not allowed. Denied by rule at index 0',
    'Dependencies to elements of type "helpers" and internalPath "index.js" are not allowed. Denied by rule at index 0',
    'Dependencies to elements of type "components" and internalPath "main.js" are not allowed. Denied by rule at index 2',
  ]
);

// options with capture

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          target: { type: "helpers" },
          allow: "main.js",
        },
        {
          target: { type: "helpers", captured: { elementName: "*-a" } },
          disallow: "*",
        },
        {
          target: { type: "helpers", captured: { elementName: "*-a" } },
          allow: "index.*",
        },
        {
          target: { type: "components" },
          allow: "Component.js",
        },
        {
          target: { type: "modules" },
          allow: "Module.js",
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-b"',
    'Dependencies to elements of type "helpers", elementName "helper-a" and internalPath "main.js" are not allowed. Denied by rule at index 1',
  ]
);

// Custom messages

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      message:
        "Importing the file ${dependency.internalPath} is not allowed in ${dependency.type}",
      rules: [
        {
          target: { type: "helpers" },
          allow: "main.js",
        },
        {
          target: { type: "helpers", captured: { elementName: "*-a" } },
          disallow: "*",
          message: "Do not import any type of file from helpers with name *-a",
        },
        {
          target: { type: "helpers", captured: { elementName: "*-a" } },
          allow: "index.*",
        },
        {
          target: { type: "components" },
          allow: "Component.js",
        },
        {
          target: { type: "modules" },
          allow: "Module.js",
        },
      ],
    },
  ],
  [
    "Importing the file index.js is not allowed in helpers",
    "Do not import any type of file from helpers with name *-a",
  ]
);

const noRulesRuleTester = createRuleTester(SETTINGS.oneLevel);
noRulesRuleTester.run(RULE, rule, {
  valid: [
    {
      filename: absoluteFilePath("helpers/helper-b/HelperB.js"),
      code: "import HelperA from 'helpers/helper-a/HelperA.js'",
      options: [
        {
          default: "allow",
          message:
            "Importing the file ${dependency.internalPath} is not allowed in ${dependency.type}",
          // Testing options with no rules
        },
      ],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("helpers/helper-b/HelperB.js"),
      code: "import HelperA from 'helpers/helper-a/HelperA.js'",
      options: [
        {
          default: "disallow",
          message: "disallowed by default",
          // Testing options with no rules
        },
      ],
      errors: [
        {
          message: "disallowed by default",
          type: "Literal",
        },
      ],
    },
  ],
});
