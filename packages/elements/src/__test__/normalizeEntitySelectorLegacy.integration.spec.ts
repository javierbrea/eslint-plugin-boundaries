import type {
  LegacySimpleElementSingleSelectorByTypeWithOptions,
  BackwardCompatibleElementSelector,
  ElementSelectorNormalized,
} from "../index";
import { normalizeElementSelector } from "../index";

describe("normalizeElementsSelector | Legacy | Integration", () => {
  it.each([
    {
      selector: "component",
      expected: [{ type: "component" }],
    },
    {
      selector: [
        "component",
        { fileName: "Button" },
      ] as LegacySimpleElementSingleSelectorByTypeWithOptions,
      expected: [{ type: "component", captured: { fileName: "Button" } }],
    },
    {
      selector: [
        "component",
        [
          "foo",
          { bar: "baz" },
        ] as LegacySimpleElementSingleSelectorByTypeWithOptions,
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
      selector: BackwardCompatibleElementSelector;
      expected: ElementSelectorNormalized;
    }) => {
      const normalized = normalizeElementSelector(selector);

      expect(normalized).toStrictEqual(expected);
    }
  );
});
