import rule from "../../../src/Rules/EntryPoint";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage, entryPointNoRuleMessage } from "../../support/messages";

const { ENTRY_POINT: RULE } = require("../../../src/Settings");

const { absoluteFilePath } = pathResolvers("one-level");

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
            message: errorMessage(
              errorMessages,
              0,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'components' with elementName 'component-c'",
              })
            ),
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
            message: errorMessage(
              errorMessages,
              1,
              entryPointNoRuleMessage({
                entryPoint: "ComponentA.js",
                dep: "'components' with elementName 'component-a'",
              })
            ),
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
            message: errorMessage(
              errorMessages,
              2,
              entryPointNoRuleMessage({
                entryPoint: "index.js",
                dep: "'helpers' with elementName 'helper-b'",
              })
            ),
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
            message: errorMessage(
              errorMessages,
              3,
              entryPointNoRuleMessage({
                entryPoint: "main.js",
                dep: "'helpers' with elementName 'helper-a'",
              })
            ),
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
          target: ["components"],
          allow: ["${target.elementName}.js", "${from.elementName}.js"],
        },
      ],
    },
  ],
  {
    3: "The entry point 'main.js' is not allowed in elements of type 'helpers' with elementName '*-a'. Disallowed in rule 2",
  }
);

// Custom messages

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      message:
        "Importing the file ${target.internalPath} is not allowed in ${target.type}",
      rules: [
        {
          target: "helpers",
          allow: "main.js",
        },
        {
          target: [["helpers", { elementName: "*-a" }]],
          disallow: "*",
          message:
            "Do not import any type of file from helpers with name *-a (importing from ${from.elementName})",
        },
        {
          target: [["helpers", { elementName: "*-a" }]],
          allow: "index.*",
        },
        {
          target: ["components"],
          allow: ["${target.elementName}.js", "${from.elementName}.js"],
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
