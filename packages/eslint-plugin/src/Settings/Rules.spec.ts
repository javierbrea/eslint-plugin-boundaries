jest.mock("../Debug", () => ({
  warnOnce: jest.fn(),
}));

import { warnOnce } from "../Debug";
import { RULE_NAMES_MAP, RULE_SHORT_NAMES_MAP } from "../Shared/Settings.types";
import type {
  RuleOptionsWithPolicies,
  RuleOptionsPolicies,
} from "../Shared/Settings.types";

import {
  collectRuleWarningIndexes,
  detectLegacyTemplateSyntax,
  isRuleEffect,
  isRuleName,
  isRulePolicy,
  isRuleShortName,
  legacyPoliciesSchema,
  rulesMainKey,
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
  warnMigrationToDependencies,
} from "./Rules";

const mockedWarnOnce = jest.mocked(warnOnce);

describe("Settings/Rules", () => {
  beforeEach(() => {
    mockedWarnOnce.mockClear();
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

  describe("rulesMainKey", () => {
    it("returns 'from' when no key is provided", () => {
      expect(rulesMainKey()).toBe("from");
    });

    it("returns the provided key when given", () => {
      expect(rulesMainKey("target")).toBe("target");
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
  });

  describe("warnMigrationToDependencies", () => {
    it("warns about deprecation and points to the dependencies rule", () => {
      warnMigrationToDependencies(RULE_NAMES_MAP.ELEMENT_TYPES);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(RULE_NAMES_MAP.ELEMENT_TYPES),
        expect.stringContaining(RULE_NAMES_MAP.DEPENDENCIES)
      );
    });
  });

  describe("validateAndWarnRuleOptions", () => {
    // Modern object-based selectors used as a neutral baseline that triggers
    // no warning, so each test can isolate the deprecation it exercises.
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };

    it("does nothing when options are undefined", () => {
      validateAndWarnRuleOptions(undefined, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does nothing when options.policies is missing", () => {
      const options = {} as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does nothing when options.policies is not an array", () => {
      const options = {
        policies: "not-an-array",
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does not warn when no rule uses deprecated syntax", () => {
      const options = {
        policies: [
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(`[${RULE_NAMES_MAP.DEPENDENCIES}]`),
        expect.stringContaining("dependency.kind")
      );
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("1, 2");
    });

    it("does not warn again for the same options object on subsequent invocations", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            to: modernTo,
            importKind: "type",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);
      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
    });

    it("warns about legacy string selector syntax in `from` for the dependencies rule", () => {
      const options = {
        policies: [
          { from: "helper", to: modernTo } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.stringContaining("object-based selectors")
      );
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("indices: 0");
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("warns about an array of legacy tuple selectors", () => {
      const options = {
        policies: [
          {
            from: [["helper", { family: "data" }], "component"],
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("detects legacy string selector in `allow` for the dependencies rule", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            allow: ["helpers"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("detects legacy selector in `disallow` for the element-types rule", () => {
      const options = {
        policies: [
          {
            from: modernFrom,
            disallow: ["helpers"],
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ELEMENT_TYPES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.EXTERNAL, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("aggregates indices of multiple rules with legacy selectors", () => {
      const options = {
        policies: [
          { from: "helper", to: modernTo } as unknown as RuleOptionsPolicies,
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsPolicies,
          { from: "component", to: modernTo } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("0, 2");
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.stringContaining("{{...}}")
      );
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("indices: 0");
    });

    it("detects legacy template syntax recursively inside nested `to` selectors", () => {
      const options = {
        policies: [
          {
            to: { element: { path: "x/${cat}" } },
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      // A legacy string array in `allow` is also a legacy selector, so it
      // additionally triggers the legacy-selector warning; assert the template
      // warning is present among the emitted warnings.
      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes("legacy template syntax ${...}"))
      ).toBe(true);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ELEMENT_TYPES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.EXTERNAL, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("0, 2");
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(2);
      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(messages.some((m) => m.includes("legacy template syntax"))).toBe(
        true
      );
      expect(messages.some((m) => m.includes('"importKind"'))).toBe(true);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(
          "deprecated selector properties (category, elementPath, filePath)"
        ),
        expect.stringContaining("deprecated-element-selector-properties")
      );
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("indices: 0");
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining('deprecated "dependency.module" property'),
        expect.stringContaining('"to.module.source"')
      );
      expect(
        mockedWarnOnce.mock.calls.some((call) => call[0].includes("indices: 0"))
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining('"internalPath" in element selectors'),
        expect.stringContaining("fileInternalPath")
      );
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("indices: 0");
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(false);
    });
  });

  describe("validateAndWarnRuleOptions disableLegacyWarnings", () => {
    const modernFrom = { element: { type: "a" } };
    const modernTo = { element: { type: "b" } };

    it("skips detection work entirely when disableLegacyWarnings is true: no warnOnce calls despite legacy patterns", () => {
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
      // Confirm the exported symbol is accessible (required for integration tests
      // where callers can spy on the module namespace object if needed).
      expect(collectRuleWarningIndexes).toBeInstanceOf(Function);
    });

    it("does not emit any warnOnce call when disableLegacyWarnings is true and legacy patterns are present", () => {
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does not emit any warning when disableLegacyWarnings is true", () => {
      const options = {
        policies: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("emits legacy-pattern warnings when legacy patterns are present and disableLegacyWarnings is false", () => {
      const options = {
        policies: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
    });

    it("still caches via WeakSet: second call with same options is skipped even when disableLegacyWarnings changes", () => {
      const options = {
        policies: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);
      mockedWarnOnce.mockClear();
      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });
  });

  describe("validateAndWarnRuleOptions invalid selector shapes", () => {
    it("warns once when a 'dependencies' policy has an unrecognized 'from' shape", () => {
      const options = {
        policies: [
          {
            from: { notAnEntitySelectorKey: true },
            to: { element: { type: "b" } },
            allow: "*",
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });
  });

  describe("validateAndWarnRuleOptions 'rules' option alias", () => {
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("warns once that the 'rules' option is deprecated when only 'rules' is used", () => {
      const options = {
        rules: [entry],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("'rules' option is deprecated"),
        expect.stringContaining("policies")
      );
    });

    it("does not warn about the 'rules' alias when disableLegacyWarnings is true", () => {
      const options = {
        rules: [entry],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
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

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      // One warning for the deprecated 'rules' option itself, one for the legacy selector syntax.
      expect(mockedWarnOnce).toHaveBeenCalledTimes(2);
    });

    it("prefers 'policies' over 'rules' when both are set", () => {
      const options = {
        policies: [entry],
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsPolicies,
        ],
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      // 'policies' entries contain no deprecated syntax, and no 'rules' deprecation
      // warning is emitted because 'policies' is present.
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });
  });

  describe("legacyPoliciesSchema", () => {
    it("uses the default extra options schema when none is provided", () => {
      const schema = legacyPoliciesSchema();

      expect(schema.anyOf[1]).toEqual({
        type: "array",
        items: [{ type: "string" }, { type: "object" }],
      });
    });

    it("embeds custom matcher options when provided", () => {
      const customOptions = { type: "object", properties: { foo: {} } };

      const schema = legacyPoliciesSchema(customOptions);

      expect(schema.anyOf[1]).toEqual({
        type: "array",
        items: [{ type: "string" }, customOptions],
      });
    });
  });

  describe("rulesOptionsSchema", () => {
    it("returns a non-legacy schema with 'from'/'to'/'dependency' properties by default", () => {
      const [schema] = rulesOptionsSchema();
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: Record<string, unknown>; anyOf: unknown[] };
        }
      ).items;

      expect(ruleItem.properties).toHaveProperty("from");
      expect(ruleItem.properties).toHaveProperty("to");
      expect(ruleItem.properties).toHaveProperty("dependency");
      expect(ruleItem.properties).toHaveProperty("allow");
      expect(ruleItem.properties).toHaveProperty("disallow");
      expect(ruleItem.anyOf).toEqual(
        expect.arrayContaining([
          { required: ["allow"] },
          { required: ["disallow"] },
          { required: ["from", "allow"] },
          { required: ["dependency", "disallow"] },
        ])
      );
    });

    it("also exposes the same entries schema under 'policies' (the current option name)", () => {
      const [schema] = rulesOptionsSchema();
      const properties = schema.properties as unknown as Record<
        string,
        unknown
      >;

      expect(properties.policies).toEqual(properties.rules);
    });

    it("returns a legacy schema keyed by the provided mainKey", () => {
      const [schema] = rulesOptionsSchema({
        rulesMainKey: "target",
        isLegacy: true,
      });
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: Record<string, unknown>; anyOf: unknown[] };
        }
      ).items;

      expect(ruleItem.properties).toHaveProperty("target");
      expect(ruleItem.properties).toHaveProperty("allow");
      expect(ruleItem.properties).toHaveProperty("disallow");
      expect(ruleItem.properties).not.toHaveProperty("from");
      expect(ruleItem.anyOf).toEqual([
        { required: ["target", "allow"] },
        { required: ["target", "disallow"] },
      ]);
    });

    it("falls back to 'from' as legacy main key when rulesMainKey is not provided", () => {
      const [schema] = rulesOptionsSchema({ isLegacy: true });
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: Record<string, unknown> };
        }
      ).items;

      expect(ruleItem.properties).toHaveProperty("from");
    });

    it("forwards extraOptionsSchema into the top-level properties", () => {
      const [schema] = rulesOptionsSchema({
        extraOptionsSchema: {
          checkAllOrigins: { type: "boolean" },
        },
      });

      expect(schema.properties).toHaveProperty("checkAllOrigins", {
        type: "boolean",
      });
    });

    it("uses the legacy policies schema with custom target matcher options when legacy", () => {
      const customMatcherOptions = { type: "object", properties: { x: {} } };

      const [schema] = rulesOptionsSchema({
        isLegacy: true,
        targetMatcherOptions: customMatcherOptions,
      });
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: { allow: { anyOf: unknown[] } } };
        }
      ).items;

      expect(ruleItem.properties.allow.anyOf[1]).toEqual({
        type: "array",
        items: [{ type: "string" }, customMatcherOptions],
      });
    });
  });
});
