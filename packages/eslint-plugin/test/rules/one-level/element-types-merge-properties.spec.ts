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
    {
      type: "helpers",
      category: "shared",
      pattern: "helpers/*",
      capture: ["elementName"],
    },
    {
      type: "components",
      category: "ui",
      pattern: ["components/*"],
      capture: ["elementName"],
    },
    {
      type: "modules",
      category: "domain",
      pattern: "modules/*",
      capture: ["elementName"],
    },
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
            rules: [
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
            rules: [
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
            rules: [
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
            rules: [
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
            rules: [
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
            rules: [
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
            rules: [
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
            rules: [
              {
                allow: [{ dependency: [{ kind: "value" }] }],
                importKind: "type",
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
            rules: [
              {
                to: "helpers",
                disallow: { from: [{ type: "helpers" }] },
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
            rules: [
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
            rules: [
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
            rules: [
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
            rules: [
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
            rules: [
              {
                dependency: { nodeKind: "import" },
                disallow: { to: { type: "*" } },
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with kind "value" and nodeKind "import" to elements of type "helpers" are not allowed. Denied by rule at index 0',
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
            rules: [
              {
                dependency: { nodeKind: "import", kind: ["foo"] },
                disallow: { to: { type: "*" } },
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with nodeKind "import" and kind "value" to elements of type "helpers" are not allowed. Denied by rule at index 0',
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
            rules: [
              {
                dependency: [{ nodeKind: "import" }],
                disallow: { to: { type: "*" } },
                importKind: "value",
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with kind "value" and nodeKind "import" to elements of type "helpers" are not allowed. Denied by rule at index 0',
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
            rules: [
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
              'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by rule at index 0',
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
            rules: [
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
              'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by rule at index 0',
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
            rules: [
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
              'Dependencies with kind "value" and nodeKind "import" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
    ],
  }
);
