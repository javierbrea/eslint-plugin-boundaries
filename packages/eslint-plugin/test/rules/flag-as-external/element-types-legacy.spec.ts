import rule from "../../../src/Rules/ElementTypes";
import noUnknownRule from "../../../src/Rules/NoUnknown";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { elementTypesNoRuleMessage } from "../../support/messages";

const { ELEMENT_TYPES: RULE } = require("../../../src/Settings");

const { absoluteFilePath } = pathResolvers("flag-as-external");

// Test 1: Default settings - all options enabled
// Tests that element-types rule ONLY controls local dependencies within packages
const testDefaultSettings = () => {
  const ruleTester = createRuleTester(SETTINGS.flagAsExternal);

  ruleTester.run(`${RULE} - default settings`, rule, {
    valid: [
      // Components can import helpers from same package (local, allowed)
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperA from 'package-a/helpers/helper-a'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                from: [["components", { package: "a" }]],
                allow: [["helpers", { package: "a" }]],
              },
            ],
          },
        ],
      },
      // External dependencies (node_modules) are not controlled by element-types
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [{ default: "disallow" }],
      },
      // External dependencies (unresolvable) are not controlled by element-types
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import UnknownPackage from 'unknown-package-xyz'",
        options: [{ default: "disallow" }],
      },
    ],
    invalid: [
      // Helpers cannot import components from same package (local, disallowed)
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'package-a/components/component-a'",
        options: [{ default: "disallow" }],
        errors: [
          {
            message: elementTypesNoRuleMessage({
              file: "'helpers' with package 'a' and elementName 'helper-a'",
              dep: "'components' with package 'a' and elementName 'component-a'",
            }),
            type: "Literal",
          },
        ],
      },
      // Components cannot import helpers from another package (local, disallowed)
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                from: [["components", { package: "package-a" }]],
                allow: [["helpers", { package: "package-a" }]],
              },
            ],
          },
        ],
        errors: [
          {
            message: elementTypesNoRuleMessage({
              file: "'components' with package 'a' and elementName 'component-a'",
              dep: "'helpers' with package 'b' and elementName 'helper-b'",
            }),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 2: outsideRootPath enabled for package-a
// Tests that imports outside package-a root are treated as external
const testOutsideRootPath = () => {
  const settingsPackageA = {
    ...SETTINGS.flagAsExternal,
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*",
        capture: ["elementName"],
      },
      {
        type: "components",
        pattern: "components/*",
        capture: ["elementName"],
      },
    ],
    "boundaries/root-path": absoluteFilePath("package-a"),
    "boundaries/flag-as-external": {
      // @ts-expect-error Known property
      ...SETTINGS.flagAsExternal["boundaries/flag-as-external"],
      outsideRootPath: true,
    },
  };

  const ruleTester = createRuleTester(settingsPackageA);

  ruleTester.run(`${RULE} - outsideRootPath`, rule, {
    valid: [
      // Imports from package-b are external (outside root-path), not controlled by element-types
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [{ default: "disallow" }],
      },
      // node_modules still external
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [{ default: "disallow" }],
      },
    ],
    invalid: [
      // Within package-a, helpers cannot import components (local, disallowed)
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'package-a/components/component-a'",
        options: [{ default: "disallow" }],
        errors: [
          {
            message: elementTypesNoRuleMessage({
              file: "'helpers' with elementName 'helper-a'",
              dep: "'components' with elementName 'component-a'",
            }),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 3: customSourcePatterns
// Tests that imports matching patterns are treated as external
const testCustomSourcePatterns = () => {
  const settingsWithCustomPatterns = {
    ...SETTINGS.flagAsExternal,
    "boundaries/flag-as-external": {
      // @ts-expect-error Known property
      ...SETTINGS.flagAsExternal["boundaries/flag-as-external"],
      customSourcePatterns: ["package-b/**"],
    },
  };

  const ruleTester = createRuleTester(settingsWithCustomPatterns);

  ruleTester.run(`${RULE} - customSourcePatterns`, rule, {
    valid: [
      // Components can import helpers from same package (local)
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperA from 'package-a/helpers/helper-a'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                from: [["components", { package: "a" }]],
                allow: [["helpers", { package: "a" }]],
              },
            ],
          },
        ],
      },
      // Imports matching customSourcePatterns are external, not controlled
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [{ default: "disallow" }],
      },
    ],
    invalid: [
      // Helpers cannot import components from same package (local, disallowed)
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'package-a/components/component-a'",
        options: [{ default: "disallow" }],
        errors: [
          {
            message: elementTypesNoRuleMessage({
              file: "'helpers' with package 'a' and elementName 'helper-a'",
              dep: "'components' with package 'a' and elementName 'component-a'",
            }),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 4: inNodeModules disabled
// Tests that node_modules are considered local when flag is disabled
const testInNodeModulesDisabled = () => {
  const settingsInNodeModulesDisabled = {
    ...SETTINGS.flagAsExternal,
    "boundaries/elements": [
      {
        type: "any",
        pattern: "**",
      },
    ],
    "boundaries/flag-as-external": {
      // @ts-expect-error Known property
      ...SETTINGS.flagAsExternal["boundaries/flag-as-external"],
      inNodeModules: false,
    },
  };

  const ruleTester = createRuleTester(settingsInNodeModulesDisabled);

  ruleTester.run(`${RULE} - inNodeModules disabled`, rule, {
    valid: [
      // node_modules imports are now considered local, but allowed by rule
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [
          { default: "disallow", rules: [{ from: ["any"], allow: ["any"] }] },
        ],
      },
    ],
    invalid: [
      // node_modules imports are now considered local, but allowed by rule
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [{ default: "disallow" }],
        errors: [
          {
            message: elementTypesNoRuleMessage({
              file: "'any'",
              dep: "'any'",
            }),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 5: unresolvableAlias disabled
// Tests that unresolvable imports are local when flag is disabled
const testUnresolvableAliasDisabled = () => {
  const settingsUnresolvableDisabled = {
    ...SETTINGS.flagAsExternal,
    "boundaries/flag-as-external": {
      // @ts-expect-error Known property
      ...SETTINGS.flagAsExternal["boundaries/flag-as-external"],
      unresolvableAlias: false,
    },
  };

  const ruleTester = createRuleTester(settingsUnresolvableDisabled);

  // Unresolvable imports are now considered local, but they are unknown, so we use the unknown rule to test it
  ruleTester.run(`${RULE} - unresolvableAlias disabled`, noUnknownRule, {
    valid: [],
    invalid: [
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import UnknownPackage from 'unknown-package-xyz'",
        errors: [
          {
            message: `Importing unknown elements is not allowed`,
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 6: Invalid settings - should still work with defaults
const testInvalidSettings = () => {
  const settingsInvalid = {
    ...SETTINGS.flagAsExternal,
    "boundaries/flag-as-external": {
      unresolvableAlias: "yes" as unknown as boolean,
      inNodeModules: "foo" as unknown as boolean,
      outsideRootPath: "foo" as unknown as boolean,
      customSourcePatterns: {} as unknown as string[],
    },
  } as RuleTesterSettings;

  const ruleTester = createRuleTester(settingsInvalid);

  ruleTester.run(`${RULE} - invalid settings`, rule, {
    valid: [
      // Components can import helpers from same package (local, allowed)
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperA from 'package-a/helpers/helper-a'",
        options: [
          {
            default: "disallow",
            rules: [
              {
                from: [["components", { package: "a" }]],
                allow: [["helpers", { package: "a" }]],
              },
            ],
          },
        ],
      },
      // External dependencies still not controlled even with invalid settings
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [{ default: "disallow" }],
      },
    ],
    invalid: [],
  });
};

testDefaultSettings();
testOutsideRootPath();
testCustomSourcePatterns();
testInNodeModulesDisabled();
testUnresolvableAliasDisabled();
testInvalidSettings();
