import rule from "../../../src/Rules/External";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const { EXTERNAL: RULE } = require("../../../src/Shared");

const { absoluteFilePath } = pathResolvers("docs-examples");

const settings = SETTINGS.docsExamples;

const options = [
  {
    // disallow all external imports by default
    default: "disallow",
    rules: [
      {
        // from helper elements
        from: { type: "helpers" },
        // allow importing moment
        allow: ["moment"],
      },
      {
        // from component elements
        from: { type: "components" },
        allow: [
          // allow importing react
          "react",
          // allow importing any @material-ui module
          "@material-ui/*",
        ],
      },
      {
        // from components of family "molecules"
        from: { type: "components", captured: { family: "molecules" } },
        disallow: [
          // disallow importing  @material-ui/icons
          "@material-ui/icons",
        ],
      },
      {
        // from modules
        from: { type: "modules" },
        allow: [
          // allow importing react
          "react",
          // allow importing useHistory, Switch and Route from react-router-dom
          [
            "react-router-dom",
            { specifiers: ["useHistory", "Switch", "Route"] },
          ],
        ],
      },
    ],
  },
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // Helpers can import moment
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import moment from 'moment'",
      options,
    },
    // Components can import react
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import React from 'react'",
      options,
    },
    // Components can import @material-ui/core
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { Button } from '@material-ui/core'",
      options,
    },
    // Modules can import react
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import React from 'react'",
      options,
    },
    // Modules can import `useHistory` from `react-router-dom`
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import { useHistory } from 'react-router-dom'",
      options,
    },
  ],
  invalid: [
    // Helpers can't import react
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import React from 'react'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "helpers", category "data" and elementName "parse" to elements of origin "external" with module "react"',
          type: "Literal",
        },
      ],
    },
    // Helpers can't import specifier from react
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import { useMemo } from 'react'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "helpers", category "data" and elementName "parse" to elements of origin "external" with module "react"',
          type: "Literal",
        },
      ],
    },
    // Components can't import `moment`
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import moment from 'moment'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "components", family "atoms" and elementName "atom-a" to elements of origin "external" with module "moment"',
          type: "Literal",
        },
      ],
    },
    // Components of family "molecules" can't import `@material-ui/icons`
    {
      filename: absoluteFilePath(
        "components/molecules/molecule-a/MoleculeA.js"
      ),
      code: "import { Info } from '@material-ui/icons'",
      options,
      errors: [
        {
          message:
            'Dependencies with module "@material-ui/icons" to elements of origin "external" are not allowed in elements of type "components" and family "molecules". Denied by rule at index 2',
          type: "Literal",
        },
      ],
    },
    // Modules can't import `withRouter` from `react-router-dom`
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import { withRouter } from 'react-router-dom'",
      options,
      errors: [
        {
          message:
            'There is no rule allowing dependencies from elements of type "modules" and elementName "module-a" to elements of origin "external" with module "react-router-dom"',
          type: "Literal",
        },
      ],
    },
  ],
});
