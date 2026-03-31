import rule from "../../../src/Rules/EntryPoint";
import { ENTRY_POINT as RULE } from "../../../src/Shared";
import {
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage } from "../../support/messages";

const { absoluteFilePath } = pathResolvers("one-level");

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
          target: "helpers",
          allow: "main.js",
          importKind: "value",
        },
        {
          target: "components",
          allow: "Component.js",
          importKind: "type",
        },
        {
          target: "modules",
          allow: "Module.js",
          importKind: "*",
        },
      ],
    },
  ],
  {
    0: 'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "helpers" and elementName "helper-a"',
    1: 'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "components" and elementName "component-b"',
    2: 'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "modules" and elementName "module-a"',
    3: 'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to elements of type "modules" and elementName "module-a"',
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
          target: "helpers",
          disallow: "!main.js",
          importKind: "*",
        },
        {
          target: "helpers",
          disallow: "main.js",
          importKind: "type",
        },
        {
          target: "components",
          disallow: "!Component.js",
          importKind: "*",
        },
        {
          target: "components",
          disallow: "Component.js",
          importKind: "value",
        },
        {
          target: "modules",
          disallow: "!Module.js",
          importKind: "*",
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
