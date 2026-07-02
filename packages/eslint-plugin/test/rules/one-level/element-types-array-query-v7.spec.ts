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

// ─── element.types ArrayQuery selectors ──────────────────────────────────────

const elementTypesArrayQuerySettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: ["components/*"], capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
} as RuleTesterSettings;

createRuleTester(elementTypesArrayQuerySettings).run(
  `${RULE} element.types array query selectors - single-type elements`,
  rule,
  {
    valid: [
      // hasLength: 1 — each single-type element has exactly one type
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { types: { hasLength: 1 } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // anyOf: ["helpers"] — types array contains "helpers"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { types: { anyOf: ["helpers"] } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // equalsTo: ["helpers"] — types array is exactly ["helpers"]
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { types: { equalsTo: ["helpers"] } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // noneOf: ["modules", "components"] — types contains neither "modules" nor "components"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: { types: { noneOf: ["modules", "components"] } },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // atIndex: { index: 0, matches: "helpers" } — first type is "helpers"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    types: { atIndex: { index: 0, matches: "helpers" } },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // allOf: ["helpers"] — types contains all listed values
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { types: { allOf: ["helpers"] } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // anyOf: ["helpers"] on TO — to.types includes "helpers", disallow fires
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: { element: { types: { anyOf: ["helpers"] } } },
                },
                message: "types-anyOf-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "types-anyOf-helpers-disallowed", type: "Literal" },
        ],
      },
      // allOf: ["helpers"] on TO — to.types contains all of ["helpers"]
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: { element: { types: { allOf: ["helpers"] } } },
                },
                message: "types-allOf-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "types-allOf-helpers-disallowed", type: "Literal" },
        ],
      },
      // noneOf: ["modules", "components"] on TO — to.types contains neither "modules" nor "components"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: {
                    element: { types: { noneOf: ["modules", "components"] } },
                  },
                },
                message: "types-noneOf-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "types-noneOf-disallowed", type: "Literal" }],
      },
      // equalsTo: ["helpers"] on TO — to.types is exactly ["helpers"]
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: { element: { types: { equalsTo: ["helpers"] } } },
                },
                message: "types-equalsTo-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "types-equalsTo-helpers-disallowed", type: "Literal" },
        ],
      },
      // hasLength: 1 on TO — to.types has exactly 1 element
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: { to: { element: { types: { hasLength: 1 } } } },
                message: "types-hasLength-1-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "types-hasLength-1-disallowed", type: "Literal" }],
      },
      // atIndex: { index: 0, matches: "helpers" } on TO — first type of to is "helpers"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: {
                    element: {
                      types: { atIndex: { index: 0, matches: "helpers" } },
                    },
                  },
                },
                message: "types-atIndex-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "types-atIndex-helpers-disallowed", type: "Literal" },
        ],
      },
    ],
  }
);

const multiTypeElementSettings: RuleTesterSettings = {
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

createRuleTester(multiTypeElementSettings).run(
  `${RULE} element.types array query selectors - multi-type elements`,
  rule,
  {
    valid: [
      // anyOf: ["helpers", "modules"] — helper has "helpers" type, which is in anyOf list
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: { types: { anyOf: ["helpers", "modules"] } },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // allOf: ["helpers", "reusable"] — helper has both "helpers" and "reusable" types
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: { types: { allOf: ["helpers", "reusable"] } },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // hasLength: 2 — helper matches "helpers" and "reusable" patterns, giving 2 types
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { types: { hasLength: 2 } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // noneOf: ["modules"] — helper has "helpers" and "reusable", not "modules"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { types: { noneOf: ["modules"] } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // equalsTo: ["helpers", "reusable"] — helper types are exactly ["helpers", "reusable"]
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: { types: { equalsTo: ["helpers", "reusable"] } },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // atIndex: { index: 0, matches: "helpers" } — first type of helper is "helpers"
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    types: { atIndex: { index: 0, matches: "helpers" } },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // allOf: ["reusable", "components"] on TO — component has both "reusable" and "components" types
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: {
                    element: { types: { allOf: ["reusable", "components"] } },
                  },
                },
                message: "multi-allOf-reusable-components-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "multi-allOf-reusable-components-disallowed",
            type: "Literal",
          },
        ],
      },
      // hasLength: 2 on TO — component has ["reusable", "components"] = 2 types
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: { to: { element: { types: { hasLength: 2 } } } },
                message: "multi-hasLength-2-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "multi-hasLength-2-disallowed", type: "Literal" }],
      },
      // noneOf: ["modules"] on TO — component has no "modules" type, noneOf matches
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "helpers" } },
                disallow: {
                  to: { element: { types: { noneOf: ["modules"] } } },
                },
                message: "multi-noneOf-modules-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "multi-noneOf-modules-disallowed", type: "Literal" },
        ],
      },
      // equalsTo: ["helpers", "reusable"] on TO — helpers have exactly these two types
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { type: "components" } },
                disallow: {
                  to: {
                    element: { types: { equalsTo: ["helpers", "reusable"] } },
                  },
                },
                message: "multi-equalsTo-helpers-reusable-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "multi-equalsTo-helpers-reusable-disallowed",
            type: "Literal",
          },
        ],
      },
    ],
  }
);

// ─── element.parents ArrayQuery selectors ────────────────────────────────────
//
// Fixtures (using SETTINGS.oneLevel: helpers/*, components/*, modules/*):
//   helpers/helper-a/HelperA.js                                      → 0 parents
//   components/component-a/helpers/helper-a/HelperA.js               → 1 parent (components/component-a)
//   components/component-a/helpers/helper-a/helpers/helper-b/HelperB.js
//                                                          → 2 parents (helpers/helper-a, components/component-a)
//

createRuleTester(SETTINGS.oneLevel).run(
  `${RULE} element.parents array query selectors`,
  rule,
  {
    valid: [
      // hasLength: 0 — top-level helper has no parent elements
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { parents: { hasLength: 0 } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // hasLength: 1 — nested helper (inside component-a) has exactly one parent
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { parents: { hasLength: 1 } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // hasLength: 2 — doubly nested helper has two ancestors
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/helpers/helper-b/HelperB.js"
        ),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { element: { parents: { hasLength: 2 } } },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // anyOf: [{ type: "components" }] — nested helper has a "components" ancestor
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: { anyOf: [{ type: "components" }] },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // noneOf: [{ type: "components" }] — top-level helper has no "components" ancestor
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: { noneOf: [{ type: "components" }] },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // allOf: [{ type: "helpers" }, { type: "components" }] — doubly nested helper has both ancestor types
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/helpers/helper-b/HelperB.js"
        ),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      allOf: [{ type: "helpers" }, { type: "components" }],
                    },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // equalsTo: [{ type: "components" }] — nested helper parent chain is exactly [components]
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: { equalsTo: [{ type: "components" }] },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // atIndex: { index: 0, matches: { type: "components" } } — closest parent is "components"
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      atIndex: { index: 0, matches: { type: "components" } },
                    },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // hasLength: 0 — top-level helper has 0 parents, disallow fires
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { parents: { hasLength: 0 } } },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parents-hasLength-0-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "parents-hasLength-0-disallowed", type: "Literal" },
        ],
      },
      // hasLength: 1 — nested helper has 1 parent, disallow fires
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { element: { parents: { hasLength: 1 } } },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parents-hasLength-1-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "parents-hasLength-1-disallowed", type: "Literal" },
        ],
      },
      // anyOf: [{ type: "components" }] — nested helper has a "components" parent, disallow fires
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: { parents: { anyOf: [{ type: "components" }] } },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parents-anyOf-components-disallowed",
              },
            ],
          },
        ],
        errors: [
          { message: "parents-anyOf-components-disallowed", type: "Literal" },
        ],
      },
      // noneOf: [{ type: "modules" }] — top-level helper has no "modules" ancestor, noneOf matches
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: {
                    parents: { noneOf: [{ type: "modules" }] },
                  },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parents-noneOf-modules-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "parents-noneOf-modules-disallowed",
            type: "Literal",
          },
        ],
      },
      // equalsTo: [{ type: "components" }] — nested helper has exactly [components] parents
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: {
                    parents: { equalsTo: [{ type: "components" }] },
                  },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parents-equalsTo-components-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "parents-equalsTo-components-disallowed",
            type: "Literal",
          },
        ],
      },
      // atIndex: { index: 0, matches: { type: "components" } } — parent[0] is "components"
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      atIndex: { index: 0, matches: { type: "components" } },
                    },
                  },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parents-atIndex-0-components-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "parents-atIndex-0-components-disallowed",
            type: "Literal",
          },
        ],
      },
    ],
  }
);

// ─── parents.types ArrayQuery selectors ──────────────────────────────────────
//
// Uses SETTINGS.oneLevel (helpers/*, components/*, modules/*).
// components/component-a/helpers/helper-a/HelperA.js has 1 parent: components/component-a (types: ["components"])
//

createRuleTester(SETTINGS.oneLevel).run(
  `${RULE} parents.types array query selectors`,
  rule,
  {
    valid: [
      // anyOf on parent types — parent has "components" in its types
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      anyOf: [{ types: { anyOf: ["components"] } }],
                    },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // hasLength: 1 on parent types — parent has exactly one type (single-type mode)
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: { anyOf: [{ types: { hasLength: 1 } }] },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // equalsTo on parent types — parent types are exactly ["components"]
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      anyOf: [{ types: { equalsTo: ["components"] } }],
                    },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // noneOf on parent types — parent has no "modules" type
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      anyOf: [{ types: { noneOf: ["modules"] } }],
                    },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // atIndex on parent types — parent's first type is "components"
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      anyOf: [
                        {
                          types: {
                            atIndex: { index: 0, matches: "components" },
                          },
                        },
                      ],
                    },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
      // allOf on multiple parent types — doubly-nested helper has parents with "helpers" and "components" types
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/helpers/helper-b/HelperB.js"
        ),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      allOf: [
                        { types: { anyOf: ["helpers"] } },
                        { types: { anyOf: ["components"] } },
                      ],
                    },
                  },
                },
                allow: { to: { element: { type: "helpers" } } },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // anyOf on parent types — parent has "components" type, disallow fires
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      anyOf: [{ types: { anyOf: ["components"] } }],
                    },
                  },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parent-types-anyOf-components-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "parent-types-anyOf-components-disallowed",
            type: "Literal",
          },
        ],
      },
      // hasLength: 1 on parent types — parent has 1 type, disallow fires
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: {
                    parents: { anyOf: [{ types: { hasLength: 1 } }] },
                  },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parent-types-hasLength-1-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "parent-types-hasLength-1-disallowed",
            type: "Literal",
          },
        ],
      },
      // noneOf on parent types — parent (components) has no "modules" type, noneOf matches
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      anyOf: [{ types: { noneOf: ["modules"] } }],
                    },
                  },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parent-types-noneOf-modules-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "parent-types-noneOf-modules-disallowed",
            type: "Literal",
          },
        ],
      },
      // equalsTo on parent types — parent types are exactly ["components"], disallow fires
      {
        filename: absoluteFilePath(
          "components/component-a/helpers/helper-a/HelperA.js"
        ),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: {
                  element: {
                    parents: {
                      anyOf: [{ types: { equalsTo: ["components"] } }],
                    },
                  },
                },
                disallow: { to: { element: { type: "helpers" } } },
                message: "parent-types-equalsTo-components-disallowed",
              },
            ],
          },
        ],
        errors: [
          {
            message: "parent-types-equalsTo-components-disallowed",
            type: "Literal",
          },
        ],
      },
    ],
  }
);
