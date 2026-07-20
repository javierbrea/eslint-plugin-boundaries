import type { ElementDescriptors } from "@boundaries/elements";

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

// Every block below reuses the same import (components/component-a importing
// components/component-b) and disallow-based policies, so the only thing that
// changes from block to block is the settings under test: `boundaries/elements-single-match`,
// `stopMatching` and `exclusive`. This isolates the effect of each option instead of
// re-running the whole rule-behavior suite once per config.
const IMPORTING_FILE = absoluteFilePath("components/component-a/ComponentA.js");
const IMPORT_CODE = "import ComponentB from 'components/component-b'";

const buildSettings = (
  elements: ElementDescriptors,
  overrides: Record<string, unknown> = {}
): RuleTesterSettings =>
  ({
    ...SETTINGS.oneLevel,
    "boundaries/elements": elements,
    ...overrides,
  }) as RuleTesterSettings;

const disallowTypesOptions = (type: string, message: string) => [
  {
    default: "allow",
    policies: [
      {
        disallow: { to: { element: { types: type } } },
        message,
      },
    ],
  },
];

// Default behavior (`boundaries/elements-single-match` defaults to `true`): only the first
// matching descriptor's type is kept, so a folder matched by two descriptors ("component" and
// "shared") is only ever typed "component". The "shared" type never appears.
createRuleTester(
  buildSettings([
    { type: "component", pattern: "components/*", capture: ["elementName"] },
    { type: "shared", pattern: "components/*", capture: ["elementName"] },
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ])
).run(`${RULE} elements-single-match: default (single-type)`, rule, {
  valid: [
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("shared", "blocked-shared"),
    },
  ],
  invalid: [],
});

// `boundaries/elements-single-match: false` opts in to multi-type accumulation: both "component"
// and "shared" descriptors match the same path level, so the element ends up with
// `types: ["component", "shared"]` and a policy targeting "shared" now applies.
createRuleTester(
  buildSettings(
    [
      { type: "component", pattern: "components/*", capture: ["elementName"] },
      { type: "shared", pattern: "components/*", capture: ["elementName"] },
      { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
      { type: "modules", pattern: "modules/*", capture: ["elementName"] },
    ],
    { "boundaries/elements-single-match": false }
  )
).run(`${RULE} elements-single-match: false (multi-type)`, rule, {
  valid: [],
  invalid: [
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("shared", "blocked-shared"),
      errors: [{ message: "blocked-shared", type: "Literal" }],
    },
  ],
});

// Per-descriptor `stopMatching: true` freezes accumulation from that point on but keeps every
// type matched so far, including its own. With `elements-single-match: false` (accumulate by
// default) and three descriptors matching "components/*", stopping at the second one still
// leaves "component" and "shared" in `types`, while "widget" (evaluated after the stop) never
// gets added.
createRuleTester(
  buildSettings(
    [
      { type: "component", pattern: "components/*", capture: ["elementName"] },
      {
        type: "shared",
        pattern: "components/*",
        capture: ["elementName"],
        stopMatching: true,
      },
      { type: "widget", pattern: "components/*", capture: ["elementName"] },
      { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
      { type: "modules", pattern: "modules/*", capture: ["elementName"] },
    ],
    { "boundaries/elements-single-match": false }
  )
).run(`${RULE} elements-single-match: per-descriptor stopMatching`, rule, {
  valid: [
    // "widget" was never evaluated because "shared" stopped matching first.
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("widget", "blocked-widget"),
    },
  ],
  invalid: [
    // "component" and "shared" are both still present: stopMatching does not discard
    // types accumulated before (or by) the descriptor that stops matching.
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("component", "blocked-component"),
      errors: [{ message: "blocked-component", type: "Literal" }],
    },
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("shared", "blocked-shared"),
      errors: [{ message: "blocked-shared", type: "Literal" }],
    },
  ],
});

// Per-descriptor `exclusive: true` discards every type accumulated so far and keeps only its
// own, then stops. Same descriptor order and same global `elements-single-match: false` as the
// stopMatching block above, but here "component" (accumulated by the first descriptor) is
// discarded once "shared" matches as exclusive, and "widget" is never reached either.
createRuleTester(
  buildSettings(
    [
      { type: "component", pattern: "components/*", capture: ["elementName"] },
      {
        type: "shared",
        pattern: "components/*",
        capture: ["elementName"],
        exclusive: true,
      },
      { type: "widget", pattern: "components/*", capture: ["elementName"] },
      { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
      { type: "modules", pattern: "modules/*", capture: ["elementName"] },
    ],
    { "boundaries/elements-single-match": false }
  )
).run(`${RULE} elements-single-match: per-descriptor exclusive`, rule, {
  valid: [
    // "component" was discarded by the exclusive "shared" descriptor.
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("component", "blocked-component"),
    },
    // "widget" was never evaluated: exclusive also stops further matching.
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("widget", "blocked-widget"),
    },
  ],
  invalid: [
    // "shared" is the only type left: it wins because it is exclusive.
    {
      filename: IMPORTING_FILE,
      code: IMPORT_CODE,
      options: disallowTypesOptions("shared", "blocked-shared"),
      errors: [{ message: "blocked-shared", type: "Literal" }],
    },
  ],
});
