import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { errorMessage, externalNoRuleMessage } from "../../support/messages";

const rule = ruleFactory();
const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // Non recognized types can import anything
      {
        filename: absoluteFilePath("foo/index.js"),
        code: "import React from 'react'",
        options,
      },
      // No option provided
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import { withRouter } from 'react-router-dom'",
      },
      // Ignored files can import anything
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
        settings: {
          ...settings,
          "boundaries/ignore": [codeFilePath("components/component-a/**/*.js")],
        },
      },
      // Modules can import any non-recognized local file
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { foo } from '../../foo/index'",
        options,
      },
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
      // Helpers can import foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import FooLibrary from 'foo-library'",
        options,
      },
      // Helpers can import foo-library using namespace
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import FooLibrary, * as Namespace from 'foo-library'",
        options,
      },
      // Helpers can import * from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import * as Link from 'foo-library'",
        options,
      },
      // Helpers can import * from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import * as FooLibrary from 'foo-library'",
        options,
      },
      // Helpers can import Foo from foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { Foo } from 'foo-library'",
        options,
      },
      // Modules can import material-ui/icons
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { Icon } from '@material-ui/icons'",
        options,
      },
    ],
    invalid: [
      // Helpers can't import react
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
      // Components can't import react-router-dom
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import { withRouter } from 'react-router-dom'",
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
      // Helpers can't import foo-library Link
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
      // Helpers can't import foo-library Link
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
      // Helpers can't import react nor foo-library Link
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
      // Helpers can't import foo-library Link when there are more specifiers
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import { Link, Foo } from 'foo-library'",
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
      // Helpers can't import foo-library Link when specifiers are renamed locally
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
      // Modules can't import material-ui
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { Label } from '@material-ui/core'",
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
      // Modules can't import var/foo from react-router-dom
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import Foo from 'react-router-dom/var/foo'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              8,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "react-router-dom",
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

const testCapture = (
  settings: RuleTesterSettings,
  options: unknown[],
  errorMessages: Record<number, string>
) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // Module A can import react-router-dom
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
      },
      // Helpers A can import foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import FooLibrary from 'foo-library'",
        options,
      },
      // Helper B can import foo-library using namespace
      {
        filename: absoluteFilePath("helpers/helper-a/HelperB.js"),
        code: "import FooLibrary, * as Namespace from 'foo-library'",
        options,
      },
    ],
    invalid: [
      // Module B can't import react-router-dom
      {
        filename: absoluteFilePath("modules/module-b/ModuleB.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'modules'",
                dep: "react-router-dom",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helpers B can't import foo-library
      {
        filename: absoluteFilePath("helpers/helper-b/HelperB.js"),
        code: "import FooLibrary from 'foo-library'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-b'",
                dep: "foo-library",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // Helper A can't import foo-library using namespace
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import FooLibrary, { Link } from 'foo-library'",
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
    ],
  });
};

// deprecated settings
runTest(
  SETTINGS.deprecated,
  [
    {
      checkAllOrigins: true,
      default: "allow",
      rules: [
        {
          from: { type: "helpers" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "react" },
          },
        },
        {
          from: { type: "helpers" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "foo-library",
              specifiers: ["Link", "Router"],
            },
          },
        },
        {
          from: { type: "components" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "react-router-dom" },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "@material-ui/core" },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "react-router-dom",
              specifiers: ["Link"],
            },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external", internalPath: "/var/*" },
            dependency: { module: "react-router-dom" },
          },
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module "react" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    1: 'Dependencies with module "react-router-dom" to entities of origin "external" are not allowed in elements of type "components". Denied by rule at index 2',
    2: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    3: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    4: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    5: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    6: 'Dependencies with module "foo-library" and specifiers "Link", "Router" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    7: 'Dependencies with module "@material-ui/core" to entities of origin "external" are not allowed in elements of type "modules". Denied by rule at index 3',
    8: 'Dependencies with module "react-router-dom" to entities of origin "external" and fileInternalPath "/var/foo" are not allowed in elements of type "modules". Denied by rule at index 5',
  }
);

// allow-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      checkAllOrigins: true,
      default: "allow",
      rules: [
        {
          from: { type: "helpers" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "react" },
          },
        },
        {
          from: { type: "helpers" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "foo-library",
              specifiers: ["Link", "Router"],
            },
          },
        },
        {
          from: { type: "components" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "react-router-dom" },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "@material-ui/*" },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "react-router-dom",
              specifiers: ["Link"],
            },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external", internalPath: "/var/foo" },
            dependency: { module: "react-router-*" },
          },
        },
        {
          from: { type: "modules" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "@material-ui/icons" },
          },
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module "react" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    1: 'Dependencies with module "react-router-dom" to entities of origin "external" are not allowed in elements of type "components". Denied by rule at index 2',
    2: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    3: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    4: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    5: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    6: 'Dependencies with module "foo-library" and specifiers "Link", "Router" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    7: 'Dependencies with module "@material-ui/core" to entities of origin "external" are not allowed in elements of type "modules". Denied by rule at index 3',
    8: 'Dependencies with module "react-router-dom" to entities of origin "external" and fileInternalPath "/var/foo" are not allowed in elements of type "modules". Denied by rule at index 5',
  }
);

// micromatch-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      checkAllOrigins: true,
      default: "allow",
      rules: [
        {
          from: { type: "h*" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "react" },
          },
        },
        {
          from: { type: "h*" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "foo-*",
              specifiers: ["L*", "R*"],
            },
          },
        },
        {
          from: { type: "c*" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "react-router-*" },
          },
        },
        {
          from: { type: "m*" },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "@material-ui/*" },
          },
        },
        {
          from: { type: "m*" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "react-router-*",
              specifiers: ["L*"],
            },
          },
        },
        {
          from: { type: "m*" },
          disallow: {
            to: { origin: "external", internalPath: "/var/f*" },
            dependency: { module: "react-*" },
          },
        },
        {
          from: { type: "m*" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "@material-ui/i*" },
          },
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module "react" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    1: 'Dependencies with module "react-router-dom" to entities of origin "external" are not allowed in elements of type "components". Denied by rule at index 2',
    2: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    3: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    4: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    5: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    6: 'Dependencies with module "foo-library" and specifiers "Link", "Router" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    7: 'Dependencies with module "@material-ui/core" to entities of origin "external" are not allowed in elements of type "modules". Denied by rule at index 3',
    8: 'Dependencies with module "react-router-dom" to entities of origin "external" and fileInternalPath "/var/foo" are not allowed in elements of type "modules". Denied by rule at index 5',
  }
);

// disallow-based options

runTest(
  SETTINGS.oneLevel,
  [
    {
      checkAllOrigins: true,
      default: "disallow",
      rules: [
        {
          from: { type: "helpers" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "foo-library" },
          },
        },
        {
          from: { type: "helpers" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "foo-library",
              specifiers: ["Link", "Router"],
            },
          },
        },
        {
          from: { type: "components" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "react" },
          },
        },
        {
          from: { type: "modules" },
          allow: {
            to: { origin: "external" },
            dependency: { module: ["react", "react-router-dom"] },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external", internalPath: "*" },
            dependency: {
              module: "react-router-dom",
              specifiers: ["Link"],
            },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external", internalPath: ["/var/foo", "fake"] },
            dependency: { module: "react-router-dom" },
          },
          message: "Do not import {{ report.path }} from RDD in modules",
        },
        {
          from: { type: "modules" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "@material-ui/icons" },
          },
        },
      ],
    },
  ],
  {
    0: 'There is no rule allowing dependencies from elements of type "helpers" and elementName "helper-a" to entities of origin "external" with module "react"',
    1: 'There is no rule allowing dependencies from elements of type "components" and elementName "component-a" to entities of origin "external" with module "react-router-dom"',
    2: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    3: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    4: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    5: 'Dependencies with module "foo-library" and specifiers "Link", "Foo" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    6: 'Dependencies with module "foo-library" and specifiers "Link", "Router" to entities of origin "external" are not allowed in elements of type "helpers". Denied by rule at index 1',
    7: 'There is no rule allowing dependencies from elements of type "modules" and elementName "module-a" to entities of origin "external" with module "@material-ui/core"',
    8: "Do not import  from RDD in modules",
  }
);

// custom error messages

runTest(
  SETTINGS.oneLevel,
  [
    {
      checkAllOrigins: true,
      default: "disallow",
      message:
        "Importing {{ dependency.source }} is not allowed in {{ from.type }} with name {{ from.captured.elementName }}",
      rules: [
        {
          from: { type: "helpers" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "foo-library" },
          },
        },
        {
          from: { type: "helpers" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "foo-library",
              specifiers: ["Link", "Router"],
            },
          },
          message:
            "Do not import {{ report.specifiers }} from {{ dependency.source }} in helpers",
        },
        {
          from: { type: "components" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "react" },
          },
        },
        {
          from: { type: "modules" },
          allow: {
            to: { origin: "external" },
            dependency: { module: ["react", "react-router-dom"] },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "react-router-dom",
              specifiers: ["Link"],
            },
          },
        },
        {
          from: { type: "modules" },
          disallow: {
            to: { origin: "external", internalPath: "/var/foo" },
            dependency: { module: "react-router-dom" },
          },
        },
        {
          from: { type: "modules" },
          allow: {
            to: { origin: "external" },
            dependency: { module: "@material-ui/icons" },
          },
        },
      ],
    },
  ],
  {
    0: "Importing react is not allowed in helpers with name helper-a",
    1: "Importing react-router-dom is not allowed in components with name component-a",
    2: "Do not import  from foo-library in helpers",
    3: "Do not import  from foo-library in helpers",
    4: "Do not import  from foo-library in helpers",
    5: "Do not import  from foo-library in helpers",
    6: "Do not import  from foo-library in helpers",
    7: "Importing @material-ui/core is not allowed in modules with name module-a",
    8: "Importing react-router-dom/var/foo is not allowed in modules with name module-a",
  }
);

// options with capture allow-based

testCapture(
  SETTINGS.oneLevel,
  [
    {
      checkAllOrigins: true,
      default: "allow",
      rules: [
        {
          from: { type: "modules", captured: { elementName: "module-b" } },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "react-router-dom" },
          },
        },
        {
          from: { type: "helpers", captured: { elementName: "helper-b" } },
          disallow: {
            to: { origin: "external" },
            dependency: { module: "foo-library" },
          },
        },
        {
          from: { type: "helpers", captured: { elementName: "helper-a" } },
          disallow: {
            to: { origin: "external" },
            dependency: {
              module: "foo-library",
              specifiers: ["Link"],
            },
          },
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module "react-router-dom" to entities of origin "external" are not allowed in elements of type "modules" and elementName "module-b". Denied by rule at index 0',
    1: 'Dependencies with module "foo-library" to entities of origin "external" are not allowed in elements of type "helpers" and elementName "helper-b". Denied by rule at index 1',
    2: 'Dependencies with module "foo-library" and specifiers "Link" to entities of origin "external" are not allowed in elements of type "helpers" and elementName "helper-a". Denied by rule at index 2',
  }
);
