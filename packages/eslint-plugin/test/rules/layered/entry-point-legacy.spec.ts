import rule from "../../../src/Rules/EntryPoint";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const { ENTRY_POINT: RULE } = require("../../../src/Shared");

const { absoluteFilePath } = pathResolvers("layered");

const settings = SETTINGS.layered;

// https://github.com/javierbrea/eslint-plugin-boundaries/issues/340
const options = [
  {
    // disallow all entry-points by default
    default: "disallow",
    rules: [
      {
        target: ["modules"],
        allow: "**",
      },
      {
        target: [
          // Any element, except the same as target
          ["modules", { elementName: "!(${from.elementName})" }],
        ],
        // Any file, except index.js
        disallow: "!(index.js)",
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
            'Dependencies to elements of type "modules", elementName "module-a" and internalPath "helpers.js" are not allowed. Denied by rule at index 1',
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
            'Dependencies to elements of type "modules", elementName "module-a" and internalPath "ComponentA.js" are not allowed. Denied by rule at index 1',
          type: "Literal",
        },
      ],
    },
  ],
});
