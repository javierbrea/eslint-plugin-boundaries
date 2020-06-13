const { NO_EXTERNAL: RULE } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, relativeFilePath, settings } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const errorMessage = (elementType, dependencyName) =>
  `Usage of external module '${dependencyName}' is not allowed in '${elementType}'`;

const options = [
  {
    forbid: {
      helpers: ["react"],
      components: ["react-router-dom"],
      modules: [],
    },
  },
];

ruleTester.run(RULE, rule, {
  valid: [
    // Non recognized types can import whatever
    {
      filename: absoluteFilePath("src/foo/index.js"),
      code: "import React from 'react'",
      options,
    },
    // No option provided
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import { withRouter } from 'react-router-dom'",
    },
    // Ignored files can import whatever
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import { withRouter } from 'react-router-dom'",
      options,
      settings: {
        ...settings,
        "boundaries/ignore": [relativeFilePath("src/components/component-a/**/*.js")],
      },
    },
    // Modules can import react-router-dom
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import { withRouter } from 'react-router-dom'",
      options,
    },
  ],
  invalid: [
    // Helpers can't import react
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import React from 'react'",
      options,
      errors: [
        {
          message: errorMessage("helpers", "react"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Components can't import react-router-dom
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import { withRouter } from 'react-router-dom'",
      options,
      errors: [
        {
          message: errorMessage("components", "react-router-dom"),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
