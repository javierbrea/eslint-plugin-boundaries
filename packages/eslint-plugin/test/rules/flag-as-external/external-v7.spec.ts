import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const rule = ruleFactory();
const { absoluteFilePath } = pathResolvers("flag-as-external");

// Test 1: Default settings (inNodeModules + unresolvableAlias enabled)
// Tests that node_modules and unresolvable imports are controlled as external
const testDefaultSettings = () => {
  const ruleTester = createRuleTester(SETTINGS.flagAsExternal);

  ruleTester.run(`${RULE} - default settings`, rule, {
    valid: [
      // Without options, all external imports are allowed
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
      },
      // Local imports are not controlled by external rule
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperA from 'package-a/helpers/helper-a'",
        options: [
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: [{ allow: [{ to: { module: { origin: "local" } } }] }],
          },
        ],
      },
      // Allowed external dependency from node_modules
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import eslint from 'eslint'",
        options: [
          {
            checkAllOrigins: true,
            default: "allow",
            policies: [
              {
                from: { element: { type: "components" } },
                disallow: [
                  {
                    to: {
                      module: { origin: "external", source: "micromatch" },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // Disallowed external dependency from node_modules
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import micromatch from 'micromatch'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "helpers" and captured values: package="a", elementName="helper-a" to entities of module with origin "external" and module source "micromatch"',
            type: "Literal",
          },
        ],
      },
      // Disallowed unresolvable dependency
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import UnknownPackage from 'unknown-package-xyz'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "helpers" and captured values: package="a", elementName="helper-a" to entities of module with origin "external" and module source "unknown-package-xyz"',
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 2: outsideRootPath enabled for package-a
// Tests that imports from package-b (outside root) are treated as external
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
      // Local imports within package-a are not controlled by external rule
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperA from 'package-a/helpers/helper-a'",
        options: [
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: [{ allow: [{ to: { module: { origin: "local" } } }] }],
          },
        ],
      },
      // Allowed external dependency from package-b (outside root)
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: [
              {
                from: { element: { type: "components" } },
                allow: [
                  {
                    to: { module: { origin: "external", source: "package-b" } },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // Disallowed external dependency from package-b (outside root)
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "components" and captured values: elementName="component-a" to entities of module with origin "external" and module source "package-b" being elements of type "helpers" and captured values: elementName="helper-b"',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [
          {
            checkAllOrigins: true,
            default: "allow",
            policies: [
              {
                from: { element: { type: "components" } },
                disallow: [
                  {
                    to: { module: { origin: "external", source: "package-b" } },
                  },
                ],
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with module source "package-b" to entities of module with origin "external" are not allowed in elements of type "components". Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      // Disallowed all external dependency from node_modules
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import micromatch from 'micromatch'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "helpers" and captured values: elementName="helper-a" to entities of module with origin "external" and module source "micromatch"',
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
      // Local imports within same package are not controlled by external rule
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperA from 'package-a/helpers/helper-a'",
        options: [
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: [{ allow: [{ to: { module: { origin: "local" } } }] }],
          },
        ],
      },
      // Allowed external dependency matching custom pattern
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [
          {
            checkAllOrigins: true,
            default: "allow",
            policies: [
              {
                from: { element: { type: "components" } },
                disallow: [
                  { to: { module: { origin: "external", source: "eslint" } } },
                ],
              },
            ],
          },
        ],
      },
      // Allowed external dependency matching custom pattern
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: [
              {
                from: { element: { type: "components" } },
                allow: [
                  {
                    to: { module: { origin: "external", source: "package-b" } },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      // Disallowed external dependency matching custom pattern
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "components" and captured values: package="a", elementName="component-a" to entities of module with origin "external" and module source "package-b" being elements of type "helpers" and captured values: package="b", elementName="helper-b"',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath(
          "package-a/components/component-a/ComponentA.js"
        ),
        code: "import HelperB from 'package-b/helpers/helper-b'",
        options: [
          {
            checkAllOrigins: true,
            default: "allow",
            policies: [
              {
                from: { element: { type: "components" } },
                disallow: [
                  {
                    to: { module: { origin: "external", source: "package-b" } },
                  },
                ],
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with module source "package-b" to entities of module with origin "external" are not allowed in elements of type "components". Denied by policy at index 0',
            type: "Literal",
          },
        ],
      },
      // Disallowed node_modules dependency
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import micromatch from 'micromatch'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "helpers" and captured values: package="a", elementName="helper-a" to entities of module with origin "external" and module source "micromatch"',
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 4: inNodeModules disabled
// Tests that node_modules are NOT flagged as external when disabled
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
      // node_modules imports are NOT controlled by external rule (not flagged)
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: [{ allow: [{ to: { module: { origin: "local" } } }] }],
          },
        ],
      },
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import micromatch from 'micromatch'",
        options: [
          {
            checkAllOrigins: true,
            default: "disallow",
            policies: [{ allow: [{ to: { module: { origin: "local" } } }] }],
          },
        ],
      },
    ],
    invalid: [
      // Unresolvable imports still flagged as external
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import UnknownPackage from 'unknown-package-xyz'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "any" to entities of module with origin "external" and module source "unknown-package-xyz"',
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// Test 5: unresolvableAlias disabled
// Tests that unresolvable imports are NOT flagged as external when disabled
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

  ruleTester.run(`${RULE} - unresolvableAlias disabled`, rule, {
    valid: [
      // Unresolvable imports are NOT controlled by external rule (not flagged)
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import UnknownPackage from 'unknown-package-xyz'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
      },
    ],
    invalid: [
      // node_modules imports still flagged as external
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import micromatch from 'micromatch'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "helpers" and captured values: package="a", elementName="helper-a" to entities of module with origin "external" and module source "micromatch"',
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
      // Should still work with defaults when settings are invalid
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [{ checkAllOrigins: true, default: "allow" }],
      },
    ],
    invalid: [
      // Should still control external dependencies with defaults
      {
        filename: absoluteFilePath("package-a/helpers/helper-a/HelperA.js"),
        code: "import eslint from 'eslint'",
        options: [{ checkAllOrigins: true, default: "disallow" }],
        errors: [
          {
            message:
              'There is no policy allowing dependencies from elements of type "helpers" and captured values: package="a", elementName="helper-a" to entities of module with origin "external" and module source "eslint"',
            type: "Literal",
          },
        ],
      },
    ],
  });
};

testDefaultSettings();
testOutsideRootPath();
testCustomSourcePatterns();
testInNodeModulesDisabled();
testUnresolvableAliasDisabled();
testInvalidSettings();
