import type { EntitySingleSelector } from "./EntitySelector.types";
import {
  isLegacyEntitySingleSelector,
  isLegacyEntitySelector,
  isEntitySingleSelector,
  isEntitySelector,
  normalizeSingleEntitySelector,
  normalizeEntitySelector,
} from "./EntitySelectorHelpers";

describe("EntitySelectorHelpers", () => {
  describe("isLegacyEntitySingleSelector", () => {
    it("should return true for a legacy simple element selector string", () => {
      expect(isLegacyEntitySingleSelector("component")).toBe(true);
    });

    it("should return true for a legacy simple element selector tuple", () => {
      expect(
        isLegacyEntitySingleSelector(["component", { key: "value" }])
      ).toBe(true);
    });

    it("should return true for a legacy element object selector with origin", () => {
      expect(
        isLegacyEntitySingleSelector({ type: "component", origin: "local" })
      ).toBe(true);
    });

    it("should return true for a legacy element object selector with elementPath", () => {
      expect(
        isLegacyEntitySingleSelector({
          type: "component",
          elementPath: "src/**",
        })
      ).toBe(true);
    });

    it("should return true for a legacy element object selector with internalPath", () => {
      expect(
        isLegacyEntitySingleSelector({
          type: "component",
          internalPath: "index.ts",
        })
      ).toBe(true);
    });

    it("should return true for a modern element single selector (type only) since it is backward compatible", () => {
      expect(isLegacyEntitySingleSelector({ type: "component" })).toBe(true);
    });

    it("should return false for a new entity single selector with element property", () => {
      expect(
        isLegacyEntitySingleSelector({ element: { type: "component" } })
      ).toBe(false);
    });

    it("should return false for a new entity single selector with file property", () => {
      expect(
        isLegacyEntitySingleSelector({ file: { categories: "utils" } })
      ).toBe(false);
    });

    it("should return false for a new entity single selector with module property", () => {
      expect(
        isLegacyEntitySingleSelector({ module: { origin: "local" } })
      ).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyEntitySingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyEntitySingleSelector(undefined)).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isLegacyEntitySingleSelector(42)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacyEntitySingleSelector(true)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isLegacyEntitySingleSelector({})).toBe(false);
    });
  });

  describe("isLegacyEntitySelector", () => {
    it("should return true for a legacy simple element selector string", () => {
      expect(isLegacyEntitySelector("component")).toBe(true);
    });

    it("should return true for a legacy element object selector", () => {
      expect(
        isLegacyEntitySelector({ type: "component", origin: "local" })
      ).toBe(true);
    });

    it("should return true for a modern element single selector (backward compatible)", () => {
      expect(isLegacyEntitySelector({ type: "component" })).toBe(true);
    });

    it("should return true for an array containing at least one backward compatible element selector", () => {
      expect(
        isLegacyEntitySelector([
          { type: "component" },
          { element: { type: "helper" } },
        ])
      ).toBe(true);
    });

    it("should return true for an array of legacy simple element selectors", () => {
      expect(isLegacyEntitySelector(["component"])).toBe(true);
    });

    it("should return false for an array where no element is a backward compatible element selector", () => {
      expect(isLegacyEntitySelector([{ element: { type: "component" } }])).toBe(
        false
      );
    });

    it("should return false for a new entity single selector", () => {
      expect(isLegacyEntitySelector({ element: { type: "component" } })).toBe(
        false
      );
    });

    it("should return false for null", () => {
      expect(isLegacyEntitySelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyEntitySelector(undefined)).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isLegacyEntitySelector(42)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isLegacyEntitySelector(true)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isLegacyEntitySelector({})).toBe(false);
    });
  });

  describe("isEntitySingleSelector", () => {
    it("should return true for an object with element property", () => {
      expect(isEntitySingleSelector({ element: { type: "component" } })).toBe(
        true
      );
    });

    it("should return true for an object with file property", () => {
      expect(isEntitySingleSelector({ file: { categories: "utils" } })).toBe(
        true
      );
    });

    it("should return true for an object with module property", () => {
      expect(isEntitySingleSelector({ module: { origin: "local" } })).toBe(
        true
      );
    });

    it("should return true for an object with element, file, and module properties", () => {
      expect(
        isEntitySingleSelector({
          element: { type: "component" },
          file: { categories: "utils" },
          module: { origin: "local" },
        })
      ).toBe(true);
    });

    it("should return true for an object with element and file properties", () => {
      expect(
        isEntitySingleSelector({
          element: { type: "component" },
          file: { path: "src/**" },
        })
      ).toBe(true);
    });

    it("should return true for an object with element as array of selectors", () => {
      expect(
        isEntitySingleSelector({
          element: [{ type: "component" }, { type: "helper" }],
        })
      ).toBe(true);
    });

    it("should return true for an object with file as array of selectors", () => {
      expect(
        isEntitySingleSelector({
          file: [{ categories: "utils" }, { path: "src/**" }],
        })
      ).toBe(true);
    });

    it("should return true for an object with module as array of selectors", () => {
      expect(
        isEntitySingleSelector({
          module: [{ origin: "local" }, { source: "lodash" }],
        })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isEntitySingleSelector({})).toBe(false);
    });

    it("should return false for an object without entity selector properties", () => {
      expect(isEntitySingleSelector({ foo: "bar", baz: 123 })).toBe(false);
    });

    it("should return false when element has invalid value", () => {
      expect(isEntitySingleSelector({ element: "invalid" })).toBe(false);
    });

    it("should return false when file has invalid value", () => {
      expect(isEntitySingleSelector({ file: "invalid" })).toBe(false);
    });

    it("should return false when module has invalid value", () => {
      expect(isEntitySingleSelector({ module: "invalid" })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isEntitySingleSelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isEntitySingleSelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isEntitySingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isEntitySingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isEntitySingleSelector([{ element: { type: "component" } }])).toBe(
        false
      );
    });

    it("should return false for a boolean", () => {
      expect(isEntitySingleSelector(true)).toBe(false);
    });
  });

  describe("isEntitySelector", () => {
    it("should return true for a single entity selector object", () => {
      expect(isEntitySelector({ element: { type: "component" } })).toBe(true);
    });

    it("should return true for an array of entity selector objects", () => {
      expect(
        isEntitySelector([
          { element: { type: "component" } },
          { file: { categories: "utils" } },
        ])
      ).toBe(true);
    });

    it("should return true for an array with a single entity selector", () => {
      expect(isEntitySelector([{ module: { origin: "local" } }])).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isEntitySelector([])).toBe(true);
    });

    it("should return false for an array containing invalid objects", () => {
      expect(isEntitySelector([{ foo: "bar" }])).toBe(false);
    });

    it("should return false for an array with mixed valid and invalid objects", () => {
      expect(
        isEntitySelector([{ element: { type: "component" } }, { foo: "bar" }])
      ).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isEntitySelector("string")).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isEntitySelector(42)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isEntitySelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isEntitySelector(undefined)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isEntitySelector(true)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isEntitySelector({})).toBe(false);
    });
  });

  describe("normalizeSingleEntitySelector", () => {
    it("should normalize a new entity selector with element property", () => {
      const selector: EntitySingleSelector = {
        element: { type: "component" },
      };

      const result = normalizeSingleEntitySelector(selector);

      expect(result).toEqual([{ element: [{ type: "component" }] }]);
    });

    it("should normalize a new entity selector with file property", () => {
      const selector: EntitySingleSelector = {
        file: { categories: "utils" },
      };

      const result = normalizeSingleEntitySelector(selector);

      expect(result).toEqual([{ file: [{ categories: "utils" }] }]);
    });

    it("should normalize a new entity selector with module property", () => {
      const selector: EntitySingleSelector = {
        module: { origin: "local" },
      };

      const result = normalizeSingleEntitySelector(selector);

      expect(result).toEqual([{ module: [{ origin: "local" }] }]);
    });

    it("should normalize a new entity selector with all properties", () => {
      const selector: EntitySingleSelector = {
        element: { type: "component" },
        file: { categories: "utils" },
        module: { origin: "local" },
      };

      const result = normalizeSingleEntitySelector(selector);

      expect(result).toEqual([
        {
          element: [{ type: "component" }],
          file: [{ categories: "utils" }],
          module: [{ origin: "local" }],
        },
      ]);
    });

    it("should normalize a new entity selector with array sub-selectors", () => {
      const selector: EntitySingleSelector = {
        element: [{ type: "component" }, { type: "helper" }],
      };

      const result = normalizeSingleEntitySelector(selector);

      expect(result).toEqual([
        {
          element: [{ type: "component" }, { type: "helper" }],
        },
      ]);
    });

    it("should normalize a legacy simple element string selector", () => {
      const result = normalizeSingleEntitySelector("component");

      expect(result).toEqual([{ element: [{ type: "component" }] }]);
    });

    it("should normalize a legacy simple element tuple selector", () => {
      const result = normalizeSingleEntitySelector([
        "component",
        { key: "value" },
      ]);

      expect(result).toEqual([
        { element: [{ type: "component", captured: { key: "value" } }] },
      ]);
    });

    it("should normalize a legacy element object selector with elementPath", () => {
      const result = normalizeSingleEntitySelector({
        type: "component",
        elementPath: "src/**",
      });

      expect(result).toEqual([
        {
          element: [{ type: "component", path: "src/**" }],
        },
      ]);
    });

    it("should normalize a legacy element object selector with internalPath", () => {
      const result = normalizeSingleEntitySelector({
        type: "component",
        internalPath: "index.ts",
      });

      expect(result).toEqual([
        {
          element: [{ type: "component", fileInternalPath: "index.ts" }],
        },
        {
          element: [{ type: "component" }],
          module: [{ internalPath: "index.ts" }],
        },
      ]);
    });

    it("should normalize a legacy element object selector with origin", () => {
      const result = normalizeSingleEntitySelector({
        type: "component",
        origin: "local",
      });

      expect(result).toEqual([
        {
          element: [{ type: "component" }],
          module: [{ origin: "local" }],
        },
      ]);
    });

    it("should normalize a legacy element object selector with origin only", () => {
      const result = normalizeSingleEntitySelector({ origin: "local" });

      expect(result).toEqual([{ module: [{ origin: "local" }] }]);
    });

    it("should return an empty array for a legacy element object selector with undefined origin only", () => {
      const result = normalizeSingleEntitySelector({ origin: undefined });

      expect(result).toEqual([]);
    });

    it("should normalize a legacy element object selector with path and elementPath", () => {
      const result = normalizeSingleEntitySelector({
        type: "component",
        elementPath: "src/**",
        path: "foo/**",
      });

      expect(result).toEqual([
        {
          element: [{ type: "component", path: "src/**", filePath: "foo/**" }],
        },
      ]);
    });

    it("should normalize a modern element single selector without legacy properties", () => {
      const result = normalizeSingleEntitySelector({
        type: "component",
        path: "src/**",
      });

      expect(result).toEqual([
        { element: [{ type: "component", path: "src/**" }] },
      ]);
    });

    it("should throw an error for an invalid selector", () => {
      expect(() =>
        normalizeSingleEntitySelector(
          // @ts-expect-error Testing invalid input
          42
        )
      ).toThrow("Invalid entity selector");
    });
  });

  describe("normalizeEntitySelector", () => {
    it("should normalize a single new entity selector", () => {
      const selector: EntitySingleSelector = {
        element: { type: "component" },
      };

      const result = normalizeEntitySelector(selector);

      expect(result).toEqual([{ element: [{ type: "component" }] }]);
    });

    it("should normalize an array of new entity selectors", () => {
      const selectors: EntitySingleSelector[] = [
        { element: { type: "component" } },
        { file: { categories: "utils" } },
      ];

      const result = normalizeEntitySelector(selectors);

      expect(result).toEqual([
        { element: [{ type: "component" }] },
        { file: [{ categories: "utils" }] },
      ]);
    });

    it("should normalize a legacy simple element selector", () => {
      const result = normalizeEntitySelector("component");

      expect(result).toEqual([{ element: [{ type: "component" }] }]);
    });

    it("should normalize a legacy element object selector with origin", () => {
      const result = normalizeEntitySelector({
        type: "component",
        origin: "local",
      });

      expect(result).toEqual([
        {
          element: [{ type: "component" }],
          module: [{ origin: "local" }],
        },
      ]);
    });

    it("should normalize an array of mixed legacy and new selectors", () => {
      const result = normalizeEntitySelector([
        { element: { type: "component" } },
        { element: { type: "helper" }, module: { origin: "local" } },
      ]);

      expect(result).toEqual([
        { element: [{ type: "component" }] },
        {
          element: [{ type: "helper" }],
          module: [{ origin: "local" }],
        },
      ]);
    });

    it("should normalize an array with a single entity selector", () => {
      const result = normalizeEntitySelector([{ module: { origin: "local" } }]);

      expect(result).toEqual([{ module: [{ origin: "local" }] }]);
    });

    it("should throw an error for an invalid selector in an array", () => {
      expect(() =>
        normalizeEntitySelector([
          // @ts-expect-error Testing invalid input
          42,
        ])
      ).toThrow();
    });
  });
});
