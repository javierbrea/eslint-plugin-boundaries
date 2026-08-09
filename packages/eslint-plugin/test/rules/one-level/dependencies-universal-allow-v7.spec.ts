import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import { elementTypesNoRuleMessage } from "../../support/messages";

// Regression coverage for a policy that has neither `from` nor `to` at the policy level —
// a "universal" policy that only scopes the dependency target via `allow`/`disallow` — using
// both the modern wrapped form (`allow: { to: { element: { type: "helpers" } } }`) and the
// legacy bare form kept for backward compatibility (`allow: { element: { type: "helpers" } }`).
//
// The bare form used to be mishandled by `buildEntrySelector`: with neither `from` nor `to`
// fixed at the policy level, it fell into the "opposite direction" branch and put the bare
// selector into `from` instead of `to`, inverting the policy's meaning, and also left a
// present-but-`undefined` `from`/`to` property on the built selector, which
// `@boundaries/elements` rejects as an invalid dependency selector shape (crashing the match
// for every dependency evaluated against that policy). Both cases below must behave
// identically: any element may import the target type, and imports to any other type are
// still denied by the `disallow` default.

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("one-level");

const runScenario = (allow: unknown) => {
  const ruleTester = createRuleTester(SETTINGS.oneLevel);

  ruleTester.run(RULE, rule, {
    valid: [
      // A component may import a helper: the universal policy only scopes "to", not "from".
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [{ default: "disallow", policies: [{ allow }] }],
      },
      // A module may also import a helper: proves the policy is NOT scoped by "from" (the
      // legacy inversion bug would only have allowed this if "from" happened to be "helpers").
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import HelperA from 'helpers/helper-a'",
        options: [{ default: "disallow", policies: [{ allow }] }],
      },
      // A helper may import another helper: "from" type "helpers" is also unconstrained.
      {
        filename: absoluteFilePath("helpers/helper-b/HelperB.js"),
        code: "import HelperA from '../helper-a'",
        options: [{ default: "disallow", policies: [{ allow }] }],
      },
    ],
    invalid: [
      // A component importing a module is still denied: the universal policy only allows
      // dependencies whose target is of type "helpers".
      {
        filename: absoluteFilePath("components/component-a/ComponentA.js"),
        code: "import ModuleA from 'modules/module-a'",
        options: [{ default: "disallow", policies: [{ allow }] }],
        errors: [
          {
            message: elementTypesNoRuleMessage({
              file: '"components" and captured values: elementName="component-a"',
              dep: '"modules" and captured values: elementName="module-a"',
            }),
            type: "Literal",
          },
        ],
      },
      // A module importing a component is denied for the same reason, confirming the target
      // scoping is symmetric regardless of which element type is doing the importing.
      {
        filename: absoluteFilePath("modules/module-a/ModuleA.js"),
        code: "import ComponentA from 'components/component-a'",
        options: [{ default: "disallow", policies: [{ allow }] }],
        errors: [
          {
            message: elementTypesNoRuleMessage({
              file: '"modules" and captured values: elementName="module-a"',
              dep: '"components" and captured values: elementName="component-a"',
            }),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

describe("universal allow with modern wrapped selector", () => {
  runScenario({ to: { element: { type: "helpers" } } });
});

describe("universal allow with legacy bare selector (backward compatible)", () => {
  runScenario({ element: { type: "helpers" } });
});

describe("universal allow with legacy element selector (backward compatible)", () => {
  runScenario({ type: "helpers" });
});

describe("universal allow with legacy string selector (backward compatible)", () => {
  runScenario("helpers");
});
