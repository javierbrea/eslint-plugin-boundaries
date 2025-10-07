const { EXTERNAL: RULE } = require("../../../dist/constants/rules");
const {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} = require("../../support/helpers");
const {
  customErrorMessage,
  externalNoRuleMessage,
} = require("../../support/messages");

const rule = require(`../../../dist/rules/${RULE}`).default;

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");

const test = (settings, options, errorMessages) => {
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
            message: customErrorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "react",
              }),
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
            message: customErrorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: "'components' with elementName 'component-a'",
                dep: "react-router-dom",
              }),
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
            message: customErrorMessage(
              errorMessages,
              2,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              }),
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
            message: customErrorMessage(
              errorMessages,
              3,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              }),
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
            message: customErrorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "react",
              }),
            ),
            type: "Literal",
          },
          {
            message: customErrorMessage(
              errorMessages,
              3,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              }),
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
            message: customErrorMessage(
              errorMessages,
              4,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              }),
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
            message: customErrorMessage(
              errorMessages,
              5,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              }),
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
            message: customErrorMessage(
              errorMessages,
              6,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
              }),
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
            message: customErrorMessage(
              errorMessages,
              7,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "@material-ui/core",
              }),
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
            message: customErrorMessage(
              errorMessages,
              8,
              externalNoRuleMessage({
                file: "'modules' with elementName 'module-a'",
                dep: "react-router-dom",
              }),
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

const testCapture = (settings, options, errorMessages) => {
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
            message: customErrorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: "'modules'",
                dep: "react-router-dom",
              }),
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
            message: customErrorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-b'",
                dep: "foo-library",
              }),
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
            message: customErrorMessage(
              errorMessages,
              2,
              externalNoRuleMessage({
                file: "'helpers' with elementName 'helper-a'",
                dep: "foo-library",
                specifiers: ["Link"],
              }),
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// deprecated settings
test(
  SETTINGS.deprecated,
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
        },
        {
          from: "components",
          disallow: ["react-router-dom"],
        },
        {
          from: "modules",
          disallow: [
            "@material-ui/core",
            ["react-router-dom", { specifiers: ["Link"] }],
            ["react-router-dom", { path: ["/var/*"] }],
          ],
        },
      ],
    },
  ],
  {
    0: "Usage of external module 'react' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    1: "Usage of external module 'react-router-dom' is not allowed in elements of type 'components'. Disallowed in rule 2",
    2: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    3: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    4: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    5: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    6: "Usage of 'Link, Router' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    7: "Usage of external module '@material-ui/core' is not allowed in elements of type 'modules'. Disallowed in rule 3",
    8: "Usage of '/var/foo' from external module 'react-router-dom' is not allowed in elements of type 'modules'. Disallowed in rule 3",
  },
);

// allow-based options

test(
  SETTINGS.oneLevel,
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
        },
        {
          from: "components",
          disallow: ["react-router-dom"],
        },
        {
          from: "modules",
          disallow: [
            "@material-ui/*",
            ["react-router-dom", { specifiers: ["Link"] }],
            ["react-router-*", { path: ["/var/foo"] }],
          ],
        },
        {
          from: "modules",
          allow: ["@material-ui/icons"],
        },
      ],
    },
  ],
  {
    0: "Usage of external module 'react' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    1: "Usage of external module 'react-router-dom' is not allowed in elements of type 'components'. Disallowed in rule 2",
    2: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    3: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    4: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    5: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    6: "Usage of 'Link, Router' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    7: "Usage of external module '@material-ui/core' is not allowed in elements of type 'modules'. Disallowed in rule 3",
    8: "Usage of '/var/foo' from external module 'react-router-dom' is not allowed in elements of type 'modules'. Disallowed in rule 3",
  },
);

// micromatch-based options

test(
  SETTINGS.oneLevel,
  [
    {
      default: "allow",
      rules: [
        {
          from: "h*",
          disallow: ["react", ["foo-*", { specifiers: ["L*", "R*"] }]],
        },
        {
          from: "c*",
          disallow: ["react-router-*"],
        },
        {
          from: "m*",
          disallow: [
            "@material-ui/*",
            ["react-router-*", { specifiers: ["L*"] }],
            ["react-*", { path: ["/var/f*"] }],
          ],
        },
        {
          from: "m*",
          allow: ["@material-ui/i*"],
        },
      ],
    },
  ],
  {
    0: "Usage of external module 'react' is not allowed in elements of type 'h*'. Disallowed in rule 1",
    1: "Usage of external module 'react-router-dom' is not allowed in elements of type 'c*'. Disallowed in rule 2",
    2: "Usage of 'L*' from external module 'foo-library' is not allowed in elements of type 'h*'. Disallowed in rule 1",
    3: "Usage of 'L*' from external module 'foo-library' is not allowed in elements of type 'h*'. Disallowed in rule 1",
    4: "Usage of 'L*' from external module 'foo-library' is not allowed in elements of type 'h*'. Disallowed in rule 1",
    5: "Usage of 'L*' from external module 'foo-library' is not allowed in elements of type 'h*'. Disallowed in rule 1",
    6: "Usage of 'L*, R*' from external module 'foo-library' is not allowed in elements of type 'h*'. Disallowed in rule 1",
    7: "Usage of external module '@material-ui/core' is not allowed in elements of type 'm*'. Disallowed in rule 3",
    8: "Usage of '/var/foo' from external module 'react-router-dom' is not allowed in elements of type 'm*'. Disallowed in rule 3",
  },
);

// disallow-based options

test(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      rules: [
        {
          from: "helpers",
          allow: ["foo-library"],
          disallow: [["foo-library", { specifiers: ["Link", "Router"] }]],
        },
        {
          from: "components",
          allow: ["react"],
        },
        {
          from: "modules",
          allow: ["react", "react-router-dom"],
          disallow: [
            ["react-router-dom", { specifiers: ["Link"], path: ["*"] }],
          ],
        },
        {
          from: "modules",
          allow: ["react", "react-router-dom"],
          disallow: [["react-router-dom", { path: ["/var/foo", "fake"] }]],
          message: "Do not import ${report.path} from RDD in modules",
        },
        {
          from: "modules",
          allow: ["@material-ui/icons"],
        },
      ],
    },
  ],
  {
    2: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    3: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    4: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    5: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    6: "Usage of 'Link, Router' from external module 'foo-library' is not allowed in elements of type 'helpers'. Disallowed in rule 1",
    8: "Do not import /var/foo from RDD in modules",
  },
);

// custom error messages

test(
  SETTINGS.oneLevel,
  [
    {
      default: "disallow",
      message:
        "Importing ${dependency.source} is not allowed in ${file.type} with name ${file.elementName}",
      rules: [
        {
          from: "helpers",
          allow: ["foo-library"],
          disallow: [["foo-library", { specifiers: ["Link", "Router"] }]],
          message:
            "Do not import ${report.specifiers} from ${dependency.source} in helpers",
        },
        {
          from: "components",
          allow: ["react"],
        },
        {
          from: "modules",
          allow: ["react", "react-router-dom"],
          disallow: [
            ["react-router-dom", { specifiers: ["Link"] }],
            ["react-router-dom", { path: "/var/foo" }],
          ],
        },
        {
          from: "modules",
          allow: ["@material-ui/icons"],
        },
      ],
    },
  ],
  {
    0: "Importing react is not allowed in helpers with name helper-a",
    1: "Importing react-router-dom is not allowed in components with name component-a",
    2: "Do not import Link from foo-library in helpers",
    3: "Do not import Link from foo-library in helpers",
    4: "Do not import Link from foo-library in helpers",
    5: "Do not import Link from foo-library in helpers",
    6: "Do not import Link, Router from foo-library in helpers",
    7: "Importing @material-ui/core is not allowed in modules with name module-a",
    8: "Importing react-router-dom/var/foo is not allowed in modules with name module-a",
  },
);

// options with capture allow-based

testCapture(
  SETTINGS.oneLevel,
  [
    {
      default: "allow",
      rules: [
        {
          from: [["modules", { elementName: "module-b" }]],
          disallow: ["react-router-dom"],
        },
        {
          from: [["helpers", { elementName: "helper-b" }]],
          disallow: ["foo-library"],
        },
        {
          from: [["helpers", { elementName: "helper-a" }]],
          disallow: [["foo-library", { specifiers: ["Link"] }]],
        },
      ],
    },
  ],
  {
    0: "Usage of external module 'react-router-dom' is not allowed in elements of type 'modules' with elementName 'module-b'. Disallowed in rule 1",
    1: "Usage of external module 'foo-library' is not allowed in elements of type 'helpers' with elementName 'helper-b'. Disallowed in rule 2",
    2: "Usage of 'Link' from external module 'foo-library' is not allowed in elements of type 'helpers' with elementName 'helper-a'. Disallowed in rule 3",
  },
);
