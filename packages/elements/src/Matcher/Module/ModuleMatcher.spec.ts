import type { MatchersOptionsNormalized } from "../../Config";
import type { ModuleDescription } from "../../Descriptor";
import type { Micromatch } from "../Shared";

import { ModulesMatcher } from "./ModuleMatcher";
import type { ModuleSingleSelector } from "./ModuleSelector.types";
import { normalizeModuleSelector } from "./ModuleSelectorHelpers";

jest.mock("./ModuleSelectorHelpers");
jest.mock("../Shared/Micromatch");

const mockedNormalizeModuleSelector = jest.mocked(normalizeModuleSelector);

describe("ModulesMatcher", () => {
  const MOCK_CONFIG: MatchersOptionsNormalized = { legacyTemplates: false };

  let micromatch: jest.Mocked<Micromatch>;
  let matcher: ModulesMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatch = {
      isMatch: jest.fn(),
    } as unknown as jest.Mocked<Micromatch>;
    matcher = new ModulesMatcher(MOCK_CONFIG, micromatch);
  });

  function createModuleDescription(
    overrides: Partial<ModuleDescription> = {}
  ): ModuleDescription {
    return {
      origin: "local",
      source: null,
      internalPath: null,
      ...overrides,
    };
  }

  describe("constructor", () => {
    it("should create an instance of ModulesMatcher", () => {
      expect(matcher).toBeInstanceOf(ModulesMatcher);
    });
  });

  describe("getSelectorMatching", () => {
    it("should normalize the selector and return the first matching selector", () => {
      const moduleDescription = createModuleDescription();
      const selector: ModuleSingleSelector = { origin: "local" };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(moduleDescription, selector);

      expect(mockedNormalizeModuleSelector).toHaveBeenCalledWith(selector);
      expect(result).toBe(selector);
    });

    it("should return null when no selector matches", () => {
      const moduleDescription = createModuleDescription();
      const selector: ModuleSingleSelector = { origin: "external" };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(moduleDescription, selector);

      expect(result).toBeNull();
    });

    it("should return the first matching selector from an array", () => {
      const moduleDescription = createModuleDescription({
        origin: "external",
      });
      const selectors: ModuleSingleSelector[] = [
        { origin: "local" },
        { origin: "external" },
      ];
      mockedNormalizeModuleSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(moduleDescription, selectors);

      expect(result).toBe(selectors[1]);
    });

    it("should pass extraTemplateData to matching", () => {
      const moduleDescription = createModuleDescription({
        origin: "external",
        source: "@scope/package",
      });
      const selector: ModuleSingleSelector = { source: "{{ mySource }}" };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(moduleDescription, selector, {
        extraTemplateData: { mySource: "@scope/package" },
      });

      expect(result).toBe(selector);
    });

    it("should return null when the normalized selectors array is empty", () => {
      const moduleDescription = createModuleDescription();
      mockedNormalizeModuleSelector.mockReturnValue([]);

      const result = matcher.getSelectorMatching(moduleDescription, []);

      expect(result).toBeNull();
    });

    it("should match when selector has no origin, source, or internalPath keys", () => {
      const moduleDescription = createModuleDescription();
      const selector = {} as ModuleSingleSelector;
      mockedNormalizeModuleSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(moduleDescription, selector);

      expect(result).toBe(selector);
    });

    it("should skip selectors where origin matches but source does not", () => {
      const moduleDescription = createModuleDescription({
        origin: "external",
        source: "lodash",
      });
      const nonMatchingSelector: ModuleSingleSelector = {
        origin: "external",
        source: "react",
      };
      const matchingSelector: ModuleSingleSelector = {
        origin: "external",
        source: "lodash",
      };
      mockedNormalizeModuleSelector.mockReturnValue([
        nonMatchingSelector,
        matchingSelector,
      ]);
      micromatch.isMatch
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(moduleDescription, [
        nonMatchingSelector,
        matchingSelector,
      ]);

      expect(result).toBe(matchingSelector);
    });

    it("should skip selectors where origin and source match but internalPath does not", () => {
      const moduleDescription = createModuleDescription({
        origin: "external",
        source: "lodash",
        internalPath: "fp",
      });
      const nonMatchingSelector: ModuleSingleSelector = {
        origin: "external",
        source: "lodash",
        internalPath: "core",
      };
      const matchingSelector: ModuleSingleSelector = {
        origin: "external",
        source: "lodash",
        internalPath: "fp",
      };
      mockedNormalizeModuleSelector.mockReturnValue([
        nonMatchingSelector,
        matchingSelector,
      ]);
      micromatch.isMatch
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(moduleDescription, [
        nonMatchingSelector,
        matchingSelector,
      ]);

      expect(result).toBe(matchingSelector);
    });

    it("should match null source against null selector source", () => {
      const moduleDescription = createModuleDescription({
        origin: "local",
        source: null,
      });
      const selector: ModuleSingleSelector = { source: null };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(moduleDescription, selector);

      expect(result).toBe(selector);
    });

    it("should match null internalPath against null selector internalPath", () => {
      const moduleDescription = createModuleDescription({
        origin: "local",
        internalPath: null,
      });
      const selector: ModuleSingleSelector = { internalPath: null };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(moduleDescription, selector);

      expect(result).toBe(selector);
    });

    it("should use default empty extraTemplateData when options are not provided", () => {
      const moduleDescription = createModuleDescription();
      const selector: ModuleSingleSelector = { origin: "local" };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(moduleDescription, selector);

      expect(result).toBe(selector);
    });
  });

  describe("isModuleMatch", () => {
    it("should return true when a matching selector is found", () => {
      const moduleDescription = createModuleDescription();
      const selector: ModuleSingleSelector = { origin: "local" };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.isModuleMatch(moduleDescription, selector);

      expect(result).toBe(true);
    });

    it("should return false when no matching selector is found", () => {
      const moduleDescription = createModuleDescription();
      const selector: ModuleSingleSelector = { origin: "external" };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.isModuleMatch(moduleDescription, selector);

      expect(result).toBe(false);
    });

    it("should return true when matching against an array of selectors and one matches", () => {
      const moduleDescription = createModuleDescription({
        origin: "external",
      });
      const selectors: ModuleSingleSelector[] = [
        { origin: "local" },
        { origin: "external" },
      ];
      mockedNormalizeModuleSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.isModuleMatch(moduleDescription, selectors);

      expect(result).toBe(true);
    });

    it("should return false when matching against an array of selectors and none matches", () => {
      const moduleDescription = createModuleDescription({
        origin: "core",
      });
      const selectors: ModuleSingleSelector[] = [
        { origin: "local" },
        { origin: "external" },
      ];
      mockedNormalizeModuleSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.isModuleMatch(moduleDescription, selectors);

      expect(result).toBe(false);
    });

    it("should pass options through to getSelectorMatching", () => {
      const moduleDescription = createModuleDescription({
        origin: "external",
        source: "@scope/package",
      });
      const selector: ModuleSingleSelector = { source: "{{ mySource }}" };
      mockedNormalizeModuleSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.isModuleMatch(moduleDescription, selector, {
        extraTemplateData: { mySource: "@scope/package" },
      });

      expect(result).toBe(true);
    });

    it("should return true when selector has no properties", () => {
      const moduleDescription = createModuleDescription();
      const selector = {} as ModuleSingleSelector;
      mockedNormalizeModuleSelector.mockReturnValue([selector]);

      const result = matcher.isModuleMatch(moduleDescription, selector);

      expect(result).toBe(true);
    });
  });
});
