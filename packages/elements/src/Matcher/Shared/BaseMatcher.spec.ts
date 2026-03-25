import type { MatchersOptionsNormalized } from "../../Config";
import type { BaseDescriptor } from "../../Descriptor";
import type { MicromatchPatternNullable } from "../../Shared";

import { BaseElementsMatcher } from "./BaseMatcher";
import type { TemplateData } from "./BaseMatcher.types";
import type { BaseSingleSelector } from "./BaseSelector.types";
import type { Micromatch } from "./Micromatch";

class TestMatcher extends BaseElementsMatcher {
  public testIsMicromatchMatch(
    value: string | null | undefined | boolean,
    pattern: MicromatchPatternNullable
  ) {
    return this.isMicromatchMatch(value, pattern);
  }

  public testIsTemplateMicromatchMatch(
    pattern: MicromatchPatternNullable,
    templateData: TemplateData,
    value: string | string[] | undefined
  ) {
    return this.isTemplateMicromatchMatch(pattern, templateData, value);
  }

  public testIsElementKeyBooleanMatch(options: {
    element: BaseDescriptor;
    selector: BaseSingleSelector;
    elementKey: keyof BaseDescriptor;
    selectorKey: keyof BaseSingleSelector;
  }) {
    return this.isElementKeyBooleanMatch(options);
  }
}

describe("BaseElementsMatcher", () => {
  let config: MatchersOptionsNormalized;
  let micromatch: Micromatch;
  let matcher: TestMatcher;

  beforeEach(() => {
    config = {
      legacyTemplates: false,
    } as unknown as MatchersOptionsNormalized;
    micromatch = {
      isMatch: jest.fn().mockReturnValue(true),
    } as unknown as Micromatch;
    matcher = new TestMatcher(config, micromatch);
  });

  describe("isMicromatchMatch", () => {
    it("should return false if pattern is not null and value is null and pattern does not contain null", () => {
      expect(matcher.testIsMicromatchMatch(null, ["a", "b"])).toBe(false);
    });

    it("should return true if value is null and pattern array contains null", () => {
      expect(matcher.testIsMicromatchMatch(null, ["a", null])).toBe(true);
    });

    it("should return false if array pattern after cleaning is empty", () => {
      expect(
        // @ts-expect-error Mocked partially
        matcher.testIsMicromatchMatch("val", ["", undefined])
      ).toBe(false);
    });

    it("should return true if value is empty and matches pattern", () => {
      // Mock to make it match
      jest.mocked(micromatch.isMatch).mockReturnValueOnce(true);

      expect(matcher.testIsMicromatchMatch("", [""])).toBe(false); // empty pattern after clean is false
    });
  });

  describe("isTemplateMicromatchMatch", () => {
    it("should return false if value is undefined", () => {
      expect(
        matcher.testIsTemplateMicromatchMatch("pattern", {}, undefined)
      ).toBe(false);
    });

    it("should return false if rendered pattern is empty", () => {
      expect(
        matcher.testIsTemplateMicromatchMatch(
          "{{empty}}",
          { empty: "" },
          "value"
        )
      ).toBe(false);
    });

    it("should handle array values", () => {
      jest.mocked(micromatch.isMatch).mockReturnValue(true);

      expect(
        matcher.testIsTemplateMicromatchMatch("pattern", {}, [
          "value1",
          "value2",
        ])
      ).toBe(true);
    });
  });

  describe("isElementKeyBooleanMatch", () => {
    it("should return true if selectorKey does not exist in selector", () => {
      expect(
        matcher.testIsElementKeyBooleanMatch({
          element: { a: true } as unknown as BaseDescriptor,
          selector: {} as unknown as BaseSingleSelector,
          elementKey: "a" as keyof BaseDescriptor,
          selectorKey: "a" as keyof BaseSingleSelector,
        })
      ).toBe(true);
    });

    it("should return false if selector value is not boolean", () => {
      expect(
        matcher.testIsElementKeyBooleanMatch({
          element: { a: true } as unknown as BaseDescriptor,
          selector: { a: "true" } as unknown as BaseSingleSelector,
          elementKey: "a" as keyof BaseDescriptor,
          selectorKey: "a" as keyof BaseSingleSelector,
        })
      ).toBe(false);
    });

    it("should return false if element value is not boolean", () => {
      expect(
        matcher.testIsElementKeyBooleanMatch({
          element: { a: "true" } as unknown as BaseDescriptor,
          selector: { a: true } as unknown as BaseSingleSelector,
          elementKey: "a" as keyof BaseDescriptor,
          selectorKey: "a" as keyof BaseSingleSelector,
        })
      ).toBe(false);
    });
  });
});
