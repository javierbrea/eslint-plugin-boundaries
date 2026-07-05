import type { ModuleSingleSelector } from "./ModuleSelector.types";
import {
  isModuleSingleSelector,
  isModuleSelector,
  normalizeModuleSingleSelector,
  normalizeModuleSelector,
} from "./ModuleSelectorHelpers";

describe("ModuleSelectorHelpers", () => {
  describe("isModuleSingleSelector", () => {
    it("should return true for an object with origin property", () => {
      expect(isModuleSingleSelector({ origin: "src/**" })).toBe(true);
    });

    it("should return true for an object with source property", () => {
      expect(isModuleSingleSelector({ source: "lodash" })).toBe(true);
    });

    it("should return true for an object with internalPath property", () => {
      expect(isModuleSingleSelector({ internalPath: "utils/**" })).toBe(true);
    });

    it("should return true for an object with multiple module selector properties", () => {
      expect(
        isModuleSingleSelector({
          origin: "src/**",
          source: "lodash",
          internalPath: "utils/**",
        })
      ).toBe(true);
    });

    it("should return true for an object with a subset of module selector properties", () => {
      expect(
        isModuleSingleSelector({ origin: "src/**", source: "lodash" })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isModuleSingleSelector({})).toBe(false);
    });

    it("should return false for an object without any module selector properties", () => {
      expect(isModuleSingleSelector({ foo: "bar", baz: 123 })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isModuleSingleSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isModuleSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isModuleSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isModuleSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isModuleSingleSelector([{ origin: "src/**" }])).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isModuleSingleSelector(true)).toBe(false);
    });
  });

  describe("isModuleSelector", () => {
    it("should return true for a single module selector object", () => {
      expect(isModuleSelector({ origin: "src/**" })).toBe(true);
    });

    it("should return true for an array of module selector objects", () => {
      expect(
        isModuleSelector([{ origin: "src/**" }, { source: "lodash" }])
      ).toBe(true);
    });

    it("should return true for an array with a single module selector", () => {
      expect(isModuleSelector([{ internalPath: "utils/**" }])).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isModuleSelector([])).toBe(true);
    });

    it("should return false for an array containing invalid objects", () => {
      expect(isModuleSelector([{ foo: "bar" }])).toBe(false);
    });

    it("should return false for an array with mixed valid and invalid objects", () => {
      expect(isModuleSelector([{ origin: "src/**" }, { foo: "bar" }])).toBe(
        false
      );
    });

    it("should return false for a string", () => {
      expect(isModuleSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isModuleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isModuleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isModuleSelector(undefined)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isModuleSelector(true)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isModuleSelector({})).toBe(false);
    });
  });

  describe("normalizeModuleSingleSelector", () => {
    it("should return the selector when it has origin property", () => {
      const selector: ModuleSingleSelector = { origin: "src/**" };

      expect(normalizeModuleSingleSelector(selector)).toEqual(selector);
    });

    it("should return the selector when it has source property", () => {
      const selector: ModuleSingleSelector = { source: "lodash" };

      expect(normalizeModuleSingleSelector(selector)).toEqual(selector);
    });

    it("should return the selector when it has internalPath property", () => {
      const selector: ModuleSingleSelector = { internalPath: "utils/**" };

      expect(normalizeModuleSingleSelector(selector)).toEqual(selector);
    });

    it("should return the selector when it has all properties", () => {
      const selector: ModuleSingleSelector = {
        origin: "src/**",
        source: "lodash",
        internalPath: "utils/**",
      };

      expect(normalizeModuleSingleSelector(selector)).toEqual(selector);
    });

    it("should throw an error for an invalid selector", () => {
      expect(() => normalizeModuleSingleSelector({})).toThrow(
        "Invalid module selector"
      );
    });
  });

  describe("normalizeModuleSelector", () => {
    it("should wrap a single selector in an array", () => {
      const selector: ModuleSingleSelector = { origin: "src/**" };

      expect(normalizeModuleSelector(selector)).toEqual([selector]);
    });

    it("should normalize each item in an array selector", () => {
      const selectors: ModuleSingleSelector[] = [
        { origin: "src/**" },
        { source: "lodash" },
      ];

      expect(normalizeModuleSelector(selectors)).toEqual(selectors);
    });

    it("should return an array with a single item for a single selector with all properties", () => {
      const selector: ModuleSingleSelector = {
        origin: "src/**",
        source: "lodash",
        internalPath: "utils/**",
      };

      expect(normalizeModuleSelector(selector)).toEqual([selector]);
    });

    it("should handle an array with a single selector", () => {
      const selectors: ModuleSingleSelector[] = [{ origin: "src/**" }];

      expect(normalizeModuleSelector(selectors)).toEqual(selectors);
    });

    it("should throw an error for an invalid selector", () => {
      expect(() =>
        normalizeModuleSelector(
          // @ts-expect-error Testing invalid input
          "invalid"
        )
      ).toThrow("Invalid module selector");
    });

    it("should throw an error when array contains invalid selectors", () => {
      expect(() => normalizeModuleSelector([{}])).toThrow(
        "Invalid module selector"
      );
    });
  });
});
