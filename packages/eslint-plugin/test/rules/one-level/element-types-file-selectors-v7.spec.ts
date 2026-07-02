import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage } from "../../support/messages";

const rule = ruleFactory();

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const REST_OF_PATH = "test/fixtures/one-level";

// Helpers and components/modules in one-level fixtures resolve to:
// 'helpers/helper-a'       → helpers/helper-a/index.js  (elementName="helper-a", fileName="index")
// 'helpers/helper-a/HelperA.js' → helpers/helper-a/HelperA.js (elementName="helper-a", fileName="HelperA")
// 'helpers/helper-b'       → helpers/helper-b/index.js  (elementName="helper-b", fileName="index")
// 'components/component-a' → components/component-a/index.js (elementName="component-a", fileName="index")
// 'modules/module-a'       → modules/module-a/index.js  (elementName="module-a", fileName="index")

function fileCategoriesNoRuleMessage({
  file,
  dep,
}: {
  file: string;
  dep: string;
}) {
  return `There is no policy allowing dependencies from file of category ${file} to file of category ${dep}`;
}

function fileCapturedNoRuleMessage({
  file,
  dep,
}: {
  file: string;
  dep: string;
}) {
  return `There is no policy allowing dependencies from ${file} to ${dep}`;
}

function fileWithCapturedDesc(
  category: string,
  elementName: string,
  fileName: string,
  elementType: string,
  elementCapturedName: string
) {
  return (
    `file of category "${category}" and captured values: ` +
    `restOfPath="${REST_OF_PATH}", elementName="${elementName}", fileName="${fileName}" ` +
    `belonging to elements of type "${elementType}" and captured values: ` +
    `elementName="${elementCapturedName}"`
  );
}

// Settings using file descriptors WITHOUT capture
// Used for basic file.categories selector tests.
const defaultSettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: ["components/*"], capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
  "boundaries/files": [
    { category: "helpers", pattern: "**/helpers/*/**" },
    { category: "components", pattern: ["**/components/*/**"] },
    { category: "modules", pattern: "**/modules/*/**" },
  ],
} as RuleTesterSettings;

// Settings using file descriptors WITH capture on patterns
// The basePattern "**" prepends a "restOfPath" captured value automatically.
// For pattern "helpers/*/*.js": restOfPath + elementName + fileName are captured.
const captureSettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: ["components/*"], capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
  "boundaries/files": [
    {
      category: "helpers",
      pattern: "helpers/*/*.js",
      basePattern: "**",
      capture: ["elementName", "fileName"],
    },
    {
      category: "components",
      pattern: "components/*/*.js",
      basePattern: "**",
      capture: ["elementName", "fileName"],
    },
    {
      category: "modules",
      pattern: "modules/*/*.js",
      basePattern: "**",
      capture: ["elementName", "fileName"],
    },
  ],
} as RuleTesterSettings;

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Non recognized types can import whatever
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import helpers
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
      // Components can import helpers using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import components using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options,
      },
      // Modules can import helpers using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Modules can import components using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
      },
      // Can import internal files
      {
        filename: absoluteFilePath("modules/module-a/index.js"),
        code: "import ModuleA from './ModuleA'",
        options,
      },
      // Modules can import modules
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b'",
        options,
      },
      // Helpers can import ignored helpers
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("helpers/helper-b/**/*.js")],
        },
      },
      // Invalid options are treated as no-op
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b/foo.js'",
        options: [{ policies: undefined }],
      },
      // Invalid options: unknown file category in from
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ModuleB from '../module-b/foo.js'",
        options: [
          {
            policies: [
              {
                from: { file: { categories: "foo" } },
                allow: { to: { file: { categories: "modules" } } },
              },
            ],
          },
        ],
      },
      // No types provided in settings
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import B from '../../modules/module-b/foo.js'",
        settings: {
          ...settings,
          "boundaries/types": null,
        },
      },
      // Helpers can import another helper when everything is allowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [{ default: "allow" }],
      },
      // Can import node built-in module
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import fs from 'node:fs'",
        options,
      },
    ],
    invalid: [
      // Helpers can't import another when everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [{ default: "disallow" }],
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "helpers" and captured values: elementName="helper-a"',
                dep: '"helpers" belonging to elements of type "helpers" and captured values: elementName="helper-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import another helper
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "helpers" and captured values: elementName="helper-a"',
                dep: '"helpers" belonging to elements of type "helpers" and captured values: elementName="helper-b"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import a component
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              2,
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "helpers" and captured values: elementName="helper-a"',
                dep: '"components" belonging to elements of type "components" and captured values: elementName="component-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import a module
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              3,
              fileCategoriesNoRuleMessage({
                file: '"helpers" belonging to elements of type "helpers" and captured values: elementName="helper-a"',
                dep: '"modules" belonging to elements of type "modules" and captured values: elementName="module-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Components can't import a module
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              4,
              fileCategoriesNoRuleMessage({
                file: '"components" belonging to elements of type "components" and captured values: elementName="component-a"',
                dep: '"modules" belonging to elements of type "modules" and captured values: elementName="module-a"',
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

const testFileCaptured = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Components can import helper-a (captured elementName matches)
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from '../../helpers/helper-a'",
        options,
      },
      // Components can import helper-a using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
      // Components can import component-b using alias (not disallowed component)
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options,
      },
      // Component A can import internal files
      {
        filename: absoluteFilePath("components/component-a/index.js"),
        code: "import ComponentA from './ComponentA'",
        options,
      },
      // Modules can import helper-a using alias
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options,
      },
    ],
    invalid: [
      // Components can't import helper-b (captured elementName doesn't match "helper-a")
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperB from '../../helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              fileCapturedNoRuleMessage({
                file: fileWithCapturedDesc(
                  "components",
                  "component-a",
                  "ComponentA",
                  "components",
                  "component-a"
                ),
                dep: fileWithCapturedDesc(
                  "helpers",
                  "helper-b",
                  "index",
                  "helpers",
                  "helper-b"
                ),
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Components can't import helper-b using alias
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              fileCapturedNoRuleMessage({
                file: fileWithCapturedDesc(
                  "components",
                  "component-a",
                  "ComponentA",
                  "components",
                  "component-a"
                ),
                dep: fileWithCapturedDesc(
                  "helpers",
                  "helper-b",
                  "index",
                  "helpers",
                  "helper-b"
                ),
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Component B can't import component-a (disallowed by captured value rule)
      {
        filename: absoluteFilePath("components/component-b/ComponentB.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              2,
              fileCapturedNoRuleMessage({
                file: fileWithCapturedDesc(
                  "components",
                  "component-b",
                  "ComponentB",
                  "components",
                  "component-b"
                ),
                dep: fileWithCapturedDesc(
                  "components",
                  "component-a",
                  "index",
                  "components",
                  "component-a"
                ),
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can't import helper-b (captured elementName doesn't match)
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              3,
              fileCapturedNoRuleMessage({
                file: fileWithCapturedDesc(
                  "modules",
                  "module-a",
                  "ModuleA",
                  "modules",
                  "module-a"
                ),
                dep: fileWithCapturedDesc(
                  "helpers",
                  "helper-b",
                  "index",
                  "helpers",
                  "helper-b"
                ),
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// disallow-based options using file.categories selectors

runTest(
  defaultSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "components" } },
          allow: {
            to: [
              { file: { categories: "helpers" } },
              { file: { categories: "components" } },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              { file: { categories: "helpers" } },
              { file: { categories: "components" } },
              { file: { categories: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// settings with no capture on elements (only file categories drive rules)

runTest(
  {
    ...defaultSettings,
    "boundaries/elements": [
      { type: "helpers", pattern: "helpers/*" },
      { type: "components", pattern: ["components/*"] },
      { type: "modules", pattern: "modules/*" },
    ],
  } as RuleTesterSettings,
  [
    {
      default: "allow",
      policies: [
        {
          from: { file: { categories: "helpers" } },
          disallow: {
            to: [
              { file: { categories: "modules" } },
              { file: { categories: "components" } },
              { file: { categories: "helpers" } },
            ],
          },
        },
        {
          from: { file: { categories: "components" } },
          disallow: { to: { file: { categories: "modules" } } },
        },
        {
          from: {
            file: { categories: "components" },
            element: { captured: { elementName: "component-a" } },
          },
          allow: {
            to: {
              file: { categories: "modules" },
              element: { captured: { elementName: "module-b" } },
            },
          },
        },
      ],
    },
  ],
  {
    0: fileCategoriesNoRuleMessage({
      file: '"helpers" belonging to elements of type "helpers"',
      dep: '"helpers" belonging to elements of type "helpers"',
    }),
    1: 'Dependencies to file of category "helpers" are not allowed in file of category "helpers". Denied by policy at index 0',
    2: 'Dependencies to file of category "components" are not allowed in file of category "helpers". Denied by policy at index 0',
    3: 'Dependencies to file of category "modules" are not allowed in file of category "helpers". Denied by policy at index 0',
    4: 'Dependencies to file of category "modules" are not allowed in file of category "components". Denied by policy at index 1',
  }
);

// micromatch-based file category options

runTest(
  defaultSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              { file: { categories: "h*" } },
              { file: { categories: "c*" } },
            ],
          },
        },
        {
          from: { file: { categories: "m*" } },
          allow: {
            to: [
              { file: { categories: "h*" } },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// allow-based file category options

runTest(
  defaultSettings,
  [
    {
      default: "allow",
      policies: [
        {
          from: { file: { categories: "helpers" } },
          disallow: {
            to: [
              { file: { categories: "modules" } },
              { file: { categories: "components" } },
              { file: { categories: "helpers" } },
            ],
          },
        },
        {
          from: { file: { categories: "components" } },
          disallow: { to: [{ file: { categories: "modules" } }] },
        },
      ],
    },
  ],
  {
    1: 'Dependencies to file of category "helpers" are not allowed in file of category "helpers". Denied by policy at index 0',
    2: 'Dependencies to file of category "components" are not allowed in file of category "helpers". Denied by policy at index 0',
    3: 'Dependencies to file of category "modules" are not allowed in file of category "helpers". Denied by policy at index 0',
    4: 'Dependencies to file of category "modules" are not allowed in file of category "components". Denied by policy at index 1',
  }
);

// file.captured allow-based options: allow to helpers only when captured elementName is "helper-a"

// file.captured with micromatch negative expression

testFileCaptured(
  captureSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "components" } },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              {
                file: {
                  categories: "components",
                  captured: { elementName: "!component-a" },
                },
              },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              { file: { categories: "components" } },
              { file: { categories: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// file.captured with micromatch pattern: allow helpers matching "*-a"

testFileCaptured(
  captureSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "*-a" },
                },
              },
              { file: { categories: "c*" } },
            ],
          },
          disallow: {
            to: [
              {
                file: { categories: "c*", captured: { elementName: "*-a" } },
              },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "h*", captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    2: 'Dependencies to file of category "components" and captured values: elementName="component-a" are not allowed in file of category "components". Denied by policy at index 0',
  }
);

// file.captured custom error message

testFileCaptured(
  captureSettings,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.file.categories.[0]}} with captured name {{to.file.captured.elementName}} is not allowed in {{from.file.categories.[0]}} with captured name {{from.file.captured.elementName}}",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "*-a" },
                },
              },
              { file: { categories: "c*" } },
            ],
          },
          disallow: {
            to: [
              {
                file: { categories: "c*", captured: { elementName: "*-a" } },
              },
            ],
          },
          message:
            "Do not import {{to.file.categories.[0]}} named {{to.file.captured.elementName}} from {{from.file.categories.[0]}} named {{from.file.captured.elementName}}. Repeat: Do not import {{to.file.categories.[0]}} named {{to.file.captured.elementName}} from {{from.file.categories.[0]}} named {{from.file.captured.elementName}}.",
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "h*", captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    0: "Importing helpers with captured name helper-b is not allowed in components with captured name component-a",
    1: "Importing helpers with captured name helper-b is not allowed in components with captured name component-a",
    2: "Do not import components named component-a from components named component-b. Repeat: Do not import components named component-a from components named component-b.",
    3: "Importing helpers with captured name helper-b is not allowed in modules with captured name module-a",
  }
);

// file.captured custom error message at rule level (default message)

testFileCaptured(
  captureSettings,
  [
    {
      default: "disallow",
      message:
        "Importing {{to.file.categories.[0]}} with captured name {{to.file.captured.elementName}} is not allowed in {{from.file.categories.[0]}} with captured name {{from.file.captured.elementName}}",
      policies: [
        {
          from: { file: { categories: "c*" } },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "*-a" },
                },
              },
              { file: { categories: "c*" } },
            ],
          },
          disallow: {
            to: {
              file: { categories: "c*", captured: { elementName: "*-a" } },
            },
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: { categories: "h*", captured: { elementName: "*-a" } },
              },
              { file: { categories: "c*" } },
              { file: { categories: "m*" } },
            ],
          },
        },
      ],
    },
  ],
  {
    0: "Importing helpers with captured name helper-b is not allowed in components with captured name component-a",
    1: "Importing helpers with captured name helper-b is not allowed in components with captured name component-a",
    2: "Importing components with captured name component-a is not allowed in components with captured name component-b",
    3: "Importing helpers with captured name helper-b is not allowed in modules with captured name module-a",
  }
);

// file.captured in FROM selector: behavior differs based on the FROM file's captured elementName.
// component-a files may import any component, while other component files (captured "!component-a")
// may only import helper-a. This proves that FROM file.captured drives which rule applies.

testFileCaptured(
  captureSettings,
  [
    {
      default: "disallow",
      policies: [
        {
          from: {
            file: {
              categories: "components",
              captured: { elementName: "component-a" },
            },
          },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              { file: { categories: "components" } },
            ],
          },
        },
        {
          from: {
            file: {
              categories: "components",
              captured: { elementName: "!component-a" },
            },
          },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
            ],
          },
        },
        {
          from: { file: { categories: "modules" } },
          allow: {
            to: [
              {
                file: {
                  categories: "helpers",
                  captured: { elementName: "helper-a" },
                },
              },
              { file: { categories: "components" } },
              { file: { categories: "modules" } },
            ],
          },
        },
      ],
    },
  ],
  {}
);

// Object selector properties for file descriptors with captures
// Tests specific file selector properties in both FROM and TO positions.

const fileSelectorPropertiesSettings = {
  ...captureSettings,
} as RuleTesterSettings;

createRuleTester(fileSelectorPropertiesSettings).run(
  `${RULE} file selector properties`,
  rule,
  {
    valid: [
      // file.categories in FROM and dependency.module null is valid
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                allow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { module: null },
                },
              },
            ],
          },
        ],
      },
      // file.isIgnored and file.isUnknown null in TO is valid
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: {
                  to: { file: { isIgnored: false, isUnknown: false } },
                },
              },
            ],
          },
        ],
      },
      // dependency.relationship.from null is valid
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: {
                  dependency: { relationship: { from: null } },
                },
              },
            ],
          },
        ],
      },
      // dependency.relationship.to null is valid
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: {
                  dependency: { relationship: { to: null } },
                },
              },
            ],
          },
        ],
      },
      // file.captured null in TO is valid (no rule triggers)
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: {
                  to: { file: { captured: null } },
                },
              },
            ],
          },
        ],
      },
      // non-matching relationship in disallow is valid
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { relationship: { to: "foo" } },
                },
              },
            ],
          },
        ],
      },
      // file.categories and file.captured null combo in TO is valid
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: {
                  to: {
                    file: { categories: null, captured: null },
                  },
                },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // file.categories in FROM and TO
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: { to: [{ file: { categories: "helpers" } }] },
                message: "blocked-category",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-category", type: "Literal" }],
      },
      // file.captured in TO selector
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [
                    {
                      file: {
                        categories: "helpers",
                        captured: { elementName: "helper-b" },
                      },
                    },
                  ],
                },
                message: "blocked-file-captured",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-file-captured", type: "Literal" }],
      },
      // file.captured with fileName in TO selector
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b/HelperB.js'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [
                    {
                      file: {
                        categories: "helpers",
                        captured: { fileName: "HelperB" },
                      },
                    },
                  ],
                },
                message: "blocked-file-name",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-file-name", type: "Literal" }],
      },
      // file.captured in FROM selector
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  file: {
                    categories: "helpers",
                    captured: { elementName: "helper-a" },
                  },
                },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                },
                message: "blocked-from-captured",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-from-captured", type: "Literal" }],
      },
      // file.path in TO selector
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { path: "**/helpers/helper-b/**" } }],
                },
                message: "blocked-file-path-to",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-file-path-to", type: "Literal" }],
      },
      // file.path in FROM selector
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { path: "**/helpers/helper-a/**" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                },
                message: "blocked-file-path-from",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-file-path-from", type: "Literal" }],
      },
      // file.isIgnored in TO selector
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: { to: [{ file: { isIgnored: false } }] },
                message: "blocked-is-ignored",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-is-ignored", type: "Literal" }],
      },
      // file.isUnknown in TO selector
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: { to: [{ file: { isUnknown: false } }] },
                message: "blocked-is-unknown",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-is-unknown", type: "Literal" }],
      },
      // dependency.source combined with file.categories
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { source: "helpers/helper-b" },
                },
                message: "blocked-source",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-source", type: "Literal" }],
      },
      // dependency.kind combined with file.categories
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { kind: "value" },
                },
                message: "blocked-kind",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-kind", type: "Literal" }],
      },
      // dependency.specifiers combined with file.categories
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { specifiers: "HelperB" },
                },
                message: "blocked-specifiers",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-specifiers", type: "Literal" }],
      },
      // dependency.nodeKind combined with file.categories
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { HelperB } from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [{ file: { categories: "helpers" } }],
                  dependency: { nodeKind: "import" },
                },
                message: "blocked-node-kind",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-node-kind", type: "Literal" }],
      },
      // file.captured micromatch pattern: fileName matching "*B"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b/HelperB.js'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: [
                    {
                      file: {
                        categories: "helpers",
                        captured: { fileName: "*B" },
                      },
                    },
                  ],
                },
                message: "blocked-filename-micromatch",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-filename-micromatch", type: "Literal" }],
      },
      // Null cases: file.categories null in TO
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                disallow: {
                  to: { file: { categories: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to file of category "helpers" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      // Null cases: file.captured null in TO
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                disallow: {
                  to: { file: { captured: null } },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to file of captured values: restOfPath="test/fixtures/one-level", elementName="helper-b", fileName="index" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      // Null cases: all file properties null in TO
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                disallow: {
                  to: {
                    file: { categories: null, captured: null },
                  },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to file of category "helpers" and captured values: restOfPath="test/fixtures/one-level", elementName="helper-b", fileName="index" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
    ],
  }
);
