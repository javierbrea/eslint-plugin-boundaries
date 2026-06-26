import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const rule = ruleFactory();

const defaultOptions = [
  {
    default: "disallow",
    rules: [
      {
        to: { element: { type: "*" } },
        allow: { to: { element: { fileInternalPath: "index.js" } } },
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
          to: { element: { type: "helpers" } },
          allow: { to: { element: { fileInternalPath: "main.js" } } },
        },
        {
          to: { element: { type: "components" } },
          allow: { to: { element: { fileInternalPath: "Component.js" } } },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module.js" } } },
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
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
          to: { element: { type: "helpers" } },
          allow: { to: { element: { fileInternalPath: "main.js" } } },
        },
        {
          to: { element: { type: "components" } },
          allow: { to: { element: { fileInternalPath: "Component.js" } } },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module.js" } } },
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
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
          to: { element: { type: "h*" } },
          allow: { to: { element: { fileInternalPath: "main.*" } } },
        },
        {
          to: { element: { type: "c*" } },
          allow: { to: { element: { fileInternalPath: "C*.*" } } },
        },
        {
          to: { element: { type: "m*" } },
          allow: { to: { element: { fileInternalPath: "M*.*" } } },
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-a"',
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
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
          to: { element: { type: "helpers" } },
          disallow: { to: { element: { fileInternalPath: "*.js" } } },
        },
        {
          to: { element: { type: "helpers" } },
          allow: { to: { element: { fileInternalPath: "main.js" } } },
        },
        {
          to: { element: { type: "components" } },
          disallow: { to: { element: { fileInternalPath: "*.js" } } },
        },
        {
          to: { element: { type: "components" } },
          allow: { to: { element: { fileInternalPath: "Component.js" } } },
        },
        {
          to: { element: { type: "modules" } },
          disallow: { to: { element: { fileInternalPath: "*" } } },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module.js" } } },
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
    'Dependencies to elements of type "helpers" and fileInternalPath "index.js" are not allowed. Denied by rule at index 0',
    'Dependencies to elements of type "helpers" and fileInternalPath "index.js" are not allowed. Denied by rule at index 0',
    'Dependencies to elements of type "components" and fileInternalPath "main.js" are not allowed. Denied by rule at index 2',
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
          to: { element: { type: "components" } },
          allow: { to: { element: { fileInternalPath: "Component.js" } } },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module.js" } } },
        },
      ],
    },
  ],
  [
    'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-b"',
    'Dependencies to elements of type "helpers", captured values: elementName="helper-a" and fileInternalPath "main.js" are not allowed. Denied by rule at index 1',
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
          to: { element: { type: "helpers" } },
          allow: { to: { element: { fileInternalPath: "main.js" } } },
        },
        {
          to: {
            element: { type: "helpers", captured: { elementName: "*-a" } },
          },
          disallow: { to: { element: { fileInternalPath: "*" } } },
          message: "Do not import any type of file from helpers with name *-a",
        },
        {
          to: {
            element: { type: "helpers", captured: { elementName: "*-a" } },
          },
          allow: { to: { element: { fileInternalPath: "index.*" } } },
        },
        {
          to: { element: { type: "components" } },
          allow: { to: { element: { fileInternalPath: "Component.js" } } },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module.js" } } },
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
