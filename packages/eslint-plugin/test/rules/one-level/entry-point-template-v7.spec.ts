import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage } from "../../support/messages";

const { absoluteFilePath } = pathResolvers("one-level");

const rule = ruleFactory();

const testCapture = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // component-c entry-point is component-c
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentC from 'components/component-c/component-c'",
        options,
      },
      // componentD entry-point is componentD.js
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentD from 'components/ComponentD/ComponentD'",
        options,
      },
      // helper-b entry-point is main.js
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-b/main'",
        options,
      },
      // module-a can import entry-point module-a in componentD
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentD from 'components/ComponentD/module-a'",
        options,
      },
    ],
    invalid: [
      // import index from component-c
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentD from 'components/component-c'",
        options,
        errors: [
          {
            message: errorMessage(errorMessages, 0, ""),
            type: "Literal",
          },
        ],
      },
      // import componentA from component-a
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentA from 'components/component-a/ComponentA'",
        options,
        errors: [
          {
            message: errorMessage(errorMessages, 1, ""),
            type: "Literal",
          },
        ],
      },
      // import helper-b index.js
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage(errorMessages, 2, ""),
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
            message: errorMessage(errorMessages, 3, ""),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

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
          allow: {
            to: {
              element: {
                fileInternalPath: [
                  "${to.elementName}.js",
                  "${from.elementName}.js",
                ],
              },
            },
          },
        },
      ],
    },
  ],
  {
    0: 'There is no rule allowing dependencies from elements of type "modules" and captured values: elementName="module-a" to elements of type "components" and captured values: elementName="component-c"',
    1: 'There is no rule allowing dependencies from elements of type "modules" and captured values: elementName="module-a" to elements of type "components" and captured values: elementName="component-a"',
    2: 'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-b"',
    3: 'Dependencies to elements of type "helpers", captured values: elementName="helper-a" and fileInternalPath "main.js" are not allowed. Denied by rule at index 1',
  }
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
          message:
            "Do not import any type of file from helpers with name *-a (importing from ${from.elementName})",
        },
        {
          to: {
            element: { type: "helpers", captured: { elementName: "*-a" } },
          },
          allow: { to: { element: { fileInternalPath: "index.*" } } },
        },
        {
          to: { element: { type: "components" } },
          allow: {
            to: {
              element: {
                fileInternalPath: [
                  "${to.elementName}.js",
                  "${from.elementName}.js",
                ],
              },
            },
          },
        },
      ],
    },
  ],
  {
    0: "Importing the file index.js is not allowed in components",
    1: "Importing the file ComponentA.js is not allowed in components",
    2: "Importing the file index.js is not allowed in helpers",
    3: "Do not import any type of file from helpers with name *-a (importing from component-a)",
  }
);
