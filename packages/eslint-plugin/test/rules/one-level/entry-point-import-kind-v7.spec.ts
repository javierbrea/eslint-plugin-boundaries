import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage } from "../../support/messages";

const { absoluteFilePath } = pathResolvers("one-level");

const rule = ruleFactory();

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // import value from main.js file from helper
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import helper from 'helpers/helper-b/main'",
        options,
      },
      // import type from Component.js file from component
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type ComponentB from 'components/component-b/Component.js'",
        options,
      },
      // import type from Module.js file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type ModuleA from 'modules/module-a/Module'",
        options,
      },
      // import value from Module.js file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a/Module'",
        options,
      },
    ],
    invalid: [
      // import type from main.js file from helper
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type HelperA from 'helpers/helper-a/main'",
        options,
        errors: [
          {
            message: errorMessage(errorMessages, 0, ""),
            type: "Literal",
          },
        ],
      },
      // import value from Component.js file from component
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b/Component.js'",
        options,
        errors: [
          {
            message: errorMessage(errorMessages, 1, ""),
            type: "Literal",
          },
        ],
      },
      // import value from not allowed file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: errorMessage(errorMessages, 2, ""),
            type: "Literal",
          },
        ],
      },
      // import type from not allowed file from module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type ModuleA from 'modules/module-a'",
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

// disallow based options

runTest(
  TYPESCRIPT_SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          to: { element: { type: "helpers" } },
          allow: { to: { element: { fileInternalPath: "main.js" } } },
          dependency: { kind: "value" },
        },
        {
          to: { element: { type: "components" } },
          allow: { to: { element: { fileInternalPath: "Component.js" } } },
          dependency: { kind: "type" },
        },
        {
          to: { element: { type: "modules" } },
          allow: { to: { element: { fileInternalPath: "Module.js" } } },
          dependency: { kind: "*" },
        },
      ],
    },
  ],
  {
    0: 'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "helpers" and captured values: elementName="helper-a"',
    1: 'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-b"',
    2: 'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "modules" and captured values: elementName="module-a"',
    3: 'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "modules" and captured values: elementName="module-a"',
  }
);

// allow based options

runTest(
  TYPESCRIPT_SETTINGS.oneLevel,
  [
    {
      default: "allow",
      rules: [
        {
          to: { element: { type: "helpers" } },
          disallow: { to: { element: { fileInternalPath: "!main.js" } } },
          dependency: { kind: "*" },
        },
        {
          to: { element: { type: "helpers" } },
          disallow: { to: { element: { fileInternalPath: "main.js" } } },
          dependency: { kind: "type" },
        },
        {
          to: { element: { type: "components" } },
          disallow: { to: { element: { fileInternalPath: "!Component.js" } } },
          dependency: { kind: "*" },
        },
        {
          to: { element: { type: "components" } },
          disallow: { to: { element: { fileInternalPath: "Component.js" } } },
          dependency: { kind: "value" },
        },
        {
          to: { element: { type: "modules" } },
          disallow: { to: { element: { fileInternalPath: "!Module.js" } } },
          dependency: { kind: "*" },
        },
      ],
    },
  ],
  {
    0: 'Dependencies with kind "type" to elements of type "helpers" and fileInternalPath "main.js" are not allowed. Denied by rule at index 1',
    1: 'Dependencies with kind "value" to elements of type "components" and fileInternalPath "Component.js" are not allowed. Denied by rule at index 3',
    2: 'Dependencies with kind "value" to elements of type "modules" and fileInternalPath "index.js" are not allowed. Denied by rule at index 4',
    3: 'Dependencies with kind "type" to elements of type "modules" and fileInternalPath "index.js" are not allowed. Denied by rule at index 4',
  }
);
