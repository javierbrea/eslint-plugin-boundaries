import type { FileDescriptors } from "@boundaries/elements";

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

// Every block below reuses the same importing file and disallow-based policies, so the only
// thing that changes from block to block is the settings under test: `boundaries/files-single-match`,
// per-descriptor `stopMatching` and `exclusive`. This isolates the effect of each option instead
// of re-running the whole rule-behavior suite once per config.
const IMPORTING_FILE = absoluteFilePath("modules/module-a/ModuleA.js");

// Three files with different shapes, reused across every block:
// - index.js:  matches both "**/index.js" and "**/*.js" (and never "**/main.js")
// - HelperA.js: only matches "**/*.js"
// - main.js:   matches both "**/*.js" and "**/main.js" (and never "**/index.js")
const INDEX_FILE_IMPORT = "import HelperA from '../../helpers/helper-a'";
const NAMED_FILE_IMPORT =
  "import HelperA from '../../helpers/helper-a/HelperA.js'";
const MAIN_FILE_IMPORT = "import HelperA from '../../helpers/helper-a/main.js'";

const buildSettings = (
  files: FileDescriptors,
  overrides: Record<string, unknown> = {}
): RuleTesterSettings =>
  ({
    ...SETTINGS.oneLevel,
    "boundaries/files": files,
    ...overrides,
  }) as RuleTesterSettings;

const disallowCategoryOptions = (category: string, message: string) => [
  {
    default: "allow",
    policies: [
      {
        disallow: { to: { file: { categories: category } } },
        message,
      },
    ],
  },
];

// Default behavior (`boundaries/files-single-match` defaults to `false`): every matching
// descriptor contributes its category. An "index.js" file matches both the "index" and the
// "source" descriptors, so it ends up with `categories: ["index", "source"]` — meaning a policy
// meant to target generic "source" files also (probably unintentionally) catches index files.
createRuleTester(
  buildSettings([
    { category: "index", pattern: "**/index.js" },
    { category: "source", pattern: "**/*.js" },
    { category: "entry", pattern: "**/main.js" },
  ])
).run(`${RULE} files-single-match: default (accumulate)`, rule, {
  valid: [],
  invalid: [
    {
      filename: IMPORTING_FILE,
      code: INDEX_FILE_IMPORT,
      options: disallowCategoryOptions("source", "blocked-source"),
      errors: [{ message: "blocked-source", type: "Literal" }],
    },
    {
      filename: IMPORTING_FILE,
      code: NAMED_FILE_IMPORT,
      options: disallowCategoryOptions("source", "blocked-source"),
      errors: [{ message: "blocked-source", type: "Literal" }],
    },
  ],
});

// `boundaries/files-single-match: true` keeps only the first matching descriptor's category for
// every file, project-wide. With the same descriptor order as above, "index.js" now stops at
// "index" (never gaining "source"), and "main.js" stops at "source" (never reaching "entry").
// The effect applies globally, to every file, regardless of which descriptor happens to match.
createRuleTester(
  buildSettings(
    [
      { category: "index", pattern: "**/index.js" },
      { category: "source", pattern: "**/*.js" },
      { category: "entry", pattern: "**/main.js" },
    ],
    { "boundaries/files-single-match": true }
  )
).run(`${RULE} files-single-match: true (global single match)`, rule, {
  valid: [
    // "index.js" no longer carries the "source" category.
    {
      filename: IMPORTING_FILE,
      code: INDEX_FILE_IMPORT,
      options: disallowCategoryOptions("source", "blocked-source"),
    },
    // "main.js" stopped at "source" and never reached the "entry" descriptor.
    {
      filename: IMPORTING_FILE,
      code: MAIN_FILE_IMPORT,
      options: disallowCategoryOptions("entry", "blocked-entry"),
    },
  ],
  invalid: [
    {
      filename: IMPORTING_FILE,
      code: NAMED_FILE_IMPORT,
      options: disallowCategoryOptions("source", "blocked-source"),
      errors: [{ message: "blocked-source", type: "Literal" }],
    },
  ],
});

// Per-descriptor `stopMatching: true` is a targeted exception: only the descriptor it is set on
// stops evaluating further descriptors, and it keeps everything matched so far (including its
// own category). Here it is set on "index" and placed AFTER "source"/"entry", so "index.js"
// still gets "source" (matched first) plus "index" (matched second, then stops), while
// "main.js" — untouched by the flag — keeps accumulating normally and gets both "source" and
// "entry". This is the "carve out just the exception" story `files-single-match` cannot express.
createRuleTester(
  buildSettings([
    { category: "source", pattern: "**/*.js" },
    { category: "entry", pattern: "**/main.js" },
    { category: "index", pattern: "**/index.js", stopMatching: true },
  ])
).run(`${RULE} files-single-match: per-descriptor stopMatching`, rule, {
  valid: [],
  invalid: [
    // "index.js" still carries "source": stopMatching does not discard prior matches.
    {
      filename: IMPORTING_FILE,
      code: INDEX_FILE_IMPORT,
      options: disallowCategoryOptions("source", "blocked-source"),
      errors: [{ message: "blocked-source", type: "Literal" }],
    },
    // "main.js" is unaffected by the flag (set only on the "index" descriptor) and still
    // accumulates both "source" and "entry".
    {
      filename: IMPORTING_FILE,
      code: MAIN_FILE_IMPORT,
      options: disallowCategoryOptions("entry", "blocked-entry"),
      errors: [{ message: "blocked-entry", type: "Literal" }],
    },
  ],
});

// Per-descriptor `exclusive: true` uses the same descriptor order as the stopMatching block
// above, changing only that flag. Unlike `stopMatching`, `exclusive` discards every category
// accumulated so far once it matches: "index.js" matched "source" first, but the exclusive
// "index" descriptor then discards it, leaving only `categories: ["index"]`. "main.js" — again
// untouched by the flag — still accumulates "source" and "entry" normally.
createRuleTester(
  buildSettings([
    { category: "source", pattern: "**/*.js" },
    { category: "entry", pattern: "**/main.js" },
    { category: "index", pattern: "**/index.js", exclusive: true },
  ])
).run(`${RULE} files-single-match: per-descriptor exclusive`, rule, {
  valid: [
    // "source" was discarded once the exclusive "index" descriptor matched.
    {
      filename: IMPORTING_FILE,
      code: INDEX_FILE_IMPORT,
      options: disallowCategoryOptions("source", "blocked-source"),
    },
  ],
  invalid: [
    // "main.js" is unaffected by the flag (set only on the "index" descriptor) and still
    // accumulates both "source" and "entry".
    {
      filename: IMPORTING_FILE,
      code: MAIN_FILE_IMPORT,
      options: disallowCategoryOptions("entry", "blocked-entry"),
      errors: [{ message: "blocked-entry", type: "Literal" }],
    },
    // "index" itself is still present: exclusive keeps its own category.
    {
      filename: IMPORTING_FILE,
      code: INDEX_FILE_IMPORT,
      options: disallowCategoryOptions("index", "blocked-index"),
      errors: [{ message: "blocked-index", type: "Literal" }],
    },
  ],
});
