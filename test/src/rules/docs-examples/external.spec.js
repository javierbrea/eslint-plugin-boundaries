const { EXTERNAL: RULE } = require("../../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../helpers");

const rule = require(`../../../../src/rules/${RULE}`);

const { absoluteFilePath } = pathResolvers("docs-examples");

const errorMessage = (elementType, dependencyName) =>
  `Usage of external module '${dependencyName}' is not allowed in '${elementType}'`;

const settings = SETTINGS.docsExamples;

const options = [
  {
    // disallow all external imports by default
    default: "disallow",
    rules: [
      {
        // from helper elements
        from: ["helpers"],
        // allow importing moment
        allow: ["moment"],
      },
      {
        // from component elements
        from: ["components"],
        allow: [
          // allow importing react
          "react",
          // allow importing any @material-ui module
          "@material-ui/*",
        ],
      },
      {
        // from components of family "molecules"
        from: [["components", { family: "molecules" }]],
        disallow: [
          // disallow importing  @material-ui/icons
          "@material-ui/icons",
        ],
      },
      {
        // from modules
        from: ["modules"],
        allow: [
          // allow importing react
          "react",
          // allow importing useHistory, Switch and Route from react-router-dom
          ["react-router-dom", { specifiers: ["useHistory", "Switch", "Route"] }],
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
          message: errorMessage("helpers", "react"),
          type: "ImportDeclaration",
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
          message: errorMessage("components", "moment"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Components of family "molecules" can't import `@material-ui/icons`
    {
      filename: absoluteFilePath("components/molecules/molecule-a/MoleculeA.js"),
      code: "import { Info } from '@material-ui/icons'",
      options,
      errors: [
        {
          message: errorMessage("components", "@material-ui/icons"),
          type: "ImportDeclaration",
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
          message: errorMessage("modules", "react-router-dom"),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
