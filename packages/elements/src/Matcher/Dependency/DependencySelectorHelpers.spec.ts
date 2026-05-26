import type {
  DependencyInfoSingleSelector,
  LegacyDependencyInfoSingleSelector,
  LegacyDependencySingleSelector,
} from "./DependencySelector.types";
import {
  isLegacyDependencyInfoSingleSelector,
  isLegacyDependencyInfoSelector,
  isDependencyInfoSingleSelector,
  isDependencyInfoSelector,
  isBackwardCompatibleDependencyInfoSingleSelector,
  isBackwardCompatibleDependencyInfoSelector,
  normalizeLegacyDependencyInfoSingleSelector,
  isBaseDependencySingleSelector,
  isLegacyDependencySingleSelector,
  isLegacyDependencySelector,
  isDependencySingleSelector,
  isDependencySelector,
  isBackwardCompatibleDependencySingleSelector,
  isBackwardCompatibleDependencySelector,
  normalizeSingleDependencyInfoSelector,
  normalizeDependencyInfoSelector,
  normalizeLegacyDependencySingleSelector,
  normalizeSingleDependencySelector,
  normalizeDependencySelector,
} from "./DependencySelectorHelpers";

describe("DependencySelectorHelpers", () => {
  describe("isLegacyDependencyInfoSingleSelector", () => {
    it("should return true for an object with module property", () => {
      expect(isLegacyDependencyInfoSingleSelector({ module: "lodash" })).toBe(
        true
      );
    });

    it("should return true for an object with module and other properties", () => {
      expect(
        isLegacyDependencyInfoSingleSelector({
          module: "lodash",
          kind: "value",
        })
      ).toBe(true);
    });

    it("should return false for an object without module property", () => {
      expect(isLegacyDependencyInfoSingleSelector({ kind: "value" })).toBe(
        false
      );
    });

    it("should return false for an empty object", () => {
      expect(isLegacyDependencyInfoSingleSelector({})).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isLegacyDependencyInfoSingleSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyDependencyInfoSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyDependencyInfoSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isLegacyDependencyInfoSingleSelector([{ module: "lodash" }])).toBe(
        false
      );
    });
  });

  describe("isLegacyDependencyInfoSelector", () => {
    it("should return true for a single legacy dependency info selector", () => {
      expect(isLegacyDependencyInfoSelector({ module: "lodash" })).toBe(true);
    });

    it("should return true for an array containing at least one legacy selector", () => {
      expect(
        isLegacyDependencyInfoSelector([
          { module: "lodash" },
          { kind: "value" },
        ])
      ).toBe(true);
    });

    it("should return false for an array with no legacy selectors", () => {
      expect(isLegacyDependencyInfoSelector([{ kind: "value" }])).toBe(false);
    });

    it("should return false for an empty array", () => {
      expect(isLegacyDependencyInfoSelector([])).toBe(false);
    });

    it("should return false for a non-legacy single selector", () => {
      expect(isLegacyDependencyInfoSelector({ kind: "value" })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isLegacyDependencyInfoSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyDependencyInfoSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyDependencyInfoSelector(undefined)).toBe(false);
    });
  });

  describe("isDependencyInfoSingleSelector", () => {
    it("should return true for an object with kind property", () => {
      expect(isDependencyInfoSingleSelector({ kind: "value" })).toBe(true);
    });

    it("should return true for an object with relationship property", () => {
      expect(
        isDependencyInfoSingleSelector({
          relationship: { from: "parent", to: "child" },
        })
      ).toBe(true);
    });

    it("should return true for an object with specifiers property", () => {
      expect(isDependencyInfoSingleSelector({ specifiers: "default" })).toBe(
        true
      );
    });

    it("should return true for an object with nodeKind property", () => {
      expect(isDependencyInfoSingleSelector({ nodeKind: "import" })).toBe(true);
    });

    it("should return true for an object with source property", () => {
      expect(isDependencyInfoSingleSelector({ source: "lodash" })).toBe(true);
    });

    it("should return true for an object with multiple properties", () => {
      expect(
        isDependencyInfoSingleSelector({
          kind: "value",
          source: "lodash",
          specifiers: "default",
        })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isDependencyInfoSingleSelector({})).toBe(false);
    });

    it("should return false for an object with unrelated properties", () => {
      expect(isDependencyInfoSingleSelector({ foo: "bar" })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isDependencyInfoSingleSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isDependencyInfoSingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isDependencyInfoSingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isDependencyInfoSingleSelector([{ kind: "value" }])).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isDependencyInfoSingleSelector(42)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isDependencyInfoSingleSelector(true)).toBe(false);
    });
  });

  describe("isDependencyInfoSelector", () => {
    it("should return true for a single dependency info selector", () => {
      expect(isDependencyInfoSelector({ kind: "value" })).toBe(true);
    });

    it("should return true for an array of dependency info selectors", () => {
      expect(
        isDependencyInfoSelector([{ kind: "value" }, { source: "lodash" }])
      ).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isDependencyInfoSelector([])).toBe(true);
    });

    it("should return false for an array with invalid items", () => {
      expect(isDependencyInfoSelector([{ foo: "bar" }])).toBe(false);
    });

    it("should return false for an array with mixed valid and invalid items", () => {
      expect(
        isDependencyInfoSelector([{ kind: "value" }, { foo: "bar" }])
      ).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isDependencyInfoSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isDependencyInfoSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isDependencyInfoSelector(undefined)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isDependencyInfoSelector({})).toBe(false);
    });
  });

  describe("isBackwardCompatibleDependencyInfoSingleSelector", () => {
    it("should return true for a dependency info single selector", () => {
      expect(
        isBackwardCompatibleDependencyInfoSingleSelector({ kind: "value" })
      ).toBe(true);
    });

    it("should return true for a legacy dependency info single selector", () => {
      expect(
        isBackwardCompatibleDependencyInfoSingleSelector({ module: "lodash" })
      ).toBe(true);
    });

    it("should return true for a selector with both module and kind", () => {
      expect(
        isBackwardCompatibleDependencyInfoSingleSelector({
          module: "lodash",
          kind: "value",
        })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isBackwardCompatibleDependencyInfoSingleSelector({})).toBe(false);
    });

    it("should return false for an object with unrelated properties", () => {
      expect(
        isBackwardCompatibleDependencyInfoSingleSelector({ foo: "bar" })
      ).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isBackwardCompatibleDependencyInfoSingleSelector("string")).toBe(
        false
      );
    });

    it("should return false for null", () => {
      expect(isBackwardCompatibleDependencyInfoSingleSelector(null)).toBe(
        false
      );
    });

    it("should return false for undefined", () => {
      expect(isBackwardCompatibleDependencyInfoSingleSelector(undefined)).toBe(
        false
      );
    });
  });

  describe("isBackwardCompatibleDependencyInfoSelector", () => {
    it("should return true for a single backward compatible selector", () => {
      expect(
        isBackwardCompatibleDependencyInfoSelector({ module: "lodash" })
      ).toBe(true);
    });

    it("should return true for a single dependency info selector", () => {
      expect(
        isBackwardCompatibleDependencyInfoSelector({ kind: "value" })
      ).toBe(true);
    });

    it("should return true for an array of backward compatible selectors", () => {
      expect(
        isBackwardCompatibleDependencyInfoSelector([
          { module: "lodash" },
          { kind: "value" },
        ])
      ).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isBackwardCompatibleDependencyInfoSelector([])).toBe(true);
    });

    it("should return false for an array with invalid items", () => {
      expect(isBackwardCompatibleDependencyInfoSelector([{ foo: "bar" }])).toBe(
        false
      );
    });

    it("should return false for a string", () => {
      expect(isBackwardCompatibleDependencyInfoSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isBackwardCompatibleDependencyInfoSelector(null)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isBackwardCompatibleDependencyInfoSelector({})).toBe(false);
    });
  });

  describe("normalizeLegacyDependencyInfoSingleSelector", () => {
    it("should remove the module property", () => {
      const selector: LegacyDependencyInfoSingleSelector = {
        module: "lodash",
      };

      expect(normalizeLegacyDependencyInfoSingleSelector(selector)).toEqual({});
    });

    it("should keep other properties and remove module", () => {
      const selector: LegacyDependencyInfoSingleSelector = {
        module: "lodash",
        kind: "value",
        source: "lodash/fp",
      };

      expect(normalizeLegacyDependencyInfoSingleSelector(selector)).toEqual({
        kind: "value",
        source: "lodash/fp",
      });
    });

    it("should return a new object without module when only module and relationship are present", () => {
      const selector: LegacyDependencyInfoSingleSelector = {
        module: "react",
        relationship: { from: "parent" },
      };

      expect(normalizeLegacyDependencyInfoSingleSelector(selector)).toEqual({
        relationship: { from: "parent" },
      });
    });
  });

  describe("isBaseDependencySingleSelector", () => {
    it("should return true for an object with from property", () => {
      expect(isBaseDependencySingleSelector({ from: {} })).toBe(true);
    });

    it("should return true for an object with to property", () => {
      expect(isBaseDependencySingleSelector({ to: {} })).toBe(true);
    });

    it("should return true for an object with dependency property", () => {
      expect(isBaseDependencySingleSelector({ dependency: {} })).toBe(true);
    });

    it("should return true for an object with all three properties", () => {
      expect(
        isBaseDependencySingleSelector({ from: {}, to: {}, dependency: {} })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isBaseDependencySingleSelector({})).toBe(false);
    });

    it("should return false for an object with unrelated properties", () => {
      expect(isBaseDependencySingleSelector({ foo: "bar" })).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isBaseDependencySingleSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isBaseDependencySingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isBaseDependencySingleSelector(undefined)).toBe(false);
    });

    it("should return false for an array", () => {
      expect(isBaseDependencySingleSelector([{ from: {} }])).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isBaseDependencySingleSelector(42)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isBaseDependencySingleSelector(true)).toBe(false);
    });
  });

  describe("isLegacyDependencySingleSelector", () => {
    it("should return true when from is a legacy entity selector (string)", () => {
      expect(isLegacyDependencySingleSelector({ from: "components" })).toBe(
        true
      );
    });

    it("should return true when to is a legacy entity selector (string)", () => {
      expect(isLegacyDependencySingleSelector({ to: "helpers" })).toBe(true);
    });

    it("should return true when dependency contains a legacy info selector with module", () => {
      expect(
        isLegacyDependencySingleSelector({
          dependency: { module: "lodash" },
        })
      ).toBe(true);
    });

    it("should return true when dependency is an array containing a legacy info selector", () => {
      expect(
        isLegacyDependencySingleSelector({
          dependency: [{ module: "lodash" }, { kind: "value" }],
        })
      ).toBe(true);
    });

    it("should return false when from/to are entity selectors and dependency is not legacy", () => {
      expect(
        isLegacyDependencySingleSelector({
          from: { element: [{ type: "components" }] },
          to: { element: [{ type: "helpers" }] },
          dependency: { kind: "value" },
        })
      ).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isLegacyDependencySingleSelector({})).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isLegacyDependencySingleSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyDependencySingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyDependencySingleSelector(undefined)).toBe(false);
    });

    it("should return false when it does not have from, to or dependency", () => {
      expect(isLegacyDependencySingleSelector({ foo: "bar" })).toBe(false);
    });
  });

  describe("isLegacyDependencySelector", () => {
    it("should return true for a single legacy dependency selector", () => {
      expect(isLegacyDependencySelector({ from: "components" })).toBe(true);
    });

    it("should return true for an array containing at least one legacy selector", () => {
      expect(
        isLegacyDependencySelector([
          { from: "components" },
          {
            from: { element: [{ type: "helpers" }] },
            dependency: { kind: "value" },
          },
        ])
      ).toBe(true);
    });

    it("should return false for an array with no legacy selectors", () => {
      expect(
        isLegacyDependencySelector([
          {
            from: { element: [{ type: "components" }] },
            dependency: { kind: "value" },
          },
        ])
      ).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isLegacyDependencySelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isLegacyDependencySelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isLegacyDependencySelector(undefined)).toBe(false);
    });

    it("should return false for an empty array", () => {
      expect(isLegacyDependencySelector([])).toBe(false);
    });
  });

  describe("isDependencySingleSelector", () => {
    it("should return true for a selector with valid entity from", () => {
      expect(
        isDependencySingleSelector({
          from: { element: [{ type: "components" }] },
        })
      ).toBe(true);
    });

    it("should return true for a selector with valid entity to", () => {
      expect(
        isDependencySingleSelector({
          to: { element: [{ type: "helpers" }] },
        })
      ).toBe(true);
    });

    it("should return true for a selector with valid dependency info", () => {
      expect(
        isDependencySingleSelector({ dependency: { kind: "value" } })
      ).toBe(true);
    });

    it("should return true for a selector with all valid properties", () => {
      expect(
        isDependencySingleSelector({
          from: { element: [{ type: "components" }] },
          to: { element: [{ type: "helpers" }] },
          dependency: { kind: "value" },
        })
      ).toBe(true);
    });

    it("should return true for a selector with dependency info array", () => {
      expect(
        isDependencySingleSelector({
          dependency: [{ kind: "value" }, { source: "lodash" }],
        })
      ).toBe(true);
    });

    it("should return false when from is a legacy string selector", () => {
      expect(isDependencySingleSelector({ from: "components" })).toBe(false);
    });

    it("should return false when to is a legacy string selector", () => {
      expect(isDependencySingleSelector({ to: "helpers" })).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isDependencySingleSelector({})).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isDependencySingleSelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isDependencySingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isDependencySingleSelector(undefined)).toBe(false);
    });

    it("should return false for a number", () => {
      expect(isDependencySingleSelector(42)).toBe(false);
    });

    it("should return false for a boolean", () => {
      expect(isDependencySingleSelector(true)).toBe(false);
    });
  });

  describe("isDependencySelector", () => {
    it("should return true for a single dependency selector", () => {
      expect(
        isDependencySelector({
          from: { element: [{ type: "components" }] },
        })
      ).toBe(true);
    });

    it("should return true for an array of dependency selectors", () => {
      expect(
        isDependencySelector([
          { from: { element: [{ type: "components" }] } },
          { to: { element: [{ type: "helpers" }] } },
        ])
      ).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isDependencySelector([])).toBe(true);
    });

    it("should return false for an array with invalid selectors", () => {
      expect(isDependencySelector([{ foo: "bar" }])).toBe(false);
    });

    it("should return false for an array with mixed valid and invalid selectors", () => {
      expect(
        isDependencySelector([
          { from: { element: [{ type: "components" }] } },
          { foo: "bar" },
        ])
      ).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isDependencySelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isDependencySelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isDependencySelector(undefined)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isDependencySelector({})).toBe(false);
    });
  });

  describe("isBackwardCompatibleDependencySingleSelector", () => {
    it("should return true for a dependency single selector", () => {
      expect(
        isBackwardCompatibleDependencySingleSelector({
          from: { element: [{ type: "components" }] },
        })
      ).toBe(true);
    });

    it("should return true for a legacy dependency single selector", () => {
      expect(
        isBackwardCompatibleDependencySingleSelector({ from: "components" })
      ).toBe(true);
    });

    it("should return false for an empty object", () => {
      expect(isBackwardCompatibleDependencySingleSelector({})).toBe(false);
    });

    it("should return false for a string", () => {
      expect(isBackwardCompatibleDependencySingleSelector("string")).toBe(
        false
      );
    });

    it("should return false for null", () => {
      expect(isBackwardCompatibleDependencySingleSelector(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isBackwardCompatibleDependencySingleSelector(undefined)).toBe(
        false
      );
    });
  });

  describe("isBackwardCompatibleDependencySelector", () => {
    it("should return true for a single backward compatible selector", () => {
      expect(
        isBackwardCompatibleDependencySelector({ from: "components" })
      ).toBe(true);
    });

    it("should return true for an array of backward compatible selectors", () => {
      expect(
        isBackwardCompatibleDependencySelector([
          { from: "components" },
          { from: { element: [{ type: "helpers" }] } },
        ])
      ).toBe(true);
    });

    it("should return true for an empty array", () => {
      expect(isBackwardCompatibleDependencySelector([])).toBe(true);
    });

    it("should return false for an array with invalid selectors", () => {
      expect(isBackwardCompatibleDependencySelector([{ foo: "bar" }])).toBe(
        false
      );
    });

    it("should return false for a string", () => {
      expect(isBackwardCompatibleDependencySelector("string")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isBackwardCompatibleDependencySelector(null)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isBackwardCompatibleDependencySelector({})).toBe(false);
    });
  });

  describe("normalizeSingleDependencyInfoSelector", () => {
    it("should normalize a legacy selector by removing the module property", () => {
      const selector: LegacyDependencyInfoSingleSelector = {
        module: "lodash",
        kind: "value",
      };

      expect(normalizeSingleDependencyInfoSelector(selector)).toEqual({
        kind: "value",
      });
    });

    it("should return the selector as-is when it is a valid dependency info single selector", () => {
      const selector: DependencyInfoSingleSelector = { kind: "value" };

      expect(normalizeSingleDependencyInfoSelector(selector)).toEqual(selector);
    });

    it("should return the selector with all properties preserved", () => {
      const selector: DependencyInfoSingleSelector = {
        kind: "value",
        source: "lodash",
        specifiers: "default",
        nodeKind: "import",
        relationship: { from: "parent" },
      };

      expect(normalizeSingleDependencyInfoSelector(selector)).toEqual(selector);
    });

    it("should throw for an invalid selector", () => {
      expect(() =>
        normalizeSingleDependencyInfoSelector(
          // @ts-expect-error Testing invalid input
          {}
        )
      ).toThrow("Invalid dependency information selector");
    });
  });

  describe("normalizeDependencyInfoSelector", () => {
    it("should wrap a single selector in an array", () => {
      const selector: DependencyInfoSingleSelector = { kind: "value" };

      expect(normalizeDependencyInfoSelector(selector)).toEqual([selector]);
    });

    it("should normalize each item in an array selector", () => {
      const selectors: DependencyInfoSingleSelector[] = [
        { kind: "value" },
        { source: "lodash" },
      ];

      expect(normalizeDependencyInfoSelector(selectors)).toEqual(selectors);
    });

    it("should normalize a legacy single selector and wrap in array", () => {
      const selector: LegacyDependencyInfoSingleSelector = {
        module: "lodash",
        kind: "value",
      };

      expect(normalizeDependencyInfoSelector(selector)).toEqual([
        { kind: "value" },
      ]);
    });

    it("should normalize an array with legacy selectors", () => {
      const selectors: LegacyDependencyInfoSingleSelector[] = [
        { module: "lodash", kind: "value" },
        { module: "react", source: "react" },
      ];

      expect(normalizeDependencyInfoSelector(selectors)).toEqual([
        { kind: "value" },
        { source: "react" },
      ]);
    });

    it("should throw for an invalid selector", () => {
      expect(() =>
        normalizeDependencyInfoSelector(
          // @ts-expect-error Testing invalid input
          "invalid"
        )
      ).toThrow("Invalid dependency information selector");
    });
  });

  describe("normalizeLegacyDependencySingleSelector", () => {
    it("should normalize a selector with legacy string from", () => {
      const selector: LegacyDependencySingleSelector = {
        from: "components",
      };

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0].from).toBeDefined();
    });

    it("should normalize a selector with legacy string to", () => {
      const selector: LegacyDependencySingleSelector = {
        to: "helpers",
      };

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0].to).toBeDefined();
    });

    it("should normalize a selector with legacy dependency containing module", () => {
      const selector: LegacyDependencySingleSelector = {
        to: "helpers",
        dependency: { module: "lodash" },
      };

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0].to).toBeDefined();

      const toSelectors = result[0].to;

      expect(toSelectors).toBeDefined();
      expect(
        toSelectors!.some((sel) =>
          sel.module?.some((m) => m.source === "lodash")
        )
      ).toBe(true);
    });

    it("should produce multiple normalized selectors from dependency array with modules", () => {
      const selector: LegacyDependencySingleSelector = {
        dependency: [{ module: "lodash" }, { module: "react" }],
      };

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(2);
    });

    it("should normalize a selector without from, to or dependency", () => {
      const selector: LegacyDependencySingleSelector = {};

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({});
    });

    it("should normalize a selector with dependency containing only kind (no module)", () => {
      const selector: LegacyDependencySingleSelector = {
        dependency: { kind: "value" },
      };

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0].dependency).toEqual([{ kind: "value" }]);
    });

    it("should not include dependency in result when normalized dependency items are all empty", () => {
      const selector: LegacyDependencySingleSelector = {
        dependency: { module: "lodash" },
      };

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0].dependency).toBeUndefined();
    });

    it("should normalize a selector with both from and to as entity selectors", () => {
      const selector: LegacyDependencySingleSelector = {
        from: { element: [{ type: "components" }] },
        to: { element: [{ type: "helpers" }] },
      };

      const result = normalizeLegacyDependencySingleSelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0].from).toBeDefined();
      expect(result[0].to).toBeDefined();
    });
  });

  describe("normalizeSingleDependencySelector", () => {
    it("should normalize a legacy dependency selector", () => {
      const selector: LegacyDependencySingleSelector = {
        from: "components",
      };

      const result = normalizeSingleDependencySelector(selector);

      expect(result).toHaveLength(1);
      expect(result[0].from).toBeDefined();
    });

    it("should normalize a valid dependency single selector", () => {
      const result = normalizeSingleDependencySelector({
        from: { element: [{ type: "components" }] },
        dependency: { kind: "value" },
      });

      expect(result).toHaveLength(1);
      expect(result[0].from).toBeDefined();
      expect(result[0].dependency).toBeDefined();
    });

    it("should throw for an invalid selector", () => {
      expect(() =>
        normalizeSingleDependencySelector(
          // @ts-expect-error Testing invalid input
          "invalid"
        )
      ).toThrow("Invalid dependency selector");
    });
  });

  describe("normalizeDependencySelector", () => {
    it("should normalize a single backward compatible selector", () => {
      const result = normalizeDependencySelector({
        from: "components",
      });

      expect(result).toHaveLength(1);
      expect(result[0].from).toBeDefined();
    });

    it("should normalize an array of backward compatible selectors", () => {
      const result = normalizeDependencySelector([
        { from: "components" },
        { to: "helpers" },
      ]);

      expect(result).toHaveLength(2);
    });

    it("should flatMap array results from multiple selectors with dependency arrays", () => {
      const result = normalizeDependencySelector([
        {
          dependency: [{ module: "lodash" }, { module: "react" }],
        },
        { from: "components" },
      ]);

      expect(result).toHaveLength(3);
    });

    it("should throw for an invalid selector", () => {
      expect(() =>
        normalizeDependencySelector(
          // @ts-expect-error Testing invalid input
          "invalid"
        )
      ).toThrow("Invalid dependency selector");
    });
  });
});
