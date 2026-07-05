import getRule from "../../../src/Rules/NoUnknown";
import {
  NO_UNKNOWN_DEPENDENCIES as RULE,
  RULE_NAMES_MAP,
} from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const rule = getRule();
const deprecatedRule = getRule(RULE_NAMES_MAP.NO_UNKNOWN);

const { absoluteFilePath } = pathResolvers("docs-examples");

// The `require` option controls which classification axes the target must be known
// on. With the default (`require: "any"`) the rule reports only when the target is
// unknown as both an element and a file.
const ELEMENTS_MESSAGE = "Dependencies to unknown elements are not allowed";
const FILES_MESSAGE = "Dependencies to unknown files are not allowed";
const BOTH_MESSAGE =
  "Dependencies to unknown elements and files are not allowed";

// docsExamplesV7 defines element descriptors for components and modules and a file
// descriptor for helpers. We extend it with a file descriptor for components so that
// all four element/file combinations exist among the fixtures:
//  - components/atoms/atom-a/AtomA.js -> known element, known file
//  - modules/module-a/ModuleA.js      -> known element, unknown file
//  - helpers/data/parse.js            -> unknown element, known file
//  - foo.js                           -> unknown element, unknown file
const elementsAndFiles: RuleTesterSettings = {
  ...SETTINGS.docsExamplesV7,
  "boundaries/files": [
    {
      category: "helpers",
      pattern: "helpers/*/*.js",
      basePattern: "**",
      capture: ["category", "elementName"],
    },
    {
      category: "components",
      pattern: "components/*/*/*.js",
      basePattern: "**",
    },
  ],
} as RuleTesterSettings;

// Settings using ONLY file descriptors (no element descriptors). Every element is
// unknown, so the rule must rely on file descriptors (require: "file").
const fileOnlySettings: RuleTesterSettings = {
  "boundaries/files": [
    {
      category: "helpers",
      pattern: "helpers/*/*.js",
      basePattern: "**",
      capture: ["category", "elementName"],
    },
  ],
  "import/resolver": {
    "eslint-import-resolver-node": {},
  },
} as RuleTesterSettings;

const ruleTester = createRuleTester(elementsAndFiles);

// =========================================================================
// Default options (require: "any"): the target must be known on at least one
// axis. Report only when the target is unknown as both element and file.
// =========================================================================
ruleTester.run(RULE, rule, {
  valid: [
    // Known element -> allowed (even when its file is unknown).
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options: [{}],
    },
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [{}],
    },
    // Known file (even when its element is unknown) -> allowed.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{}],
    },
    // External dependencies are not local, so they are never reported.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import 'chalk'",
      options: [{}],
    },
  ],
  invalid: [
    // Unknown element and unknown file -> reported with the combined message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{}],
      errors: [{ message: BOTH_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// require: "all" -> both axes active. Report when the target is an unknown
// element OR an unknown file.
// =========================================================================
ruleTester.run(RULE, rule, {
  valid: [
    // Known element and known file -> allowed.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options: [{ require: "all" }],
    },
  ],
  invalid: [
    // Known element but unknown file -> reported with the file message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [{ require: "all" }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
    // Unknown element but known file -> reported with the element message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{ require: "all" }],
      errors: [{ message: ELEMENTS_MESSAGE, type: "Literal" }],
    },
    // Unknown element and unknown file -> reported with the combined message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{ require: "all" }],
      errors: [{ message: BOTH_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// require: "file" -> file axis only. Report when the target file is unknown,
// regardless of its element. This preserves the pre-v7 `no-unknown-files`
// intent for projects that judge targets purely by file descriptors.
// =========================================================================
ruleTester.run(RULE, rule, {
  valid: [
    // Known file -> allowed even though the element is unknown.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options: [{ require: "file" }],
    },
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{ require: "file" }],
    },
  ],
  invalid: [
    // Unknown file (known element) -> reported with the file message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [{ require: "file" }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{ require: "file" }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// require: "element" -> element axis only. Report when the target element is
// unknown, regardless of its file. This preserves the legacy `no-unknown`
// behavior explicitly.
// =========================================================================
ruleTester.run(RULE, rule, {
  valid: [
    // Known element (even with an unknown file) -> allowed.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [{ require: "element" }],
    },
  ],
  invalid: [
    // Unknown element (known file) -> reported with the element message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{ require: "element" }],
      errors: [{ message: ELEMENTS_MESSAGE, type: "Literal" }],
    },
    // Unknown element (and unknown file) -> reported with the element message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{ require: "element" }],
      errors: [{ message: ELEMENTS_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// Only file descriptors configured (no element descriptors). Every element is
// unknown, so require: "file" makes the rule judge targets purely by file
// descriptors: known files are allowed, unknown files are reported.
// =========================================================================
createRuleTester(fileOnlySettings).run(RULE, rule, {
  valid: [
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import sort from './sort'",
      options: [{ require: "file" }],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import foo from '../../foo'",
      options: [{ require: "file" }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// Deprecated rule name `boundaries/no-unknown` keeps working (with the same
// default `require: "any"` behavior as `no-unknown-dependencies`); it emits a
// one-time rename warning at lint time.
// =========================================================================
createRuleTester(elementsAndFiles).run(RULE, deprecatedRule, {
  valid: [
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options: [{}],
    },
    // Known file (even when its element is unknown) -> allowed, since the
    // deprecated name now defaults to `require: "any"` like the new one.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{}],
    },
  ],
  invalid: [
    // Unknown element and unknown file -> reported with the combined message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{}],
      errors: [{ message: BOTH_MESSAGE, type: "Literal" }],
    },
  ],
});
