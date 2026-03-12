import type {
  ElementSelectorWithOptions,
  ElementSelectors,
  CapturedValuesSelector,
} from "./Matcher.types";
import {
  isCapturedValuesSelector,
  isSimpleElementSelectorByType,
  isElementSelectorWithLegacyOptions,
  isElementSelectorData,
  isElementSelector,
  isElementsSelector,
} from "./MatcherHelpers";

describe("elementsSelectorHelpers", () => {
  describe("isCapturedValuesSelector", () => {
    it("should return true for valid captured values selectors", () => {
      const capturedSelector: CapturedValuesSelector = {
        type: "component",
        name: "Button",
      };

      expect(isCapturedValuesSelector(capturedSelector)).toBe(true);
    });

    it("should return true for empty objects", () => {
      expect(isCapturedValuesSelector({})).toBe(true);
    });

    it("should return false for non-object values", () => {
      expect(isCapturedValuesSelector("string")).toBe(false);
      expect(isCapturedValuesSelector(123)).toBe(false);
      expect(isCapturedValuesSelector(true)).toBe(false);
      expect(isCapturedValuesSelector(null)).toBe(false);
      expect(isCapturedValuesSelector(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalCapturedValuesSelector = {};
      // Empty object is the minimal requirement for CapturedValuesSelector

      expect(isCapturedValuesSelector(minimalCapturedValuesSelector)).toBe(
        true
      );
    });

    it("should return true for arrays of valid captured values selectors", () => {
      expect(
        isCapturedValuesSelector([{ type: "component" }, { name: "Button" }])
      ).toBe(true);
      expect(isCapturedValuesSelector([{}])).toBe(true);
    });

    it("should return false for arrays with invalid elements", () => {
      expect(isCapturedValuesSelector(["string", {}])).toBe(false);
      expect(isCapturedValuesSelector([123, {}])).toBe(false);
      expect(isCapturedValuesSelector([[], {}])).toBe(false);
      expect(isCapturedValuesSelector([{ type: "component" }, "invalid"])).toBe(
        false
      );
      expect(
        isCapturedValuesSelector([{ type: "component" }, { invalid: 123 }])
      ).toBe(false);
    });
  });

  describe("isSimpleElementSelectorByType", () => {
    it("should return true for string values", () => {
      expect(isSimpleElementSelectorByType("component")).toBe(true);
      expect(isSimpleElementSelectorByType("utils")).toBe(true);
      expect(isSimpleElementSelectorByType("")).toBe(true);
    });

    it("should return false for primitive non-string values", () => {
      expect(isSimpleElementSelectorByType(123)).toBe(false);
      expect(isSimpleElementSelectorByType(true)).toBe(false);
      expect(isSimpleElementSelectorByType(null)).toBe(false);
      expect(isSimpleElementSelectorByType(undefined)).toBe(false);
    });

    it("should return false for object and array values", () => {
      expect(isSimpleElementSelectorByType({})).toBe(false);
      expect(isSimpleElementSelectorByType([])).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalSimpleElementSelector = "component";
      // String is the minimal requirement for SimpleElementSelector

      expect(isSimpleElementSelectorByType(minimalSimpleElementSelector)).toBe(
        true
      );
    });
  });

  describe("isElementSelectorWithOptions", () => {
    it("should return true for valid element selectors with options", () => {
      const elementSelectorWithOptions: ElementSelectorWithOptions = [
        "component",
        { name: "button" },
      ];

      expect(
        isElementSelectorWithLegacyOptions(elementSelectorWithOptions)
      ).toBe(true);
    });

    it("should return false for arrays with incorrect length", () => {
      expect(
        isElementSelectorWithLegacyOptions(["component", {}, "extra"])
      ).toBe(false);
      expect(isElementSelectorWithLegacyOptions([])).toBe(false);
    });

    it("should return false for arrays with invalid elements", () => {
      expect(isElementSelectorWithLegacyOptions([123, {}])).toBe(false);
      expect(
        isElementSelectorWithLegacyOptions(["component", "not-object"])
      ).toBe(false);
      expect(isElementSelectorWithLegacyOptions([null, {}])).toBe(false);
      expect(isElementSelectorWithLegacyOptions(["component", null])).toBe(
        false
      );
    });

    it("should return false for non-array values", () => {
      expect(isElementSelectorWithLegacyOptions("string")).toBe(false);
      expect(isElementSelectorWithLegacyOptions({})).toBe(false);
      expect(isElementSelectorWithLegacyOptions(null)).toBe(false);
      expect(isElementSelectorWithLegacyOptions(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalElementSelectorWithOptions = ["component", {}];

      // Array with [string, object] is the minimal requirement
      expect(
        isElementSelectorWithLegacyOptions(minimalElementSelectorWithOptions)
      ).toBe(true);
    });

    it("should return false when options are not valid captured values selector", () => {
      expect(
        isElementSelectorWithLegacyOptions(["component", { type: 123 }])
      ).toBe(false);
    });
  });

  describe("element selector helpers", () => {
    it("isElementSelectorData should match either", () => {
      expect(isElementSelectorData({ type: "component" })).toBe(true);
      expect(isElementSelectorData({ category: "ui" })).toBe(true);
      expect(
        isElementSelectorData({ parent: { type: "feature-folder" } })
      ).toBe(true);
      expect(isElementSelectorData({ type: "component", category: "ui" })).toBe(
        true
      );
      expect(isElementSelectorData({})).toBe(false);
    });

    it("isElementSelectorData should not match simple strings", () => {
      expect(isElementSelectorData("component")).toBe(false);
    });

    it("isElementSelectorData should match parent property being null", () => {
      expect(isElementSelectorData({ parent: null })).toBe(true);
    });
  });

  describe("isElementSelector", () => {
    it("should return true for simple element selectors", () => {
      expect(isElementSelector("component")).toBe(true);
      expect(isElementSelector("utils")).toBe(true);
    });

    it("should return true for element selectors with options", () => {
      const elementSelectorWithOptions: ElementSelectorWithOptions = [
        "component",
        { foo: "button" },
      ];

      expect(isElementSelector(elementSelectorWithOptions)).toBe(true);
    });

    it("should return true for element selectors without options", () => {
      expect(isElementSelector(["component"])).toBe(true);
    });

    it("should return false for invalid element selectors", () => {
      expect(isElementSelector(123)).toBe(false);
      expect(isElementSelector({})).toBe(false);
      expect(isElementSelector(null)).toBe(false);
      expect(isElementSelector(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalSimpleSelector = "component";
      const minimalSelectorWithOptions = ["component", {}];

      expect(isElementSelector(minimalSimpleSelector)).toBe(true);
      expect(isElementSelector(minimalSelectorWithOptions)).toBe(true);
    });
  });

  describe("isElementsSelector", () => {
    it("should return true for single element selectors", () => {
      expect(isElementsSelector("component")).toBe(true);

      const elementSelectorWithOptions: ElementSelectorWithOptions = [
        "component",
        { type: "button" },
      ];

      expect(isElementsSelector(elementSelectorWithOptions)).toBe(true);
    });

    it("should return true for arrays of element selectors", () => {
      const elementsSelector: ElementSelectors = [
        "component",
        ["utils", { foo: "helper" }],
      ];

      expect(isElementsSelector(elementsSelector)).toBe(true);
    });

    it("should return true for arrays with mixed element selector types", () => {
      const mixedElementsSelector = [
        "component",
        ["utils", { foo: "helper" }],
        "service",
      ];

      expect(isElementsSelector(mixedElementsSelector)).toBe(true);
    });

    it("should return false for arrays with invalid element selectors", () => {
      expect(isElementsSelector([123, "component"])).toBe(false);
      expect(isElementsSelector([null, "component"])).toBe(false);
      expect(isElementsSelector(["component", "valid", 123])).toBe(false);
    });

    it("should return false for empty arrays", () => {
      expect(isElementsSelector([])).toBe(false);
    });

    it("should return true for arrays with valid element selectors including captured values", () => {
      // Empty object is a valid CapturedValuesSelector
      expect(isElementsSelector(["component", {}])).toBe(true);

      // Object with properties is also valid
      expect(isElementsSelector(["component", { type: "button" }])).toBe(true);
    });

    it("should return false for invalid values", () => {
      expect(isElementsSelector(123)).toBe(false);
      expect(isElementsSelector({})).toBe(false);
      expect(isElementsSelector(null)).toBe(false);
      expect(isElementsSelector(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalSingleElementSelector = "component";
      const minimalArrayElementsSelector = ["component"];

      expect(isElementsSelector(minimalSingleElementSelector)).toBe(true);
      expect(isElementsSelector(minimalArrayElementsSelector)).toBe(true);
    });
  });
});
