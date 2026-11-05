jest.mock("../../../src/Debug", () => ({
  ...jest.requireActual("../../../src/Debug"),
  warnDiagnostics: jest.fn(),
}));

import { moreInfoSettingsLink } from "@boundaries/config";
import { Linter } from "eslint";

import { warnDiagnostics } from "../../../src/Debug";
import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const rule = ruleFactory();
const warnDiagnosticsMock = jest.mocked(warnDiagnostics);
const { absoluteFilePath } = pathResolvers("one-level");

let testsCounter = 0;

const runTest = (
  settings: RuleTesterSettings,
  options: unknown[],
  {
    0: errorMessage0 = 'There is no policy allowing dependencies from elements of type "helpers" and captured values: elementName="helper-a" to elements of type "helpers" and captured values: elementName="helper-b"',
  }: Partial<Record<number, string>> = {}
) => {
  testsCounter++;
  const ruleTester = createRuleTester(settings);

  ruleTester.run(`${RULE} - ${testsCounter}`, rule, {
    // Everything is valid, as settings are wrong
    valid: [
      // Helpers can't import another if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        options: [
          {
            default: "disallow",
          },
        ],
      },
      // Helpers can't import another helper
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: 'import HelperB from "helpers/helper-b"',
        options,
      },
      // Helpers can't import a component:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ComponentA from 'components/component-a'",
        options,
      },
      // Helpers can't import a module:
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
      },
      // Components can't import a module:
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options,
      },
    ],
    invalid: [
      // Helpers can't import another if everything is disallowed
      {
        filename: absoluteFilePath("helpers/helper-a/HelperA.js"),
        code: "import HelperB from 'helpers/helper-b'",
        settings: SETTINGS.oneLevel,
        options: [
          {
            default: "disallow",
          },
        ],
        errors: [
          {
            message: errorMessage0,
            type: "Literal",
          },
        ],
      },
    ],
  });
};

// no element settings

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [],
  } as RuleTesterSettings,
  [
    {
      default: "disallow",
    },
  ],
  {}
);

// no type

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        pattern: "foo/*",
        capture: ["elementName"],
      },
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// no valid mode

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        mode: "foo",
      },
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// no valid capture

runTest(
  {
    ...SETTINGS.oneLevel,
    "boundaries/elements": [
      {
        pattern: "foo/*",
        capture: "foo",
      },
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// invalid dependency nodes

runTest(
  {
    "boundaries/dependency-nodes": [
      // valid
      "import",
      "export",
      "dynamic-import",
      { selector: "Selector", kind: "value" },
      { selector: "Selector", kind: "type" },
      // invalid
      "unknown-default-node",
      { selector: "Selector", kind: "unknown-kind" },
      { selector: 0, kind: "value" },
      { kind: "value" },
      { unknown: "object" },
      0, // invalid type
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// invalid additional dependency nodes

runTest(
  {
    "boundaries/additional-dependency-nodes": [
      // valid
      { selector: "Selector", kind: "value" },
      { selector: "Selector", kind: "type" },
      // invalid
      { selector: "Selector", kind: "unknown-kind" },
      { selector: 0, kind: "value" },
      { kind: "value" },
      { unknown: "object" },
      "import",
      "any-string",
      0,
    ],
  } as RuleTesterSettings,
  [],
  {}
);

// invalid additional dependency nodes - not an array
runTest(
  {
    "boundaries/additional-dependency-nodes": "invalid-value",
  } as RuleTesterSettings,
  [],
  {}
);

describe("dependencies - element descriptor whose capture is not an array", () => {
  it("warns, ignores the descriptor and checks the dependencies with the other descriptors", () => {
    // Arrange
    const linter = new Linter();
    const invalidDescriptor = {
      type: "foo",
      pattern: "foo/*",
      capture: "elementName",
    };
    const oneLevelSettings = SETTINGS.oneLevel as unknown as Record<
      string,
      unknown[]
    >;

    // Act
    const messages = linter.verify(
      "import HelperB from 'helpers/helper-b'",
      {
        files: ["**/*.js"],
        plugins: { boundaries: { rules: { dependencies: rule } } },
        settings: {
          ...oneLevelSettings,
          "boundaries/elements": [
            invalidDescriptor,
            ...oneLevelSettings["boundaries/elements"],
          ],
        },
        rules: { "boundaries/dependencies": [2, { default: "disallow" }] },
      },
      absoluteFilePath("helpers/helper-a/HelperA.js")
    );

    // Assert
    expect(messages).toEqual([
      expect.objectContaining({
        message:
          'There is no policy allowing dependencies from elements of type "helpers" and captured values: elementName="helper-a" to elements of type "helpers" and captured values: elementName="helper-b"',
      }),
    ]);
    expect(warnDiagnosticsMock).toHaveBeenCalledWith([
      {
        level: "warning",
        title: "Some element descriptors are invalid and will be ignored.",
        detail: `Invalid descriptors:\n${JSON.stringify([
          { match: "folder", ...invalidDescriptor },
        ])}.\n${moreInfoSettingsLink()}`,
        paths: [["boundaries/elements", 0]],
      },
    ]);
  });
});
