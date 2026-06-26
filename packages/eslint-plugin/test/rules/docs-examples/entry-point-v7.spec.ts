import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const { absoluteFilePath } = pathResolvers("docs-examples");

const rule = ruleFactory();

const settings = SETTINGS.docsExamplesV7;

const options = [
  {
    // disallow all entry-points by default
    default: "disallow",
    rules: [
      {
        // when importing helpers
        to: { file: { categories: "helpers" } },
        // allow everything (helpers are single files)
        allow: {
          to: [{ file: { categories: "*" } }, { element: { type: "*" } }],
        },
      },
      {
        // when importing components or modules
        to: [
          { element: { type: "components" } },
          { element: { type: "modules" } },
        ],
        // only allow index.js
        allow: { to: { element: { fileInternalPath: "index.js" } } },
      },
    ],
  },
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // helper file can be imported
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from 'helpers/data/parse'",
      options,
    },
    // index.js from components can be imported
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ComponentB from 'components/atoms/atom-b'",
      options,
    },
    // index.js from components can be imported
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ComponentB from 'components/atoms/atom-b/index.js'",
      options,
    },
    // index.js from modules can be imported
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'modules/module-b'",
      options,
    },
  ],
  invalid: [
    // Any other file than index.js can't be imported from components
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import AtomA from 'components/atoms/atom-a/AtomA'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "modules" and captured values: elementName="module-a" to elements of type "components" and captured values: family="atoms", elementName="atom-a"',
          type: "Literal",
        },
      ],
    },
    // Any other file than index.js can't be imported from modules
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'modules/module-b/ModuleB'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "modules" and captured values: elementName="module-a" to elements of type "modules" and captured values: elementName="module-b"',
          type: "Literal",
        },
      ],
    },
  ],
});
