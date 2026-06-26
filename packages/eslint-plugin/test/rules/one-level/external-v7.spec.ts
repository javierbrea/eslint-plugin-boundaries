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
          from: { element: { type: "helpers" } },
          disallow: [
            { to: { module: { origin: "external", source: "react" } } },
            {
              to: { module: { origin: "external", source: "foo-library" } },
              dependency: { specifiers: ["Link", "Router"] },
            },
          ],
        },
        {
          from: { element: { type: "components" } },
          disallow: [
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
        },
        {
          from: { element: { type: "modules" } },
          disallow: [
            {
              to: {
                module: { origin: "external", source: "@material-ui/core" },
              },
            },
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
              dependency: { specifiers: ["Link"] },
            },
            {
              to: {
                module: {
                  origin: "external",
                  source: "react-router-dom",
                  internalPath: "var/*",
                },
              },
            },
          ],
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module source "react" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    1: 'Dependencies with module source "react-router-dom" to entities of module with origin "external" are not allowed in elements of type "components". Denied by rule at index 1',
    2: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    5: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    6: 'Dependencies with module source "foo-library" and specifiers "Link", "Router" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    7: 'Dependencies with module source "@material-ui/core" to entities of module with origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
    8: 'Dependencies with module source "react-router-dom" and module internalPath "var/foo" to entities of module with origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
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
          from: { element: { type: "helpers" } },
          disallow: [
            { to: { module: { origin: "external", source: "react" } } },
            {
              to: { module: { origin: "external", source: "foo-library" } },
              dependency: { specifiers: ["Link", "Router"] },
            },
          ],
        },
        {
          from: { element: { type: "components" } },
          disallow: [
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
        },
        {
          from: { element: { type: "modules" } },
          disallow: [
            {
              to: { module: { origin: "external", source: "@material-ui/*" } },
            },
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
              dependency: { specifiers: ["Link"] },
            },
            {
              to: {
                module: {
                  origin: "external",
                  source: "react-router-*",
                  internalPath: "var/foo",
                },
              },
            },
          ],
        },
        {
          from: { element: { type: "modules" } },
          allow: [
            {
              to: {
                module: { origin: "external", source: "@material-ui/icons" },
              },
            },
          ],
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module source "react" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    1: 'Dependencies with module source "react-router-dom" to entities of module with origin "external" are not allowed in elements of type "components". Denied by rule at index 1',
    2: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    5: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    6: 'Dependencies with module source "foo-library" and specifiers "Link", "Router" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    7: 'Dependencies with module source "@material-ui/core" to entities of module with origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
    8: 'Dependencies with module source "react-router-dom" and module internalPath "var/foo" to entities of module with origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
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
          from: { element: { type: "h*" } },
          disallow: [
            { to: { module: { origin: "external", source: "react" } } },
            {
              to: { module: { origin: "external", source: "foo-*" } },
              dependency: { specifiers: ["L*", "R*"] },
            },
          ],
        },
        {
          from: { element: { type: "c*" } },
          disallow: [
            {
              to: { module: { origin: "external", source: "react-router-*" } },
            },
          ],
        },
        {
          from: { element: { type: "m*" } },
          disallow: [
            {
              to: { module: { origin: "external", source: "@material-ui/*" } },
            },
            {
              to: { module: { origin: "external", source: "react-router-*" } },
              dependency: { specifiers: ["L*"] },
            },
            {
              to: {
                module: {
                  origin: "external",
                  source: "react-*",
                  internalPath: "var/f*",
                },
              },
            },
          ],
        },
        {
          from: { element: { type: "m*" } },
          allow: [
            {
              to: { module: { origin: "external", source: "@material-ui/i*" } },
            },
          ],
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module source "react" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    1: 'Dependencies with module source "react-router-dom" to entities of module with origin "external" are not allowed in elements of type "components". Denied by rule at index 1',
    2: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    5: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    6: 'Dependencies with module source "foo-library" and specifiers "Link", "Router" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    7: 'Dependencies with module source "@material-ui/core" to entities of module with origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
    8: 'Dependencies with module source "react-router-dom" and module internalPath "var/foo" to entities of module with origin "external" are not allowed in elements of type "modules". Denied by rule at index 2',
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
          from: { element: { type: "helpers" } },
          allow: [
            { to: { module: { origin: "external", source: "foo-library" } } },
          ],
          disallow: [
            {
              to: { module: { origin: "external", source: "foo-library" } },
              dependency: { specifiers: ["Link", "Router"] },
            },
          ],
        },
        {
          from: { element: { type: "components" } },
          allow: [{ to: { module: { origin: "external", source: "react" } } }],
        },
        {
          from: { element: { type: "modules" } },
          allow: [
            { to: { module: { origin: "external", source: "react" } } },
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
          disallow: [
            {
              to: {
                module: {
                  origin: "external",
                  source: "react-router-dom",
                  internalPath: "*",
                },
              },
              dependency: { specifiers: ["Link"] },
            },
          ],
        },
        {
          from: { element: { type: "modules" } },
          allow: [
            { to: { module: { origin: "external", source: "react" } } },
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
          disallow: [
            {
              to: {
                module: {
                  origin: "external",
                  source: "react-router-dom",
                  internalPath: ["var/foo", "fake"],
                },
              },
            },
          ],
          message: "Do not import ${report.path} from RDD in modules",
        },
        {
          from: { element: { type: "modules" } },
          allow: [
            {
              to: {
                module: { origin: "external", source: "@material-ui/icons" },
              },
            },
          ],
        },
      ],
    },
  ],
  {
    0: 'There is no rule allowing dependencies from elements of type "helpers" and captured values: elementName="helper-a" to entities of module with origin "external" and module source "react"',
    1: 'There is no rule allowing dependencies from elements of type "components" and captured values: elementName="component-a" to entities of module with origin "external" and module source "react-router-dom"',
    2: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    3: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    4: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    5: 'Dependencies with module source "foo-library" and specifiers "Link", "Foo" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    6: 'Dependencies with module source "foo-library" and specifiers "Link", "Router" to entities of module with origin "external" are not allowed in elements of type "helpers". Denied by rule at index 0',
    7: 'There is no rule allowing dependencies from elements of type "modules" and captured values: elementName="module-a" to entities of module with origin "external" and module source "@material-ui/core"',
    8: "Do not import var/foo from RDD in modules",
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
          from: { element: { type: "helpers" } },
          allow: [
            { to: { module: { origin: "external", source: "foo-library" } } },
          ],
          disallow: [
            {
              to: { module: { origin: "external", source: "foo-library" } },
              dependency: { specifiers: ["Link", "Router"] },
            },
          ],
          message:
            "Do not import {{ report.specifiers }} from {{ dependency.source }} in helpers",
        },
        {
          from: { element: { type: "components" } },
          allow: [{ to: { module: { origin: "external", source: "react" } } }],
        },
        {
          from: { element: { type: "modules" } },
          allow: [
            { to: { module: { origin: "external", source: "react" } } },
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
          disallow: [
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
              dependency: { specifiers: ["Link"] },
            },
            {
              to: {
                module: {
                  origin: "external",
                  source: "react-router-dom",
                  internalPath: "var/foo",
                },
              },
            },
          ],
        },
        {
          from: { element: { type: "modules" } },
          allow: [
            {
              to: {
                module: { origin: "external", source: "@material-ui/icons" },
              },
            },
          ],
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
          from: {
            element: { type: "modules", captured: { elementName: "module-b" } },
          },
          disallow: [
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
        },
        {
          from: {
            element: { type: "helpers", captured: { elementName: "helper-b" } },
          },
          disallow: [
            { to: { module: { origin: "external", source: "foo-library" } } },
          ],
        },
        {
          from: {
            element: { type: "helpers", captured: { elementName: "helper-a" } },
          },
          disallow: [
            {
              to: { module: { origin: "external", source: "foo-library" } },
              dependency: { specifiers: ["Link"] },
            },
          ],
        },
      ],
    },
  ],
  {
    0: 'Dependencies with module source "react-router-dom" to entities of module with origin "external" are not allowed in elements of type "modules" and captured values: elementName="module-b". Denied by rule at index 0',
    1: 'Dependencies with module source "foo-library" to entities of module with origin "external" are not allowed in elements of type "helpers" and captured values: elementName="helper-b". Denied by rule at index 1',
    2: 'Dependencies with module source "foo-library" and specifiers "Link" to entities of module with origin "external" are not allowed in elements of type "helpers" and captured values: elementName="helper-a". Denied by rule at index 2',
  }
);

const noRulesTester = createRuleTester(SETTINGS.oneLevel);
noRulesTester.run(RULE, rule, {
  valid: [
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import React from 'react'",
      options: [
        {
          checkAllOrigins: true,
          default: "allow",
        },
      ],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import React from 'react'",
      options: [
        {
          checkAllOrigins: true,
          default: "disallow",
          message: "No external dependencies allowed",
        },
      ],
      errors: [
        {
          message: "No external dependencies allowed",
          type: "Literal",
        },
      ],
    },
  ],
});
