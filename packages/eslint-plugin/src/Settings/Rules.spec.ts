jest.mock("../Debug", () => ({
  warnOnce: jest.fn(),
}));

import { warnOnce } from "../Debug";
import {
  RULE_NAMES_MAP,
  RULE_SHORT_NAMES_MAP,
  SETTINGS_KEYS_MAP,
} from "../Shared/Settings.types";
import type {
  RuleOptionsWithRules,
  RuleOptionsRules,
} from "../Shared/Settings.types";

import {
  collectRuleWarningIndexes,
  detectLegacyTemplateSyntax,
  isRuleName,
  isRulePolicy,
  isRuleShortName,
  legacyPoliciesSchema,
  rulesMainKey,
  rulesOptionsSchema,
  validateAndWarnRuleOptions,
  validateLegacyTemplates,
  warnMigrationToDependencies,
} from "./Rules";

const mockedWarnOnce = jest.mocked(warnOnce);

describe("Settings/Rules", () => {
  beforeEach(() => {
    mockedWarnOnce.mockClear();
  });

  describe("isRulePolicy", () => {
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

  describe("validateLegacyTemplates", () => {
    it("returns undefined when value is undefined", () => {
      expect(validateLegacyTemplates(undefined)).toBeUndefined();
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("returns the boolean when it is a valid boolean", () => {
      expect(validateLegacyTemplates(true)).toBe(true);
      expect(validateLegacyTemplates(false)).toBe(false);
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("warns and returns undefined when the value is invalid", () => {
      expect(validateLegacyTemplates("invalid")).toBeUndefined();
      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(SETTINGS_KEYS_MAP.LEGACY_TEMPLATES),
        expect.stringContaining("boolean")
      );
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

    it("does nothing when options.rules is missing", () => {
      const options = {} as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does nothing when options.rules is not an array", () => {
      const options = {
        rules: "not-an-array",
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does not warn when no rule uses deprecated syntax", () => {
      const options = {
        rules: [
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does not flag an array of modern object selectors as legacy", () => {
      const options = {
        rules: [
          {
            from: [{ element: { type: "a" } }, { element: { type: "b" } }],
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("warns once about deprecated rule-level importKind and includes affected indices", () => {
      const rules: RuleOptionsRules[] = [
        { from: modernFrom, to: modernTo } as unknown as RuleOptionsRules,
        {
          from: modernFrom,
          to: modernTo,
          importKind: "type",
        } as unknown as RuleOptionsRules,
        {
          from: modernFrom,
          to: modernTo,
          importKind: "value",
        } as unknown as RuleOptionsRules,
      ];
      const options = { rules } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: modernFrom,
            to: modernTo,
            importKind: "type",
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);
      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
    });

    it("warns about legacy string selector syntax in `from` for the dependencies rule", () => {
      const options = {
        rules: [
          { from: "helper", to: modernTo } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: ["helper", { family: "data" }],
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("warns about an array of legacy string selectors", () => {
      const options = {
        rules: [
          {
            from: ["helper", "component"],
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("warns about an array of legacy tuple selectors", () => {
      const options = {
        rules: [
          {
            from: [["helper", { family: "data" }], "component"],
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("detects legacy string selector in `allow` for the dependencies rule", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            allow: ["helpers"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("detects legacy selector in `disallow` for the element-types rule", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            disallow: ["helpers"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ELEMENT_TYPES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("detects legacy string selector in `target` for the entry-point rule", () => {
      const options = {
        rules: [
          {
            target: "components",
            allow: ["**/index.ts"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy selector syntax"),
        expect.any(String)
      );
    });

    it("does NOT flag `allow`/`disallow` as legacy selectors for the external rule (external lib names)", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            allow: ["lodash"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.EXTERNAL, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does NOT flag `allow`/`disallow` as legacy selectors for the entry-point rule (file globs)", () => {
      const options = {
        rules: [
          {
            target: { element: { type: "a" } },
            allow: ["**/index.ts"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("aggregates indices of multiple rules with legacy selectors", () => {
      const options = {
        rules: [
          { from: "helper", to: modernTo } as unknown as RuleOptionsRules,
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsRules,
          { from: "component", to: modernTo } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("0, 2");
    });

    it("warns about legacy template syntax in `from` for the dependencies rule", () => {
      const options = {
        rules: [
          {
            from: { element: { type: "Comp${name}" } },
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            to: { element: { path: "x/${cat}" } },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.any(String)
      );
    });

    it("detects legacy template syntax in the `dependency` selector", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            dependency: { kind: "value-${kind}" },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.any(String)
      );
    });

    it("detects legacy template syntax in `allow` for the dependencies rule", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            allow: ["b/${captured}"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: modernFrom,
            disallow: ["x/${y}"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ELEMENT_TYPES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes("legacy template syntax ${...}"))
      ).toBe(true);
    });

    it("does NOT scan `allow`/`disallow` templates for the external rule (external lib names)", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            disallow: ["lodash/${sub}"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.EXTERNAL, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does NOT scan `allow`/`disallow` templates for the entry-point rule (file globs)", () => {
      const options = {
        rules: [
          {
            target: { element: { type: "a" } },
            disallow: ["**/${private}/**"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("detects legacy template syntax in `target` for the entry-point rule", () => {
      const options = {
        rules: [
          {
            target: { element: { type: "Comp${x}" } },
            allow: ["**/index.ts"],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.ENTRY_POINT, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("legacy template syntax ${...}"),
        expect.any(String)
      );
    });

    it("aggregates indices of multiple rules with legacy template syntax", () => {
      const options = {
        rules: [
          {
            from: { element: { type: "a${b}" } },
            to: modernTo,
          } as unknown as RuleOptionsRules,
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsRules,
          {
            from: modernFrom,
            dependency: { kind: "y${z}" },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("0, 2");
    });

    it("emits both legacy template and deprecated importKind warnings when applicable", () => {
      const options = {
        rules: [
          {
            from: { element: { type: "a${b}" } },
            to: modernTo,
            importKind: "type",
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: { element: { category: "domain" } },
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: modernFrom,
            to: { element: { elementPath: "src/**" } },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes("deprecated selector properties"))
      ).toBe(true);
    });

    it("detects deprecated v7 selector property 'filePath' nested in `to`", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            to: { file: { filePath: "src/**" } },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes("deprecated selector properties"))
      ).toBe(true);
    });

    it("does not warn about deprecated v7 selector properties when none are used", () => {
      const options = {
        rules: [
          { from: modernFrom, to: modernTo } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("warns about deprecated 'dependency.module' property", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            dependency: { module: "lodash" },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: modernFrom,
            dependency: [{ kind: "value" }, { module: "lodash" }],
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes('deprecated "dependency.module"'))
      ).toBe(true);
    });

    it("does not warn about 'dependency.module' when the dependency selector omits it", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            dependency: { kind: "value" },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes('deprecated "dependency.module"'))
      ).toBe(false);
    });

    it("does not warn about 'dependency.module' when dependency is a non-object primitive", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            dependency: null,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: { type: "helper", internalPath: "src/**" },
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining('"internalPath" in element selectors'),
        expect.stringContaining("fileInternalPath")
      );
      expect(mockedWarnOnce.mock.calls[0][0]).toContain("indices: 0");
    });

    it("warns when internalPath appears inside an element sub-selector of a modern entity selector", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            to: { element: { internalPath: "src/**" } },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(true);
    });

    it("does not warn when internalPath appears inside a module sub-selector (modern usage)", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            to: { module: { internalPath: "dist/**" } },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(false);
    });

    it("does not warn when no internalPath is present", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(false);
    });

    it("warns when internalPath appears in an array of element selectors inside a modern entity selector", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            to: { element: [{ internalPath: "src/**" }, { type: "b" }] },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      const messages = mockedWarnOnce.mock.calls.map((call) => call[0]);
      expect(
        messages.some((m) => m.includes('"internalPath" in element selectors'))
      ).toBe(true);
    });

    it("does not warn when the element sub-selector value is a non-object primitive", () => {
      const options = {
        rules: [
          {
            from: modernFrom,
            to: { element: null },
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

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
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
      // Confirm the exported symbol is accessible (required for integration tests
      // where callers can spy on the module namespace object if needed).
      expect(collectRuleWarningIndexes).toBeInstanceOf(Function);
    });

    it("does not emit any warnOnce call when disableLegacyWarnings is true and legacy patterns are present", () => {
      const options = {
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsRules,
          {
            from: modernFrom,
            to: modernTo,
            importKind: "type",
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does not emit any warning when disableLegacyWarnings is true", () => {
      const options = {
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("emits legacy-pattern warnings when legacy patterns are present and disableLegacyWarnings is false", () => {
      const options = {
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
    });

    it("still caches via WeakSet: second call with same options is skipped even when disableLegacyWarnings changes", () => {
      const options = {
        rules: [
          {
            from: "legacy-string",
            to: modernTo,
          } as unknown as RuleOptionsRules,
        ],
      } as unknown as RuleOptionsWithRules;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);
      mockedWarnOnce.mockClear();
      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);

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
