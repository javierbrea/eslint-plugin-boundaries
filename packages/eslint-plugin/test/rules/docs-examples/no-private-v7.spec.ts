import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const settings = SETTINGS.docsExamplesV7;
const { absoluteFilePath } = pathResolvers("docs-examples");

const rule = ruleFactory();

const options = [
  {
    default: "allow",
    policies: [
      { disallow: { to: { element: { parent: { type: "*" } } } } },
      {
        allow: {
          dependency: { relationship: { to: ["child", "sibling", "uncle"] } },
        },
      },
    ],
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
      filename: absoluteFilePath(
        "modules/module-b/modules/module-c/ModuleC.js"
      ),
      code: "import ModuleA from 'modules/module-a'",
      options,
    },
    // `module-c` can import `module-d` because it is his brother
    {
      filename: absoluteFilePath(
        "modules/module-b/modules/module-c/ModuleC.js"
      ),
      code: "import ModuleD from '../module-d'",
      options,
    },
    // `module-e` can import `module-d` because it is his uncle
    {
      filename: absoluteFilePath(
        "modules/module-b/modules/module-c/modules/module-e/ModuleE"
      ),
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
          message:
            'Dependencies to elements of parent type "modules" are not allowed. Denied by policy at index 0',
          type: "Literal",
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
          message:
            'Dependencies to elements of parent type "modules" are not allowed. Denied by policy at index 0',
          type: "Literal",
        },
      ],
    },
    // `module-e` can't import `module-d` when `allowUncles` option is disabled
    {
      filename: absoluteFilePath(
        "modules/module-b/modules/module-c/modules/module-e/ModuleE"
      ),
      code: "import ModuleD from 'modules/module-b/modules/module-d'",
      options: [
        {
          default: "allow",
          policies: [
            { disallow: { to: { element: { parent: { type: "*" } } } } },
            {
              allow: {
                dependency: { relationship: { to: ["child", "sibling"] } },
              },
            },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies to elements of parent type "modules" are not allowed. Denied by policy at index 0',
          type: "Literal",
        },
      ],
    },
  ],
});
