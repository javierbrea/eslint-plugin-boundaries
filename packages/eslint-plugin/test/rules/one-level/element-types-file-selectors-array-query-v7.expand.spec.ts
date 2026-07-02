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

// Single-category settings: each file has exactly one domain category.
// helpers/*/** → "helpers", components/*/** → "components", modules/*/** → "modules"
const singleCategorySettings: RuleTesterSettings = {
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

// Multi-category settings: each JS file also gets a "source" category.
// Resulting categories: ["helpers","source"], ["components","source"], ["modules","source"]
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

// ─── file.categories noneOf expand ───────────────────────────────────────────
// Rule: disallow imports where to file shares no category with from file.
// noneOf expand resolves to from file's categories.
//
// singleCategory:
//   components → helpers: from=["components"], to=["helpers"]
//       noneOf=["components"]; "helpers" not in list → noneOf passes → disallowed ✓
//   helpers → helpers: from=["helpers"], to=["helpers"]
//       noneOf=["helpers"]; "helpers" IS in list → noneOf fails → not disallowed ✓

createRuleTester(singleCategorySettings).run(
  `${RULE} file.categories noneOf expand — disallow to that shares no category with from`,
  rule,
  {
    valid: [
      // helpers → helpers: same category → noneOf fails → not disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        noneOf: [{ expand: "{{ from.file.categories }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-no-category-with-from",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // components → helpers: different categories → noneOf passes → disallowed
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "components" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        noneOf: [{ expand: "{{ from.file.categories }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-no-category-with-from",
              },
            ],
          },
        ],
        errors: [
          { message: "to-shares-no-category-with-from", type: "Literal" },
        ],
      },
    ],
  }
);

// ─── file.categories anyOf expand (multi-category) ───────────────────────────
// Rule: disallow imports where to file shares at least one category with from file.
// anyOf expand resolves to from file's categories (includes "source" for all JS files).
//
// multiCategory:
//   components → components: from=["components","source"], to=["components","source"]
//       anyOf=["components","source"]; "components" IS in list → anyOf passes → disallowed ✓
//   components → helpers: from=["components","source"], to=["helpers","source"]
//       anyOf=["components","source"]; "source" IS in list → anyOf passes → disallowed ✓
//
// For a valid case we need a rule that only disallows by the non-"source" domain category:
//   from: components file, disallow to files sharing the "components" category
//   but allow importing helpers (different domain, only shares "source")
//
// Actually with "source" everywhere anyOf expand always fires between JS files.
// Use a rule that filters by a static `from.file.categories` first.
//
// Test: disallow imports from components where to has "components" category (using anyOf expand
// but scoped so only components→components triggers):

createRuleTester(multiCategorySettings).run(
  `${RULE} file.categories anyOf expand — disallow to that shares a category with from (multi-category)`,
  rule,
  {
    valid: [
      // components → modules: anyOf=["components","source"]; "modules" not in list but "source" IS
      // Actually "source" is shared by all JS files, so anyOf passes for any JS→JS import.
      // For a valid case: use noneOf expand instead to allow non-shared-category imports.
      // helpers → components: from=["helpers","source"], noneOf=["helpers","source"]; to=["components","source"]
      //   "source" IS in noneOf → noneOf fails → not disallowed → valid
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        noneOf: [{ expand: "{{ from.file.categories }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-no-category-with-from",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // helpers → modules: from=["helpers","source"], noneOf=["helpers","source"]
      // to=["modules","source"]; "source" IS in noneOf → noneOf fails → not disallowed
      // Wait: noneOf["helpers","source"] means: selector matches if NONE of to.categories is in the list
      // "source" IS in to.categories and IS in noneOf list → noneOf fails → not disallowed
      //
      // For a truly different-category import that does trigger noneOf, we need a file with NO
      // "source" or "helpers" category. With multiCategorySettings all JS files get "source",
      // so no import between JS files can escape the "source" match.
      //
      // Instead test anyOf expand: disallow if to shares ANY of from's categories.
      // helpers → helpers: from=["helpers","source"], anyOf=["helpers","source"]
      // to=["helpers","source"]; "helpers" IS in anyOf → anyOf passes → disallowed ✓
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        anyOf: [{ expand: "{{ from.file.categories }}" }],
                      },
                    },
                  },
                },
                message: "to-shares-category-with-from",
              },
            ],
          },
        ],
        errors: [{ message: "to-shares-category-with-from", type: "Literal" }],
      },
    ],
  }
);

// ─── file.categories mixed static + expand ────────────────────────────────────
// noneOf: ["modules", { expand: "{{ from.file.categories }}" }]
// Disallows imports where to file has neither "modules" nor any of from's categories.
//
// from=components (["components"]): noneOf=["modules","components"]
//   → helpers (["helpers"]): "helpers" not in noneOf → noneOf passes → disallowed ✓
//   → components (["components"]): "components" IS in noneOf → noneOf fails → not disallowed ✓

createRuleTester(singleCategorySettings).run(
  `${RULE} file.categories mixed noneOf with static and expand items`,
  rule,
  {
    valid: [
      // components → components: "components" IS in noneOf=["modules","components"] → noneOf fails → not disallowed
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ComponentB from 'components/component-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "components" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        noneOf: [
                          "modules",
                          { expand: "{{ from.file.categories }}" },
                        ],
                      },
                    },
                  },
                },
                message: "to-has-no-modules-or-from-category",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // components → helpers: "helpers" not in ["modules","components"] → noneOf passes → disallowed
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "components" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        noneOf: [
                          "modules",
                          { expand: "{{ from.file.categories }}" },
                        ],
                      },
                    },
                  },
                },
                message: "to-has-no-modules-or-from-category",
              },
            ],
          },
        ],
        errors: [
          { message: "to-has-no-modules-or-from-category", type: "Literal" },
        ],
      },
    ],
  }
);

// ─── file.categories equalsTo expand ─────────────────────────────────────────
//
// equalsTo expand "{{ from.file.categories }}" resolves to from file's categories.
// The resolved array is used as an ordered exact-match pattern list.
//
// singleCategory: each file has exactly one category.
//   helpers/*/** → ["helpers"]
//   components/*/** → ["components"]
//
// Disallow selector: equalsTo [{ expand: "{{ from.file.categories }}" }]
// Matches when to.categories == from.categories (same ordered array).
//   helpers → helpers: to=["helpers"], equalsTo=["helpers"] → matches → disallowed ✓
//   helpers → components: to=["components"], equalsTo=["helpers"] → no match → not disallowed ✓

createRuleTester(singleCategorySettings).run(
  `${RULE} file.categories equalsTo expand — disallow to whose categories equal from's categories`,
  rule,
  {
    valid: [
      // helpers → components: categories differ → equalsTo fails → not disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        equalsTo: [{ expand: "{{ from.file.categories }}" }],
                      },
                    },
                  },
                },
                message: "to-categories-equal-from-categories",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // helpers → helpers: same categories → equalsTo passes → disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "allow",
            rules: [
              {
                from: { file: { categories: "helpers" } },
                disallow: {
                  to: {
                    file: {
                      categories: {
                        equalsTo: [{ expand: "{{ from.file.categories }}" }],
                      },
                    },
                  },
                },
                message: "to-categories-equal-from-categories",
              },
            ],
          },
        ],
        errors: [
          {
            message: "to-categories-equal-from-categories",
            type: "Literal",
          },
        ],
      },
    ],
  }
);
