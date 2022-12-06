const { NO_PRIVATE: RULE } = require("../../../src/constants/rules");
const { SETTINGS, createRuleTester, pathResolvers } = require("../../support/helpers");
const { noPrivateMessage } = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const options = [
  {
    allowUncles: true,
  },
];

const test = (settings) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // Non recognized types can import whatever
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import ComponentC from 'components/component-a/components/component-c'",
        options,
      },
      // Ignored files can import whatever
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentD from './components/component-c/components/component-d'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("components/component-a/ComponentA.js")],
        },
      },
      // Ignored dependencies can be imported
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentD from './components/component-c/components/component-d'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [
            codeFilePath("components/component-a/components/component-c/**/*.js"),
          ],
        },
      },
      // Component A is public, as it is not child of any other element, so anyone can use it:
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: 'import ComponentA from "components/component-a"',
        options,
      },
      // Private elements can use a parent elements: // TODO, add relationship rule to avoid this
      {
        filename: absoluteFilePath("components/component-a/components/component-c/ComponentC.js"),
        code: 'import ModuleA from "../../"',
        options,
      },
      // Private elements can use public elements:
      {
        filename: absoluteFilePath("components/component-a/components/component-c/ComponentC.js"),
        code: 'import ModuleA from "modules/module-a"',
        options,
      },
      // Elements can use their direct children elements:
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: 'import ComponentC from "./components/component-c"',
        options,
      },
      /* Private elements can use other private element when both have the same parent.
    Component C can use helper A, as both are children of component A: */
      {
        filename: absoluteFilePath("components/component-a/components/component-c/ComponentC.js"),
        code: 'import HelperA from "components/component-a/helpers/helper-a"',
        options,
      },
      /* Private elements can use other private element if it is a direct child of a common ancestor,
    and the allowUncles option is enabled.
    Component D can use helper A as it is a direct child of common ancestor component A. */
      {
        filename: absoluteFilePath(
          "components/component-a/components/component-c/components/component-d/ComponentD.js"
        ),
        code: 'import HelperA from "components/component-a/helpers/helper-a"',
        options,
      },
      // Private elements can use an ancestor // TODO, add relationships rule to avoid this
      {
        filename: absoluteFilePath(
          "components/component-a/components/component-c/components/component-d/ComponentD.js"
        ),
        code: 'import HelperA from "../../../../"',
        options,
      },
      // External dependencies are allowed
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: 'import React from "react"',
        options,
      },
      // Not recognized dependencies are allowed
      {
        filename: absoluteFilePath("components/component-a/components/component-b/ComponentB.js"),
        code: "import foo from '../../../../foo/foo2'",
        options,
      },
    ],
    invalid: [
      /* Private elements can't be used by anyone except its parent
    (and other descendants of the parent when allowUncles option is enabled) */
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentD from './components/component-c/components/component-d'",
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'components' with elementName 'component-c'",
            }),
            type: "ImportDeclaration",
          },
        ],
      },
      // Component C is private of component A, so module A can't use it
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: 'import ComponentC from "components/component-a/components/component-c"',
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'components' with elementName 'component-a'",
            }),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helper B is private of helper A, so component C can't use it:
      {
        filename: absoluteFilePath("components/component-a/components/component-c/ComponentC.js"),
        code: 'import HelperB from "../../helpers/helper-a/helpers/helper-b"',
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'helpers' with elementName 'helper-a'",
            }),
            type: "ImportDeclaration",
          },
        ],
      },
      // Helper B is private of helper A, so component A can't use it (even when it is its "grandchild")
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: 'import HelperB from "./helpers/helper-a/helpers/helper-b"',
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'helpers' with elementName 'helper-a'",
            }),
            type: "ImportDeclaration",
          },
        ],
      },
      /* Private elements can't use other private element if it is a direct child of a common ancestor,
    but the allowUncles option is disabled. Component D can't use helper A as it is a direct child of
    common ancestor component A, but allowUncles option is disabled. */
      {
        filename: absoluteFilePath(
          "components/component-a/components/component-c/components/component-d/ComponentD.js"
        ),
        code: 'import HelperA from "components/component-a/helpers/helper-a"',
        options: [
          {
            allowUncles: false,
          },
        ],
        errors: [
          {
            message: noPrivateMessage({
              dep: "'components' with elementName 'component-a'",
            }),
            type: "ImportDeclaration",
          },
        ],
      },
      /* Custom message */
      {
        filename: absoluteFilePath(
          "components/component-a/components/component-c/components/component-d/ComponentD.js"
        ),
        code: 'import HelperA from "components/component-a/helpers/helper-a"',
        options: [
          {
            allowUncles: false,
            message:
              "The element of type '${dependency.type}' with name '${dependency.elementName}' is child of element of type '${dependency.parent.type}' with name '${dependency.parent.elementName}'",
          },
        ],
        errors: [
          {
            message:
              "The element of type 'helpers' with name 'helper-a' is child of element of type 'components' with name 'component-a'",
            type: "ImportDeclaration",
          },
        ],
      },
      /* Custom message */
      {
        filename: absoluteFilePath(
          "components/component-a/components/component-c/components/component-d/ComponentD.js"
        ),
        code: 'import HelperA from "components/component-a/helpers/helper-a"',
        options: [
          {
            allowUncles: false,
            message:
              "The element of type '${target.type}' with name '${target.elementName}' is child of element of type '${target.parent.type}' with name '${target.parent.elementName}'",
          },
        ],
        errors: [
          {
            message:
              "The element of type 'helpers' with name 'helper-a' is child of element of type 'components' with name 'component-a'",
            type: "ImportDeclaration",
          },
        ],
      },
      /* Custom message with file info*/
      {
        filename: absoluteFilePath(
          "components/component-a/components/component-c/components/component-d/ComponentD.js"
        ),
        code: 'import HelperA from "components/component-a/helpers/helper-a"',
        options: [
          {
            allowUncles: false,
            message:
              "This element is of type '${file.type}' with name '${file.elementName}', and it is child of element of type '${file.parent.type}' with name '${file.parent.elementName}'",
          },
        ],
        errors: [
          {
            message:
              "This element is of type 'components' with name 'component-d', and it is child of element of type 'components' with name 'component-c'",
            type: "ImportDeclaration",
          },
        ],
      },
      /* Custom message with file info*/
      {
        filename: absoluteFilePath(
          "components/component-a/components/component-c/components/component-d/ComponentD.js"
        ),
        code: 'import HelperA from "components/component-a/helpers/helper-a"',
        options: [
          {
            allowUncles: false,
            message:
              "This element is of type '${from.type}' with name '${from.elementName}', and it is child of element of type '${from.parent.type}' with name '${from.parent.elementName}'",
          },
        ],
        errors: [
          {
            message:
              "This element is of type 'components' with name 'component-d', and it is child of element of type 'components' with name 'component-c'",
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

// deprecated settings
test(SETTINGS.deprecated);

// new settings
test(SETTINGS.oneLevel);
