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

// Multi-type element settings: helpers match "helpers" and "reusable"; components match
// "components" and "reusable"; modules match only "modules".
// Allows testing expand items that compare from vs to types dynamically.
const multiTypeSettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements-single-type": false,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: "components/*", capture: ["elementName"] },
    {
      type: "reusable",
      pattern: "{helpers,components}/*",
      capture: ["elementName"],
    },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
} as RuleTesterSettings;

// ─── disallow imports where to has none of from's types (noneOf expand) ───────
//
// helpers types = ["helpers", "reusable"]
// components types = ["components", "reusable"]
// modules types = ["modules"]
//
// noneOf expand "{{ from.element.types }}" resolves to from element's types.
// Disallow selector matches when to.types has NONE of from's types.
//   helper → component: ["components","reusable"] ∩ ["helpers","reusable"] = {"reusable"} → noneOf fails → not disallowed
//   helper → module:    ["modules"] ∩ ["helpers","reusable"] = {} → noneOf passes → disallowed

createRuleTester(multiTypeSettings).run(
  `${RULE} element.types noneOf expand — disallow to that shares no type with from`,
  rule,
  {
    valid: [
      // helper → component: types overlap via "reusable" → noneOf fails → not disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: {
                    element: {
                      types: {
                        noneOf: [{ expand: "{{ from.element.types }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-no-type-with-from",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // helper → module: no shared type → noneOf passes → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: {
                    element: {
                      types: {
                        noneOf: [{ expand: "{{ from.element.types }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-no-type-with-from",
              },
            ],
          },
        ],
        errors: [{ message: "to-shares-no-type-with-from", type: "Literal" }],
      },
    ],
  }
);

// ─── disallow imports where to shares a type with from (anyOf expand) ─────────
//
// anyOf expand "{{ from.element.types }}" resolves to from element's types.
// Disallow selector matches when to.types HAS at least one of from's types.
//   component → component: ["components","reusable"] ∩ ["components","reusable"] = {"components","reusable"} → anyOf passes → disallowed
//   component → module:    ["modules"] ∩ ["components","reusable"] = {} → anyOf fails → not disallowed

createRuleTester(multiTypeSettings).run(
  `${RULE} element.types anyOf expand — disallow to that shares a type with from`,
  rule,
  {
    valid: [
      // component → module: no shared type → anyOf fails → not disallowed
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "components" } },
                disallow: {
                  to: {
                    element: {
                      types: {
                        anyOf: [{ expand: "{{ from.element.types }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-type-with-from",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // component → component (same types) → anyOf passes → disallowed
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "components" } },
                disallow: {
                  to: {
                    element: {
                      types: {
                        anyOf: [{ expand: "{{ from.element.types }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-type-with-from",
              },
            ],
          },
        ],
        errors: [{ message: "to-shares-type-with-from", type: "Literal" }],
      },
    ],
  }
);

// ─── mixed static + expand in noneOf ──────────────────────────────────────────
// noneOf: ["modules", { expand: "{{ from.element.types }}" }]
// Disallows both imports with "modules" type and imports with any of from's types.
//
// from=helper (["helpers","reusable"]):
//   → component (["components","reusable"]): noneOf=["modules","helpers","reusable"]
//       "reusable" IS in noneOf → noneOf fails → not disallowed ✓
//   → module (["modules"]): noneOf=["modules","helpers","reusable"]
//       "modules" IS in noneOf → noneOf fails → not disallowed (module already excluded)
// The disallow fires when to has NONE of the listed types: e.g. a hypothetical empty type
// Let's test with a different combination:
// from=module (["modules"]):
//   → helper (["helpers","reusable"]): noneOf=["modules"]
//       "helpers","reusable" not in ["modules"] → noneOf passes → disallowed ✓
// And with mixed:
// noneOf: ["components", { expand }] where from=helper (["helpers","reusable"])
//   → module (["modules"]): noneOf=["components","helpers","reusable"]
//       "modules" not in list → noneOf passes → disallowed ✓
//   → component (["components","reusable"]): noneOf=["components","helpers","reusable"]
//       "components" IS in list → noneOf fails → not disallowed ✓

createRuleTester(multiTypeSettings).run(
  `${RULE} element.types noneOf with mixed static and expand items`,
  rule,
  {
    valid: [
      // helper → component: "components" or "reusable" are in noneOf list → noneOf fails → not disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: {
                    element: {
                      types: {
                        noneOf: [
                          "components",
                          { expand: "{{ from.element.types }}" },
                        ],
                      },
                    },
                  },
                },
                message: "no-non-component-non-from-types",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // helper → module: "modules" not in ["components","helpers","reusable"] → noneOf passes → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: {
                    element: {
                      types: {
                        noneOf: [
                          "components",
                          { expand: "{{ from.element.types }}" },
                        ],
                      },
                    },
                  },
                },
                message: "no-non-component-non-from-types",
              },
            ],
          },
        ],
        errors: [
          { message: "no-non-component-non-from-types", type: "Literal" },
        ],
      },
    ],
  }
);
