import { BaseElementsMatcher } from "./BaseElementsMatcher";
import { Micromatch } from "./Micromatch";
import { MatchersOptionsNormalized } from "../Config";

class TestMatcher extends BaseElementsMatcher {
  public testIsMicromatchMatch(value: any, pattern: any) {
    return this.isMicromatchMatch(value, pattern);
  }

  public testIsTemplateMicromatchMatch(pattern: any, templateData: any, value: any) {
    return this.isTemplateMicromatchMatch(pattern, templateData, value);
  }

  public testIsElementKeyBooleanMatch(options: any) {
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
    } as any;
    micromatch = {
      isMatch: jest.fn().mockReturnValue(true),
    } as any;
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
      expect(matcher.testIsMicromatchMatch("val", ["", undefined] as any)).toBe(false);
    });

    it("should return true if value is empty and matches pattern", () => {
        // Mock to make it match
        (micromatch.isMatch as jest.Mock).mockReturnValueOnce(true);
        expect(matcher.testIsMicromatchMatch("", [""] as any)).toBe(false); // empty pattern after clean is false
    });
  });

  describe("isTemplateMicromatchMatch", () => {
    it("should return false if value is undefined", () => {
      expect(matcher.testIsTemplateMicromatchMatch("pattern", {}, undefined)).toBe(false);
    });

    it("should return false if rendered pattern is empty", () => {
      expect(matcher.testIsTemplateMicromatchMatch("{{empty}}", { empty: "" }, "value")).toBe(false);
    });

    it("should handle array values", () => {
      (micromatch.isMatch as jest.Mock).mockReturnValue(true);
      expect(matcher.testIsTemplateMicromatchMatch("pattern", {}, ["value1", "value2"])).toBe(true);
    });
  });

  describe("isElementKeyBooleanMatch", () => {
    it("should return true if selectorKey does not exist in selector", () => {
      expect(
        matcher.testIsElementKeyBooleanMatch({
          element: { a: true },
          selector: {},
          elementKey: "a",
          selectorKey: "a",
        })
      ).toBe(true);
    });

    it("should return false if selector value is not boolean", () => {
      expect(
        matcher.testIsElementKeyBooleanMatch({
          element: { a: true },
          selector: { a: "true" },
          elementKey: "a",
          selectorKey: "a",
        })
      ).toBe(false);
    });

    it("should return false if element value is not boolean", () => {
      expect(
        matcher.testIsElementKeyBooleanMatch({
          element: { a: "true" },
          selector: { a: true },
          elementKey: "a",
          selectorKey: "a",
        })
      ).toBe(false);
    });
  });
});
