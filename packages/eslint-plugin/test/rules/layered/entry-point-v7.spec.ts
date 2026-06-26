import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const { absoluteFilePath } = pathResolvers("layered");

const rule = ruleFactory();

const settings = SETTINGS.layeredV7;

// https://github.com/javierbrea/eslint-plugin-boundaries/issues/340
const options = [
  {
    // disallow all entry-points by default
    default: "disallow",
    rules: [
      {
        to: { element: { type: "modules" } },
        allow: { to: { element: { fileInternalPath: "**" } } },
      },
      {
        to: {
          element: {
            type: "modules",
            captured: {
              // Any element, except the same as target
              elementName: "!({{ from.element.captured.elementName }})",
            },
          },
        },
        // Any file, except index.js
        disallow: { to: { element: { fileInternalPath: "**/!(index.js)" } } },
      },
    ],
  },
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // helper can be imported inside the same module
    {
      filename: absoluteFilePath("modules/module-a/components/ComponentA.js"),
      code: "import { someHelper } from '../helpers.js'",
      options,
    },
    // helper can be imported from the pubic module API, defined in index.js
    {
      filename: absoluteFilePath("modules/module-b/components/ComponentB.js"),
      code: "import { someHelper } from 'modules/module-a'",
      options,
    },
  ],
  invalid: [
    // Any other file than index.js can't be imported from other module
    {
      filename: absoluteFilePath("modules/module-b/components/ComponentB.js"),
      code: "import { someHelper } from 'modules/module-a/helpers.js'",
      options,
      errors: [
        {
          message:
            'Dependencies to elements of type "modules", captured values: elementName="module-a" and fileInternalPath "helpers.js" are not allowed. Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
    {
      filename: absoluteFilePath("modules/module-b/components/ComponentB.js"),
      code: "import { someHelper } from 'modules/module-a/components/ComponentA.js'",
      options,
      errors: [
        {
          message:
            'Dependencies to elements of type "modules", captured values: elementName="module-a" and fileInternalPath "components/ComponentA.js" are not allowed. Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
  ],
});
