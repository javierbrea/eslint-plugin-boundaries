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

// Generic test function

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  {
    absoluteFilePath,
  }: {
    absoluteFilePath: ReturnType<typeof pathResolvers>["absoluteFilePath"];
  },
  errorMessages: Record<number, string> = {}
) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // Helpers can import foo-library
      {
        filename: absoluteFilePath("helpers/helper-a/main.js"),
        code: "import FooLibrary from 'foo-library'",
        options,
      },
      // atom-b can import material-ui
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
      },
      // molecule-b can import material-ui
      {
        filename: absoluteFilePath("components/molecules/molecule-b/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
      },
      // layout-b can import material-ui
      {
        filename: absoluteFilePath("components/layouts/layout-b/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
      },
      // atom-b can import material-ui/foo
      {
        filename: absoluteFilePath("components/atoms/atom-b/index.js"),
        code: "import { Label } from '@material-ui/foo'",
        options,
      },
      // molecule-b can import material-ui/foo
      {
        filename: absoluteFilePath("components/molecules/molecule-b/index.js"),
        code: "import { Label } from '@material-ui/foo'",
        options,
      },
      // layout-b can import material-ui/foo
      {
        filename: absoluteFilePath("components/layouts/layout-b/index.js"),
        code: "import { Label } from '@material-ui/foo'",
        options,
      },
      // domain-a modules can import react-router-dom
      {
        filename: absoluteFilePath("modules/domain-b/module-a/ModuleA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
      },
      // domain-b modules can import react-router-dom
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import { withRouter } from 'react-router-dom'",
        options,
      },
      // domain-a modules can import react
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import React from 'react'",
        options,
      },
      // pages can import react
      {
        filename: absoluteFilePath("modules/pages/page-a/PageA.js"),
        code: "import React from 'react'",
        options,
      },
      // External dependencies can be imported
      {
        filename: absoluteFilePath("modules/pages/page-a/PageA.js"),
        code: "import 'chalk'",
      },
    ],
    invalid: [
      // Helpers can't import react
      {
        filename: absoluteFilePath("helpers/helper-a/main.js"),
        code: "import React from 'react'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              0,
              externalNoRuleMessage({
                file: '"helpers" and captured values: elementName="helper-a"',
                dep: "react",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // atom-a can't import material-ui
      {
        filename: absoluteFilePath("components/atoms/atom-a/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              1,
              externalNoRuleMessage({
                file: '"components" and captured values: category="atoms", elementName="atom-a"',
                dep: "@material-ui/core",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // molecule-a can't import material-ui
      {
        filename: absoluteFilePath("components/molecules/molecule-a/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              2,
              externalNoRuleMessage({
                file: '"components" and captured values: category="molecules", elementName="molecule-a"',
                dep: "@material-ui/core",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // layout-a can't import material-ui
      {
        filename: absoluteFilePath("components/layouts/layout-a/index.js"),
        code: "import { Label } from '@material-ui/core'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              3,
              externalNoRuleMessage({
                file: '"components" and captured values: category="layouts", elementName="layout-a"',
                dep: "@material-ui/core",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // pages can't import react-router-dom
      {
        filename: absoluteFilePath("modules/pages/page-a/PageA.js"),
        code: "import { Link } from 'react-router-dom'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              4,
              externalNoRuleMessage({
                file: '"modules" and captured values: domain="pages", elementName="page-a"',
                dep: "react-router-dom",
              })
            ),
            type: "Literal",
          },
        ],
      },
      // domain-b modules can't import react
      {
        filename: absoluteFilePath("modules/domain-b/module-b/index.js"),
        code: "import 'react'",
        options,
        errors: [
          {
            message: errorMessage(
              errorMessages,
              4,
              externalNoRuleMessage({
                file: '"modules" and captured values: domain="domain-b", elementName="module-b"',
                dep: "react",
              })
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// disallow-based options

runTest(
  SETTINGS.twoLevels,
  [
    {
      checkAllOrigins: true,
      default: "disallow",
      policies: [
        {
          from: { element: { type: "helpers" } },
          allow: [
            { to: { module: { origin: "external", source: "foo-library" } } },
          ],
        },
        {
          from: {
            element: {
              type: "components",
              captured: { elementName: "*-b" },
            },
          },
          allow: [
            {
              to: { module: { origin: "external", source: "@material-ui/*" } },
            },
          ],
        },
        {
          from: {
            element: {
              type: "modules",
              captured: { domain: "!pages" },
            },
          },
          allow: [
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
        },
        {
          from: {
            element: { type: "modules", captured: { domain: "*-a" } },
          },
          allow: [{ to: { module: { origin: "external", source: "react" } } }],
        },
        {
          from: {
            element: { type: "modules", captured: { domain: "pages" } },
          },
          allow: [{ to: { module: { origin: "external", source: "react" } } }],
        },
      ],
    },
  ],
  pathResolvers("two-levels"),
  {}
);

runTest(
  SETTINGS.twoLevelsWithPrivate,
  [
    {
      checkAllOrigins: true,
      default: "disallow",
      policies: [
        {
          from: { element: { type: "helpers" } },
          allow: [
            { to: { module: { origin: "external", source: "foo-library" } } },
          ],
        },
        {
          from: {
            element: {
              type: "components",
              captured: { elementName: "*-b" },
            },
          },
          allow: [
            {
              to: { module: { origin: "external", source: "@material-ui/*" } },
            },
          ],
        },
        {
          from: {
            element: {
              type: "modules",
              captured: { domain: "!pages" },
            },
          },
          allow: [
            {
              to: {
                module: { origin: "external", source: "react-router-dom" },
              },
            },
          ],
        },
        {
          from: {
            element: { type: "modules", captured: { domain: "*-a" } },
          },
          allow: [{ to: { module: { origin: "external", source: "react" } } }],
        },
        {
          from: {
            element: { type: "modules", captured: { domain: "pages" } },
          },
          allow: [{ to: { module: { origin: "external", source: "react" } } }],
        },
      ],
    },
  ],
  pathResolvers("two-levels-with-private"),
  {}
);
