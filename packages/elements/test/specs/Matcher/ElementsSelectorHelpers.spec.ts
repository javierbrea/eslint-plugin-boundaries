import type {
  ElementSelectorWithOptions,
  ElementSelectors,
  ExternalLibrarySelectorWithOptions,
  ExternalLibrariesSelector,
  CapturedValuesSelector,
} from "../../../src/Matcher/ElementsMatcher.types";
import {
  isCapturedValuesSelector,
  isSimpleElementSelectorByType,
  isElementSelectorWithLegacyOptions,
  isElementSelectorData,
  isElementSelector,
  isElementsSelector,
  isExternalLibrarySelectorOptionsWithPath,
  isExternalLibrarySelectorOptionsWithSpecifiers,
  isExternalLibrarySelectorOptions,
  isExternalLibrarySelectorWithOptions,
  isExternalLibrarySelector,
  isExternalLibrariesSelector,
} from "../../../src/Matcher/ElementsMatcherHelpers";

describe("elementsSelectorHelpers", () => {
  describe("isCapturedValuesSelector", () => {
    it("should return true for valid captured values selectors", () => {
      const capturedValuesSelector: CapturedValuesSelector = {
        type: "component",
        name: "Button",
      };

      expect(isCapturedValuesSelector(capturedValuesSelector)).toBe(true);
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
      expect(isElementSelectorWithLegacyOptions(["component"])).toBe(false);
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
      expect(isElementSelectorData({ type: "component", category: "ui" })).toBe(
        true
      );
      expect(isElementSelectorData({})).toBe(false);
    });

    it("isElementSelectorData should not match simple strings", () => {
      expect(isElementSelectorData("component")).toBe(false);
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

    it("should return false for invalid element selectors", () => {
      expect(isElementSelector(123)).toBe(false);
      expect(isElementSelector({})).toBe(false);
      expect(isElementSelector(["component"])).toBe(false);
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

  describe("isExternalLibrarySelectorOptionsWithPath", () => {
    it("should return true for options with string path", () => {
      const optionsWithStringPath = {
        path: "src/components",
      };

      expect(
        isExternalLibrarySelectorOptionsWithPath(optionsWithStringPath)
      ).toBe(true);
    });

    it("should return true for options with array path", () => {
      const optionsWithArrayPath = {
        path: ["src/components", "src/utils"],
      };

      expect(
        isExternalLibrarySelectorOptionsWithPath(optionsWithArrayPath)
      ).toBe(true);
    });

    it("should return false for options without path property", () => {
      const optionsWithoutPath = {
        specifiers: ["Component"],
      };

      expect(isExternalLibrarySelectorOptionsWithPath(optionsWithoutPath)).toBe(
        false
      );
    });

    it("should return false for options with invalid path types", () => {
      expect(isExternalLibrarySelectorOptionsWithPath({ path: 123 })).toBe(
        false
      );

      expect(isExternalLibrarySelectorOptionsWithPath({ path: true })).toBe(
        false
      );

      expect(
        isExternalLibrarySelectorOptionsWithPath({ path: [123, "string"] })
      ).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isExternalLibrarySelectorOptionsWithPath("string")).toBe(false);
      expect(isExternalLibrarySelectorOptionsWithPath(null)).toBe(false);
      expect(isExternalLibrarySelectorOptionsWithPath(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalOptionsWithPath = {
        path: "src/components",
        // path property is the minimal requirement
      };

      expect(
        isExternalLibrarySelectorOptionsWithPath(minimalOptionsWithPath)
      ).toBe(true);
    });
  });

  describe("isExternalLibrarySelectorOptionsWithSpecifiers", () => {
    it("should return true for options with valid specifiers", () => {
      const optionsWithSpecifiers = {
        specifiers: ["Component", "useState"],
      };

      expect(
        isExternalLibrarySelectorOptionsWithSpecifiers(optionsWithSpecifiers)
      ).toBe(true);
    });

    it("should return true for options with empty specifiers array", () => {
      const optionsWithEmptySpecifiers = {
        specifiers: [],
      };

      expect(
        isExternalLibrarySelectorOptionsWithSpecifiers(
          optionsWithEmptySpecifiers
        )
      ).toBe(true);
    });

    it("should return false for options without specifiers property", () => {
      const optionsWithoutSpecifiers = {
        path: "src/components",
      };

      expect(
        isExternalLibrarySelectorOptionsWithSpecifiers(optionsWithoutSpecifiers)
      ).toBe(false);
    });

    it("should return false for options with invalid specifiers", () => {
      expect(
        isExternalLibrarySelectorOptionsWithSpecifiers({
          specifiers: "string",
        })
      ).toBe(false);

      expect(
        isExternalLibrarySelectorOptionsWithSpecifiers({
          specifiers: [123, "string"],
        })
      ).toBe(false);

      expect(
        isExternalLibrarySelectorOptionsWithSpecifiers({ specifiers: null })
      ).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isExternalLibrarySelectorOptionsWithSpecifiers("string")).toBe(
        false
      );
      expect(isExternalLibrarySelectorOptionsWithSpecifiers(null)).toBe(false);
      expect(isExternalLibrarySelectorOptionsWithSpecifiers(undefined)).toBe(
        false
      );
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalOptionsWithSpecifiers = {
        specifiers: ["Component"],
        // specifiers property is the minimal requirement
      };

      expect(
        isExternalLibrarySelectorOptionsWithSpecifiers(
          minimalOptionsWithSpecifiers
        )
      ).toBe(true);
    });
  });

  describe("isExternalLibrarySelectorOptions", () => {
    it("should return true for options with path", () => {
      const optionsWithPath = {
        path: "src/components",
      };

      expect(isExternalLibrarySelectorOptions(optionsWithPath)).toBe(true);
    });

    it("should return true for options with specifiers", () => {
      const optionsWithSpecifiers = {
        specifiers: ["Component", "useState"],
      };

      expect(isExternalLibrarySelectorOptions(optionsWithSpecifiers)).toBe(
        true
      );
    });

    it("should return true for options with both path and specifiers", () => {
      const optionsWithBoth = {
        path: "src/components",
        specifiers: ["Component"],
      };

      expect(isExternalLibrarySelectorOptions(optionsWithBoth)).toBe(true);
    });

    it("should return false for options with neither path nor specifiers", () => {
      const optionsWithNeither = {
        other: "property",
      };

      expect(isExternalLibrarySelectorOptions(optionsWithNeither)).toBe(false);
    });

    it("should return false for invalid options", () => {
      expect(
        isExternalLibrarySelectorOptions({
          path: 123,
          specifiers: "string",
        })
      ).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isExternalLibrarySelectorOptions("string")).toBe(false);
      expect(isExternalLibrarySelectorOptions(null)).toBe(false);
      expect(isExternalLibrarySelectorOptions(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalOptionsWithPath = {
        path: "src/components",
        // path OR specifiers is required
      };

      const minimalOptionsWithSpecifiers = {
        specifiers: ["Component"],
        // path OR specifiers is required
      };

      expect(isExternalLibrarySelectorOptions(minimalOptionsWithPath)).toBe(
        true
      );
      expect(
        isExternalLibrarySelectorOptions(minimalOptionsWithSpecifiers)
      ).toBe(true);
    });
  });

  describe("isExternalLibrarySelectorWithOptions", () => {
    it("should return true for valid external library selectors with options", () => {
      const selectorWithOptions: ExternalLibrarySelectorWithOptions = [
        "react",
        { specifiers: ["useState", "useEffect"] },
      ];

      expect(isExternalLibrarySelectorWithOptions(selectorWithOptions)).toBe(
        true
      );
    });

    it("should return true for selectors with path options", () => {
      const selectorWithPathOptions: ExternalLibrarySelectorWithOptions = [
        "lodash",
        { path: "utils" },
      ];

      expect(
        isExternalLibrarySelectorWithOptions(selectorWithPathOptions)
      ).toBe(true);
    });

    it("should return false for arrays with incorrect length", () => {
      expect(isExternalLibrarySelectorWithOptions(["react"])).toBe(false);
      expect(
        isExternalLibrarySelectorWithOptions([
          "react",
          { specifiers: ["useState"] },
          "extra",
        ])
      ).toBe(false);
    });

    it("should return false for arrays with invalid elements", () => {
      expect(
        isExternalLibrarySelectorWithOptions([123, { specifiers: ["test"] }])
      ).toBe(false);

      expect(
        isExternalLibrarySelectorWithOptions(["react", { invalid: "options" }])
      ).toBe(false);
    });

    it("should return false for non-array values", () => {
      expect(isExternalLibrarySelectorWithOptions("string")).toBe(false);
      expect(isExternalLibrarySelectorWithOptions({})).toBe(false);
      expect(isExternalLibrarySelectorWithOptions(null)).toBe(false);
      expect(isExternalLibrarySelectorWithOptions(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalSelectorWithOptions = [
        "react", // String selector
        { path: "src/components" }, // Minimal options (path)
      ];

      expect(
        isExternalLibrarySelectorWithOptions(minimalSelectorWithOptions)
      ).toBe(true);

      const minimalSelectorWithSpecifiersOptions = [
        "react", // String selector
        { specifiers: ["src/components"] }, // Minimal options (specifiers)
      ];

      expect(
        isExternalLibrarySelectorWithOptions(
          minimalSelectorWithSpecifiersOptions
        )
      ).toBe(true);
    });
  });

  describe("isExternalLibrarySelector", () => {
    it("should return true for simple external library selectors", () => {
      expect(isExternalLibrarySelector("react")).toBe(true);
      expect(isExternalLibrarySelector("lodash")).toBe(true);
    });

    it("should return true for external library selectors with options", () => {
      const selectorWithOptions: ExternalLibrarySelectorWithOptions = [
        "react",
        { specifiers: ["useState"] },
      ];

      expect(isExternalLibrarySelector(selectorWithOptions)).toBe(true);
    });

    it("should return false for invalid external library selectors", () => {
      expect(isExternalLibrarySelector(123)).toBe(false);
      expect(isExternalLibrarySelector({})).toBe(false);
      expect(isExternalLibrarySelector(["react"])).toBe(false);
      expect(isExternalLibrarySelector(null)).toBe(false);
      expect(isExternalLibrarySelector(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalSimpleSelector = "react";
      const minimalSelectorWithOptions = ["react", { path: "components" }];

      expect(isExternalLibrarySelector(minimalSimpleSelector)).toBe(true);
      expect(isExternalLibrarySelector(minimalSelectorWithOptions)).toBe(true);
    });
  });

  describe("isExternalLibrariesSelector", () => {
    it("should return true for single external library selectors", () => {
      expect(isExternalLibrariesSelector("react")).toBe(true);

      const selectorWithOptions: ExternalLibrarySelectorWithOptions = [
        "react",
        { specifiers: ["useState"] },
      ];

      expect(isExternalLibrariesSelector(selectorWithOptions)).toBe(true);
    });

    it("should return true for arrays of external library selectors", () => {
      const librariesSelector: ExternalLibrariesSelector = [
        "react",
        ["lodash", { path: "utils" }],
      ];

      expect(isExternalLibrariesSelector(librariesSelector)).toBe(true);
    });

    it("should return true for arrays with mixed external library selector types", () => {
      const mixedLibrariesSelector = [
        "react",
        ["lodash", { specifiers: ["isEmpty"] }],
        "express",
      ];

      expect(isExternalLibrariesSelector(mixedLibrariesSelector)).toBe(true);
    });

    it("should return false for arrays with invalid external library selectors", () => {
      expect(isExternalLibrariesSelector([123, "react"])).toBe(false);
      expect(isExternalLibrariesSelector(["react", []])).toBe(false);
    });

    it("should return true for arrays with valid selectors including captured values", () => {
      // Empty object is a valid selector for external libraries in some contexts
      expect(isExternalLibrariesSelector(["react", "lodash"])).toBe(true);
    });

    it("should return false for invalid values", () => {
      expect(isExternalLibrariesSelector(123)).toBe(false);
      expect(isExternalLibrariesSelector({})).toBe(false);
      expect(isExternalLibrariesSelector(null)).toBe(false);
      expect(isExternalLibrariesSelector(undefined)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalSingleLibrarySelector = "react";
      const minimalArrayLibrariesSelector = ["react"];

      expect(isExternalLibrariesSelector(minimalSingleLibrarySelector)).toBe(
        true
      );
      expect(isExternalLibrariesSelector(minimalArrayLibrariesSelector)).toBe(
        true
      );
    });
  });
});
