import { ElementsMatcher } from "../../../src/Selector/ElementsMatcher";
import type { ElementsSelector } from "../../../src/Selector/ElementsSelector.types";

describe("elementsMatcher", () => {
  it("should have isMatch method", () => {
    const matcher = new ElementsMatcher("foo-type");

    expect(
      matcher.isMatch({
        type: "foo-type",
        category: null,
        capturedValues: {},
        path: "/src/test.ts",
        elementPath: "/src",
        internalPath: "test.ts",
        parents: [],
        isKnown: true,
        isExternal: false,
      }),
    ).toBe(true);
  });

  describe("get selector", () => {
    it("should normalize a simple selector (string)", () => {
      const selector: ElementsSelector = "typeA";
      const matcher = new ElementsMatcher(selector);

      expect(matcher.selector).toEqual([{ type: "typeA" }]);
    });

    it("should normalize an object selector with type", () => {
      const selector: ElementsSelector = { type: "typeB" };
      const matcher = new ElementsMatcher(selector);

      expect(matcher.selector).toEqual([{ type: "typeB" }]);
    });

    it("should normalize an object selector with category", () => {
      const selector: ElementsSelector = { category: "catA" };
      const matcher = new ElementsMatcher(selector);

      expect(matcher.selector).toEqual([{ category: "catA" }]);
    });

    it("should normalize an object selector with type and category", () => {
      const selector: ElementsSelector = { type: "typeC", category: "catB" };
      const matcher = new ElementsMatcher(selector);

      expect(matcher.selector).toEqual([{ type: "typeC", category: "catB" }]);
    });

    it("should normalize an array of selectors", () => {
      const selector: ElementsSelector = ["typeA", { category: "catA" }];
      const matcher = new ElementsMatcher(selector);

      expect(matcher.selector).toEqual([
        { type: "typeA" },
        { category: "catA" },
      ]);
    });

    it("should normalize a legacy options selector (tuple)", () => {
      const selector: ElementsSelector = ["typeA", { foo: "bar" }];
      const matcher = new ElementsMatcher(selector);

      expect(matcher.selector).toEqual([
        { type: "typeA", captured: { foo: "bar" } },
      ]);
    });

    it("should normalize an array of legacy options selectors", () => {
      const selector: ElementsSelector = [
        ["typeA", { foo: "bar" }],
        { type: "typeB" },
        [{ type: "typeB" }, { foo: "baz" }],
      ];
      const matcher = new ElementsMatcher(selector);

      expect(matcher.selector).toEqual([
        { type: "typeA", captured: { foo: "bar" } },
        { type: "typeB" },
        { type: "typeB", captured: { foo: "baz" } },
      ]);
    });

    it("should throw an error for invalid selectors", () => {
      const invalidSelector = [
        123,
        ["typeA"],
        [{}, { foo: "bar" }],
        [{ type: 123 }],
        ["typeA", "typeB", { foo: "bar" }],
      ];

      // @ts-expect-error Testing invalid selector
      expect(() => new ElementsMatcher(invalidSelector)).toThrow(
        "Invalid element selector",
      );
    });
  });
});
