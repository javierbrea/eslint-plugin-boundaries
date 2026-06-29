import type { MatchersOptionsNormalized } from "../../Config";
import type { ElementDescription, ElementParent } from "../../Descriptor";
import type { Micromatch } from "../Shared";

import { ElementsMatcher } from "./ElementMatcher";
import type {
  ElementSingleSelectorNormalized,
  ParentElementSingleSelector,
} from "./ElementSelector.types";
import { normalizeElementSelector } from "./ElementSelectorHelpers";

jest.mock("./ElementSelectorHelpers");
jest.mock("../Shared/Micromatch");

const mockedNormalizeElementSelector = jest.mocked(normalizeElementSelector);

describe("ElementsMatcher", () => {
  const MOCK_CONFIG: MatchersOptionsNormalized = { legacyTemplates: false };

  let micromatch: jest.Mocked<Micromatch>;
  let matcher: ElementsMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatch = {
      isMatch: jest.fn(),
    } as unknown as jest.Mocked<Micromatch>;
    matcher = new ElementsMatcher(MOCK_CONFIG, micromatch);
  });

  function createElementDescription(
    overrides: Partial<ElementDescription> = {}
  ): ElementDescription {
    return {
      path: "src/components/Button",
      captured: null,
      isIgnored: false,
      isUnknown: false,
      types: ["component"],
      category: null,
      filePath: null,
      fileInternalPath: null,
      parents: [],
      ...overrides,
    };
  }

  function createParent(overrides: Partial<ElementParent> = {}): ElementParent {
    return {
      types: ["module"],
      category: null,
      path: "src/modules/auth",
      captured: null,
      ...overrides,
    };
  }

  describe("constructor", () => {
    it("should create an instance of ElementsMatcher", () => {
      expect(matcher).toBeInstanceOf(ElementsMatcher);
    });
  });

  describe("getSelectorMatching", () => {
    it("should normalize the selector and return the first matching selector", () => {
      const element = createElementDescription();
      const selector: ElementSingleSelectorNormalized = { type: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(mockedNormalizeElementSelector).toHaveBeenCalledWith(selector);
      expect(result).toBe(selector);
    });

    it("should return null when no selector matches", () => {
      const element = createElementDescription();
      const selector: ElementSingleSelectorNormalized = { type: "helper" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should return the first matching selector from an array", () => {
      const element = createElementDescription({ types: ["helper"] });
      const selectors: ElementSingleSelectorNormalized[] = [
        { type: "component" },
        { type: "helper" },
      ];
      mockedNormalizeElementSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(element, selectors);

      expect(result).toBe(selectors[1]);
    });

    it("should return null when the normalized selectors array is empty", () => {
      const element = createElementDescription();
      mockedNormalizeElementSelector.mockReturnValue([]);

      const result = matcher.getSelectorMatching(element, []);

      expect(result).toBeNull();
    });

    it("should match when selector has no properties", () => {
      const element = createElementDescription();
      const selector = {} as ElementSingleSelectorNormalized;
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should throw when element is not a valid element description", () => {
      const invalidElement = { foo: "bar" } as unknown as ElementDescription;
      const selector: ElementSingleSelectorNormalized = { type: "component" };

      expect(() =>
        matcher.getSelectorMatching(invalidElement, selector)
      ).toThrow("Invalid element description");
    });

    it("should pass extraTemplateData to matching", () => {
      const element = createElementDescription({ types: ["component"] });
      const selector: ElementSingleSelectorNormalized = {
        type: "{{ myType }}",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector, {
        extraTemplateData: { myType: "component" },
      });

      expect(result).toBe(selector);
    });

    it("should use default empty extraTemplateData when options are not provided", () => {
      const element = createElementDescription();
      const selector: ElementSingleSelectorNormalized = { type: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });
  });

  describe("isElementMatch", () => {
    it("should return true when a matching selector is found", () => {
      const element = createElementDescription();
      const selector: ElementSingleSelectorNormalized = { type: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.isElementMatch(element, selector);

      expect(result).toBe(true);
    });

    it("should return false when no matching selector is found", () => {
      const element = createElementDescription();
      const selector: ElementSingleSelectorNormalized = { type: "helper" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.isElementMatch(element, selector);

      expect(result).toBe(false);
    });

    it("should return true when matching against an array and one matches", () => {
      const element = createElementDescription({ types: ["helper"] });
      const selectors: ElementSingleSelectorNormalized[] = [
        { type: "component" },
        { type: "helper" },
      ];
      mockedNormalizeElementSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.isElementMatch(element, selectors);

      expect(result).toBe(true);
    });

    it("should return false when matching against an array and none matches", () => {
      const element = createElementDescription({ types: ["service"] });
      const selectors: ElementSingleSelectorNormalized[] = [
        { type: "component" },
        { type: "helper" },
      ];
      mockedNormalizeElementSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.isElementMatch(element, selectors);

      expect(result).toBe(false);
    });

    it("should pass options through to getSelectorMatching", () => {
      const element = createElementDescription({ types: ["component"] });
      const selector: ElementSingleSelectorNormalized = {
        type: "{{ myType }}",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.isElementMatch(element, selector, {
        extraTemplateData: { myType: "component" },
      });

      expect(result).toBe(true);
    });

    it("should return true when selector has no properties", () => {
      const element = createElementDescription();
      const selector = {} as ElementSingleSelectorNormalized;
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.isElementMatch(element, selector);

      expect(result).toBe(true);
    });
  });

  describe("type matching", () => {
    it("should match when selector type matches the first type of the element", () => {
      const element = createElementDescription({
        types: ["component", "shared"],
      });
      const selector: ElementSingleSelectorNormalized = { type: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when selector type does not match the first type", () => {
      const element = createElementDescription({
        types: ["component", "shared"],
      });
      const selector: ElementSingleSelectorNormalized = { type: "helper" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match when selector type is undefined", () => {
      const element = createElementDescription({ types: ["component"] });
      const selector: ElementSingleSelectorNormalized = {};
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should handle element with null types for single type match", () => {
      const element = createElementDescription({ types: null });
      const selector: ElementSingleSelectorNormalized = { type: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });
  });

  describe("types matching", () => {
    it("should match when selector types matches the element types", () => {
      const element = createElementDescription({
        types: ["component", "shared"],
      });
      const selector: ElementSingleSelectorNormalized = { types: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when selector types does not match", () => {
      const element = createElementDescription({
        types: ["component", "shared"],
      });
      const selector: ElementSingleSelectorNormalized = { types: "helper" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });
  });

  describe("path matching", () => {
    it("should match when selector path matches element path", () => {
      const element = createElementDescription({
        path: "src/components/Button",
      });
      const selector: ElementSingleSelectorNormalized = {
        path: "src/components/*",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when selector path does not match", () => {
      const element = createElementDescription({
        path: "src/components/Button",
      });
      const selector: ElementSingleSelectorNormalized = {
        path: "src/helpers/*",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });
  });

  describe("category matching", () => {
    it("should match when selector category matches element category", () => {
      const element = createElementDescription({ category: "atoms" });
      const selector: ElementSingleSelectorNormalized = { category: "atoms" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when selector category does not match", () => {
      const element = createElementDescription({ category: "atoms" });
      const selector: ElementSingleSelectorNormalized = {
        category: "molecules",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });
  });

  describe("fileInternalPath matching", () => {
    it("should match when selector fileInternalPath matches", () => {
      const element = createElementDescription({
        fileInternalPath: "index.ts",
      });
      const selector: ElementSingleSelectorNormalized = {
        fileInternalPath: "index.*",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when selector fileInternalPath does not match", () => {
      const element = createElementDescription({
        fileInternalPath: "utils.ts",
      });
      const selector: ElementSingleSelectorNormalized = {
        fileInternalPath: "index.*",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });
  });

  describe("filePath matching (legacy)", () => {
    it("should match when selector filePath matches", () => {
      const element = createElementDescription({
        filePath: "src/components/Button/index.ts",
      });
      const selector: ElementSingleSelectorNormalized = {
        filePath: "src/components/**",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when selector filePath does not match", () => {
      const element = createElementDescription({
        filePath: "src/helpers/format.ts",
      });
      const selector: ElementSingleSelectorNormalized = {
        filePath: "src/components/**",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });
  });

  describe("isIgnored matching", () => {
    it("should match when both element and selector isIgnored are true", () => {
      const element = createElementDescription({ isIgnored: true });
      const selector: ElementSingleSelectorNormalized = { isIgnored: true };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when element isIgnored differs from selector", () => {
      const element = createElementDescription({ isIgnored: false });
      const selector: ElementSingleSelectorNormalized = { isIgnored: true };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match when selector isIgnored is undefined", () => {
      const element = createElementDescription({ isIgnored: true });
      const selector: ElementSingleSelectorNormalized = {};
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });
  });

  describe("isUnknown matching", () => {
    it("should match when both element and selector isUnknown are true", () => {
      const element = createElementDescription({ isUnknown: true });
      const selector: ElementSingleSelectorNormalized = { isUnknown: true };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when element isUnknown differs from selector", () => {
      const element = createElementDescription({ isUnknown: false });
      const selector: ElementSingleSelectorNormalized = { isUnknown: true };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match when selector isUnknown is undefined", () => {
      const element = createElementDescription({ isUnknown: true });
      const selector: ElementSingleSelectorNormalized = {};
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });
  });

  describe("captured values matching", () => {
    it("should match when selector has no captured property", () => {
      const element = createElementDescription({
        captured: { name: "Button" },
      });
      const selector: ElementSingleSelectorNormalized = { type: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should match when selector captured is an empty object", () => {
      const element = createElementDescription({
        captured: { name: "Button" },
      });
      const selector: ElementSingleSelectorNormalized = { captured: {} };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should match when captured values match the selector", () => {
      const element = createElementDescription({
        captured: { name: "Button" },
      });
      const selector: ElementSingleSelectorNormalized = {
        captured: { name: "Button" },
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match when captured values do not match", () => {
      const element = createElementDescription({
        captured: { name: "Button" },
      });
      const selector: ElementSingleSelectorNormalized = {
        captured: { name: "Input" },
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should not match when element has no captured values but selector requires them", () => {
      const element = createElementDescription({ captured: null });
      const selector: ElementSingleSelectorNormalized = {
        captured: { name: "Button" },
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should not match when element captured values lack a required key", () => {
      const element = createElementDescription({
        captured: { name: "Button" },
      });
      const selector: ElementSingleSelectorNormalized = {
        captured: { category: "atoms" },
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match with array of captured values using OR logic", () => {
      const element = createElementDescription({
        captured: { name: "Input" },
      });
      const selector: ElementSingleSelectorNormalized = {
        captured: [{ name: "Button" }, { name: "Input" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should not match with array of captured values when none matches", () => {
      const element = createElementDescription({
        captured: { name: "Select" },
      });
      const selector: ElementSingleSelectorNormalized = {
        captured: [{ name: "Button" }, { name: "Input" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should not match when captured array is empty", () => {
      const element = createElementDescription({
        captured: { name: "Button" },
      });
      const selector: ElementSingleSelectorNormalized = { captured: [] };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should not match when captured selector value is null", () => {
      const element = createElementDescription({
        captured: { name: "Button" },
      });
      const selector: ElementSingleSelectorNormalized = {
        captured: { name: null },
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });
  });

  describe("parent matching", () => {
    it("should match when selector has no parent property", () => {
      const element = createElementDescription({
        parents: [createParent()],
      });
      const selector: ElementSingleSelectorNormalized = { type: "component" };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBe(selector);
    });

    it("should match when parent selector is null and element has no parents", () => {
      const element = createElementDescription({ parents: [] });
      const selector: ElementSingleSelectorNormalized = { parent: null };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: null });
    });

    it("should not match when parent selector is null but element has parents", () => {
      const element = createElementDescription({
        parents: [createParent()],
      });
      const selector: ElementSingleSelectorNormalized = { parent: null };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match when parent type matches the first parent's first type", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ type: "module" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: { type: "module" } });
    });

    it("should not match when parent type does not match", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ type: "feature" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match the first parent selector that matches using OR logic", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["feature"] })],
      });
      const parentSelector1 = { type: "module" };
      const parentSelector2 = { type: "feature" };
      const selector: ElementSingleSelectorNormalized = {
        parent: [parentSelector1, parentSelector2],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: parentSelector2 });
    });

    it("should not match when element has no parents but selector requires one", () => {
      const element = createElementDescription({ parents: [] });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ type: "module" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match parent types selector", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module", "feature"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ types: "module" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: { types: "module" } });
    });

    it("should not match parent types when they do not match", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ types: "feature" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("matches parent when types uses allOf and all required types are present", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module", "lazy"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ types: { allOf: ["module", "lazy"] } }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockImplementation(
        (val: string, pattern: string | string[]) => val === pattern
      );

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({
        parent: { types: { allOf: ["module", "lazy"] } },
      });
    });

    it("does not match parent when types uses allOf and a required type is missing", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ types: { allOf: ["module", "lazy"] } }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockImplementation(
        (val: string, pattern: string | string[]) => val === pattern
      );

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("matches parent when types uses noneOf and none of the forbidden types are present", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ types: { noneOf: ["deprecated", "legacy"] } }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({
        parent: { types: { noneOf: ["deprecated", "legacy"] } },
      });
    });

    it("matches parent when types uses hasLength and count matches", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module", "lazy"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ types: { hasLength: 2 } }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: { types: { hasLength: 2 } } });
    });

    it("should match parent path selector", () => {
      const element = createElementDescription({
        parents: [createParent({ path: "src/modules/auth" })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ path: "src/modules/*" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: { path: "src/modules/*" } });
    });

    it("should not match parent path when it does not match", () => {
      const element = createElementDescription({
        parents: [createParent({ path: "src/helpers/format" })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ path: "src/modules/*" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match parent category selector", () => {
      const element = createElementDescription({
        parents: [createParent({ category: "domain" })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ category: "domain" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: { category: "domain" } });
    });

    it("should not match parent category when it does not match", () => {
      const element = createElementDescription({
        parents: [createParent({ category: "domain" })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ category: "infra" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match parent captured values", () => {
      const element = createElementDescription({
        parents: [createParent({ captured: { name: "auth" } })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ captured: { name: "auth" } }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({
        parent: { captured: { name: "auth" } },
      });
    });

    it("should not match parent captured values when they do not match", () => {
      const element = createElementDescription({
        parents: [createParent({ captured: { name: "auth" } })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ captured: { name: "billing" } }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match parent with empty captured selector", () => {
      const element = createElementDescription({
        parents: [createParent({ captured: { name: "auth" } })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ captured: {} }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: { captured: {} } });
    });

    it("should not match parent captured values with empty array", () => {
      const element = createElementDescription({
        parents: [createParent({ captured: { name: "auth" } })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ captured: [] }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match parent captured values with array of selectors using OR logic", () => {
      const element = createElementDescription({
        parents: [createParent({ captured: { name: "billing" } })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ captured: [{ name: "auth" }, { name: "billing" }] }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({
        parent: {
          captured: [{ name: "auth" }, { name: "billing" }],
        },
      });
    });

    it("should handle parent with null types", () => {
      const element = createElementDescription({
        parents: [createParent({ types: null })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ type: "module" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should not match when parent selector array contains an undefined element", () => {
      const element = createElementDescription({
        parents: [createParent()],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [undefined as unknown as ParentElementSingleSelector],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should match when parent selector array contains null and element has no parents", () => {
      const element = createElementDescription({ parents: [] });
      const selector: ElementSingleSelectorNormalized = {
        parent: [null as unknown as ParentElementSingleSelector],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toEqual({ parent: null });
    });
  });

  describe("combined matching", () => {
    it("should match when all selector properties match", () => {
      const element = createElementDescription({
        types: ["component"],
        path: "src/components/Button",
        category: "atoms",
        fileInternalPath: "index.ts",
        captured: { name: "Button" },
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        type: "component",
        path: "src/components/*",
        category: "atoms",
        fileInternalPath: "index.*",
        captured: { name: "Button" },
        parent: [{ type: "module" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).not.toBeNull();
    });

    it("should not match when type matches but path does not", () => {
      const element = createElementDescription({
        types: ["component"],
        path: "src/helpers/format",
      });
      const selector: ElementSingleSelectorNormalized = {
        type: "component",
        path: "src/components/*",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const result = matcher.getSelectorMatching(element, selector);

      expect(result).toBeNull();
    });

    it("should skip first non-matching selector and return second matching one", () => {
      const element = createElementDescription({
        types: ["helper"],
        path: "src/helpers/format",
      });
      const selector1: ElementSingleSelectorNormalized = {
        type: "component",
        path: "src/components/*",
      };
      const selector2: ElementSingleSelectorNormalized = {
        type: "helper",
        path: "src/helpers/*",
      };
      mockedNormalizeElementSelector.mockReturnValue([selector1, selector2]);
      micromatch.isMatch
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(element, [
        selector1,
        selector2,
      ]);

      expect(result).toBe(selector2);
    });
  });

  describe("types array query", () => {
    describe("anyOf", () => {
      it("returns a match when any type matches anyOf", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { anyOf: ["ui", "service"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) =>
            [pattern].flat().includes(val)
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when no type is in anyOf", () => {
        const element = createElementDescription({ types: ["component"] });
        const selector: ElementSingleSelectorNormalized = {
          types: { anyOf: ["service", "api"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("allOf", () => {
      it("returns a match when all matchers find a matching type", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { allOf: ["component", "ui"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) =>
            [pattern].flat().includes(val)
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when a required type is missing", () => {
        const element = createElementDescription({ types: ["component"] });
        const selector: ElementSingleSelectorNormalized = {
          types: { allOf: ["component", "ui"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("noneOf", () => {
      it("returns a match when no type matches the forbidden list", () => {
        const element = createElementDescription({ types: ["component"] });
        const selector: ElementSingleSelectorNormalized = {
          types: { noneOf: ["service", "api"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when a forbidden type is present", () => {
        const element = createElementDescription({
          types: ["component", "service"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { noneOf: ["service"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) =>
            [pattern].flat().includes(val)
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("equalsTo", () => {
      it("returns a match for exact ordered types", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { equalsTo: ["component", "ui"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when order differs", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { equalsTo: ["ui", "component"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("hasLength", () => {
      it("returns a match when the types array has the expected length", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { hasLength: 2 },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when the types array has a different length", () => {
        const element = createElementDescription({ types: ["component"] });
        const selector: ElementSingleSelectorNormalized = {
          types: { hasLength: 2 },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("atIndex", () => {
      it("returns a match when the type at the given index matches", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { atIndex: { index: 1, matches: "ui" } },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns a match for index -1 (last element)", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { atIndex: { index: -1, matches: "ui" } },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns a match when matches is an array and the type at index equals one", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { atIndex: { index: 0, matches: ["helper", "component"] } },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) =>
            [pattern].flat().includes(val)
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when matches is an array and the type at index equals none", () => {
        const element = createElementDescription({
          types: ["component", "ui"],
        });
        const selector: ElementSingleSelectorNormalized = {
          types: { atIndex: { index: 0, matches: ["helper", "service"] } },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) =>
            [pattern].flat().includes(val)
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("null types (unknown/ignored element)", () => {
      it("returns no match when element has null types", () => {
        const element = createElementDescription({ types: null });
        const selector: ElementSingleSelectorNormalized = {
          types: { anyOf: ["component"] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });
  });

  describe("parent", () => {
    it("returns a match when the first parent type matches the parent selector", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ type: "module" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      expect(matcher.isElementMatch(element, selector)).toBe(true);
    });

    it("returns no match when the first parent type does not match", () => {
      const element = createElementDescription({
        parents: [createParent({ types: ["module"] })],
      });
      const selector: ElementSingleSelectorNormalized = {
        parent: [{ type: "service" }],
      };
      mockedNormalizeElementSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      expect(matcher.isElementMatch(element, selector)).toBe(false);
    });

    it("returns a match for parent: null when element has no parents", () => {
      const element = createElementDescription({ parents: [] });
      const selector: ElementSingleSelectorNormalized = { parent: null };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      expect(matcher.isElementMatch(element, selector)).toBe(true);
    });

    it("returns no match for parent: null when element has parents", () => {
      const element = createElementDescription({
        parents: [createParent()],
      });
      const selector: ElementSingleSelectorNormalized = { parent: null };
      mockedNormalizeElementSelector.mockReturnValue([selector]);

      expect(matcher.isElementMatch(element, selector)).toBe(false);
    });
  });

  describe("parents array query", () => {
    describe("anyOf", () => {
      it("returns a match when any ancestor matches the anyOf selector", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { anyOf: [{ type: "app" }] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when no ancestor matches anyOf", () => {
        const element = createElementDescription({
          parents: [createParent({ types: ["module"] })],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { anyOf: [{ type: "app" }] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("allOf", () => {
      it("returns a match when all matchers find a matching ancestor", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { allOf: [{ type: "module" }, { type: "app" }] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when a required ancestor type is missing", () => {
        const element = createElementDescription({
          parents: [createParent({ types: ["module"] })],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { allOf: [{ type: "module" }, { type: "app" }] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("noneOf", () => {
      it("returns a match when no ancestor matches the forbidden selector", () => {
        const element = createElementDescription({
          parents: [createParent({ types: ["module"] })],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { noneOf: [{ type: "app" }] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when a forbidden ancestor is present", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { noneOf: [{ type: "app" }] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("hasLength", () => {
      it("returns a match for hasLength: 0 on a top-level element", () => {
        const element = createElementDescription({ parents: [] });
        const selector: ElementSingleSelectorNormalized = {
          parents: { hasLength: 0 },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns a match when ancestor count equals hasLength", () => {
        const element = createElementDescription({
          parents: [createParent(), createParent()],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { hasLength: 2 },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when ancestor count differs from hasLength", () => {
        const element = createElementDescription({
          parents: [createParent()],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { hasLength: 2 },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("atIndex", () => {
      it("matches the outermost ancestor using index -1", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { atIndex: { index: -1, matches: { type: "app" } } },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when out-of-range index is used", () => {
        const element = createElementDescription({
          parents: [createParent({ types: ["module"] })],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { atIndex: { index: 5, matches: { type: "module" } } },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });

      it("returns a match when matches is an array and the parent at index satisfies one selector", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: {
            atIndex: {
              index: 0,
              matches: [{ type: "service" }, { type: "module" }],
            },
          },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when matches is an array and the parent at index satisfies none", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: {
            atIndex: {
              index: 0,
              matches: [{ type: "service" }, { type: "helper" }],
            },
          },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("equalsTo", () => {
      it("returns a match for exact ordered ancestor chain", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: {
            equalsTo: [{ type: "module" }, { type: "app" }],
          },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match for reversed ancestor order", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: {
            equalsTo: [{ type: "app" }, { type: "module" }],
          },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });

    describe("template inside parents matcher", () => {
      it("renders template variables before matching parent type", () => {
        const element = createElementDescription({
          parents: [createParent({ types: ["module"] })],
        });
        const selector: ElementSingleSelectorNormalized = {
          parents: { anyOf: [{ type: "{{ parentType }}" }] },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        const result = matcher.getSelectorMatching(element, selector, {
          extraTemplateData: { parentType: "module" },
        });

        expect(result).not.toBeNull();
      });
    });

    describe("parents and parent together", () => {
      it("requires both parent and parents to match when both are specified", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parent: [{ type: "module" }],
          parents: { hasLength: 2 },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockImplementation(
          (val: string, pattern: string | string[]) => val === pattern
        );

        expect(matcher.isElementMatch(element, selector)).toBe(true);
      });

      it("returns no match when parents passes but parent fails", () => {
        const element = createElementDescription({
          parents: [
            createParent({ types: ["module"] }),
            createParent({ types: ["app"] }),
          ],
        });
        const selector: ElementSingleSelectorNormalized = {
          parent: [{ type: "service" }],
          parents: { hasLength: 2 },
        };
        mockedNormalizeElementSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        expect(matcher.isElementMatch(element, selector)).toBe(false);
      });
    });
  });
});
