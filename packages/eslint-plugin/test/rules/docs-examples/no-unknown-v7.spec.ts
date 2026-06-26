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

// The rule reports a dependency when its target is an unknown element OR an unknown
// file. `allowUnknownElements` (default false) and `allowUnknownFiles` (default true)
// each disable their axis. With the defaults the rule reports only when the target
// element is unknown, preserving the behavior of the deprecated `no-unknown` rule.
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
// unknown, so the rule must rely on file descriptors (allowUnknownElements: true).
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
// Default options (allowUnknownElements: false, allowUnknownFiles: true):
// report only when the target element is unknown (legacy behavior).
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
    // External dependencies are not local, so they are never reported.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import 'chalk'",
      options: [{}],
    },
  ],
  invalid: [
    // Unknown element (known file) -> reported by default (file axis disabled).
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{}],
      errors: [{ message: ELEMENTS_MESSAGE, type: "Literal" }],
    },
    // Unknown element (and unknown file) -> reported with the element message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{}],
      errors: [{ message: ELEMENTS_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// allowUnknownFiles: false -> both axes active. Report when the target is an
// unknown element OR an unknown file.
// =========================================================================
ruleTester.run(RULE, rule, {
  valid: [
    // Known element and known file -> allowed.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options: [{ allowUnknownFiles: false }],
    },
  ],
  invalid: [
    // Known element but unknown file -> reported with the file message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [{ allowUnknownFiles: false }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
    // Unknown element but known file -> reported with the element message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{ allowUnknownFiles: false }],
      errors: [{ message: ELEMENTS_MESSAGE, type: "Literal" }],
    },
    // Unknown element and unknown file -> reported with the combined message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{ allowUnknownFiles: false }],
      errors: [{ message: BOTH_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// allowUnknownElements: true + allowUnknownFiles: false -> file axis only.
// Report when the target file is unknown, regardless of its element.
// =========================================================================
ruleTester.run(RULE, rule, {
  valid: [
    // Known file -> allowed even though the element is unknown.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options: [{ allowUnknownElements: true, allowUnknownFiles: false }],
    },
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{ allowUnknownElements: true, allowUnknownFiles: false }],
    },
  ],
  invalid: [
    // Unknown file (known element) -> reported with the file message.
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [{ allowUnknownElements: true, allowUnknownFiles: false }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{ allowUnknownElements: true, allowUnknownFiles: false }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// allowUnknownElements: true (allowUnknownFiles defaults to true) -> both axes
// disabled, so the rule never reports.
// =========================================================================
ruleTester.run(RULE, rule, {
  valid: [
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import foo from '../../../foo'",
      options: [{ allowUnknownElements: true }],
    },
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{ allowUnknownElements: true }],
    },
  ],
  invalid: [],
});

// =========================================================================
// Only file descriptors configured (no element descriptors). Setting
// allowUnknownElements: true and allowUnknownFiles: false makes the rule judge
// targets purely by file descriptors: known files are allowed, unknown files
// are reported.
// =========================================================================
createRuleTester(fileOnlySettings).run(RULE, rule, {
  valid: [
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import sort from './sort'",
      options: [{ allowUnknownElements: true, allowUnknownFiles: false }],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("helpers/data/parse.js"),
      code: "import foo from '../../foo'",
      options: [{ allowUnknownElements: true, allowUnknownFiles: false }],
      errors: [{ message: FILES_MESSAGE, type: "Literal" }],
    },
  ],
});

// =========================================================================
// Deprecated rule name `boundaries/no-unknown` keeps working (with the default,
// legacy behavior); it emits a one-time rename warning at lint time.
// =========================================================================
createRuleTester(elementsAndFiles).run(RULE, deprecatedRule, {
  valid: [
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import AtomB from 'components/atoms/atom-b'",
      options: [{}],
    },
  ],
  invalid: [
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from '../../../helpers/data/parse'",
      options: [{}],
      errors: [{ message: ELEMENTS_MESSAGE, type: "Literal" }],
    },
  ],
});
