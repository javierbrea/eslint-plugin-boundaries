import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("one-level");

const objectSelectorPropertiesSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: ["components/*"], capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
  "boundaries/files": [
    { category: "shared", pattern: "helpers/*/*/**", capture: [] },
    { category: "ui", pattern: ["components/*/*/**"], capture: [] },
    { category: "domain", pattern: "modules/*/*/**", capture: [] },
  ],
} as RuleTesterSettings;

createRuleTester(objectSelectorPropertiesSettings).run(
  `${RULE} object selector properties`,
  rule,
  {
    valid: [
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                to: "helpers",
                allow: "helpers",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: { nodeKind: "dynamic-import" },
                disallow: { dependency: { kind: "value" } },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: [{ nodeKind: "dynamic-import" }],
                disallow: { dependency: { kind: "value" } },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: [{ nodeKind: "dynamic-import" }],
                disallow: { dependency: [{ kind: "value" }] },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: { nodeKind: "dynamic-import" },
                disallow: { dependency: [{ kind: "value" }] },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: { dependency: { kind: "value" } },
                importKind: "type",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: [{ dependency: { kind: "value" } }],
                importKind: "type",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                allow: [{ dependency: [{ kind: "value" }] }],
                importKind: "type",
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: { nodeKind: "import", kind: ["foo"] },
                disallow: { to: { element: { type: "*" } } },
                importKind: "value",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                to: "helpers",
                disallow: { from: [{ element: { type: "helpers" } }] },
                message: "blocked-type",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-type", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: { nodeKind: "import" },
                disallow: { dependency: { kind: "value" } },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-dependency-type", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: [{ nodeKind: "import" }],
                disallow: { dependency: { kind: "value" } },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-dependency-type", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: { nodeKind: "import" },
                disallow: { dependency: [{ kind: "value" }] },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-dependency-type", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: [{ nodeKind: "import" }],
                disallow: { dependency: [{ kind: "value" }] },
                message: "blocked-dependency-type",
              },
            ],
          },
        ],
        errors: [{ message: "blocked-dependency-type", type: "Literal" }],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: { nodeKind: "import" },
                disallow: { to: { element: { type: "*" } } },
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with kind "value" and nodeKind "import" to elements of type "helpers" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                dependency: [{ nodeKind: "import" }],
                disallow: { to: { element: { type: "*" } } },
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with kind "value" and nodeKind "import" to elements of type "helpers" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                disallow: { dependency: { nodeKind: "import" } },
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                disallow: [{ dependency: { nodeKind: "import" } }],
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                disallow: [{ dependency: [{ nodeKind: "import" }] }],
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
    ],
  }
);
