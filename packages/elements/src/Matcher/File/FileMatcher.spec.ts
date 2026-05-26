import type { MatchersOptionsNormalized } from "../../Config";
import type { FileDescription } from "../../Descriptor";
import type { Micromatch } from "../Shared";

import { FilesMatcher } from "./FileMatcher";
import type { FileSingleSelector } from "./FileSelector.types";
import { normalizeFileSelector } from "./FileSelectorHelpers";

jest.mock("./FileSelectorHelpers");
jest.mock("../Shared/Micromatch");

const mockedNormalizeFileSelector = jest.mocked(normalizeFileSelector);

describe("FilesMatcher", () => {
  const MOCK_CONFIG: MatchersOptionsNormalized = { legacyTemplates: false };

  let micromatch: jest.Mocked<Micromatch>;
  let matcher: FilesMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatch = {
      isMatch: jest.fn(),
    } as unknown as jest.Mocked<Micromatch>;
    matcher = new FilesMatcher(MOCK_CONFIG, micromatch);
  });

  function createFileDescription(
    overrides: Partial<FileDescription> = {}
  ): FileDescription {
    return {
      path: "src/components/Button.ts",
      captured: null,
      categories: ["components"],
      isIgnored: false,
      isUnknown: false,
      ...overrides,
    };
  }

  describe("constructor", () => {
    it("should create an instance of FilesMatcher", () => {
      expect(matcher).toBeInstanceOf(FilesMatcher);
    });
  });

  describe("getSelectorMatching", () => {
    it("should normalize the selector and return the first matching selector", () => {
      const file = createFileDescription();
      const selector: FileSingleSelector = { path: "src/**" };
      mockedNormalizeFileSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(file, selector);

      expect(mockedNormalizeFileSelector).toHaveBeenCalledWith(selector);
      expect(result).toBe(selector);
    });

    it("should return null when no selector matches", () => {
      const file = createFileDescription();
      const selector: FileSingleSelector = { path: "lib/**" };
      mockedNormalizeFileSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.getSelectorMatching(file, selector);

      expect(result).toBeNull();
    });

    it("should return null when the normalized selectors array is empty", () => {
      const file = createFileDescription();
      mockedNormalizeFileSelector.mockReturnValue([]);

      const result = matcher.getSelectorMatching(file, []);

      expect(result).toBeNull();
    });

    it("should return the first matching selector from an array", () => {
      const file = createFileDescription({ path: "lib/utils/index.ts" });
      const selectors: FileSingleSelector[] = [
        { path: "src/**" },
        { path: "lib/**" },
      ];
      mockedNormalizeFileSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.getSelectorMatching(file, selectors);

      expect(result).toBe(selectors[1]);
    });

    it("should match when selector has no properties", () => {
      const file = createFileDescription();
      const selector = {} as FileSingleSelector;
      mockedNormalizeFileSelector.mockReturnValue([selector]);

      const result = matcher.getSelectorMatching(file, selector);

      expect(result).toBe(selector);
    });

    it("should pass extraTemplateData to matching", () => {
      const file = createFileDescription({ path: "src/components/Button.ts" });
      const selector: FileSingleSelector = { path: "{{ basePath }}/**" };
      mockedNormalizeFileSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(file, selector, {
        extraTemplateData: { basePath: "src/components" },
      });

      expect(result).toBe(selector);
    });

    it("should use default empty extraTemplateData when options are not provided", () => {
      const file = createFileDescription();
      const selector: FileSingleSelector = { path: "src/**" };
      mockedNormalizeFileSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.getSelectorMatching(file, selector);

      expect(result).toBe(selector);
    });

    describe("path matching", () => {
      it("should match when file path matches selector path pattern", () => {
        const file = createFileDescription({
          path: "src/components/Button.ts",
        });
        const selector: FileSingleSelector = { path: "src/components/**" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should not match when file path does not match selector path pattern", () => {
        const file = createFileDescription({
          path: "src/components/Button.ts",
        });
        const selector: FileSingleSelector = { path: "lib/**" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });
    });

    describe("categories matching", () => {
      it("should match when selector has no categories property", () => {
        const file = createFileDescription({ categories: ["components"] });
        const selector: FileSingleSelector = { path: "src/**" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when categories is undefined in the selector", () => {
        const file = createFileDescription({ categories: ["components"] });
        const selector: FileSingleSelector = {
          categories: undefined,
        };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when categories is null in the selector", () => {
        const file = createFileDescription({ categories: null });
        const selector: FileSingleSelector = {
          categories: null,
        };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when file categories match selector categories pattern", () => {
        const file = createFileDescription({ categories: ["components"] });
        const selector: FileSingleSelector = { categories: "components" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should not match when file categories do not match selector categories", () => {
        const file = createFileDescription({ categories: ["helpers"] });
        const selector: FileSingleSelector = { categories: "components" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });
    });

    describe("isIgnored matching", () => {
      it("should match when selector has no isIgnored property", () => {
        const file = createFileDescription({ isIgnored: true });
        const selector: FileSingleSelector = { path: "src/**" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when both isIgnored values are true", () => {
        const file = createFileDescription({ isIgnored: true });
        const selector: FileSingleSelector = { isIgnored: true };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when both isIgnored values are false", () => {
        const file = createFileDescription({ isIgnored: false });
        const selector: FileSingleSelector = { isIgnored: false };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should not match when isIgnored values differ", () => {
        const file = createFileDescription({ isIgnored: false });
        const selector: FileSingleSelector = { isIgnored: true };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });
    });

    describe("isUnknown matching", () => {
      it("should match when selector has no isUnknown property", () => {
        const file = createFileDescription({ isUnknown: true });
        const selector: FileSingleSelector = { path: "src/**" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when both isUnknown values are true", () => {
        const file = createFileDescription({ isUnknown: true });
        const selector: FileSingleSelector = { isUnknown: true };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should not match when isUnknown values differ", () => {
        const file = createFileDescription({ isUnknown: true });
        const selector: FileSingleSelector = { isUnknown: false };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });
    });

    describe("captured values matching", () => {
      it("should match when selector has no captured property", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = { path: "src/**" };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when selector captured is an empty object", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = { captured: {} };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should match when file captured values match selector captured pattern", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = { captured: { name: "Button" } };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should not match when file captured values do not match selector captured pattern", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = { captured: { name: "Input" } };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });

      it("should not match when file has no captured values but selector has captured", () => {
        const file = createFileDescription({ captured: null });
        const selector: FileSingleSelector = { captured: { name: "Button" } };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });

      it("should not match when file captured is missing the key required by selector", () => {
        const file = createFileDescription({
          captured: { type: "component" },
        });
        const selector: FileSingleSelector = { captured: { name: "Button" } };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });

      it("should match when captured selector is an array and any element matches", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = {
          captured: [{ name: "Input" }, { name: "Button" }],
        };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBe(selector);
      });

      it("should not match when captured selector is an array and no element matches", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = {
          captured: [{ name: "Input" }, { name: "Select" }],
        };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(false);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });

      it("should not match when captured selector is an empty array", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = { captured: [] };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });

      it("should not match when captured selector pattern is null after rendering", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = {
          captured: { name: null },
        };
        mockedNormalizeFileSelector.mockReturnValue([selector]);

        const result = matcher.getSelectorMatching(file, selector);

        expect(result).toBeNull();
      });

      it("should use template data when matching captured values", () => {
        const file = createFileDescription({
          captured: { name: "Button" },
        });
        const selector: FileSingleSelector = {
          captured: { name: "{{ expectedName }}" },
        };
        mockedNormalizeFileSelector.mockReturnValue([selector]);
        micromatch.isMatch.mockReturnValue(true);

        const result = matcher.getSelectorMatching(file, selector, {
          extraTemplateData: { expectedName: "Button" },
        });

        expect(result).toBe(selector);
      });
    });

    describe("combined matching", () => {
      it("should skip selectors where isIgnored matches but path does not", () => {
        const file = createFileDescription({
          path: "src/components/Button.ts",
          isIgnored: false,
        });
        const nonMatchingSelector: FileSingleSelector = {
          isIgnored: false,
          path: "lib/**",
        };
        const matchingSelector: FileSingleSelector = {
          isIgnored: false,
          path: "src/**",
        };
        mockedNormalizeFileSelector.mockReturnValue([
          nonMatchingSelector,
          matchingSelector,
        ]);
        micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

        const result = matcher.getSelectorMatching(file, [
          nonMatchingSelector,
          matchingSelector,
        ]);

        expect(result).toBe(matchingSelector);
      });

      it("should skip selectors where path matches but categories does not", () => {
        const file = createFileDescription({
          path: "src/helpers/format.ts",
          categories: ["helpers"],
        });
        const nonMatchingSelector: FileSingleSelector = {
          path: "src/**",
          categories: "components",
        };
        const matchingSelector: FileSingleSelector = {
          path: "src/**",
          categories: "helpers",
        };
        mockedNormalizeFileSelector.mockReturnValue([
          nonMatchingSelector,
          matchingSelector,
        ]);
        micromatch.isMatch
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);

        const result = matcher.getSelectorMatching(file, [
          nonMatchingSelector,
          matchingSelector,
        ]);

        expect(result).toBe(matchingSelector);
      });

      it("should skip selectors where path and categories match but captured does not", () => {
        const file = createFileDescription({
          path: "src/components/Button.ts",
          categories: ["components"],
          captured: { name: "Button" },
        });
        const nonMatchingSelector: FileSingleSelector = {
          path: "src/**",
          categories: "components",
          captured: { name: "Input" },
        };
        const matchingSelector: FileSingleSelector = {
          path: "src/**",
          categories: "components",
          captured: { name: "Button" },
        };
        mockedNormalizeFileSelector.mockReturnValue([
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

        const result = matcher.getSelectorMatching(file, [
          nonMatchingSelector,
          matchingSelector,
        ]);

        expect(result).toBe(matchingSelector);
      });
    });
  });

  describe("isFileMatch", () => {
    it("should return true when a matching selector is found", () => {
      const file = createFileDescription();
      const selector: FileSingleSelector = { path: "src/**" };
      mockedNormalizeFileSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.isFileMatch(file, selector);

      expect(result).toBe(true);
    });

    it("should return false when no matching selector is found", () => {
      const file = createFileDescription();
      const selector: FileSingleSelector = { path: "lib/**" };
      mockedNormalizeFileSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.isFileMatch(file, selector);

      expect(result).toBe(false);
    });

    it("should return true when matching against an array of selectors and one matches", () => {
      const file = createFileDescription({ path: "lib/utils/index.ts" });
      const selectors: FileSingleSelector[] = [
        { path: "src/**" },
        { path: "lib/**" },
      ];
      mockedNormalizeFileSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const result = matcher.isFileMatch(file, selectors);

      expect(result).toBe(true);
    });

    it("should return false when matching against an array of selectors and none matches", () => {
      const file = createFileDescription({ path: "test/foo.spec.ts" });
      const selectors: FileSingleSelector[] = [
        { path: "src/**" },
        { path: "lib/**" },
      ];
      mockedNormalizeFileSelector.mockReturnValue(selectors);
      micromatch.isMatch.mockReturnValue(false);

      const result = matcher.isFileMatch(file, selectors);

      expect(result).toBe(false);
    });

    it("should pass options through to getSelectorMatching", () => {
      const file = createFileDescription({
        path: "src/components/Button.ts",
      });
      const selector: FileSingleSelector = { path: "{{ basePath }}/**" };
      mockedNormalizeFileSelector.mockReturnValue([selector]);
      micromatch.isMatch.mockReturnValue(true);

      const result = matcher.isFileMatch(file, selector, {
        extraTemplateData: { basePath: "src/components" },
      });

      expect(result).toBe(true);
    });

    it("should return true when selector has no properties", () => {
      const file = createFileDescription();
      const selector = {} as FileSingleSelector;
      mockedNormalizeFileSelector.mockReturnValue([selector]);

      const result = matcher.isFileMatch(file, selector);

      expect(result).toBe(true);
    });
  });
});
