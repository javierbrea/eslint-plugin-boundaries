import { Linter } from "eslint";

import ruleFactory from "../../../src/Rules/Dependencies";
import { SETTINGS, pathResolvers } from "../../support/helpers";

const { absoluteFilePath } = pathResolvers("one-level");
// `SETTINGS` types the `boundaries/*` settings as a `Linter.Config`, which `createRuleTester` passes as settings too
const settings = SETTINGS.oneLevel as unknown as Record<string, unknown>;

/**
 * Lints an import of a helper from a component with the dependencies rule. `RuleTester` cannot expect a rule to throw, so the file is linted with `Linter`.
 * @param options - The options of the rule.
 * @returns The messages of the lint.
 */
function lintComponentImportingHelper(options: Record<string, unknown>) {
  const linter = new Linter();
  return linter.verify(
    "import HelperA from '../../helpers/helper-a'",
    {
      plugins: { boundaries: { rules: { dependencies: ruleFactory() } } },
      languageOptions: { ecmaVersion: 2015, sourceType: "module" },
      settings,
      rules: { "boundaries/dependencies": [2, options] },
    },
    absoluteFilePath("components/component-a/ComponentA.js")
  );
}

describe("dependencies - custom messages that fail to render", () => {
  it("throws an error naming the message and its policy when the message of the policy fails to render", () => {
    const options = {
      default: "allow",
      policies: [
        {
          from: { element: { type: "components" } },
          disallow: { to: { element: { type: "modules" } } },
          message: "{{to.type}}",
        },
        {
          from: { element: { type: "components" } },
          disallow: { to: { element: { type: "helpers" } } },
          message: "{{foo from.type}}",
        },
      ],
    };

    const lint = () => lintComponentImportingHelper(options);

    expect(lint).toThrow(
      'The custom message "{{foo from.type}}" of the policy at index 1 failed to render: Missing helper: "foo"'
    );
  });

  it("throws an error naming the rule options when the message of the options fails to render", () => {
    const options = {
      default: "disallow",
      message: "{{#if from.type}}bad",
      policies: [],
    };

    const lint = () => lintComponentImportingHelper(options);

    expect(lint).toThrow(
      'The custom message "{{#if from.type}}bad" of the rule options failed to render: Parse error on line 1:'
    );
  });
});
