const { NO_PRIVATE: RULE } = require("../../../src/constants/rules");

const {
  createRuleTester,
  absoluteFilePath,
  relativeFilePath,
  settingsFilePath,
  settings,
} = require("../helpers");

const rule = require(`../../../src/rules/${RULE}`);
const ruleTester = createRuleTester();

const errorMessage = (parent) => `Dependency is private of '${relativeFilePath(parent)}'`;

const options = [
  {
    allowUncles: true,
  },
];

ruleTester.run(RULE, rule, {
  valid: [
    // Non recognized types can import whatever
    {
      filename: absoluteFilePath("src/foo/index.js"),
      code: "import ComponentC from 'components/component-a/components/component-c'",
      options,
    },
    // Ignored files can import whatever
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentD from './components/component-c/components/component-d'",
      options,
      settings: {
        ...settings,
        "boundaries/ignore": [settingsFilePath("src/components/component-a/ComponentA.js")],
      },
    },
    // Ignored dependencies can be imported
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentD from './components/component-c/components/component-d'",
      options,
      settings: {
        ...settings,
        "boundaries/ignore": [
          settingsFilePath("src/components/component-a/components/component-c/**/*.js"),
        ],
      },
    },
    // Component A is public, as it is not child of any other element, so anyone can use it:
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: 'import ComponentA from "components/component-a"',
      options,
    },
    // Private elements can use public elements:
    {
      filename: absoluteFilePath(
        "src/components/component-a/components/component-c/ComponentC.js"
      ),
      code: 'import ModuleA from "modules/module-a"',
      options,
    },
    // Elements can use their direct children elements:
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: 'import ComponentC from "./components/component-c"',
      options,
    },
    /* Private elements can use other private element when both have the same parent.
    Component C can use helper A, as both are children of component A: */
    {
      filename: absoluteFilePath(
        "src/components/component-a/components/component-c/ComponentC.js"
      ),
      code: 'import HelperA from "components/component-a/helpers/helper-a"',
      options,
    },
    /* Private elements can use other private element if it is a direct child of a common ancestor,
    and the allowUncles option is enabled.
    Component D can use helper A as it is a direct child of common ancestor component A. */
    {
      filename: absoluteFilePath(
        "src/components/component-a/components/component-c/components/component-d/ComponentD.js"
      ),
      code: 'import HelperA from "components/component-a/helpers/helper-a"',
      options,
    },
    // External dependencies are allowed
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: 'import React from "react"',
      options,
    },
    // Not recognized dependencies are allowed
    {
      filename: absoluteFilePath(
        "src/components/component-a/components/component-b/ComponentB.js"
      ),
      code: "import foo from '../../../../foo/foo2'",
      options,
    },
  ],
  invalid: [
    /* Private elements can't be used by anyone except its parent
    (and other descendants of the parent when allowUncles option is enabled) */
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: "import ComponentD from './components/component-c/components/component-d'",
      options,
      errors: [
        {
          message: errorMessage("src/components/component-a/components/component-c"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Component C is private of component A, so module A can't use it
    {
      filename: absoluteFilePath("src/modules/module-a/ModuleA.js"),
      code: 'import ComponentC from "components/component-a/components/component-c"',
      options,
      errors: [
        {
          message: errorMessage("src/components/component-a"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helper B is private of helper A, so component C can't use it:
    {
      filename: absoluteFilePath(
        "src/components/component-a/components/component-c/ComponentC.js"
      ),
      code: 'import HelperB from "../../helpers/helper-a/helpers/helper-b"',
      options,
      errors: [
        {
          message: errorMessage("src/components/component-a/helpers/helper-a"),
          type: "ImportDeclaration",
        },
      ],
    },
    // Helper B is private of helper A, so component A can't use it (even when it is its "grandchild")
    {
      filename: absoluteFilePath("src/components/component-a/ComponentA.js"),
      code: 'import HelperB from "./helpers/helper-a/helpers/helper-b"',
      options,
      errors: [
        {
          message: errorMessage("src/components/component-a/helpers/helper-a"),
          type: "ImportDeclaration",
        },
      ],
    },
    /* Private elements can't use other private element if it is a direct child of a common ancestor,
    but the allowUncles option is disabled. Component D can't use helper A as it is a direct child of
    common ancestor component A, but allowUncles option is disabled. */
    {
      filename: absoluteFilePath(
        "src/components/component-a/components/component-c/components/component-d/ComponentD.js"
      ),
      code: 'import HelperA from "components/component-a/helpers/helper-a"',
      options: [
        {
          allowUncles: false,
        },
      ],
      errors: [
        {
          message: errorMessage("src/components/component-a"),
          type: "ImportDeclaration",
        },
      ],
    },
  ],
});
