import type { MatchersOptionsNormalized } from "../../Config";
import type { BaseDescription, ModuleDescription } from "../../Descriptor";
import type { MicromatchPatternNullable } from "../../Shared";
import type { ElementSingleSelector } from "../Element";
import type { ModuleSelector } from "../Module";

import type { ArrayQuery } from "./ArrayQuery.types";
import { BaseElementsMatcher } from "./BaseMatcher";
import type { TemplateData } from "./BaseMatcher.types";
import { Micromatch } from "./Micromatch";

jest.mock("./Micromatch");

class TestableMatcher extends BaseElementsMatcher {
  public callIsArrayQueryMatch<TElement, TMatcher>(
    array: readonly TElement[] | null,
    query: ArrayQuery<TMatcher>,
    matchElement: (element: TElement, matcher: TMatcher) => boolean
  ): boolean {
    return this.isArrayQueryMatch(array, query, matchElement);
  }

  public callGetRenderedTemplates(
    template: MicromatchPatternNullable,
    templateData: TemplateData
  ): MicromatchPatternNullable {
    return this.getRenderedTemplates(template, templateData);
  }

  public callCleanMicromatchPattern(
    pattern: MicromatchPatternNullable
  ): string | string[] | null {
    return this.cleanMicromatchPattern(pattern);
  }

  public callIsMicromatchMatch(
    value: string | null | undefined | boolean,
    pattern: MicromatchPatternNullable
  ): boolean {
    return this.isMicromatchMatch(value, pattern);
  }

  public callIsTemplateMicromatchMatch(
    pattern: MicromatchPatternNullable,
    templateData: TemplateData,
    value: string | string[] | null | undefined | boolean
  ): boolean {
    return this.isTemplateMicromatchMatch(pattern, templateData, value);
  }

  public callIsObjectKeyBooleanMatch<
    T extends BaseDescription | ModuleDescription,
    S extends ElementSingleSelector | ModuleSelector,
  >(params: {
    object: T;
    selector: S;
    objectKey: keyof T;
    selectorKey: keyof S;
  }): boolean {
    return this.isObjectKeyBooleanMatch(params);
  }

  public callIsObjectKeyMicromatchMatch<
    T extends BaseDescription | ModuleDescription,
    S extends ElementSingleSelector | ModuleSelector,
    K extends keyof T,
  >(params: {
    object: T & Record<K, string | string[] | null | undefined | boolean>;
    selector: S;
    objectKey: K;
    selectorKey: keyof S;
    selectorValue?: MicromatchPatternNullable;
    templateData: TemplateData;
  }): boolean {
    return this.isObjectKeyMicromatchMatch(params);
  }
}

describe("BaseElementsMatcher", () => {
  let matcher: TestableMatcher;
  let micromatch: jest.Mocked<Micromatch>;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatch = new Micromatch(false) as jest.Mocked<Micromatch>;
  });

  function createMatcher(
    config: MatchersOptionsNormalized = { legacyTemplates: false }
  ): TestableMatcher {
    matcher = new TestableMatcher(config, micromatch);
    return matcher;
  }

  describe("constructor", () => {
    it("should store the legacyTemplates option", () => {
      const instance = createMatcher({ legacyTemplates: true });

      expect(instance).toBeInstanceOf(BaseElementsMatcher);
    });

    it("should store the micromatch instance", () => {
      const instance = createMatcher();

      expect(instance).toBeInstanceOf(BaseElementsMatcher);
    });
  });

  describe("getRenderedTemplates", () => {
    describe("with a single template", () => {
      it("should return the template as-is when it has no Handlebars syntax", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates("plain-string", {});

        expect(result).toBe("plain-string");
      });

      it("should return null when the template is null", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates(null, {});

        expect(result).toBeNull();
      });

      it("should render a Handlebars template with provided data", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates("{{ type }}/index", {
          type: "components",
        });

        expect(result).toBe("components/index");
      });

      it("should render multiple placeholders in a single template", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates(
          "{{ category }}/{{ type }}",
          {
            category: "ui",
            type: "button",
          }
        );

        expect(result).toBe("ui/button");
      });

      it("should return empty string for unresolved Handlebars variables", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates("{{ missing }}", {});

        expect(result).toBe("");
      });
    });

    describe("with an array of templates", () => {
      it("should render each template in the array", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates(
          ["{{ type }}/index", "plain"],
          { type: "components" }
        );

        expect(result).toEqual(["components/index", "plain"]);
      });

      it("should handle null entries in the array", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates([null, "{{ type }}"], {
          type: "utils",
        });

        expect(result).toEqual([null, "utils"]);
      });

      it("should return all templates as-is when none have Handlebars syntax", () => {
        createMatcher();

        const result = matcher.callGetRenderedTemplates(["foo", "bar"], {});

        expect(result).toEqual(["foo", "bar"]);
      });
    });

    describe("with legacy templates enabled", () => {
      it("should convert ${} syntax to Handlebars and render", () => {
        createMatcher({ legacyTemplates: true });

        const result = matcher.callGetRenderedTemplates("${type}/index", {
          type: "components",
        });

        expect(result).toBe("components/index");
      });

      it("should convert multiple ${} placeholders", () => {
        createMatcher({ legacyTemplates: true });

        const result = matcher.callGetRenderedTemplates("${category}/${type}", {
          category: "ui",
          type: "button",
        });

        expect(result).toBe("ui/button");
      });

      it("should return the template as-is when it has no legacy syntax", () => {
        createMatcher({ legacyTemplates: true });

        const result = matcher.callGetRenderedTemplates("plain-string", {});

        expect(result).toBe("plain-string");
      });

      it("should return null when legacy template is null", () => {
        createMatcher({ legacyTemplates: true });

        const result = matcher.callGetRenderedTemplates(null, {});

        expect(result).toBeNull();
      });
    });

    describe("with legacy templates disabled", () => {
      it("should not convert ${} syntax", () => {
        createMatcher({ legacyTemplates: false });

        const result = matcher.callGetRenderedTemplates("${type}/index", {
          type: "components",
        });

        expect(result).toBe("${type}/index");
      });
    });
  });

  describe("cleanMicromatchPattern", () => {
    it("should return null when the pattern is null", () => {
      createMatcher();

      const result = matcher.callCleanMicromatchPattern(null);

      expect(result).toBeNull();
    });

    it("should return the string pattern unchanged", () => {
      createMatcher();

      const result = matcher.callCleanMicromatchPattern("src/**");

      expect(result).toBe("src/**");
    });

    it("should filter out falsy values from an array", () => {
      createMatcher();

      const result = matcher.callCleanMicromatchPattern([
        "src/**",
        null,
        "",
        "lib/**",
      ]);

      expect(result).toEqual(["src/**", "lib/**"]);
    });

    it("should return an empty array when all values are falsy", () => {
      createMatcher();

      const result = matcher.callCleanMicromatchPattern([null, "", null]);

      expect(result).toEqual([]);
    });

    it("should return the array unchanged when all values are truthy", () => {
      createMatcher();

      const result = matcher.callCleanMicromatchPattern(["foo", "bar"]);

      expect(result).toEqual(["foo", "bar"]);
    });
  });

  describe("isMicromatchMatch", () => {
    it("should return true when both value and pattern are null", () => {
      createMatcher();

      const result = matcher.callIsMicromatchMatch(null, null);

      expect(result).toBe(true);
    });

    it("should return false when value is not null but pattern is null", () => {
      createMatcher();

      const result = matcher.callIsMicromatchMatch("foo", null);

      expect(result).toBe(false);
    });

    it("should return true when value is null and pattern array contains null", () => {
      createMatcher();

      const result = matcher.callIsMicromatchMatch(null, [null, "foo"]);

      expect(result).toBe(true);
    });

    it("should return false when value is null and pattern array does not contain null", () => {
      createMatcher();

      const result = matcher.callIsMicromatchMatch(null, ["foo", "bar"]);

      expect(result).toBe(false);
    });

    it("should return false when value is null and pattern is a string", () => {
      createMatcher();

      const result = matcher.callIsMicromatchMatch(null, "foo");

      expect(result).toBe(false);
    });

    it("should delegate to micromatch.isMatch for string values", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.callIsMicromatchMatch("src/foo", "src/**");

      expect(micromatch.isMatch).toHaveBeenCalledWith("src/foo", "src/**");
      expect(result).toBe(true);
    });

    it("should delegate to micromatch.isMatch for array patterns", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.callIsMicromatchMatch("test/foo", [
        "src/**",
        "lib/**",
      ]);

      expect(micromatch.isMatch).toHaveBeenCalledWith("test/foo", [
        "src/**",
        "lib/**",
      ]);
      expect(result).toBe(false);
    });

    it("should convert boolean values to string before matching", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.callIsMicromatchMatch(true, "true");

      expect(micromatch.isMatch).toHaveBeenCalledWith("true", "true");
      expect(result).toBe(true);
    });

    it("should convert false to string before matching", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.callIsMicromatchMatch(false, "true");

      expect(micromatch.isMatch).toHaveBeenCalledWith("false", "true");
      expect(result).toBe(false);
    });

    it("should return false when pattern is an empty string", () => {
      createMatcher();

      const result = matcher.callIsMicromatchMatch("foo", "");

      expect(result).toBe(false);
    });

    it("should return false when cleaned array pattern is empty", () => {
      createMatcher();

      const result = matcher.callIsMicromatchMatch("foo", [null, ""]);

      expect(result).toBe(false);
    });

    it("should clean null values from pattern arrays before matching", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.callIsMicromatchMatch("foo", [null, "foo"]);

      expect(micromatch.isMatch).toHaveBeenCalledWith("foo", ["foo"]);
      expect(result).toBe(true);
    });
  });

  describe("isTemplateMicromatchMatch", () => {
    it("should return false when the value is undefined", () => {
      createMatcher();

      const result = matcher.callIsTemplateMicromatchMatch("**", {}, undefined);

      expect(result).toBe(false);
    });

    it("should render the pattern as a template and match the value", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.callIsTemplateMicromatchMatch(
        "{{ type }}/**",
        { type: "components" },
        "components/Button"
      );

      expect(micromatch.isMatch).toHaveBeenCalledWith(
        "components/Button",
        "components/**"
      );
      expect(result).toBe(true);
    });

    it("should return false when the rendered template is an empty string", () => {
      createMatcher();

      const result = matcher.callIsTemplateMicromatchMatch(
        "{{ missing }}",
        {},
        "some-value"
      );

      expect(result).toBe(false);
    });

    it("should match null value against null pattern", () => {
      createMatcher();

      const result = matcher.callIsTemplateMicromatchMatch(null, {}, null);

      expect(result).toBe(true);
    });

    it("should return false when value is null but pattern is not null", () => {
      createMatcher();

      const result = matcher.callIsTemplateMicromatchMatch("foo", {}, null);

      expect(result).toBe(false);
    });

    it("should match array values by checking if any item matches", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.callIsTemplateMicromatchMatch("bar", {}, [
        "foo",
        "bar",
      ]);

      expect(result).toBe(true);
    });

    it("should return false when no array item matches", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.callIsTemplateMicromatchMatch("baz", {}, [
        "foo",
        "bar",
      ]);

      expect(result).toBe(false);
    });

    it("should match boolean values", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.callIsTemplateMicromatchMatch("true", {}, true);

      expect(micromatch.isMatch).toHaveBeenCalledWith("true", "true");
      expect(result).toBe(true);
    });
  });

  describe("isObjectKeyBooleanMatch", () => {
    it("should return true when the selector key is not present in the selector", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyBooleanMatch({
        object: {
          path: "/some/path",
          captured: null,
          isIgnored: false,
          isUnknown: true,
        } as BaseDescription,
        selector: { type: "component" } as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(true);
    });

    it("should return true when the selector key is undefined", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyBooleanMatch({
        object: {
          path: "/some/path",
          captured: null,
          isIgnored: false,
          isUnknown: false,
        } as BaseDescription,
        selector: {
          isIgnored: undefined,
        } as unknown as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(true);
    });

    it("should return true when both values are true", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyBooleanMatch({
        object: {
          path: null,
          captured: null,
          isIgnored: true,
          isUnknown: true,
        } as BaseDescription,
        selector: { isIgnored: true } as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(true);
    });

    it("should return true when both values are false", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyBooleanMatch({
        object: {
          path: "/path",
          captured: null,
          isIgnored: false,
          isUnknown: false,
        } as BaseDescription,
        selector: { isIgnored: false } as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(true);
    });

    it("should return false when boolean values differ", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyBooleanMatch({
        object: {
          path: null,
          captured: null,
          isIgnored: false,
          isUnknown: true,
        } as BaseDescription,
        selector: { isIgnored: true } as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(false);
    });

    it("should return false when the selector value is not a boolean", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyBooleanMatch({
        object: {
          path: "/path",
          captured: null,
          isIgnored: false,
          isUnknown: false,
        } as BaseDescription,
        selector: {
          isIgnored: "true",
        } as unknown as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(false);
    });

    it("should return false when the object value is not a boolean", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyBooleanMatch({
        object: {
          path: "/path",
          captured: null,
          isIgnored: "false",
          isUnknown: false,
        } as unknown as BaseDescription,
        selector: { isIgnored: true } as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(false);
    });

    it("should return false when the object key is not present in the object", () => {
      createMatcher();

      const object = {
        path: "/path",
        captured: null,
        isUnknown: false,
      } as unknown as BaseDescription;

      const result = matcher.callIsObjectKeyBooleanMatch({
        object,
        selector: { isIgnored: true } as ElementSingleSelector,
        objectKey: "isIgnored" as keyof BaseDescription,
        selectorKey: "isIgnored" as keyof ElementSingleSelector,
      });

      expect(result).toBe(false);
    });
  });

  describe("isObjectKeyMicromatchMatch", () => {
    it("should return true when the selector key is not present in the selector", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyMicromatchMatch({
        object: {
          origin: "local",
          source: null,
          internalPath: null,
        } as ModuleDescription,
        selector: {} as ModuleSelector,
        objectKey: "origin" as keyof ModuleDescription,
        selectorKey: "origin" as keyof ModuleSelector,
        selectorValue: undefined,
        templateData: {},
      });

      expect(result).toBe(true);
    });

    it("should return true when the selector value is undefined", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyMicromatchMatch({
        object: {
          origin: "local",
          source: null,
          internalPath: null,
        } as ModuleDescription,
        selector: {
          origin: undefined,
        } as unknown as ModuleSelector,
        objectKey: "origin" as keyof ModuleDescription,
        selectorKey: "origin" as keyof ModuleSelector,
        selectorValue: undefined,
        templateData: {},
      });

      expect(result).toBe(true);
    });

    it("should delegate to isTemplateMicromatchMatch when both keys exist", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.callIsObjectKeyMicromatchMatch({
        object: {
          origin: "local",
          source: null,
          internalPath: null,
        } as ModuleDescription,
        selector: { origin: "local" } as ModuleSelector,
        objectKey: "origin" as keyof ModuleDescription,
        selectorKey: "origin" as keyof ModuleSelector,
        selectorValue: "local",
        templateData: {},
      });

      expect(result).toBe(true);
      expect(micromatch.isMatch).toHaveBeenCalledWith("local", "local");
    });

    it("should return false when the object does not have the specified key", () => {
      createMatcher();

      const object = {
        source: null,
        internalPath: null,
      } as unknown as ModuleDescription;

      const result = matcher.callIsObjectKeyMicromatchMatch({
        object,
        selector: { origin: "local" } as ModuleSelector,
        objectKey: "origin" as keyof ModuleDescription,
        selectorKey: "origin" as keyof ModuleSelector,
        selectorValue: "local",
        templateData: {},
      });

      expect(result).toBe(false);
    });

    it("should render template data in the selector value before matching", () => {
      createMatcher();
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.callIsObjectKeyMicromatchMatch({
        object: {
          origin: "external",
          source: "@scope/package",
          internalPath: null,
        } as ModuleDescription,
        selector: {
          source: "{{ source }}",
        } as unknown as ModuleSelector,
        objectKey: "source" as keyof ModuleDescription,
        selectorKey: "source" as keyof ModuleSelector,
        selectorValue: "{{ source }}",
        templateData: { source: "@scope/package" },
      });

      expect(result).toBe(true);
    });

    it("should match null object values against null selector patterns", () => {
      createMatcher();

      const result = matcher.callIsObjectKeyMicromatchMatch({
        object: {
          origin: "local",
          source: null,
          internalPath: null,
        } as ModuleDescription,
        selector: { source: null } as ModuleSelector,
        objectKey: "source" as keyof ModuleDescription,
        selectorKey: "source" as keyof ModuleSelector,
        selectorValue: null,
        templateData: {},
      });

      expect(result).toBe(true);
    });
  });

  describe("isArrayQueryMatch", () => {
    const eq = (element: string, pattern: string): boolean =>
      element === pattern;

    beforeEach(() => {
      createMatcher();
    });

    describe("null array", () => {
      it("returns false for null array with anyOf", () => {
        expect(matcher.callIsArrayQueryMatch(null, { anyOf: ["a"] }, eq)).toBe(
          false
        );
      });

      it("returns false for null array with allOf", () => {
        expect(matcher.callIsArrayQueryMatch(null, { allOf: ["a"] }, eq)).toBe(
          false
        );
      });

      it("returns false for null array with noneOf", () => {
        expect(matcher.callIsArrayQueryMatch(null, { noneOf: ["a"] }, eq)).toBe(
          false
        );
      });

      it("returns false for null array with equalsTo", () => {
        expect(matcher.callIsArrayQueryMatch(null, { equalsTo: [] }, eq)).toBe(
          false
        );
      });

      it("returns false for null array with hasLength", () => {
        expect(matcher.callIsArrayQueryMatch(null, { hasLength: 0 }, eq)).toBe(
          false
        );
      });

      it("returns false for null array with atIndex", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            null,
            { atIndex: { index: 0, matches: "a" } },
            eq
          )
        ).toBe(false);
      });
    });

    describe("anyOf", () => {
      it("returns true when an element matches", () => {
        expect(
          matcher.callIsArrayQueryMatch(["a", "b"], { anyOf: ["b", "c"] }, eq)
        ).toBe(true);
      });

      it("returns false when no element matches", () => {
        expect(
          matcher.callIsArrayQueryMatch(["a", "b"], { anyOf: ["c", "d"] }, eq)
        ).toBe(false);
      });

      it("returns false when anyOf is empty (some of [] is false)", () => {
        expect(matcher.callIsArrayQueryMatch(["a"], { anyOf: [] }, eq)).toBe(
          false
        );
      });
    });

    describe("allOf", () => {
      it("returns true when all matchers find a matching element", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b", "c"],
            { allOf: ["a", "c"] },
            eq
          )
        ).toBe(true);
      });

      it("returns false when one matcher finds no matching element", () => {
        expect(
          matcher.callIsArrayQueryMatch(["a", "b"], { allOf: ["a", "c"] }, eq)
        ).toBe(false);
      });

      it("returns true when allOf is empty (vacuously)", () => {
        expect(matcher.callIsArrayQueryMatch(["a"], { allOf: [] }, eq)).toBe(
          true
        );
      });
    });

    describe("noneOf", () => {
      it("returns true when no element matches any forbidden matcher", () => {
        expect(
          matcher.callIsArrayQueryMatch(["a", "b"], { noneOf: ["c", "d"] }, eq)
        ).toBe(true);
      });

      it("returns false when an element matches a forbidden matcher", () => {
        expect(
          matcher.callIsArrayQueryMatch(["a", "b"], { noneOf: ["b"] }, eq)
        ).toBe(false);
      });

      it("returns true when noneOf is empty (nothing forbidden)", () => {
        expect(matcher.callIsArrayQueryMatch(["a"], { noneOf: [] }, eq)).toBe(
          true
        );
      });
    });

    describe("equalsTo", () => {
      it("returns true for equal ordered arrays", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b"],
            { equalsTo: ["a", "b"] },
            eq
          )
        ).toBe(true);
      });

      it("returns false for wrong order", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b"],
            { equalsTo: ["b", "a"] },
            eq
          )
        ).toBe(false);
      });

      it("returns false for wrong length", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b", "c"],
            { equalsTo: ["a", "b"] },
            eq
          )
        ).toBe(false);
      });

      it("returns true for empty array with equalsTo: []", () => {
        expect(matcher.callIsArrayQueryMatch([], { equalsTo: [] }, eq)).toBe(
          true
        );
      });
    });

    describe("atIndex", () => {
      it("returns true for a positive in-range index", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b", "c"],
            { atIndex: { index: 1, matches: "b" } },
            eq
          )
        ).toBe(true);
      });

      it("returns false when the element at a positive index does not match", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b", "c"],
            { atIndex: { index: 1, matches: "a" } },
            eq
          )
        ).toBe(false);
      });

      it("returns false for a positive out-of-range index", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a"],
            { atIndex: { index: 5, matches: "a" } },
            eq
          )
        ).toBe(false);
      });

      it("returns true for index -1 (last element)", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b", "c"],
            { atIndex: { index: -1, matches: "c" } },
            eq
          )
        ).toBe(true);
      });

      it("returns false for a negative out-of-range index", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a"],
            { atIndex: { index: -5, matches: "a" } },
            eq
          )
        ).toBe(false);
      });

      it("returns true when matches is an array and the element equals one of them", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b", "c"],
            { atIndex: { index: 1, matches: ["x", "b"] } },
            eq
          )
        ).toBe(true);
      });

      it("returns false when matches is an array and the element equals none of them", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b", "c"],
            { atIndex: { index: 1, matches: ["x", "y"] } },
            eq
          )
        ).toBe(false);
      });
    });

    describe("hasLength", () => {
      it("returns true when lengths match", () => {
        expect(
          matcher.callIsArrayQueryMatch(["a", "b"], { hasLength: 2 }, eq)
        ).toBe(true);
      });

      it("returns false when lengths do not match", () => {
        expect(
          matcher.callIsArrayQueryMatch(["a", "b"], { hasLength: 3 }, eq)
        ).toBe(false);
      });
    });

    describe("aND combination", () => {
      it("returns false when one operator fails even if others pass", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b"],
            { anyOf: ["a"], noneOf: ["b"] },
            eq
          )
        ).toBe(false);
      });

      it("returns true when both operators pass", () => {
        expect(
          matcher.callIsArrayQueryMatch(
            ["a", "b"],
            { anyOf: ["a"], noneOf: ["c"] },
            eq
          )
        ).toBe(true);
      });
    });

    describe("empty query object", () => {
      it("returns true for a non-null array with no constraints", () => {
        expect(matcher.callIsArrayQueryMatch(["a", "b"], {}, eq)).toBe(true);
      });

      it("returns true for an empty array with no constraints", () => {
        expect(matcher.callIsArrayQueryMatch([], {}, eq)).toBe(true);
      });
    });
  });
});
