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

// Helpers and components/modules in one-level fixtures resolve to:
// 'helpers/helper-a'       → helpers/helper-a/index.js  (elementName="helper-a", fileName="index")
// 'helpers/helper-a/HelperA.js' → helpers/helper-a/HelperA.js (elementName="helper-a", fileName="HelperA")
// 'helpers/helper-b'       → helpers/helper-b/index.js  (elementName="helper-b", fileName="index")
// 'components/component-a' → components/component-a/index.js (elementName="component-a", fileName="index")
// 'modules/module-a'       → modules/module-a/index.js  (elementName="module-a", fileName="index")

// Settings using file descriptors WITHOUT capture
// Used for basic file.categories selector tests.
const defaultSettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: ["components/*"], capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
  "boundaries/files": [
    { category: "helpers", pattern: "**/helpers/*/**" },
    { category: "components", pattern: ["**/components/*/**"] },
    { category: "modules", pattern: "**/modules/*/**" },
  ],
} as RuleTesterSettings;

// =====================================================================
// file.categories array query selectors
// =====================================================================

// Multi-category settings: each JS file gets both its domain category and
// an extra "source" category matched by **/*.js.
// Resulting categories array: [domain, "source"] — e.g. ["helpers", "source"].
const multiCategorySettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: ["components/*"], capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
  "boundaries/files": [
    { category: "helpers", pattern: "**/helpers/*/**" },
    { category: "components", pattern: ["**/components/*/**"] },
    { category: "modules", pattern: "**/modules/*/**" },
    { category: "source", pattern: "**/*.js" },
  ],
} as RuleTesterSettings;

// Single-category tests: defaultSettings gives each file exactly one category.

createRuleTester(defaultSettings).run(
  `${RULE} file categories array query selectors - single category`,
  rule,
  {
    valid: [
      // anyOf: allow imports of helpers via anyOf: ["helpers"]
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: { to: { file: { categories: { anyOf: ["helpers"] } } } },
              },
            ],
          },
        ],
      },
      // anyOf with multiple matchers: allow helpers OR components
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: {
                    file: { categories: { anyOf: ["helpers", "components"] } },
                  },
                },
              },
            ],
          },
        ],
      },
      // allOf with single item: allow helpers when TO has "helpers" category
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: { to: { file: { categories: { allOf: ["helpers"] } } } },
              },
            ],
          },
        ],
      },
      // noneOf: allow helpers where TO has no "modules" category (helpers don't have "modules")
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: { file: { categories: { noneOf: ["modules"] } } },
                },
              },
            ],
          },
        ],
      },
      // hasLength 1: allow all single-category files
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: { to: { file: { categories: { hasLength: 1 } } } },
              },
            ],
          },
        ],
      },
      // atIndex 0: allow when first category is "helpers"
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: {
                    file: {
                      categories: {
                        atIndex: { index: 0, matches: "helpers" },
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      // atIndex OR semantics: allow when first category is "helpers" OR "components"
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: {
                    file: {
                      categories: {
                        atIndex: {
                          index: 0,
                          matches: ["helpers", "components"],
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      // equalsTo: allow when categories = ["helpers"] exactly
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: { file: { categories: { equalsTo: ["helpers"] } } },
                },
              },
            ],
          },
        ],
      },
      // noneOf in disallow does NOT match helpers: "helpers" IS in ["helpers"], so noneOf is false
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { noneOf: ["helpers"] } } },
                },
              },
            ],
          },
        ],
      },
      // Array query in FROM: anyOf in FROM matches, but TO does not match anyOf: ["modules"]
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: { anyOf: ["helpers"] } } },
                disallow: {
                  to: { file: { categories: { anyOf: ["modules"] } } },
                },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // anyOf: disallow imports of helpers (helpers have "helpers" category → anyOf matches)
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { anyOf: ["helpers"] } } },
                },
                message: "anyOf-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "anyOf-helpers-disallowed", type: "Literal" }],
      },
      // allOf: disallow imports of helpers (helpers have "helpers" → allOf: ["helpers"] matches)
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { allOf: ["helpers"] } } },
                },
                message: "allOf-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "allOf-helpers-disallowed", type: "Literal" }],
      },
      // noneOf: helpers have neither "modules" nor "components" → noneOf matches them
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: { noneOf: ["modules", "components"] },
                    },
                  },
                },
                message: "noneOf-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "noneOf-disallowed", type: "Literal" }],
      },
      // hasLength 1: all single-category files match → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { hasLength: 1 } } },
                },
                message: "hasLength-1-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "hasLength-1-disallowed", type: "Literal" }],
      },
      // atIndex 0: first category of helpers is "helpers" → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        atIndex: { index: 0, matches: "helpers" },
                      },
                    },
                  },
                },
                message: "atIndex-0-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "atIndex-0-helpers-disallowed", type: "Literal" }],
      },
      // equalsTo: categories = ["helpers"] exactly → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { equalsTo: ["helpers"] } } },
                },
                message: "equalsTo-helpers-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "equalsTo-helpers-disallowed", type: "Literal" }],
      },
      // Array query in FROM: anyOf in FROM matches helpers, disallows to helpers
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: { anyOf: ["helpers"] } } },
                disallow: {
                  to: { file: { categories: { anyOf: ["helpers"] } } },
                },
                message: "arrayQuery-in-from-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "arrayQuery-in-from-disallowed", type: "Literal" }],
      },
    ],
  }
);

// Multi-category tests: each file has [domain, "source"] categories.

createRuleTester(multiCategorySettings).run(
  `${RULE} file categories array query selectors - multiple categories`,
  rule,
  {
    valid: [
      // hasLength 2: allow all files with exactly 2 categories
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: { to: { file: { categories: { hasLength: 2 } } } },
              },
            ],
          },
        ],
      },
      // allOf ["helpers", "source"]: helpers have both categories → allow
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: {
                    file: {
                      categories: { allOf: ["helpers", "source"] },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      // atIndex -1 "source": last category of all files is "source" → allow
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: {
                    file: {
                      categories: {
                        atIndex: { index: -1, matches: "source" },
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      // equalsTo ["helpers", "source"]: helpers have exactly these categories in order → allow
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "disallow",
            policies: [
              {
                from: { file: { categories: "components" } },
                allow: {
                  to: {
                    file: { categories: { equalsTo: ["helpers", "source"] } },
                  },
                },
              },
            ],
          },
        ],
      },
      // hasLength 1 in disallow does NOT match (files have 2 categories) → no error
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { hasLength: 1 } } },
                },
              },
            ],
          },
        ],
      },
      // equalsTo ["helpers"] in disallow does NOT match (helpers have 2 categories) → no error
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { equalsTo: ["helpers"] } } },
                },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // hasLength 2: all files have 2 categories → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { hasLength: 2 } } },
                },
                message: "multi-hasLength-2-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "multi-hasLength-2-disallowed", type: "Literal" }],
      },
      // allOf ["helpers", "source"]: helpers have both categories → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: { categories: { allOf: ["helpers", "source"] } },
                  },
                },
                message: "multi-allOf-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "multi-allOf-disallowed", type: "Literal" }],
      },
      // equalsTo ["helpers", "source"]: exact ordered match for helpers → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: { equalsTo: ["helpers", "source"] },
                    },
                  },
                },
                message: "multi-equalsTo-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "multi-equalsTo-disallowed", type: "Literal" }],
      },
      // atIndex -1 "source": last category is "source" → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        atIndex: { index: -1, matches: "source" },
                      },
                    },
                  },
                },
                message: "multi-atIndex-last-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "multi-atIndex-last-disallowed", type: "Literal" }],
      },
      // atIndex 0 OR semantics: first category is "helpers" OR "components" → helpers disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        atIndex: {
                          index: 0,
                          matches: ["helpers", "components"],
                        },
                      },
                    },
                  },
                },
                message: "multi-atIndex-OR-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "multi-atIndex-OR-disallowed", type: "Literal" }],
      },
      // noneOf ["modules"]: helpers ["helpers", "source"] don't have "modules" → noneOf matches
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            policies: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: { file: { categories: { noneOf: ["modules"] } } },
                },
                message: "multi-noneOf-disallowed",
              },
            ],
          },
        ],
        errors: [{ message: "multi-noneOf-disallowed", type: "Literal" }],
      },
    ],
  }
);
