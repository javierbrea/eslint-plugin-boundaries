import {
  isCapturedValuesSingleSelector,
  isCapturedValuesSelector,
  extendsSingleSelector,
} from "./BaseSelectorHelpers";

describe("BaseSelectorHelpers", () => {
  describe("isCapturedValuesSingleSelector", () => {
    it("should return true for an object with string values", () => {
      expect(isCapturedValuesSingleSelector({ key: "value" })).toBe(true);
    });

    it("should return true for an object with string array values", () => {
      expect(
        isCapturedValuesSingleSelector({ key: ["value1", "value2"] })
      ).toBe(true);
    });

    it("should return true for an object with mixed string and string array values", () => {
      expect(
        isCapturedValuesSingleSelector({
          a: "value",
          b: ["value1", "value2"],
        })
      ).toBe(true);
    });

    it("should return true for an empty object", () => {
      expect(isCapturedValuesSingleSelector({})).toBe(true);
    });

    it("should return false for an object with non-string values", () => {
      expect(isCapturedValuesSingleSelector({ key: 123 })).toBe(false);
    });

    it("should return false for an object with boolean values", () => {
      expect(isCapturedValuesSingleSelector({ key: true })).toBe(false);
    });

    it("should return false for an object with null values", () => {
      expect(isCapturedValuesSingleSelector({ key: null })).toBe(false);
    });

    it("should return false for an object with mixed valid and invalid values", () => {
      expect(isCapturedValuesSingleSelector({ a: "valid", b: 123 })).toBe(
        false
      );
    });

    it("should return false for a string", () => {
      expect(isCapturedValuesSingleSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isCapturedValuesSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isCapturedValuesSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isCapturedValuesSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isCapturedValuesSingleSelector(["a", "b"])).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isCapturedValuesSingleSelector(true)).toBe(false);
    });

    it("should return false for an object with arrays containing non-strings", () => {
      expect(isCapturedValuesSingleSelector({ key: [1, 2] })).toBe(false);
    });
  });

  describe("isCapturedValuesSelector", () => {
    it("should return true for a single captured values selector object", () => {
      expect(isCapturedValuesSelector({ key: "value" })).toBe(true);
    });

    it("should return true for an array of captured values selector objects", () => {
      expect(isCapturedValuesSelector([{ a: "v1" }, { b: ["v2", "v3"] }])).toBe(
        true
      );
    });

    it("should return true for an array with a single captured values selector", () => {
      expect(isCapturedValuesSelector([{ key: "value" }])).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isCapturedValuesSelector([])).toBe(true);
    });

    it("should return false for an array containing invalid objects", () => {
      expect(isCapturedValuesSelector([{ key: 123 }])).toBe(false);
    });

    it("should return false for an array with mixed valid and invalid objects", () => {
      expect(isCapturedValuesSelector([{ a: "valid" }, { b: 123 }])).toBe(
        false
      );
    });

    it("should return false for a string", () => {
      expect(isCapturedValuesSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isCapturedValuesSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isCapturedValuesSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isCapturedValuesSelector(undefined)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isCapturedValuesSelector(true)).toBe(false);
    });

    it("should return false for an array containing non-objects", () => {
      expect(isCapturedValuesSelector(["a", "b"])).toBe(false);
    });
  });

  describe("extendsSingleSelector", () => {
    it("should return true for an object with path property", () => {
      expect(extendsSingleSelector({ path: "src/**" })).toBe(true);
    });

    it("should return true for an object with captured property", () => {
      expect(extendsSingleSelector({ captured: { key: "value" } })).toBe(true);
    });

    it("should return true for an object with isIgnored property", () => {
      expect(extendsSingleSelector({ isIgnored: true })).toBe(true);
    });

    it("should return true for an object with isUnknown property", () => {
      expect(extendsSingleSelector({ isUnknown: false })).toBe(true);
    });

    it("should return true for an object with multiple base selector properties", () => {
      expect(
        extendsSingleSelector({
          path: "src/**",
          captured: { key: "value" },
          isIgnored: false,
        })
      ).toBe(true);
    });

    it("should return true for an object with base selector and additional properties", () => {
      expect(
        extendsSingleSelector({ path: "src/**", customProp: "extra" })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(extendsSingleSelector({})).toBe(false);
    });

    it("should return false for an object without any base selector properties", () => {
      expect(extendsSingleSelector({ foo: "bar", baz: 123 })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(extendsSingleSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(extendsSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(extendsSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(extendsSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(extendsSingleSelector([{ path: "src/**" }])).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(extendsSingleSelector(true)).toBe(false);
    });
  });
});
