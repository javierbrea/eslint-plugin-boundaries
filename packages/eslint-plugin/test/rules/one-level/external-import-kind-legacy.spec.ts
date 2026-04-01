import rule from "../../../src/Rules/External";
import { EXTERNAL as RULE } from "../../../src/Shared";
import {
  TYPESCRIPT_SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage, externalNoRuleMessage } from "../../support/messages";

const { absoluteFilePath } = pathResolvers("one-level");

let testIndex = 0;

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  testIndex++;
  const ruleTester = createRuleTester(settings);
  ruleTester.run(`${RULE} - ${testIndex}`, rule, {
    valid: [
      // Modules can import react-router-dom
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
      },
      // Modules can import react-router-dom /foo/var path
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { withRouter } from 'react-router-dom/foo/var'",
        options,
      },
      // Modules can import react
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import React from 'react'",
        options,
      },
      // Modules can import value from @material-ui/icons
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import Icon from '@material-ui/icons'",
        options,
      },
      // Helpers can import FooLibrary value from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import FooLibrary from 'foo-library'",
        options,
      },
      // Helpers can import type Link from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import type { Link } from 'foo-library'",
        options,
      },
      // Helpers can import type Router from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import type { Router } from 'foo-library'",
        options,
      },
      // Components can import value from react-router-dom
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
      },
    ],
    invalid: [
      // Helpers can't import value from react
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import React from 'react'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "react",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Components can't import type from react-router-dom
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import type { withRouter } from 'react-router-dom'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: "'components' with elementName 'component-a'",
                dep: "react-router-dom",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import value Link from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { Link } from 'foo-library'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              2,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import Link from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import FooLibrary, { Link } from 'foo-library'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              3,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import value from react nor foo-library Link
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: `
                import React from 'react';
                import FooLibrary, { Link } from 'foo-library';
              `,
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "react",
              })
            ),
            type: "Literal",
          },
          {
            message: errorMessage(
              errorMessages,
              3,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import value from foo-library Link when there are more specifiers
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { type Link, Foo } from 'foo-library'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              4,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import foo-library value Link when specifiers are renamed locally
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { Link as LocalLink, Foo } from 'foo-library'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              5,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers can't import foo-library Link nor Router
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { Link as LocalLink, Router } from 'foo-library'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              6,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can't import type from material-ui
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import type { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              7,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "@material-ui/core",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can't import value from material-ui
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              8,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "@material-ui/core",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can't import value var/foo from react-router-dom
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import Foo from 'react-router-dom/var/foo'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              9,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "react-router-dom",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can't import type var/foo from react-router-dom
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import type Foo from 'react-router-dom/var/foo'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              10,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "react-router-dom",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can`t import type from @material-ui/icons
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import type Icon from '@material-ui/icons/Foo'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              11,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "@material-ui/icons",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Modules can`t import type from @material-ui/icons using specifier
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import type { Icon } from '@material-ui/icons'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              12,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "@material-ui/icons",
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// allow-based options

/* runTest(
  TYPESCRIPT_SETTINGS.oneLevel,
  [
    {
      default: "allow",
      rules: [
        {
          from: "helpers",
          disallow: [
            "react",
            ["foo-library", { specifiers: ["Link", "Router"] }],
          ],
          importKind: "value",
        },
        {
          from: "components",
          disallow: ["react-router-dom"],
          importKind: "type",
        },
        {
          from: "modules",
          disallow: [
            "@material-ui/*",
            ["react-router-dom", { specifiers: ["Link"] }],
            ["react-router-*", { path: ["/var/foo"] }],
          ],
          importKind: "*",
        },
        {
          from: "modules",
          allow: ["@material-ui/icons"],
          importKind: "value",
        },
      ],
    },
  ],
  {
    0: 'Dependencies with kind "value" and module "react" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    1: 'Dependencies with kind "type" and module "react-router-dom" to entities of origin "external" are not allowed in elements of type "components". Denied by rule at index 1',
    2: 'Dependencies with kind "value", module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies with kind "value", module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies with kind "value", module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    5: 'Dependencies with kind "value", module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    6: 'Dependencies with kind "value", module "foo-library" and specifiers "Link", "Router" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    7: 'Dependencies with kind "type" and module "@material-ui/core" to entities of origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
    8: 'Dependencies with kind "value" and module "@material-ui/core" to entities of origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
    9: 'Dependencies with kind "value" and module "react-router-dom" to entities of origin "external" and fileInternalPath "/var/foo" are not allowed in elements of type "modules". Denied by rule at index 2',
    10: 'Dependencies with kind "type" and module "react-router-dom" to entities of origin "external" and fileInternalPath "/var/foo" are not allowed in elements of type "modules". Denied by rule at index 2',
    11: 'Dependencies with kind "type" and module "@material-ui/icons" to entities of origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
    12: 'Dependencies with kind "type" and module "@material-ui/icons" to entities of origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
  }
); */

// disallow-based options

runTest(
  TYPESCRIPT_SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: "helpers",
          allow: ["foo-library"],
          importKind: "*",
        },
        {
          from: "helpers",
          disallow: [["foo-library", { specifiers: ["Link", "Router"] }]],
          importKind: "value",
        },
        {
          from: "components",
          allow: ["react"],
          importKind: "*",
        },
        {
          from: "components",
          allow: ["react-router-dom"],
          importKind: "value",
        },
        {
          from: "modules",
          allow: ["react", "react-router-dom"],
          importKind: "*",
        },
        {
          from: "modules",
          disallow: [
            ["react-router-dom", { specifiers: ["Link"], path: ["*"] }],
          ],
          importKind: "*",
        },
        {
          from: "modules",
          disallow: [["react-router-dom", { path: ["var/foo", "fake"] }]],
          message: "Do not import ${dependency.importKind} from RDD in modules",
          importKind: "*",
        },
        {
          from: "modules",
          allow: ["@material-ui/icons"],
          importKind: "value",
        },
      ],
    },
  ],
  {
    0: 'There is no rule allowing dependencies from elements of type "helpers" and elementName "helper-a" to entities of origin "external" with module "react"',
    1: 'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to entities of origin "external" with module "react-router-dom"',
    2: 'Dependencies with kind "value", module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    3: 'Dependencies with kind "value", module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    4: 'Dependencies with kind "value", module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    5: 'Dependencies with kind "value", module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    6: 'Dependencies with kind "value", module "foo-library" and specifiers "Link", "Router" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    7: 'There is no rule allowing dependencies from elements of type "modules" and elementName "module-a" to entities of origin "external" with module "@material-ui/core"',
    8: 'There is no rule allowing dependencies from elements of type "modules" and elementName "module-a" to entities of origin "external" with module "@material-ui/core"',
    9: "Do not import value from RDD in modules",
    10: "Do not import type from RDD in modules",
    11: 'There is no rule allowing dependencies from elements of type "modules" and elementName "module-a" to entities of origin "external" with module "@material-ui/icons"',
    12: 'There is no rule allowing dependencies from elements of type "modules" and elementName "module-a" to entities of origin "external" with module "@material-ui/icons"',
  }
);
