import type {
  ElementSingleSelector,
  LegacyElementSingleObjectSelector,
  LegacyParentElementSingleSelector,
  BackwardCompatibleParentElementSingleSelector,
  BackwardCompatibleParentElementSelector,
  ParentElementSingleSelector,
  LegacySimpleElementSingleSelector,
} from "./ElementSelector.types";
import {
  isLegacySimpleElementSingleSelectorByType,
  isLegacySimpleElementSingleSelectorByTypeWithOptions,
  isLegacySimpleElementSingleSelector,
  isLegacyParentElementSingleSelector,
  isLegacyElementSingleObjectSelector,
  isLegacyElementSingleSelector,
  isLegacyElementSelector,
  isElementSingleSelector,
  isElementSelector,
  isBackwardCompatibleElementSingleSelector,
  isBackwardCompatibleElementSelector,
  normalizeLegacySimpleElementSingleSelector,
  normalizeLegacyParentElementSelectors,
  normalizeParentElementSelector,
  normalizeParentInElementSingleSelector,
  normalizeLegacyElementSingleObjectSelector,
  normalizeLegacyElementSingleSelector,
  normalizeSingleElementSelector,
  normalizeElementSelector,
} from "./ElementSelectorHelpers";

describe("ElementSelectorHelpers", () => {
  describe("isLegacySimpleElementSingleSelectorByType", () => {
    it("should return true for a string", () => {
      expect(isLegacySimpleElementSingleSelectorByType("components")).toBe(
        true
      );
    });

    it("should return true for an empty string", () => {
      expect(isLegacySimpleElementSingleSelectorByType("")).toBe(true);
    });

    it("should return false for a number", () => {
      expect(isLegacySimpleElementSingleSelectorByType(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacySimpleElementSingleSelectorByType(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacySimpleElementSingleSelectorByType(undefined)).toBe(false);
    });

    it("should return false for an object", () => {
      expect(isLegacySimpleElementSingleSelectorByType({ type: "foo" })).toBe(
        false
      );
    });

    it("should return false for an array", () => {
      expect(isLegacySimpleElementSingleSelectorByType(["a"])).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacySimpleElementSingleSelectorByType(true)).toBe(false);
    });
  });

  describe("isLegacySimpleElementSingleSelectorByTypeWithOptions", () => {
    it("should return true for a tuple with type and captured values", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions([
          "components",
          { key: "value" },
        ])
      ).toBe(true);
    });

    it("should return true for a single-element array with a string", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions(["components"])
      ).toBe(true);
    });

    it("should return false for an empty array", () => {
      expect(isLegacySimpleElementSingleSelectorByTypeWithOptions([])).toBe(
        false
      );
    });

    it("should return false for an array with three elements", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions([
          "a",
          { key: "v" },
          "extra",
        ])
      ).toBe(false);
    });

    it("should return false for an array with two strings", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions(["a", "b"])
      ).toBe(false);
    });

    it("should return false for a string", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions("components")
      ).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isLegacySimpleElementSingleSelectorByTypeWithOptions(42)).toBe(
        false
      );
    });

    it("should return false for null", () => {
      expect(isLegacySimpleElementSingleSelectorByTypeWithOptions(null)).toBe(
        false
      );
    });

    it("should return false for undefined", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions(undefined)
      ).toBe(false);
    });

    it("should return false for an object", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions({ key: "value" })
      ).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacySimpleElementSingleSelectorByTypeWithOptions(true)).toBe(
        false
      );
    });

    it("should return false for an array where first element is not a string", () => {
      expect(
        isLegacySimpleElementSingleSelectorByTypeWithOptions([
          42,
          { key: "value" },
        ])
      ).toBe(false);
    });
  });

  describe("isLegacySimpleElementSingleSelector", () => {
    it("should return true for a string", () => {
      expect(isLegacySimpleElementSingleSelector("components")).toBe(true);
    });

    it("should return true for a tuple with type and captured values", () => {
      expect(
        isLegacySimpleElementSingleSelector(["components", { key: "value" }])
      ).toBe(true);
    });

    it("should return true for a single-element array with a string", () => {
      expect(isLegacySimpleElementSingleSelector(["components"])).toBe(true);
    });

    it("should return false for a number", () => {
      expect(isLegacySimpleElementSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacySimpleElementSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacySimpleElementSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isLegacySimpleElementSingleSelector({})).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacySimpleElementSingleSelector(true)).toBe(false);
    });
  });

  describe("isLegacyParentElementSingleSelector", () => {
    it("should return true for an object with elementPath property", () => {
      expect(
        isLegacyParentElementSingleSelector({ elementPath: "src/**" })
      ).toBe(true);
    });

    it("should return true for an object with elementPath and other properties", () => {
      expect(
        isLegacyParentElementSingleSelector({
          elementPath: "src/**",
          type: "components",
        })
      ).toBe(true);
    });

    it("should return false for an object without elementPath", () => {
      expect(isLegacyParentElementSingleSelector({ type: "components" })).toBe(
        false
      );
    });

    it("should return false for an empty object", () => {
      expect(isLegacyParentElementSingleSelector({})).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isLegacyParentElementSingleSelector("elementPath")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyParentElementSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyParentElementSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(
        isLegacyParentElementSingleSelector([{ elementPath: "src/**" }])
      ).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacyParentElementSingleSelector(true)).toBe(false);
    });
  });

  describe("isLegacyElementSingleObjectSelector", () => {
    it("should return true for an object with origin property", () => {
      expect(isLegacyElementSingleObjectSelector({ origin: "src/**" })).toBe(
        true
      );
    });

    it("should return true for an object with elementPath property", () => {
      expect(
        isLegacyElementSingleObjectSelector({ elementPath: "src/**" })
      ).toBe(true);
    });

    it("should return true for an object with internalPath property", () => {
      expect(
        isLegacyElementSingleObjectSelector({ internalPath: "index.ts" })
      ).toBe(true);
    });

    it("should return true for an object with parent having elementPath", () => {
      expect(
        isLegacyElementSingleObjectSelector({
          parent: { elementPath: "src/**" },
        })
      ).toBe(true);
    });

    it("should return true for an object with multiple legacy properties", () => {
      expect(
        isLegacyElementSingleObjectSelector({
          origin: "src/**",
          elementPath: "components/**",
          internalPath: "index.ts",
        })
      ).toBe(true);
    });

    it("should return false for an object with parent without elementPath", () => {
      expect(
        isLegacyElementSingleObjectSelector({
          parent: { type: "components" },
        })
      ).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isLegacyElementSingleObjectSelector({})).toBe(false);
    });

    it("should return false for an object with non-legacy properties only", () => {
      expect(isLegacyElementSingleObjectSelector({ type: "components" })).toBe(
        false
      );
    });

    it("should return false for a string", () => {
      expect(isLegacyElementSingleObjectSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyElementSingleObjectSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyElementSingleObjectSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isLegacyElementSingleObjectSelector([{ origin: "src/**" }])).toBe(
        false
      );
    });

    it("should return false for a boolean", () => {
      expect(isLegacyElementSingleObjectSelector(true)).toBe(false);
    });
  });

  describe("isLegacyElementSingleSelector", () => {
    it("should return true for a string (simple selector by type)", () => {
      expect(isLegacyElementSingleSelector("components")).toBe(true);
    });

    it("should return true for a tuple with type and options", () => {
      expect(
        isLegacyElementSingleSelector(["components", { key: "value" }])
      ).toBe(true);
    });

    it("should return true for an object with origin property", () => {
      expect(isLegacyElementSingleSelector({ origin: "src/**" })).toBe(true);
    });

    it("should return true for an object with elementPath property", () => {
      expect(isLegacyElementSingleSelector({ elementPath: "src/**" })).toBe(
        true
      );
    });

    it("should return true for an object with internalPath property", () => {
      expect(isLegacyElementSingleSelector({ internalPath: "index.ts" })).toBe(
        true
      );
    });

    it("should return false for a number", () => {
      expect(isLegacyElementSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyElementSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyElementSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isLegacyElementSingleSelector({})).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacyElementSingleSelector(true)).toBe(false);
    });
  });

  describe("isLegacyElementSelector", () => {
    it("should return true for a string", () => {
      expect(isLegacyElementSelector("components")).toBe(true);
    });

    it("should return true for a legacy object selector", () => {
      expect(isLegacyElementSelector({ origin: "src/**" })).toBe(true);
    });

    it("should return true for an array with at least one legacy selector", () => {
      expect(
        isLegacyElementSelector(["components", { origin: "src/**" }])
      ).toBe(true);
    });

    it("should return true for an array of strings (legacy simple selectors)", () => {
      expect(isLegacyElementSelector(["components", "helpers"])).toBe(true);
    });

    it("should return false for an array with no legacy selectors", () => {
      expect(isLegacyElementSelector([42, false])).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isLegacyElementSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyElementSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyElementSelector(undefined)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacyElementSelector(true)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isLegacyElementSelector({})).toBe(false);
    });
  });

  describe("isElementSingleSelector", () => {
    it("should return true for an object with type property", () => {
      expect(isElementSingleSelector({ type: "components" })).toBe(true);
    });

    it("should return true for an object with types property", () => {
      expect(isElementSingleSelector({ types: "components" })).toBe(true);
    });

    it("should return true for an object with parent property", () => {
      expect(isElementSingleSelector({ parent: { type: "components" } })).toBe(
        true
      );
    });

    it("should return true for an object with category property", () => {
      expect(isElementSingleSelector({ category: "ui" })).toBe(true);
    });

    it("should return true for an object with fileInternalPath property", () => {
      expect(isElementSingleSelector({ fileInternalPath: "index.ts" })).toBe(
        true
      );
    });

    it("should return true for an object with path property (extends base selector)", () => {
      expect(isElementSingleSelector({ path: "src/**" })).toBe(true);
    });

    it("should return true for an object with captured property (extends base selector)", () => {
      expect(isElementSingleSelector({ captured: { key: "value" } })).toBe(
        true
      );
    });

    it("should return true for an object with isIgnored property (extends base selector)", () => {
      expect(isElementSingleSelector({ isIgnored: true })).toBe(true);
    });

    it("should return true for an object with isUnknown property (extends base selector)", () => {
      expect(isElementSingleSelector({ isUnknown: false })).toBe(true);
    });

    it("should return true for an object with multiple element selector properties", () => {
      expect(
        isElementSingleSelector({
          type: "components",
          category: "ui",
          fileInternalPath: "index.ts",
        })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isElementSingleSelector({})).toBe(false);
    });

    it("should return false for an object without element selector properties", () => {
      expect(isElementSingleSelector({ foo: "bar" })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isElementSingleSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isElementSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isElementSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isElementSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isElementSingleSelector([{ type: "components" }])).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isElementSingleSelector(true)).toBe(false);
    });
  });

  describe("isElementSelector", () => {
    it("should return true for a single element selector object", () => {
      expect(isElementSelector({ type: "components" })).toBe(true);
    });

    it("should return true for an array of element selector objects", () => {
      expect(
        isElementSelector([{ type: "components" }, { category: "ui" }])
      ).toBe(true);
    });

    it("should return true for an array with a single element selector", () => {
      expect(isElementSelector([{ type: "components" }])).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isElementSelector([])).toBe(true);
    });

    it("should return false for an array containing invalid objects", () => {
      expect(isElementSelector([{ foo: "bar" }])).toBe(false);
    });

    it("should return false for an array with mixed valid and invalid objects", () => {
      expect(isElementSelector([{ type: "components" }, { foo: "bar" }])).toBe(
        false
      );
    });

    it("should return false for a string", () => {
      expect(isElementSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isElementSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isElementSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isElementSelector(undefined)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isElementSelector(true)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isElementSelector({})).toBe(false);
    });
  });

  describe("isBackwardCompatibleElementSingleSelector", () => {
    it("should return true for a legacy string selector", () => {
      expect(isBackwardCompatibleElementSingleSelector("components")).toBe(
        true
      );
    });

    it("should return true for a legacy object selector with origin", () => {
      expect(
        isBackwardCompatibleElementSingleSelector({ origin: "src/**" })
      ).toBe(true);
    });

    it("should return true for a new element selector with type", () => {
      expect(
        isBackwardCompatibleElementSingleSelector({ type: "components" })
      ).toBe(true);
    });

    it("should return true for a new element selector with path", () => {
      expect(
        isBackwardCompatibleElementSingleSelector({ path: "src/**" })
      ).toBe(true);
    });

    it("should return false for a number", () => {
      expect(isBackwardCompatibleElementSingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isBackwardCompatibleElementSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isBackwardCompatibleElementSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isBackwardCompatibleElementSingleSelector({})).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isBackwardCompatibleElementSingleSelector(true)).toBe(false);
    });
  });

  describe("isBackwardCompatibleElementSelector", () => {
    it("should return true for a legacy string selector", () => {
      expect(isBackwardCompatibleElementSelector("components")).toBe(true);
    });

    it("should return true for a legacy object selector", () => {
      expect(isBackwardCompatibleElementSelector({ origin: "src/**" })).toBe(
        true
      );
    });

    it("should return true for a new element selector", () => {
      expect(isBackwardCompatibleElementSelector({ type: "components" })).toBe(
        true
      );
    });

    it("should return true for an array of legacy selectors", () => {
      expect(
        isBackwardCompatibleElementSelector(["components", "helpers"])
      ).toBe(true);
    });

    it("should return true for an array of new selectors", () => {
      expect(
        isBackwardCompatibleElementSelector([
          { type: "components" },
          { category: "ui" },
        ])
      ).toBe(true);
    });

    it("should return false for a number", () => {
      expect(isBackwardCompatibleElementSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isBackwardCompatibleElementSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isBackwardCompatibleElementSelector(undefined)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isBackwardCompatibleElementSelector({})).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isBackwardCompatibleElementSelector(true)).toBe(false);
    });
  });

  describe("normalizeLegacySimpleElementSingleSelector", () => {
    it("should convert a string to an object with type", () => {
      expect(normalizeLegacySimpleElementSingleSelector("components")).toEqual({
        type: "components",
      });
    });

    it("should convert a tuple with type and captured values", () => {
      const selector: LegacySimpleElementSingleSelector = [
        "components",
        { key: "value" },
      ];

      expect(normalizeLegacySimpleElementSingleSelector(selector)).toEqual({
        type: "components",
        captured: { key: "value" },
      });
    });

    it("should convert a single-element array with a string", () => {
      // @ts-expect-error Testing invalid input: single-element array is not a valid tuple
      const selector: LegacySimpleElementSingleSelector = ["components"];

      expect(normalizeLegacySimpleElementSingleSelector(selector)).toEqual({
        type: "components",
      });
    });

    it("should throw an error for an invalid selector", () => {
      expect(() =>
        normalizeLegacySimpleElementSingleSelector(
          // @ts-expect-error Testing invalid input
          42
        )
      ).toThrow("Invalid legacy simple element single selector");
    });
  });

  describe("normalizeLegacyParentElementSelectors", () => {
    it("should normalize legacy parent selectors with elementPath to path", () => {
      const selectors: BackwardCompatibleParentElementSingleSelector[] = [
        { elementPath: "src/**" },
      ];

      expect(normalizeLegacyParentElementSelectors(selectors)).toEqual([
        { path: "src/**" },
      ]);
    });

    it("should pass through non-legacy parent selectors unchanged", () => {
      const selectors: BackwardCompatibleParentElementSingleSelector[] = [
        { type: "components" },
      ];

      expect(normalizeLegacyParentElementSelectors(selectors)).toEqual([
        { type: "components" },
      ]);
    });

    it("should handle mixed legacy and non-legacy selectors", () => {
      const selectors: BackwardCompatibleParentElementSingleSelector[] = [
        { elementPath: "src/**" } as LegacyParentElementSingleSelector,
        { type: "components" } as ParentElementSingleSelector,
      ];

      expect(normalizeLegacyParentElementSelectors(selectors)).toEqual([
        { path: "src/**" },
        { type: "components" },
      ]);
    });

    it("should omit path when legacy selector has explicitly undefined elementPath", () => {
      const selectors: BackwardCompatibleParentElementSingleSelector[] = [
        { elementPath: undefined, type: "components" },
      ];

      expect(normalizeLegacyParentElementSelectors(selectors)).toEqual([
        { type: "components" },
      ]);
    });

    it("should handle an empty array", () => {
      expect(normalizeLegacyParentElementSelectors([])).toEqual([]);
    });

    it("should preserve other properties when normalizing legacy selectors", () => {
      const selectors: BackwardCompatibleParentElementSingleSelector[] = [
        { elementPath: "src/**", type: "components" },
      ];

      expect(normalizeLegacyParentElementSelectors(selectors)).toEqual([
        { path: "src/**", type: "components" },
      ]);
    });
  });

  describe("normalizeParentElementSelector", () => {
    it("should return null for null input", () => {
      expect(normalizeParentElementSelector(null)).toBeNull();
    });

    it("should wrap a single non-legacy selector in an array", () => {
      const selector: BackwardCompatibleParentElementSelector = {
        type: "components",
      };

      expect(normalizeParentElementSelector(selector)).toEqual([
        { type: "components" },
      ]);
    });

    it("should wrap a single legacy selector in an array and normalize it", () => {
      const selector: LegacyParentElementSingleSelector = {
        elementPath: "src/**",
      };

      expect(normalizeParentElementSelector(selector)).toEqual([
        { path: "src/**" },
      ]);
    });

    it("should normalize an array of selectors", () => {
      const selectors: BackwardCompatibleParentElementSingleSelector[] = [
        { elementPath: "src/**" } as LegacyParentElementSingleSelector,
        { type: "components" },
      ];

      expect(normalizeParentElementSelector(selectors)).toEqual([
        { path: "src/**" },
        { type: "components" },
      ]);
    });

    it("should handle an array with a single non-legacy selector", () => {
      const selectors: BackwardCompatibleParentElementSingleSelector[] = [
        { type: "components" },
      ];

      expect(normalizeParentElementSelector(selectors)).toEqual([
        { type: "components" },
      ]);
    });
  });

  describe("normalizeParentInElementSingleSelector", () => {
    it("should return the selector without parent when parent is undefined", () => {
      const selector: ElementSingleSelector = { type: "components" };

      expect(normalizeParentInElementSingleSelector(selector)).toEqual({
        type: "components",
      });
    });

    it("should normalize a parent selector that is null", () => {
      const selector: ElementSingleSelector = {
        type: "components",
        parent: null,
      };

      expect(normalizeParentInElementSingleSelector(selector)).toEqual({
        type: "components",
        parent: null,
      });
    });

    it("should normalize a single parent selector into an array", () => {
      const selector: ElementSingleSelector = {
        type: "components",
        parent: { type: "modules" },
      };

      expect(normalizeParentInElementSingleSelector(selector)).toEqual({
        type: "components",
        parent: [{ type: "modules" }],
      });
    });

    it("should normalize an array parent selector", () => {
      const selector: ElementSingleSelector = {
        type: "components",
        parent: [{ type: "modules" }, { type: "helpers" }],
      };

      expect(normalizeParentInElementSingleSelector(selector)).toEqual({
        type: "components",
        parent: [{ type: "modules" }, { type: "helpers" }],
      });
    });

    it("should preserve other properties", () => {
      const selector: ElementSingleSelector = {
        type: "components",
        category: "ui",
        fileInternalPath: "index.ts",
      };

      expect(normalizeParentInElementSingleSelector(selector)).toEqual({
        type: "components",
        category: "ui",
        fileInternalPath: "index.ts",
      });
    });
  });

  describe("normalizeLegacyElementSingleObjectSelector", () => {
    it("should convert elementPath to path", () => {
      const selector: LegacyElementSingleObjectSelector = {
        elementPath: "src/**",
      };

      expect(normalizeLegacyElementSingleObjectSelector(selector)).toEqual({
        path: "src/**",
      });
    });

    it("should convert internalPath to fileInternalPath", () => {
      const selector: LegacyElementSingleObjectSelector = {
        internalPath: "index.ts",
      };

      expect(normalizeLegacyElementSingleObjectSelector(selector)).toEqual({
        fileInternalPath: "index.ts",
      });
    });

    it("should convert both elementPath and internalPath", () => {
      const selector: LegacyElementSingleObjectSelector = {
        elementPath: "src/**",
        internalPath: "index.ts",
      };

      expect(normalizeLegacyElementSingleObjectSelector(selector)).toEqual({
        path: "src/**",
        fileInternalPath: "index.ts",
      });
    });

    it("should normalize parent selector", () => {
      const selector: LegacyElementSingleObjectSelector = {
        elementPath: "src/**",
        parent: { type: "modules" },
      };

      expect(normalizeLegacyElementSingleObjectSelector(selector)).toEqual({
        path: "src/**",
        parent: [{ type: "modules" }],
      });
    });

    it("should throw an error when origin is present", () => {
      const selector: LegacyElementSingleObjectSelector = {
        origin: "src/**",
      };

      expect(() =>
        normalizeLegacyElementSingleObjectSelector(selector)
      ).toThrow('the "origin" property is an entity-level property');
    });

    it("should preserve non-legacy properties", () => {
      const selector: LegacyElementSingleObjectSelector = {
        elementPath: "src/**",
        type: "components",
        category: "ui",
      };

      expect(normalizeLegacyElementSingleObjectSelector(selector)).toEqual({
        path: "src/**",
        type: "components",
        category: "ui",
      });
    });

    it("should normalize legacy parent with elementPath", () => {
      const selector: LegacyElementSingleObjectSelector = {
        elementPath: "src/**",
        parent: {
          elementPath: "modules/**",
        } as LegacyParentElementSingleSelector,
      };

      expect(normalizeLegacyElementSingleObjectSelector(selector)).toEqual({
        path: "src/**",
        parent: [{ path: "modules/**" }],
      });
    });
  });

  describe("normalizeLegacyElementSingleSelector", () => {
    it("should normalize a string selector", () => {
      expect(normalizeLegacyElementSingleSelector("components")).toEqual({
        type: "components",
      });
    });

    it("should normalize a tuple selector", () => {
      expect(
        normalizeLegacyElementSingleSelector(["components", { key: "value" }])
      ).toEqual({
        type: "components",
        captured: { key: "value" },
      });
    });

    it("should normalize a legacy object selector with elementPath", () => {
      expect(
        normalizeLegacyElementSingleSelector({ elementPath: "src/**" })
      ).toEqual({ path: "src/**" });
    });

    it("should normalize a legacy object selector with internalPath", () => {
      expect(
        normalizeLegacyElementSingleSelector({ internalPath: "index.ts" })
      ).toEqual({ fileInternalPath: "index.ts" });
    });

    it("should throw an error for an invalid selector", () => {
      expect(() =>
        normalizeLegacyElementSingleSelector(
          // @ts-expect-error Testing invalid input
          42
        )
      ).toThrow("Invalid legacy element single selector");
    });
  });

  describe("normalizeSingleElementSelector", () => {
    it("should normalize a legacy string selector", () => {
      expect(normalizeSingleElementSelector("components")).toEqual({
        type: "components",
      });
    });

    it("should normalize a legacy object selector", () => {
      expect(normalizeSingleElementSelector({ elementPath: "src/**" })).toEqual(
        { path: "src/**" }
      );
    });

    it("should normalize a new element selector and normalize its parent", () => {
      const selector: ElementSingleSelector = {
        type: "components",
        parent: { type: "modules" },
      };

      expect(normalizeSingleElementSelector(selector)).toEqual({
        type: "components",
        parent: [{ type: "modules" }],
      });
    });

    it("should return the selector as-is when it has no parent", () => {
      const selector: ElementSingleSelector = {
        type: "components",
        category: "ui",
      };

      expect(normalizeSingleElementSelector(selector)).toEqual({
        type: "components",
        category: "ui",
      });
    });

    it("should throw an error for an invalid selector", () => {
      expect(() =>
        normalizeSingleElementSelector(
          // @ts-expect-error Testing invalid input
          42
        )
      ).toThrow();
    });
  });

  describe("normalizeElementSelector", () => {
    it("should wrap a single string selector in an array", () => {
      expect(normalizeElementSelector("components")).toEqual([
        { type: "components" },
      ]);
    });

    it("should wrap a single object selector in an array", () => {
      expect(normalizeElementSelector({ type: "components" })).toEqual([
        { type: "components" },
      ]);
    });

    it("should normalize a legacy tuple selector and wrap in an array", () => {
      expect(
        normalizeElementSelector(["components", { key: "value" }])
      ).toEqual([{ type: "components", captured: { key: "value" } }]);
    });

    it("should normalize each item in an array of element selectors", () => {
      expect(
        normalizeElementSelector([
          { type: "components" },
          { type: "helpers", category: "ui" },
        ])
      ).toEqual([{ type: "components" }, { type: "helpers", category: "ui" }]);
    });

    it("should normalize an array of legacy string selectors", () => {
      expect(normalizeElementSelector(["components", "helpers"])).toEqual([
        { type: "components" },
        { type: "helpers" },
      ]);
    });

    it("should treat a length-2 array with string and captured values object as a legacy tuple", () => {
      expect(
        normalizeElementSelector([
          "components",
          { type: "helpers", category: "ui" },
        ])
      ).toEqual([
        {
          type: "components",
          captured: { type: "helpers", category: "ui" },
        },
      ]);
    });

    it("should normalize parent selectors within element selectors", () => {
      expect(
        normalizeElementSelector({
          type: "components",
          parent: { type: "modules" },
        })
      ).toEqual([{ type: "components", parent: [{ type: "modules" }] }]);
    });

    it("should handle a single selector with a single-element array", () => {
      expect(normalizeElementSelector([{ type: "components" }])).toEqual([
        { type: "components" },
      ]);
    });

    it("should handle legacy object selectors in an array", () => {
      expect(
        normalizeElementSelector([
          { elementPath: "src/**" },
          { internalPath: "index.ts" },
        ])
      ).toEqual([{ path: "src/**" }, { fileInternalPath: "index.ts" }]);
    });
  });
});
