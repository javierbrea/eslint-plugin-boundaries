import {
  isArray,
  isBoolean,
  isEmptyArray,
  isEmptyObject,
  isNull,
  isNullish,
  isObject,
  isObjectWithAnyOfProperties,
  isObjectWithProperty,
  isString,
  isStringArray,
  isUndefined,
} from "./TypeGuards";

describe("TypeGuards", () => {
  describe("isString", () => {
    it("should return true for string values", () => {
      expect(isString("test")).toBe(true);
      expect(isString("")).toBe(true);
      expect(isString("123")).toBe(true);
    });

    it("should return false for non-string primitives", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(Symbol("test"))).toBe(false);
    });

    it("should return false for objects and arrays", () => {
      expect(isString([])).toBe(false);
      expect(isString({})).toBe(false);
    });
  });

  describe("isUndefined", () => {
    it("should return true for undefined values", () => {
      expect(isUndefined(undefined)).toBe(true);
    });

    it("should return false for other falsy values", () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined("")).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined(false)).toBe(false);
    });

    it("should return false for objects and arrays", () => {
      expect(isUndefined([])).toBe(false);
      expect(isUndefined({})).toBe(false);
    });
  });

  describe("isNull", () => {
    it("should return true for null values", () => {
      expect(isNull(null)).toBe(true);
    });

    it("should return false for primitives", () => {
      expect(isNull(undefined)).toBe(false);
      expect(isNull("")).toBe(false);
      expect(isNull(0)).toBe(false);
      expect(isNull(false)).toBe(false);
    });

    it("should return false for objects and arrays", () => {
      expect(isNull([])).toBe(false);
      expect(isNull({})).toBe(false);
    });
  });

  describe("isNullish", () => {
    it("should return true for null and undefined values", () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
    });

    it("should return false for falsy non-nullish values", () => {
      expect(isNullish("")).toBe(false);
      expect(isNullish(0)).toBe(false);
      expect(isNullish(false)).toBe(false);
    });

    it("should return false for objects and arrays", () => {
      expect(isNullish([])).toBe(false);
      expect(isNullish({})).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("should return true for boolean values", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it("should return false for primitives that look like booleans", () => {
      expect(isBoolean("true")).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
    });

    it("should return false for objects and arrays", () => {
      expect(isBoolean([])).toBe(false);
      expect(isBoolean({})).toBe(false);
    });
  });

  describe("isObject", () => {
    it("should return true for objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: "value" })).toBe(true);
      expect(isObject({ nested: { object: true } })).toBe(true);
    });

    it("should return false for null and undefined", () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });

    it("should return false for arrays", () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it("should return false for booleans", () => {
      expect(isObject(true)).toBe(false);
      expect(isObject(false)).toBe(false);
    });

    it("should return false for primitive strings and numbers", () => {
      expect(isObject("string")).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(Symbol("test"))).toBe(false);
    });
  });

  describe("isEmptyObject", () => {
    it("should return true for empty objects", () => {
      expect(isEmptyObject({})).toBe(true);
    });

    it("should return false for non-empty objects", () => {
      expect(isEmptyObject({ key: "value" })).toBe(false);
      expect(isEmptyObject({ key: undefined })).toBe(false);
    });

    it("should return false for null and undefined", () => {
      expect(isEmptyObject(null)).toBe(false);
      expect(isEmptyObject(undefined)).toBe(false);
    });

    it("should return false for arrays and primitives", () => {
      expect(isEmptyObject([])).toBe(false);
      expect(isEmptyObject("")).toBe(false);
      expect(isEmptyObject(0)).toBe(false);
    });
  });

  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(["a", "b"])).toBe(true);
      expect(isArray([{}, null, undefined])).toBe(true);
    });

    it("should return false for null and undefined", () => {
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });

    it("should return false for non-array values", () => {
      expect(isArray({})).toBe(false);
      expect(isArray("string")).toBe(false);
      expect(isArray(123)).toBe(false);
    });

    it("should return false for boolean values", () => {
      expect(isArray(true)).toBe(false);
    });
  });

  describe("isEmptyArray", () => {
    it("should return true for empty arrays", () => {
      expect(isEmptyArray([])).toBe(true);
    });

    it("should return false for non-empty arrays", () => {
      expect(isEmptyArray([1])).toBe(false);
      expect(isEmptyArray([undefined])).toBe(false);
      expect(isEmptyArray([null])).toBe(false);
    });
  });

  describe("isStringArray", () => {
    it("should return true for string arrays", () => {
      expect(isStringArray([])).toBe(true);
      expect(isStringArray([""])).toBe(true);
      expect(isStringArray(["a", "b", "c"])).toBe(true);
    });

    it("should return false for non-array values", () => {
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray(undefined)).toBe(false);
      expect(isStringArray("string")).toBe(false);
      expect(isStringArray(123)).toBe(false);
    });

    it("should return false for arrays with non-string elements", () => {
      expect(isStringArray([1, 2, 3])).toBe(false);
      expect(isStringArray(["a", 1, "c"])).toBe(false);
      expect(isStringArray([null])).toBe(false);
      expect(isStringArray([undefined])).toBe(false);
      expect(isStringArray([true])).toBe(false);
      // eslint-disable-next-line jest/max-expects
      expect(isStringArray([{}])).toBe(false);
      // eslint-disable-next-line jest/max-expects
      expect(isStringArray([[]])).toBe(false);
    });
  });

  describe("isObjectWithProperty", () => {
    it("should return true for objects with the specified property", () => {
      expect(isObjectWithProperty({ key: "value" }, "key")).toBe(true);
      expect(isObjectWithProperty({ key: undefined }, "key")).toBe(true);
      expect(isObjectWithProperty({ key: null }, "key")).toBe(true);
    });

    it("should return true for objects with multiple properties", () => {
      expect(isObjectWithProperty({ a: 1, b: 2 }, "a")).toBe(true);
    });

    it("should return false for objects without the property", () => {
      expect(isObjectWithProperty({ key: "value" }, "other")).toBe(false);
      expect(isObjectWithProperty({}, "key")).toBe(false);
    });

    it("should return false for null and undefined", () => {
      expect(isObjectWithProperty(null, "key")).toBe(false);
      expect(isObjectWithProperty(undefined, "key")).toBe(false);
    });

    it("should return false for non-object primitives", () => {
      expect(isObjectWithProperty("string", "key")).toBe(false);
      expect(isObjectWithProperty(123, "key")).toBe(false);
      expect(isObjectWithProperty([], "key")).toBe(false);
    });
  });

  describe("isObjectWithAnyOfProperties", () => {
    it("should return true when object has any property", () => {
      expect(isObjectWithAnyOfProperties({ a: 1 }, ["a", "b"])).toBe(true);
      expect(isObjectWithAnyOfProperties({ b: 2 }, ["a", "b"])).toBe(true);
    });

    it("should return true when object has multiple properties", () => {
      expect(isObjectWithAnyOfProperties({ a: 1, b: 2 }, ["a", "b"])).toBe(
        true
      );
      expect(isObjectWithAnyOfProperties({ c: 3, a: 1 }, ["a", "b"])).toBe(
        true
      );
    });

    it("should return false when object lacks all properties", () => {
      expect(isObjectWithAnyOfProperties({ c: 3 }, ["a", "b"])).toBe(false);
      expect(isObjectWithAnyOfProperties({}, ["a", "b"])).toBe(false);
    });

    it("should return false for null and undefined", () => {
      expect(isObjectWithAnyOfProperties(null, ["a", "b"])).toBe(false);
      expect(isObjectWithAnyOfProperties(undefined, ["a", "b"])).toBe(false);
    });

    it("should return false for primitives and arrays", () => {
      expect(isObjectWithAnyOfProperties("string", ["a", "b"])).toBe(false);
      expect(isObjectWithAnyOfProperties(123, ["a", "b"])).toBe(false);
      expect(isObjectWithAnyOfProperties([], ["a", "b"])).toBe(false);
    });

    it("should return false when keys array is empty", () => {
      expect(isObjectWithAnyOfProperties({ a: 1 }, [])).toBe(false);
    });
  });
});
