const { NO_PRIVATE: RULE } = require("../../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../helpers");

const rule = require(`../../../../src/rules/${RULE}`);

const settings = SETTINGS.docsExamples;
const { absoluteFilePath } = pathResolvers("docs-examples");

const ERROR_MESSAGE = "Dependency is private of another element";

const options = [
  {
    allowUncles: true,
  },
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // `module-b` can import `module-c` because it is his direct child
    {
      filename: absoluteFilePath("modules/module-b/ModuleB.js"),
      code: "import ModuleC from './modules/module-c'",
      options,
    },
    // `module-c` can import `module-a` because it is public
    {
      filename: absoluteFilePath("modules/module-b/modules/module-c/ModuleC.js"),
      code: "import ModuleA from 'modules/module-a'",
      options,
    },
    // `module-c` can import `module-d` because it is his brother
    {
      filename: absoluteFilePath("modules/module-b/modules/module-c/ModuleC.js"),
      code: "import ModuleD from '../module-d'",
      options,
    },
    // `module-e` can import `module-d` because it is his uncle
    {
      filename: absoluteFilePath("modules/module-b/modules/module-c/modules/module-e/ModuleE"),
      code: "import ModuleD from 'modules/module-b/modules/module-d'",
      options,
    },
  ],
  invalid: [
    // `module-a` can't import `module-c` because it is child of `module-b`
    {
      filename: absoluteFilePath("modules/module-a/moduleA.js"),
      code: "import ModuleC from 'modules/module-b/modules/module-c'",
      options,
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "ImportDeclaration",
        },
      ],
    },
    // `module-b` can't import `module-e` because it is child of `module-c` (even when it is his grandchild)
    {
      filename: absoluteFilePath("modules/module-b/moduleB.js"),
      code: "import ModuleE from './modules/module-c/modules/module-e'",
      options,
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "ImportDeclaration",
        },
      ],
    },
    // `module-e` can't import `module-d` when `allowUncles` option is disabled
    {
      filename: absoluteFilePath("modules/module-b/modules/module-c/modules/module-e/ModuleE"),
      code: "import ModuleD from 'modules/module-b/modules/module-d'",
      options: [
        {
          allowUncles: false,
        },
      ],
      errors: [
        {
          message: ERROR_MESSAGE,
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
