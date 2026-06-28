import type { ElementSelector, ElementSelectorNormalized } from "../index";
import { normalizeElementSelector } from "../index";

describe("normalizeElementSelector", () => {
  it.each([
    {
      selector: { type: "component" },
      expected: [{ type: "component" }],
    },
    {
      selector: { type: "component", captured: { fileName: "Button" } },
      expected: [{ type: "component", captured: { fileName: "Button" } }],
    },
    {
      selector: [
        { type: "component" },
        { type: "foo", captured: { bar: "baz" } },
      ],
      expected: [
        { type: "component" },
        { type: "foo", captured: { bar: "baz" } },
      ],
    },
  ])(
    "should normalize element selector $selector to $expected",
    ({
      selector,
      expected,
    }: {
      selector: ElementSelector;
      expected: ElementSelectorNormalized;
    }) => {
      const normalized = normalizeElementSelector(selector);

      expect(normalized).toStrictEqual(expected);
    }
  );
});
