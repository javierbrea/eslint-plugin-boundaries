import type { ArrayQueryExpandItem } from "./ArrayQuery.types";
import {
  isArrayQuery,
  isExpandItem,
  resolveExpandItem,
  expandStringArrayQuery,
  ARRAY_QUERY_KEYS,
} from "./ArrayQuerySelectorHelpers";

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

describe("isExpandItem", () => {
  it("returns true for an object with a string expand property", () => {
    expect(isExpandItem({ expand: "{{ from.element.types }}" })).toBe(true);
  });

  it("returns false for an object without expand", () => {
    expect(isExpandItem({ anyOf: ["a"] })).toBe(false);
  });

  it("returns false for an object with non-string expand", () => {
    expect(isExpandItem({ expand: 42 })).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isExpandItem("helpers")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isExpandItem(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isExpandItem(undefined)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isExpandItem(["helpers"])).toBe(false);
  });
});

describe("resolveExpandItem", () => {
  it("resolves a string array path to a list of matchers", () => {
    const item: ArrayQueryExpandItem = { expand: "{{ from.element.types }}" };
    const data = { from: { element: { types: ["helpers", "components"] } } };

    expect(resolveExpandItem(item, data)).toEqual(["helpers", "components"]);
  });

  it("resolves a scalar string path to a single-item array", () => {
    const item: ArrayQueryExpandItem = { expand: "{{ from.element.type }}" };
    const data = { from: { element: { type: "helpers" } } };

    expect(resolveExpandItem(item, data)).toEqual(["helpers"]);
  });

  it("returns empty array when path resolves to null", () => {
    const item: ArrayQueryExpandItem = { expand: "{{ from.element.types }}" };
    const data = { from: { element: { types: null } } };

    expect(resolveExpandItem(item, data)).toEqual([]);
  });

  it("returns empty array when path resolves to undefined", () => {
    const item: ArrayQueryExpandItem = { expand: "{{ from.element.types }}" };
    const data = {};

    expect(resolveExpandItem(item, data)).toEqual([]);
  });

  it("returns empty array when expand is not a single {{ }} expression", () => {
    const item: ArrayQueryExpandItem = {
      expand: "{{ a }} and {{ b }}",
    };

    expect(resolveExpandItem(item, { a: ["x"], b: ["y"] })).toEqual([]);
  });

  it("returns empty array when expand has no template syntax", () => {
    const item: ArrayQueryExpandItem = { expand: "plain-string" };

    expect(resolveExpandItem(item, {})).toEqual([]);
  });

  it("resolves a bracket-notation index path to a string", () => {
    const item: ArrayQueryExpandItem = {
      expand: "{{ from.element.types.[0] }}",
    };
    const data = { from: { element: { types: ["helpers", "components"] } } };

    expect(resolveExpandItem(item, data)).toEqual(["helpers"]);
  });

  it("filters null/undefined entries from resolved arrays", () => {
    const item: ArrayQueryExpandItem = { expand: "{{ arr }}" };
    const data = { arr: ["a", null, undefined, "b"] };

    expect(resolveExpandItem(item, data)).toEqual(["a", "b"]);
  });
});

describe("expandStringArrayQuery", () => {
  it("expands { expand } items in anyOf", () => {
    const query = {
      anyOf: [{ expand: "{{ types }}" }, "static"],
    };
    const result = expandStringArrayQuery(query, { types: ["a", "b"] });

    expect(result.anyOf).toEqual(["a", "b", "static"]);
  });

  it("expands { expand } items in allOf", () => {
    const query = {
      allOf: [{ expand: "{{ types }}" }],
    };
    const result = expandStringArrayQuery(query, { types: ["x"] });

    expect(result.allOf).toEqual(["x"]);
  });

  it("expands { expand } items in noneOf", () => {
    const query = {
      noneOf: ["legacy", { expand: "{{ categories }}" }],
    };
    const result = expandStringArrayQuery(query, { categories: ["test"] });

    expect(result.noneOf).toEqual(["legacy", "test"]);
  });

  it("expands { expand } items in equalsTo", () => {
    const query = {
      equalsTo: [{ expand: "{{ types }}" }],
    };
    const result = expandStringArrayQuery(query, {
      types: ["helpers", "reusable"],
    });

    expect(result.equalsTo).toEqual(["helpers", "reusable"]);
  });

  it("expands mixed static and { expand } items in equalsTo", () => {
    const query = {
      equalsTo: ["static", { expand: "{{ types }}" }],
      anyOf: [{ expand: "{{ types }}" }],
    };
    const result = expandStringArrayQuery(query, { types: ["a"] });

    expect(result.equalsTo).toEqual(["static", "a"]);
    expect(result.anyOf).toEqual(["a"]);
  });

  it("leaves atIndex unchanged", () => {
    const query = {
      atIndex: { index: 0, matches: "helpers" },
    };
    const result = expandStringArrayQuery(query, {});

    expect(result.atIndex).toEqual({ index: 0, matches: "helpers" });
  });

  it("leaves hasLength unchanged", () => {
    const query = { hasLength: 2 };
    const result = expandStringArrayQuery(query, {});

    expect(result.hasLength).toBe(2);
  });

  it("returns an equivalent copy when no operator is present", () => {
    const query = { hasLength: 1 };
    const result = expandStringArrayQuery(query, {});

    expect(result).toEqual({ hasLength: 1 });
  });

  it("resolves expand to empty array when path is missing, returning empty anyOf", () => {
    const query = { anyOf: [{ expand: "{{ missing }}" }] };
    const result = expandStringArrayQuery(query, {});

    expect(result.anyOf).toEqual([]);
  });
});
