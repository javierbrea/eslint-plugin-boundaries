import { isArray, isNull, isObject, isUndefined } from "./TypeHelpers";

describe("TypeHelpers", () => {
  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
    });

    it("should return false for non-arrays", () => {
      expect(isArray("string")).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });
  });

  describe("isNull", () => {
    it("should return true for null", () => {
      expect(isNull(null)).toBe(true);
    });

    it("should return false for non-null values", () => {
      expect(isNull(undefined)).toBe(false);
      expect(isNull(0)).toBe(false);
      expect(isNull("")).toBe(false);
      expect(isNull({})).toBe(false);
    });
  });

  describe("isObject", () => {
    it("should return true for plain objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: "value" })).toBe(true);
    });

    it.each([[[]], [null], [undefined], ["string"], [123], [true]])(
      "should return false for arrays, null, and primitives (%p)",
      (value) => {
        expect(isObject(value)).toBe(false);
      }
    );
  });

  describe("isUndefined", () => {
    it("should return true for undefined", () => {
      expect(isUndefined(undefined)).toBe(true);
    });

    it("should return false for non-undefined values", () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined("")).toBe(false);
      expect(isUndefined({})).toBe(false);
    });
  });
});
