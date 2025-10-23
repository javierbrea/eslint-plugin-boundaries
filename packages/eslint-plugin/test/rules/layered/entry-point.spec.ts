import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const { ENTRY_POINT: RULE } = require("../../../src/constants/rules");

const rule = require(`../../../src/rules/${RULE}`).default;

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
            "The entry point 'helpers.js' is not allowed in elements of type 'modules' with elementName '!(module-a)'. Disallowed in rule 2",
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
            "The entry point 'ComponentA.js' is not allowed in elements of type 'modules' with elementName '!(module-a)'. Disallowed in rule 2",
          type: "Literal",
        },
      ],
    },
  ],
});
