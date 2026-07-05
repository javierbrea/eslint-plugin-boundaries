import type { FileSingleSelector } from "./FileSelector.types";
import {
  isFileSingleSelector,
  isFileSelector,
  normalizeSingleFileSelector,
  normalizeFileSelector,
} from "./FileSelectorHelpers";

describe("FileSelectorHelpers", () => {
  describe("isFileSingleSelector", () => {
    it("should return true for an object with categories property", () => {
      expect(isFileSingleSelector({ categories: "components" })).toBe(true);
    });

    it("should return true for an object with categories as an array", () => {
      expect(
        isFileSingleSelector({ categories: ["components", "utils"] })
      ).toBe(true);
    });

    it("should return true for an object with path property", () => {
      expect(isFileSingleSelector({ path: "src/**" })).toBe(true);
    });

    it("should return true for an object with captured property", () => {
      expect(isFileSingleSelector({ captured: { key: "value" } })).toBe(true);
    });

    it("should return true for an object with isIgnored property", () => {
      expect(isFileSingleSelector({ isIgnored: true })).toBe(true);
    });

    it("should return true for an object with isUnknown property", () => {
      expect(isFileSingleSelector({ isUnknown: false })).toBe(true);
    });

    it("should return true for an object with multiple file selector properties", () => {
      expect(
        isFileSingleSelector({
          categories: "components",
          path: "src/**",
          captured: { key: "value" },
        })
      ).toBe(true);
    });

    it("should return true for an object with a subset of file selector properties", () => {
      expect(
        isFileSingleSelector({ categories: "components", path: "src/**" })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isFileSingleSelector({})).toBe(false);
    });

    it("should return false for an object without any file selector properties", () => {
      expect(isFileSingleSelector({ foo: "bar", baz: 123 })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isFileSingleSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isFileSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isFileSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isFileSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isFileSingleSelector([{ categories: "components" }])).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isFileSingleSelector(true)).toBe(false);
    });
  });

  describe("isFileSelector", () => {
    it("should return true for a single file selector object", () => {
      expect(isFileSelector({ categories: "components" })).toBe(true);
    });

    it("should return true for an array of file selector objects", () => {
      expect(
        isFileSelector([{ categories: "components" }, { path: "src/**" }])
      ).toBe(true);
    });

    it("should return true for an array with a single file selector", () => {
      expect(isFileSelector([{ categories: "utils" }])).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isFileSelector([])).toBe(true);
    });

    it("should return false for an array containing invalid objects", () => {
      expect(isFileSelector([{ foo: "bar" }])).toBe(false);
    });

    it("should return false for an array with mixed valid and invalid objects", () => {
      expect(
        isFileSelector([{ categories: "components" }, { foo: "bar" }])
      ).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isFileSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isFileSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isFileSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isFileSelector(undefined)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isFileSelector(true)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isFileSelector({})).toBe(false);
    });
  });

  describe("normalizeSingleFileSelector", () => {
    it("should return the selector when it has categories property", () => {
      const selector: FileSingleSelector = { categories: "components" };

      expect(normalizeSingleFileSelector(selector)).toEqual(selector);
    });

    it("should return the selector when it has path property", () => {
      const selector: FileSingleSelector = { path: "src/**" };

      expect(normalizeSingleFileSelector(selector)).toEqual(selector);
    });

    it("should return the selector when it has captured property", () => {
      const selector: FileSingleSelector = { captured: { key: "value" } };

      expect(normalizeSingleFileSelector(selector)).toEqual(selector);
    });

    it("should return the selector when it has all properties", () => {
      const selector: FileSingleSelector = {
        categories: "components",
        path: "src/**",
        captured: { key: "value" },
        isIgnored: false,
        isUnknown: false,
      };

      expect(normalizeSingleFileSelector(selector)).toEqual(selector);
    });

    it("should return a new object, not the same reference", () => {
      const selector: FileSingleSelector = { categories: "components" };
      const result = normalizeSingleFileSelector(selector);

      expect(result).toEqual(selector);
      expect(result).not.toBe(selector);
    });

    it("should throw an error for an invalid selector", () => {
      expect(() => normalizeSingleFileSelector({})).toThrow(
        "Invalid file selector"
      );
    });
  });

  describe("normalizeFileSelector", () => {
    it("should wrap a single selector in an array", () => {
      const selector: FileSingleSelector = { categories: "components" };

      expect(normalizeFileSelector(selector)).toEqual([selector]);
    });

    it("should normalize each item in an array selector", () => {
      const selectors: FileSingleSelector[] = [
        { categories: "components" },
        { path: "src/**" },
      ];

      expect(normalizeFileSelector(selectors)).toEqual(selectors);
    });

    it("should return an array with a single item for a single selector with all properties", () => {
      const selector: FileSingleSelector = {
        categories: "components",
        path: "src/**",
        captured: { key: "value" },
      };

      expect(normalizeFileSelector(selector)).toEqual([selector]);
    });

    it("should handle an array with a single selector", () => {
      const selectors: FileSingleSelector[] = [{ categories: "components" }];

      expect(normalizeFileSelector(selectors)).toEqual(selectors);
    });

    it("should throw an error for an invalid selector", () => {
      expect(() =>
        normalizeFileSelector(
          // @ts-expect-error Testing invalid input
          "invalid"
        )
      ).toThrow("Invalid file selector");
    });

    it("should throw an error when array contains invalid selectors", () => {
      expect(() => normalizeFileSelector([{}])).toThrow(
        "Invalid file selector"
      );
    });
  });
});
