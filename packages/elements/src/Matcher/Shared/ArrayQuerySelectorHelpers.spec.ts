import { isArrayQuery, ARRAY_QUERY_KEYS } from "./ArrayQuerySelectorHelpers";

describe("isArrayQuery", () => {
  describe("returns true for objects with operator keys", () => {
    it.each(ARRAY_QUERY_KEYS)("returns true when only %s is present", (key) => {
      expect(isArrayQuery({ [key]: [] })).toBe(true);
    });

    it("returns true for an object with multiple operator keys", () => {
      expect(isArrayQuery({ anyOf: ["a"], noneOf: ["b"] })).toBe(true);
    });

    it("returns true for an object with all operator keys", () => {
      expect(
        isArrayQuery({
          anyOf: [],
          allOf: [],
          noneOf: [],
          equalsTo: [],
          atIndex: { index: 0, matches: "x" },
          hasLength: 2,
        })
      ).toBe(true);
    });
  });

  describe("returns false for non-object values", () => {
    it("returns false for a string", () => {
      expect(isArrayQuery("anyOf")).toBe(false);
    });

    it("returns false for an array", () => {
      expect(isArrayQuery(["anyOf"])).toBe(false);
    });

    it("returns false for null", () => {
      expect(isArrayQuery(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isArrayQuery(undefined)).toBe(false);
    });

    it("returns false for a number", () => {
      expect(isArrayQuery(42)).toBe(false);
    });

    it("returns false for a boolean", () => {
      expect(isArrayQuery(true)).toBe(false);
    });
  });

  describe("returns false for plain objects without operator keys", () => {
    it("returns false for an empty object", () => {
      expect(isArrayQuery({})).toBe(false);
    });

    it("returns false for an object with unrelated keys", () => {
      expect(isArrayQuery({ type: "component", path: "src/**" })).toBe(false);
    });
  });
});
