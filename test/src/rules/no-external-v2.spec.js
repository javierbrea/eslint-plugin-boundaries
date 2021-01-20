const { NO_EXTERNAL_V2: RULE } = require("../../../src/constants/rules");

const { createRuleTester, absoluteFilePath, codeFilePath, settings } = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const errorMessage = (elementType, dependencyName) =>
  `Usage of external module '${dependencyName}' is not allowed in '${elementType}'`;

const destructuredErrorMessage = (elementType, imported, dependencyName) =>
  `Usage of '${imported}' from external module '${dependencyName}' is not allowed in '${elementType}'`;

const options = [
  {
    disallow: [
      {
        from: "helpers",
        target: ["react", ["foo-library", { specifiers: ["Link", "Router"] }]],
      },
      {
        from: "components",
        target: ["react-router-dom"],
      },
      {
        from: "modules",
        target: ["material-ui", ["react-router-dom", { specifiers: ["Link"] }]],
      },
    ],
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
        "boundaries/ignore": [codeFilePath("src/components/component-a/**/*.js")],
      },
    },
    // Modules can import any non-recognized local file
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import { foo } from '../../foo/index'",
      options,
    },
    // Modules can import react-router-dom
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import { withRouter } from 'react-router-dom'",
      options,
    },
    // Modules can import react
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import React from 'react'",
      options,
    },
    // Helpers can import foo-library
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import FooLibrary from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can import foo-library using namespace
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import FooLibrary, * as Namespace from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can import * from foo-library
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import * as Link from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can import * from foo-library
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import * as FooLibrary from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can import Foo from foo-library
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import { Foo } from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
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
    // Helpers can't import foo-library Link
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import { Link } from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can't import foo-library Link
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import FooLibrary, { Link } from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can't import foo-library Link when there are more specifiers
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import { Link, Foo } from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can't import foo-library Link when specifers are renamed locally
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import { Link as LocalLink, Foo } from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helpers can't import foo-library Link nor Router
    {
      filename: absoluteFilePath("src/helpers/helper-a/HelperA.js"),
      code: "import { Link as LocalLink, Router } from 'foo-library'",
      options,
      errors: [
        {
          message: destructuredErrorMessage("helpers", "Link, Router", "foo-library"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Modules can't import material-ui
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: "import { Label } from 'material-ui/core'",
      options,
      errors: [
        {
          message: errorMessage("modules", "material-ui"),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
