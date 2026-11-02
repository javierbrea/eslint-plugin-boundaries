import type { Diagnostic } from "../Diagnostics";
import { RULE_NAMES_MAP, RULE_SHORT_NAMES_MAP } from "../Shared";
import type {
  RuleName,
  RuleOptionsWithPolicies,
  RuleOptionsPolicies,
} from "../Shared";

import {
  collectRuleWarningIndexes,
  detectLegacyTemplateSyntax,
  isRuleEffect,
  isRuleName,
  isRulePolicy,
  isRuleShortName,
  validateRuleOptions,
} from "./RuleOptions";

/**
 * Receives the title and the detail of each reported diagnostic, in order, as the ESLint plugin prints them.
 */
const reportedDiagnostic = jest.fn<void, [string, string | undefined]>();

/**
 * Base URL of the docs links that the diagnostics carry.
 */
const DOCS_URL = "https://www.jsboundaries.dev/docs";

/**
 * Validates rule options without the schema, as the ESLint plugin does, and reports their diagnostics.
 * @param options - The rule options.
 * @param ruleName - The rule name.
 * @param legacyWarnings - Whether to report deprecated syntax.
 * @returns The diagnostics.
 */
function validate(
  options: RuleOptionsWithPolicies | undefined,
  ruleName: RuleName,
  legacyWarnings: boolean
): Diagnostic[] {
  const diagnostics = validateRuleOptions(ruleName, options, {
    legacyWarnings,
    schema: false,
  });
  for (const { title, detail } of diagnostics) {
    reportedDiagnostic(title, detail);
  }
  return diagnostics;
}

describe("RuleOptions", () => {
  beforeEach(() => {
    reportedDiagnostic.mockClear();
  });

  describe("isRuleEffect", () => {
    it("returns true for 'allow'", () => {
      expect(isRuleEffect("allow")).toBe(true);
    });

    it("returns true for 'disallow'", () => {
      expect(isRuleEffect("disallow")).toBe(true);
    });

    it("returns false for an unrelated string", () => {
      expect(isRuleEffect("other")).toBe(false);
    });

    it("returns false for a non-string value", () => {
      expect(isRuleEffect(42)).toBe(false);
    });
  });

  describe("isRulePolicy (deprecated alias of isRuleEffect)", () => {
    it("returns true for 'allow'", () => {
      expect(isRulePolicy("allow")).toBe(true);
    });

    it("returns true for 'disallow'", () => {
      expect(isRulePolicy("disallow")).toBe(true);
    });

    it("returns false for an unrelated string", () => {
      expect(isRulePolicy("other")).toBe(false);
    });

    it("returns false for a non-string value", () => {
      expect(isRulePolicy(42)).toBe(false);
    });

    it("is the same function as isRuleEffect", () => {
      expect(isRulePolicy).toBe(isRuleEffect);
    });
  });

  describe("isRuleName", () => {
    it("returns true for a known rule name", () => {
      expect(isRuleName(RULE_NAMES_MAP.DEPENDENCIES)).toBe(true);
    });

    it("returns false for an unknown rule name", () => {
      expect(isRuleName("boundaries/unknown")).toBe(false);
    });
  });

  describe("isRuleShortName", () => {
    it("returns true for a known short rule name", () => {
      expect(isRuleShortName(RULE_SHORT_NAMES_MAP.DEPENDENCIES)).toBe(true);
    });

    it("returns false for an unknown short rule name", () => {
      expect(isRuleShortName("unknown")).toBe(false);
    });
  });

  describe("detectLegacyTemplateSyntax", () => {
    it("returns true when a string contains legacy template syntax", () => {
      expect(detectLegacyTemplateSyntax("hello ${name}")).toBe(true);
    });

    it("returns false when a string does not contain legacy template syntax", () => {
      expect(detectLegacyTemplateSyntax("hello {{name}}")).toBe(false);
    });

    it("returns true when any element in an array contains legacy syntax", () => {
      expect(detectLegacyTemplateSyntax(["a", "b ${c}"])).toBe(true);
    });

    it("returns false for an array without legacy syntax", () => {
      expect(detectLegacyTemplateSyntax(["a", "b"])).toBe(false);
    });

    it("returns false for null values", () => {
      expect(detectLegacyTemplateSyntax(null)).toBe(false);
    });

    it("returns true when an object value contains legacy syntax", () => {
      expect(detectLegacyTemplateSyntax({ from: "x ${y}", to: "z" })).toBe(
        true
      );
    });

    it("returns false for an object without legacy syntax", () => {
      expect(detectLegacyTemplateSyntax({ from: "x", to: "z" })).toBe(false);
    });

    it("returns false for a non-object, non-array, non-string value", () => {
      // @ts-expect-error Forcing an unsupported primitive to exercise the fallthrough branch
      expect(detectLegacyTemplateSyntax(42)).toBe(false);
    });

    it("returns false for an object with a property set to undefined", () => {
      // A JavaScript config can set a property to undefined, such as `path: someOptionalValue`
      const selector = {
        type: "components",
        path: undefined,
      } as unknown as Parameters<typeof detectLegacyTemplateSyntax>[0];

      expect(detectLegacyTemplateSyntax(selector)).toBe(false);
    });
  });

  describe("validateRuleOptions", () => {
    // Modern object-based selectors used as a neutral baseline that triggers
    // no warning, so each test can isolate the deprecation it exercises.
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };

    it("does nothing when options are undefined", () => {
      validate(undefined, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does nothing when options.policies is missing", () => {
      const options = {} as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does nothing when options.policies is not an array", () => {
      const options = {
        policies: "not-an-array",
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does not warn when no rule uses deprecated syntax", () => {
      const options = {
        policies: [
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does not flag an array of modern object selectors as legacy", () => {
      const options = {
        policies: [
          {
            from: [{ element: { type: "a" } }, { element: { type: "b" } }],
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("warns once about deprecated rule-level importKind and includes affected indices", () => {
      const rules: RuleOptionsPolicies[] = [
        { from: modernFrom, to: modernTo } as unknown as RuleOptionsPolicies,
        {
          from: modernFrom,
          to: modernTo,
          importKind: "type",
        } as unknown as RuleOptionsPolicies,
        {
          from: modernFrom,
          to: modernTo,
          importKind: "value",
        } as unknown as RuleOptionsPolicies,
      ];
      const options = { policies: rules } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining(`[${RULE_NAMES_MAP.DEPENDENCIES}]`),
        expect.stringContaining("dependency.kind")
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("1, 2");
    });

    it("warns about legacy string selector syntax in `from` for the dependencies rule", () => {
      const options = {
        policies: [
          { from: "helper", to: modernTo } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy string element selectors"),
        expect.stringContaining(
          "migration-guides/v5-to-v6/#object-based-elements-selector-syntax"
        )
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain(
        "1 policy at indices: 0"
      );
    });

    it("warns about legacy tuple selector syntax in `from`", () => {
      const options = {
        policies: [
          {
            from: ["helper", { family: "data" }],
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy tuple element selectors"),
        expect.stringContaining(
          "migration-guides/v5-to-v6/#object-based-elements-selector-syntax"
        )
      );
    });

    it("warns about an array of legacy string selectors", () => {
      const options = {
        policies: [
          {
            from: ["helper", "component"],
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy string element selectors"),
        expect.any(String)
      );
    });

    it("warns about an array mixing legacy tuple and string selectors", () => {
      const options = {
        policies: [
          {
            from: [["helper", { family: "data" }], "component"],
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      // The array contains both a tuple entry and a bare string entry, so both
      // kind-specific warnings fire for the same policy index.
      expect(reportedDiagnostic).toHaveBeenCalledTimes(2);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("legacy tuple element selectors"))
      ).toBe(true);
      expect(
        messages.some((m) => m.includes("legacy string element selectors"))
      ).toBe(true);
    });

    it("detects legacy string selector in `allow` for the dependencies rule", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            // A bare (non-array) string, as opposed to `["helpers"]`: a
            // single-item array is itself a distinct legacy tuple form (see
            // the dedicated test below), so this isolates the string kind.
            allow: "helpers",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      // A bare string in `allow` is both a legacy string selector and missing
      // the `to` wrapper, so both warnings fire.
      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("legacy string element selectors"))
      ).toBe(true);
      expect(
        messages.some((m) => m.includes('without a "from"/"to" wrapper'))
      ).toBe(true);
    });

    it("detects a legacy single-item array selector in `disallow` for the element-types rule", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            disallow: ["helpers"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ELEMENT_TYPES, true);

      // `["helpers"]` is the most common v5 shape. The tuple classification is
      // gated on the two-item form, so a single-item array falls through to
      // array recursion and is reported as a string selector instead — its
      // message and anchor fit it exactly, unlike the tuple example, which
      // shows captured values the user never wrote. It is also missing the
      // `to` wrapper.
      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("legacy string element selectors"))
      ).toBe(true);
      expect(
        messages.some((m) => m.includes('without a "from"/"to" wrapper'))
      ).toBe(true);
    });

    it("detects legacy string selector in `target` for the entry-point rule", () => {
      const options = {
        policies: [
          {
            target: "components",
            allow: ["**/index.ts"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ENTRY_POINT, true);

      // `entry-point` is not in the entity-allow/disallow rule set, so only the
      // `target` field is scanned and no wrapper warning applies.
      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy string element selectors"),
        expect.any(String)
      );
    });

    it("warns when an element selector is used directly as an entity selector in `from`", () => {
      const options = {
        policies: [
          {
            from: { type: "components" },
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining(
          "element selectors used directly as entity selectors"
        ),
        expect.stringContaining("migration-guides/v6-to-v7/#entity-selectors")
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("indices: 0");
    });

    it("warns when an element selector is used directly as an entity selector in `allow`", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            allow: { type: "helpers" },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ELEMENT_TYPES, true);

      // An unwrapped element selector in `allow` is both a flat-element legacy
      // selector and missing the `to` wrapper, so both warnings fire.
      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) =>
          m.includes("element selectors used directly as entity selectors")
        )
      ).toBe(true);
      expect(
        messages.some((m) => m.includes('without a "from"/"to" wrapper'))
      ).toBe(true);
    });

    it("warns only about the missing wrapper when `allow` uses a modern element selector without `to`", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            allow: [{ element: { type: "helper" } }],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      // { element: { type: "helper" } } is a modern entity selector, so it is
      // not a legacy selector kind — only the missing-wrapper warning applies.
      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining('without a "from"/"to" wrapper'),
        // cspell:ignore allowdisallow -- documentation anchor for the deprecated bare allow/disallow selector
        expect.stringContaining(
          "migration-guides/v5-to-v6/#to-property-in-allowdisallow-rules-is-now-required"
        )
      );
    });

    it("does NOT warn when `allow` entries are properly wrapped entity selectors", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            allow: [{ to: { element: { type: "helper" } } }],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("warns about both the string kind and the flat-element kind for a mixed `from` array", () => {
      const options = {
        policies: [
          {
            // A 2-item array whose second entry has a non-string-only shape is
            // NOT reinterpreted as a `[type, captured]` tuple (unlike
            // `["helper", { type: "component" }]`, which the underlying
            // `@boundaries/elements` guard treats as a tuple since a plain
            // `{ type: "..." }` also satisfies the captured-values shape), so
            // each array entry is classified independently.
            from: ["helper", { type: "component", parent: { type: "x" } }],
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(2);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("legacy string element selectors"))
      ).toBe(true);
      expect(
        messages.some((m) =>
          m.includes("element selectors used directly as entity selectors")
        )
      ).toBe(true);
    });

    it("falls back to the generic legacy-selector warning for an unclassified hybrid selector", () => {
      const options = {
        policies: [
          {
            from: { element: { type: "a" }, type: "b" },
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      // The gate detects legacy syntax (the top-level `type` makes it a legacy
      // element selector), but it matches none of the specific kinds since it
      // is also a valid modern entity selector (has an `element` key).
      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("Detected legacy selector syntax"),
        expect.stringContaining("migration-guides/v6-to-v7/#entity-selectors")
      );
    });

    it("does NOT flag a modern entity selector (wrapped in `element`) as legacy", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does NOT flag `allow`/`disallow` as legacy selectors for the external rule (external lib names)", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            allow: ["lodash"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.EXTERNAL, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does NOT flag `allow`/`disallow` as legacy selectors for the entry-point rule (file globs)", () => {
      const options = {
        policies: [
          {
            target: { element: { type: "a" } },
            allow: ["**/index.ts"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ENTRY_POINT, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("aggregates indices of multiple rules with legacy selectors", () => {
      const options = {
        policies: [
          { from: "helper", to: modernTo } as unknown as RuleOptionsPolicies,
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsPolicies,
          { from: "component", to: modernTo } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("0, 2");
    });

    it("warns about legacy template syntax in `from` for the dependencies rule", () => {
      const options = {
        policies: [
          {
            from: { element: { type: "Comp${name}" } },
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.stringContaining("{{...}}")
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("indices: 0");
    });

    it("detects legacy template syntax recursively inside nested `to` selectors", () => {
      const options = {
        policies: [
          {
            to: { element: { path: "x/${cat}" } },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.any(String)
      );
    });

    it("detects legacy template syntax in the `dependency` selector", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            dependency: { kind: "value-${kind}" },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.any(String)
      );
    });

    it("detects legacy template syntax in `allow` for the dependencies rule", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            allow: ["b/${captured}"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      // A single-entry array in `allow` is also a legacy string selector (the
      // one-item array form falls through to array recursion rather than
      // being classified as a tuple) and is missing the `to` wrapper, so both
      // additionally fire alongside the template warning.
      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("legacy template syntax ${...}"))
      ).toBe(true);
      expect(
        messages.some((m) => m.includes("legacy string element selectors"))
      ).toBe(true);
      expect(
        messages.some((m) => m.includes('without a "from"/"to" wrapper'))
      ).toBe(true);
      expect(reportedDiagnostic).toHaveBeenCalledTimes(3);
    });

    it("detects legacy template syntax in `disallow` for the element-types rule", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            disallow: ["x/${y}"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ELEMENT_TYPES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("legacy template syntax ${...}"))
      ).toBe(true);
    });

    it("does NOT scan `allow`/`disallow` templates for the external rule (external lib names)", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            disallow: ["lodash/${sub}"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.EXTERNAL, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does NOT scan `allow`/`disallow` templates for the entry-point rule (file globs)", () => {
      const options = {
        policies: [
          {
            target: { element: { type: "a" } },
            disallow: ["**/${private}/**"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ENTRY_POINT, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("detects legacy template syntax in `target` for the entry-point rule", () => {
      const options = {
        policies: [
          {
            target: { element: { type: "Comp${x}" } },
            allow: ["**/index.ts"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ENTRY_POINT, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.any(String)
      );
    });

    it("aggregates indices of multiple rules with legacy template syntax", () => {
      const options = {
        policies: [
          {
            from: { element: { type: "a${b}" } },
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsPolicies,
          {
            from: modernFrom,
            dependency: { kind: "y${z}" },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("0, 2");
    });

    it("emits both legacy template and deprecated importKind warnings when applicable", () => {
      const options = {
        policies: [
          {
            from: { element: { type: "a${b}" } },
            to: modernTo,
            importKind: "type",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(2);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(messages.some((m) => m.includes("legacy template syntax"))).toBe(
        true
      );
      expect(messages.some((m) => m.includes('"importKind"'))).toBe(true);
    });

    it("warns about legacy template syntax ${...} in a policy-level `message`", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: modernTo,
            message: "${from.type} cannot import ${to.type}",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.stringContaining("{{...}}")
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("indices: 0");
    });

    it("does NOT warn about a policy-level `message` using modern {{...}} syntax", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: modernTo,
            message:
              "{{from.element.types.[0]}} cannot import {{to.element.types.[0]}}",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("warns about legacy template syntax ${...} in the rule's general `message`", () => {
      const options = {
        message: "${from.type} cannot import ${to.type}",
        policies: [
          {
            from: modernFrom,
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.stringContaining("{{...}}")
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain(
        "general 'message'"
      );
    });

    it("does NOT warn about legacy template syntax when `legacyWarnings` is false", () => {
      const options = {
        message: "${from.type} cannot import ${to.type}",
        policies: [
          {
            from: modernFrom,
            to: modernTo,
            message: "${from.type} cannot import ${to.type}",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("warns about deprecated v7 selector property 'category' in `from`", () => {
      const options = {
        policies: [
          {
            from: { element: { category: "domain" } },
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining(
          "deprecated selector properties (category, elementPath, filePath)"
        ),
        expect.stringContaining("deprecated-element-selector-properties")
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("indices: 0");
    });

    it("detects deprecated v7 selector property 'elementPath' nested in `to`", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: { element: { elementPath: "src/**" } },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("deprecated selector properties"))
      ).toBe(true);
    });

    it("detects deprecated v7 selector property 'filePath' nested in `to`", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: { file: { filePath: "src/**" } },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes("deprecated selector properties"))
      ).toBe(true);
    });

    it("does not warn about deprecated v7 selector properties when none are used", () => {
      const options = {
        policies: [
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("warns about deprecated 'dependency.module' property", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            dependency: { module: "lodash" },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining('deprecated "dependency.module" property'),
        expect.stringContaining('"to.module.source"')
      );
      expect(
        reportedDiagnostic.mock.calls.some((call) =>
          call[0].includes("indices: 0")
        )
      ).toBe(true);
    });

    it("detects deprecated 'module' property in an array of dependency selectors", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            dependency: [{ kind: "value" }, { module: "lodash" }],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('deprecated "dependency.module"'))
      ).toBe(true);
    });

    it("does not warn about 'dependency.module' when the dependency selector omits it", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            dependency: { kind: "value" },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('deprecated "dependency.module"'))
      ).toBe(false);
    });

    it("does not warn about 'dependency.module' when dependency is a non-object primitive", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            dependency: null,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('deprecated "dependency.module"'))
      ).toBe(false);
    });
  });

  describe("deprecated internalPath in element selectors", () => {
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };

    it("warns when internalPath appears on a flat element selector at entity level", () => {
      const options = {
        policies: [
          {
            from: { type: "helper", internalPath: "src/**" },
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining('"internalPath" in element selectors'),
        expect.stringContaining("fileInternalPath")
      );
      expect(reportedDiagnostic.mock.calls[0][0]).toContain("indices: 0");
    });

    it("warns when internalPath appears inside an element sub-selector of a modern entity selector", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: { element: { internalPath: "src/**" } },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(true);
    });

    it("does not warn when internalPath appears inside a module sub-selector (modern usage)", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: { module: { internalPath: "dist/**" } },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(false);
    });

    it("does not warn when no internalPath is present", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(false);
    });

    it("warns when internalPath appears in an array of element selectors inside a modern entity selector", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: { element: [{ internalPath: "src/**" }, { type: "b" }] },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(true);
    });

    it("does not warn when the element sub-selector value is a non-object primitive", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: { element: null },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      const messages = reportedDiagnostic.mock.calls.map((call) => call[0]);

      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(false);
    });
  });

  describe("validateRuleOptions legacyWarnings", () => {
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };

    it("skips detection work entirely when legacyWarnings is false: no warnOnce calls despite legacy patterns", () => {
      // collectRuleWarningIndexes is exported so that callers can verify it is
      // not invoked. Here we verify the behavioral guarantee: when the flag is
      // set, validateAndWarnRuleOptions returns before calling the detection
      // loop, so warnOnce is never reached.
      const options = {
        policies: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
      // Confirm the exported symbol is accessible (required for integration tests
      // where callers can spy on the module namespace object if needed).
      expect(collectRuleWarningIndexes).toBeInstanceOf(Function);
    });

    it("does not emit any warnOnce call when legacyWarnings is false and legacy patterns are present", () => {
      const options = {
        policies: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
          {
            from: modernFrom,
            to: modernTo,
            importKind: "type",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does not emit any warning when legacyWarnings is false", () => {
      const options = {
        policies: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("emits legacy-pattern warnings when legacy patterns are present and legacyWarnings is true", () => {
      const options = {
        policies: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateRuleOptions invalid selector shapes", () => {
    const RULE = RULE_NAMES_MAP.DEPENDENCIES;
    const invalidSelector = { notAnEntitySelectorKey: true };
    const validEntry = { element: { type: "b" } };

    it.each(["from", "to", "dependency", "allow", "disallow"])(
      "reports the '%s' property alone when it is the only one with an unrecognized shape",
      (property) => {
        const options = {
          policies: [{ [property]: invalidSelector }],
        } as unknown as RuleOptionsWithPolicies;

        const result = validate(options, RULE, false);

        expect(result).toEqual([
          {
            level: "warning",
            title: `[${RULE}] Detected an unrecognized selector shape in 1 policy at indices: 0.`,
            detail: `Check the '${property}' property. More info: https://www.jsboundaries.dev/docs/rules/dependencies/`,
            paths: [["policies", 0]],
          },
        ]);
      }
    );

    it("lists every property with an unrecognized shape in the policies, in a fixed order, and counts the policies", () => {
      const options = {
        policies: [
          {
            disallow: invalidSelector,
            allow: invalidSelector,
            dependency: invalidSelector,
            to: invalidSelector,
            from: invalidSelector,
          },
          { from: validEntry },
          { from: invalidSelector },
        ],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, false);

      expect(result).toEqual([
        {
          level: "warning",
          title: `[${RULE}] Detected an unrecognized selector shape in 2 policies at indices: 0, 2.`,
          detail: `Check the 'from', 'to', 'dependency', 'allow' and 'disallow' properties. More info: https://www.jsboundaries.dev/docs/rules/dependencies/`,
          paths: [
            ["policies", 0],
            ["policies", 2],
          ],
        },
      ]);
    });

    it("checks every entry of an array of 'allow' selectors", () => {
      const options = {
        policies: [
          { from: validEntry, allow: [{ to: validEntry }, invalidSelector] },
        ],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, false);

      expect(result).toEqual([
        expect.objectContaining({
          level: "warning",
          detail: expect.stringContaining("Check the 'allow' property."),
          paths: [["policies", 0]],
        }),
      ]);
    });

    it("accepts an array of 'allow' selectors that mixes dependency selectors and entity selectors", () => {
      const options = {
        policies: [
          { from: validEntry, allow: [{ to: validEntry }, validEntry] },
        ],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, false);

      expect(result).toEqual([]);
    });

    it("does not take the 'allow' of the external rule, which lists libraries and their specifiers, for entity selectors", () => {
      const options = {
        policies: [
          {
            from: "components",
            allow: [["lodash", { specifiers: ["chunk"] }]],
          },
        ],
      };

      // The schema validation passes, so the options are valid for the external rule
      const result = validateRuleOptions(RULE_NAMES_MAP.EXTERNAL, options, {
        legacyWarnings: false,
      });

      expect(result).toEqual([]);
    });

    it("does not also warn about a missing wrapper when 'allow' has an unrecognized shape", () => {
      const options = {
        policies: [
          {
            from: { element: { type: "a" } },
            allow: { notAValidTarget: true },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      // legacyWarnings: true also runs the wrapper check, which would
      // otherwise fire on top of the invalid-shape warning for the same
      // malformed value, with a suggested fix that does not apply to it.
      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("unrecognized selector shape"),
        expect.any(String)
      );
    });

    it("does not warn when 'from'/'to'/'allow' use recognized modern or legacy shapes", () => {
      const options = {
        policies: [
          {
            from: { element: { type: "a" } },
            to: "legacy-matcher",
            allow: [{ element: { type: "b" } }],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("does not check selector shapes for rules outside dependencies/element-types", () => {
      const options = {
        policies: [
          {
            target: { notAnEntitySelectorKey: true },
            allow: "*",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });
  });

  describe("validateRuleOptions 'rules' option alias", () => {
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };
    const entry = {
      from: modernFrom,
      to: modernTo,
    } as unknown as RuleOptionsPolicies;

    it("does not warn about the 'rules' alias when 'policies' is used", () => {
      const options = {
        policies: [entry],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("warns once that the 'rules' option is deprecated when only 'rules' is used, with the link to the rename in the v7 migration guide", () => {
      const options = {
        rules: [entry],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(result).toEqual([
        {
          level: "deprecation",
          title: `[${RULE_NAMES_MAP.DEPENDENCIES}] The 'rules' option is deprecated.`,
          detail: `Please use 'policies' instead. More info: ${DOCS_URL}/releases/migration-guides/v6-to-v7/#rules-option-renamed-to-policies`,
          paths: [["rules"]],
        },
      ]);
    });

    it("does not warn about the 'rules' alias when legacyWarnings is false", () => {
      const options = {
        rules: [entry],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });

    it("evaluates deprecated-syntax entries from 'rules' when 'policies' is not set", () => {
      const options = {
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      // One warning for the deprecated 'rules' option itself, one for the legacy selector syntax.
      expect(reportedDiagnostic).toHaveBeenCalledTimes(2);
    });

    it("still warns that 'rules' is deprecated and ignored when 'policies' is also set, with the link to the rename in the v7 migration guide", () => {
      const options = {
        policies: [entry],
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      // 'policies' entries contain no deprecated syntax, so the only warning is
      // that 'rules' is deprecated and will be ignored.
      expect(result).toEqual([
        {
          level: "warning",
          title: `[${RULE_NAMES_MAP.DEPENDENCIES}] The 'rules' option is deprecated and will be ignored because 'policies' is also defined.`,
          detail: `You can safely remove the 'rules' option. More info: ${DOCS_URL}/releases/migration-guides/v6-to-v7/#rules-option-renamed-to-policies`,
          paths: [["rules"]],
        },
      ]);
    });

    it("does not warn about the 'rules' alias when legacyWarnings is false, even if 'policies' is also set", () => {
      const options = {
        policies: [entry],
        rules: [entry],
      } as unknown as RuleOptionsWithPolicies;

      validate(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });
  });

  describe("validateRuleOptions levels and paths", () => {
    const allowToB = { to: { element: { type: "b" } } };

    it("validates the options against the rule schema by default", () => {
      const result = validateRuleOptions(
        RULE_NAMES_MAP.DEPENDENCIES,
        { policies: [{ from: "a", allow: allowToB }], foo: true },
        { legacyWarnings: true }
      );

      expect(result).toEqual([
        {
          level: "error",
          title: `[${RULE_NAMES_MAP.DEPENDENCIES}] Invalid rule options.`,
          detail: expect.stringContaining('Unexpected property "foo".'),
          paths: [[]],
        },
      ]);
    });

    it("returns the paths of the schema errors from the root of the options", () => {
      const result = validateRuleOptions(
        RULE_NAMES_MAP.DEPENDENCIES,
        { policies: [{ allow: allowToB, message: 1 }] },
        { legacyWarnings: true }
      );

      expect(result[0].paths).toEqual([["policies", 0, "message"]]);
    });

    it("runs the policy checks when the options pass the rule schema", () => {
      const result = validateRuleOptions(
        RULE_NAMES_MAP.DEPENDENCIES,
        { policies: [{ from: "a", allow: allowToB }] },
        { legacyWarnings: true }
      );

      expect(result).toEqual([
        expect.objectContaining({
          level: "deprecation",
          paths: [["policies", 0]],
        }),
      ]);
    });

    it("validates missing options against the rule schema", () => {
      const result = validateRuleOptions(
        RULE_NAMES_MAP.NO_UNKNOWN_FILES,
        undefined,
        { legacyWarnings: true }
      );

      expect(result).toEqual([]);
    });

    it("returns no diagnostics for options that are not an object when the schema is not validated", () => {
      const result = validateRuleOptions(
        RULE_NAMES_MAP.DEPENDENCIES,
        "options",
        {
          legacyWarnings: true,
          schema: false,
        }
      );

      expect(result).toEqual([]);
    });

    it("returns a warning for unrecognized selector shapes, with one path per policy", () => {
      const result = validate(
        {
          policies: [
            { from: { foo: true }, allow: allowToB },
            { allow: allowToB },
            { to: { bar: true }, allow: allowToB },
          ],
        } as unknown as RuleOptionsWithPolicies,
        RULE_NAMES_MAP.DEPENDENCIES,
        true
      );

      expect(result).toEqual([
        expect.objectContaining({
          level: "warning",
          paths: [
            ["policies", 0],
            ["policies", 2],
          ],
        }),
      ]);
    });

    it("returns the paths under 'rules' when the deprecated option is used", () => {
      const result = validate(
        {
          rules: [{ from: "a", allow: allowToB }],
        } as unknown as RuleOptionsWithPolicies,
        RULE_NAMES_MAP.DEPENDENCIES,
        true
      );

      expect(result).toEqual([
        expect.objectContaining({
          level: "deprecation",
          title: `[${RULE_NAMES_MAP.DEPENDENCIES}] The 'rules' option is deprecated.`,
          paths: [["rules"]],
        }),
        expect.objectContaining({
          level: "deprecation",
          paths: [["rules", 0]],
        }),
      ]);
    });

    it("returns a warning when the deprecated 'rules' option is ignored", () => {
      const result = validate(
        {
          policies: [{ allow: allowToB }],
          rules: [{ allow: allowToB }],
        } as unknown as RuleOptionsWithPolicies,
        RULE_NAMES_MAP.DEPENDENCIES,
        true
      );

      expect(result).toEqual([
        expect.objectContaining({ level: "warning", paths: [["rules"]] }),
      ]);
    });

    it("returns the path of the general message when it uses legacy template syntax", () => {
      const result = validate(
        {
          policies: [{ allow: allowToB }],
          message: "${from.type}",
        } as unknown as RuleOptionsWithPolicies,
        RULE_NAMES_MAP.DEPENDENCIES,
        true
      );

      expect(result).toEqual([
        expect.objectContaining({ level: "deprecation", paths: [["message"]] }),
      ]);
    });
  });

  describe("validateRuleOptions texts of the deprecation diagnostics", () => {
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };
    const RULE = RULE_NAMES_MAP.DEPENDENCIES;

    it("reports the legacy template syntax of the policies with the link to the new template syntax", () => {
      const options = {
        policies: [
          { from: { element: { type: "a${b}" } }, to: modernTo },
          { from: modernFrom, to: modernTo },
          { from: { element: { type: "c${d}" } }, to: modernTo },
        ],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, true);

      expect(result).toEqual([
        {
          level: "deprecation",
          title: `[${RULE}] Detected legacy template syntax \${...} in 2 policies at indices: 0, 2.`,
          detail: `Consider migrating to {{...}} syntax. More info: ${DOCS_URL}/releases/migration-guides/v5-to-v6/#new-template-syntax`,
          paths: [
            ["policies", 0],
            ["policies", 2],
          ],
        },
      ]);
    });

    it("reports the deprecated rule-level importKind with the link to its deprecation in the v6 migration guide", () => {
      const options = {
        policies: [
          { from: modernFrom, to: modernTo, importKind: "type" },
          { from: modernFrom, to: modernTo, importKind: "value" },
        ],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, true);

      expect(result).toEqual([
        {
          level: "deprecation",
          title: `[${RULE}] Detected deprecated rule-level "importKind" in 2 policies at indices: 0, 1.`,
          detail: `Use selector-level "dependency.kind" instead. When both are defined, "dependency.kind" takes precedence. More info: ${DOCS_URL}/releases/migration-guides/v5-to-v6/#rule-level-importkind-is-deprecated`,
          paths: [
            ["policies", 0],
            ["policies", 1],
          ],
        },
      ]);
    });

    it("reports the deprecated 'dependency.module' property with the link to its deprecation in the v7 migration guide", () => {
      const options = {
        policies: [{ from: modernFrom, dependency: { module: "lodash" } }],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, true);

      // cspell:ignore dependencymodule -- documentation anchor for the deprecated dependency.module property
      expect(result).toEqual([
        {
          level: "deprecation",
          title: `[${RULE}] Detected deprecated "dependency.module" property in 1 policy at indices: 0.`,
          detail: `Use "to.module.source" instead. More info: ${DOCS_URL}/releases/migration-guides/v6-to-v7/#deprecated-dependencymodule`,
          paths: [["policies", 0]],
        },
      ]);
    });

    it("reports the deprecated element-level 'internalPath' with the link to the deprecated selector properties", () => {
      const options = {
        policies: [
          { from: modernFrom, to: { type: "b", internalPath: "src/**" } },
        ],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, true);

      expect(result).toContainEqual({
        level: "deprecation",
        title: `[${RULE}] Detected deprecated "internalPath" in element selectors in 1 policy at indices: 0.`,
        detail: `Use "fileInternalPath" for local element paths, or the module sub-selector "internalPath" for external modules. More info: ${DOCS_URL}/selectors/element/#deprecated-element-selector-properties`,
        paths: [["policies", 0]],
      });
    });

    it("reports the legacy template syntax of the general 'message' with the link to the new template syntax", () => {
      const options = {
        message: "${from.type} cannot import ${to.type}",
        policies: [{ from: modernFrom, to: modernTo }],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, true);

      expect(result).toEqual([
        {
          level: "deprecation",
          title: `[${RULE}] Detected legacy template syntax \${...} in the rule's general 'message'.`,
          detail: `Consider migrating to {{...}} syntax. More info: ${DOCS_URL}/releases/migration-guides/v5-to-v6/#new-template-syntax`,
          paths: [["message"]],
        },
      ]);
    });

    it("does not report the general 'message' when it uses the {{...}} template syntax", () => {
      const options = {
        message: "{{from.element.type}} cannot import {{to.element.type}}",
        policies: [{ from: modernFrom, to: modernTo }],
      } as unknown as RuleOptionsWithPolicies;

      const result = validate(options, RULE, true);

      expect(result).toEqual([]);
    });
  });

  describe("validateRuleOptions deprecated syntax detection", () => {
    const RULE = RULE_NAMES_MAP.DEPENDENCIES;
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };

    /**
     * Returns the titles of the diagnostics that validating the policies reports.
     * @param policies - The policies to validate.
     * @returns The titles.
     */
    function titlesOf(policies: unknown[]): string[] {
      return validate(
        { policies } as unknown as RuleOptionsWithPolicies,
        RULE,
        true
      ).map(({ title }) => title);
    }

    it("detects a deprecated selector property in any selector of an array of entity selectors", () => {
      const titles = titlesOf([
        {
          from: [{ element: { category: "domain" } }, modernFrom],
          to: modernTo,
        },
      ]);

      expect(titles).toEqual([
        `[${RULE}] Detected deprecated selector properties (category, elementPath, filePath) in 1 policy at indices: 0.`,
      ]);
    });

    it("detects a deprecated selector property in any sub-selector of an entity selector", () => {
      const titles = titlesOf([
        {
          from: { element: { category: "domain" }, file: { path: "src/**" } },
          to: modernTo,
        },
      ]);

      expect(titles).toEqual([
        `[${RULE}] Detected deprecated selector properties (category, elementPath, filePath) in 1 policy at indices: 0.`,
      ]);
    });

    it("does not take the captured values of an element selector for deprecated selector properties", () => {
      const titles = titlesOf([
        {
          from: { element: { type: "a", captured: { category: "atoms" } } },
          to: modernTo,
        },
      ]);

      expect(titles).toEqual([]);
    });

    it("does not detect deprecated selector properties that are set to undefined", () => {
      const titles = titlesOf([
        {
          from: { element: { type: "a", category: undefined } },
          to: modernTo,
          dependency: { module: undefined },
        },
      ]);

      expect(titles).toEqual([]);
    });

    it("detects a deprecated element-level 'internalPath' in any selector of an array of flat element selectors", () => {
      const titles = titlesOf([
        {
          from: [{ type: "a", internalPath: "src/**" }, { type: "b" }],
          to: modernTo,
        },
      ]);

      expect(titles).toEqual([
        `[${RULE}] Detected element selectors used directly as entity selectors in 1 policy at indices: 0.`,
        `[${RULE}] Detected deprecated "internalPath" in element selectors in 1 policy at indices: 0.`,
      ]);
    });

    it("does not detect an 'internalPath' set to undefined in a flat element selector", () => {
      const titles = titlesOf([
        { from: modernFrom, to: { type: "b", internalPath: undefined } },
      ]);

      expect(titles).toEqual([
        `[${RULE}] Detected element selectors used directly as entity selectors in 1 policy at indices: 0.`,
      ]);
    });

    it("does not detect an 'internalPath' set to undefined in the element sub-selector of an entity selector", () => {
      const titles = titlesOf([
        {
          from: modernFrom,
          to: { element: { type: "b", internalPath: undefined } },
        },
      ]);

      expect(titles).toEqual([]);
    });

    it("does not take an 'internalPath' next to the file sub-selector for a deprecated element-level one", () => {
      const titles = titlesOf([
        {
          from: modernFrom,
          to: { file: { categories: "test" }, internalPath: "src/**" },
        },
      ]);

      expect(titles).toEqual([
        `[${RULE}] Detected legacy selector syntax in 1 policy at indices: 0.`,
      ]);
    });

    it("does not take an 'internalPath' next to the module sub-selector for a deprecated element-level one", () => {
      const titles = titlesOf([
        {
          from: modernFrom,
          to: { module: { source: "lodash" }, internalPath: "src/**" },
        },
      ]);

      expect(titles).toEqual([
        `[${RULE}] Detected legacy selector syntax in 1 policy at indices: 0.`,
      ]);
    });

    it("detects an 'allow' array with an entry that lacks the 'to' wrapper next to wrapped entries", () => {
      const titles = titlesOf([
        {
          from: modernFrom,
          allow: [{ to: modernTo }, { element: { type: "c" } }],
        },
      ]);

      expect(titles).toEqual([
        `[${RULE}] Detected "allow"/"disallow" entries without a "from"/"to" wrapper in 1 policy at indices: 0.`,
      ]);
    });

    it("writes 'policies' in the plural for several policies and 'policy' for one", () => {
      const severalTitles = titlesOf([
        { from: "a", to: modernTo },
        { from: "b", to: modernTo },
      ]);
      const oneTitles = titlesOf([{ from: "a", to: modernTo }]);

      expect(severalTitles).toEqual([
        `[${RULE}] Detected legacy string element selectors in 2 policies at indices: 0, 1.`,
      ]);
      expect(oneTitles).toEqual([
        `[${RULE}] Detected legacy string element selectors in 1 policy at indices: 0.`,
      ]);
    });
  });
});
