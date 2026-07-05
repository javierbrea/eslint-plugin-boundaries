/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type {
  FileDescription,
  FileSingleSelector,
  FileSelector,
  Matcher,
} from "../index";
import {
  Elements,
  isIgnoredFileDescription,
  isKnownFileDescription,
  isUnknownFileDescription,
  isFileDescription,
  normalizeFileSelector,
} from "../index";

describe("describeFile | Integration", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "capture");

    elements = new Elements({
      includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      ignorePaths: ["**/src/**/__tests__/**"],
    });
    matcher = elements.getMatcher({
      files: [
        { pattern: "**/*.tsx", category: "react" },
        {
          pattern: ["*/*.test.ts"],
          basePattern: "**/src/*",
          category: "test",
          capture: ["testFileName"],
          baseCapture: ["root", "area"],
        },
        { pattern: "**/*.spec.ts", category: "spec" },
        { pattern: "**/modules/**/*.ts", category: "module-file" },
      ],
    });
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("configuration options", () => {
    it("should ignore files based on ignorePaths", () => {
      const file = matcher.describeFile(
        "/project/src/utils/__tests__/testUtil.ts"
      );

      expect(file).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should not include files not included in includePaths", () => {
      const file = matcher.describeFile("/project/foo/utils/testUtil.ts");

      expect(file).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should exclude files when only ignorePaths is provided", () => {
      const otherMatcher = elements.getMatcher(
        {
          files: [{ pattern: "**/*.tsx", category: "react" }],
        },
        {
          ignorePaths: ["**/src/**/*.tsx"],
        }
      );

      const file = otherMatcher.describeFile(
        "/project/src/components/Button.tsx"
      );

      expect(file).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should throw an error for invalid descriptors", () => {
      expect(() =>
        elements.getMatcher({
          files: [
            { pattern: "**/*.tsx", category: "react" },
            {
              pattern: "**/*.ts",
            } as unknown as { pattern: string; category: string },
          ],
        })
      ).toThrow(
        "File descriptor at index 1 must have a pattern, and a 'category' defined."
      );
    });

    it("should not include files when includePaths do not match", () => {
      const otherMatcher = elements.getMatcher(
        {
          files: [{ pattern: "**/*.tsx", category: "react" }],
        },
        {
          includePaths: ["**/src/**/*.md"],
        }
      );

      const file = otherMatcher.describeFile(
        "/project/src/components/Button.tsx"
      );

      expect(file).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should include every file by default", () => {
      const otherMatcher = elements.getMatcher(
        {
          files: [{ pattern: "**/*.tsx", category: "react" }],
        },
        {}
      );

      const file = otherMatcher.describeFile(
        "/project/src/components/Button.tsx"
      );

      expect(file).toEqual({
        categories: ["react"],
        path: "/project/src/components/Button.tsx",
        captured: null,
        isIgnored: false,
        isUnknown: false,
      });
      expect(isKnownFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });
  });

  describe("file descriptions", () => {
    it("should return unknown files when no path is provided", () => {
      // @ts-expect-error Testing no path provided
      const file = matcher.describeFile();

      expect(isUnknownFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should assign a single category when one descriptor matches", () => {
      const file = matcher.describeFile("/project/src/components/Button.tsx");

      expect(file).toEqual({
        categories: ["react"],
        path: "/project/src/components/Button.tsx",
        captured: null,
        isIgnored: false,
        isUnknown: false,
      });
      expect(isKnownFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should assign multiple categories when multiple descriptors match", () => {
      const file = matcher.describeFile(
        "/project/src/modules/user/user.spec.ts"
      );

      expect(file).toEqual({
        categories: ["spec", "module-file"],
        path: "/project/src/modules/user/user.spec.ts",
        captured: null,
        isIgnored: false,
        isUnknown: false,
      });
      expect(isKnownFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should capture values from a descriptor with basePattern", () => {
      const file = matcher.describeFile("/project/src/utils/math/math.test.ts");

      expect(file).toEqual({
        categories: ["test"],
        path: "/project/src/utils/math/math.test.ts",
        captured: {
          root: "/project",
          area: "utils",
          restOfPath: "math",
          testFileName: "math",
        },
        isIgnored: false,
        isUnknown: false,
      });
      expect(isKnownFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });

    it("should assign unknown file description when no descriptor matches", () => {
      const file = matcher.describeFile("/project/src/misc/other.ts");

      expect(file).toEqual({
        categories: null,
        path: "/project/src/misc/other.ts",
        captured: null,
        isIgnored: false,
        isUnknown: true,
      });
      expect(isUnknownFileDescription(file)).toBe(true);
      expect(isFileDescription(file)).toBe(true);
    });
  });

  describe("files descriptor cache", () => {
    it("should not call micromatch multiple times for the same file", () => {
      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch multiple times for the same file if cache is disabled", () => {
      matcher = elements.getMatcher(
        {
          files: [{ pattern: "**/*.tsx", category: "react" }],
        },
        {
          cache: false,
        }
      );
      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after clearing the matcher cache, because the global cache is still populated", () => {
      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();

      matcher.clearCache();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data", () => {
      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = matcher.serializeCache();

      matcher.clearCache();

      matcher.setCacheFromSerialized(serializedCache);

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = elements.serializeCache();

      matcher.clearCache();

      elements.setCacheFromSerialized(serializedCache);

      matcher.describeFile("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });
  });

  describe("pattern matching with rootPath", () => {
    it("should match files inside rootPath with relative patterns", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/app",
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        files: [
          { pattern: "**/*.tsx", category: "react" },
          { pattern: "**/*.ts", category: "typescript" },
        ],
      });

      const file = matcherWithRoot.describeFile(
        "/monorepo/packages/app/src/components/Button.tsx"
      );

      expect(file).toEqual(
        expect.objectContaining({
          categories: ["react"],
          isUnknown: false,
        })
      );
    });

    it("should match files outside rootPath using right-to-left evaluation", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/app",
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        files: [{ pattern: "**/*.tsx", category: "react" }],
      });

      const file = matcherWithRoot.describeFile(
        "/monorepo/packages/shared/src/components/Button.tsx"
      );

      expect(file).toEqual(
        expect.objectContaining({
          categories: ["react"],
          isUnknown: false,
        })
      );
    });

    it("should assign multiple categories to files matching several patterns with rootPath", () => {
      const elementsWithRoot = new Elements({
        rootPath: "/monorepo/packages/api",
      });
      const matcherWithRoot = elementsWithRoot.getMatcher({
        files: [
          { pattern: "**/*.spec.ts", category: "spec" },
          { pattern: "**/services/**/*.ts", category: "service-file" },
        ],
      });

      const file = matcherWithRoot.describeFile(
        "/monorepo/packages/api/src/services/auth/auth.spec.ts"
      );

      expect(file).toEqual(
        expect.objectContaining({
          categories: ["spec", "service-file"],
          isUnknown: false,
        })
      );
    });
  });

  describe("isFileMatch", () => {
    // eslint-disable-next-line jest/prefer-ending-with-an-expect
    it.each([
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { isIgnored: true },
        expected: true,
      },
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { isIgnored: false },
        expected: false,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { isUnknown: true },
        expected: true,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { isUnknown: false },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "react" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "test" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: ["react", "spec"] },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: ["test", "spec"] },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/user.spec.ts",
        selector: { categories: "spec" },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/user.spec.ts",
        selector: { categories: "module-file" },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/user.spec.ts",
        selector: { categories: "react" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { path: "/project/src/components/Button.tsx" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { path: "/project/src/components/**" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { path: "/project/src/services/**" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "{{ file.categories.[0] }}" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "{{ file.categories.[0] }}", isIgnored: false },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [{ categories: "spec" }, { categories: "react" }],
        expected: true,
        expectedMatch: { categories: "react" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [{ categories: "spec" }, { categories: "test" }],
        expected: false,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: { captured: { testFileName: "math" } },
        expected: true,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: { captured: { testFileName: "other" } },
        expected: false,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: {
          captured: { testFileName: "{{ file.captured.testFileName }}" },
        },
        expected: true,
      },
    ])(
      "should return $expected when checking if $filePath matches the selector $selector",
      ({
        filePath,
        expected,
        selector,
        expectedMatch,
      }: {
        filePath: string;
        expected: boolean;
        selector: FileSelector;
        expectedMatch?: FileSingleSelector;
      }) => {
        const matchResult = matcher.isFileMatch(filePath, selector);

        expect(matchResult).toBe(expected);

        if (expected) {
          const selectorMatchingResult = matcher.getFileSelectorMatching(
            filePath,
            selector
          );

          const normalizedMatchingResult = selectorMatchingResult
            ? normalizeFileSelector(selectorMatchingResult)
            : null;

          const normalizedExpectedSelector = normalizeFileSelector(
            expectedMatch || (selector as FileSingleSelector)
          );

          // eslint-disable-next-line jest/no-conditional-expect
          expect(normalizedMatchingResult).toStrictEqual(
            normalizedExpectedSelector
          );
        }
      }
    );

    it("should throw an error when using an invalid selector", () => {
      const invalidSelector = { foo: "bar" } as unknown as FileSelector;

      expect(() =>
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          invalidSelector
        )
      ).toThrow();
    });
  });

  describe("getFileSelectorMatchingDescription", () => {
    it("should return the matching selector given a file description", () => {
      const description = matcher.describeFile(
        "/project/src/components/Button.tsx"
      );

      const result = matcher.getFileSelectorMatchingDescription(description, {
        categories: "react",
      });

      expect(result).toStrictEqual({ categories: "react" });
    });

    it("should return null when no selector matches the file description", () => {
      const description = matcher.describeFile(
        "/project/src/components/Button.tsx"
      );

      const result = matcher.getFileSelectorMatchingDescription(description, {
        categories: "test",
      });

      expect(result).toBeNull();
    });

    it("should match using the first matching selector in an array", () => {
      const description = matcher.describeFile(
        "/project/src/components/Button.tsx"
      );

      const result = matcher.getFileSelectorMatchingDescription(description, [
        { categories: "spec" },
        { categories: "react" },
      ]);

      expect(result).toStrictEqual({ categories: "react" });
    });

    it("should return null when given an unknown file description", () => {
      const description = matcher.describeFile("/project/src/misc/other.ts");

      const result = matcher.getFileSelectorMatchingDescription(
        description as FileDescription,
        { categories: "react" }
      );

      expect(result).toBeNull();
    });

    it("should match isIgnored on an ignored file description", () => {
      const description = matcher.describeFile(
        "/project/src/utils/__tests__/testUtil.ts"
      );

      const result = matcher.getFileSelectorMatchingDescription(description, {
        isIgnored: true,
      });

      expect(result).toStrictEqual({ isIgnored: true });
    });

    it("should throw an error when using an invalid selector", () => {
      const description = matcher.describeFile(
        "/project/src/components/Button.tsx"
      );

      expect(() =>
        matcher.getFileSelectorMatchingDescription(description, {
          foo: "bar",
        } as unknown as FileSelector)
      ).toThrow();
    });
  });

  describe("isFileMatch cache", () => {
    let isMatchSpy: jest.SpyInstance;

    beforeEach(() => {
      isMatchSpy = jest.spyOn(micromatch, "isMatch");
    });

    it("should not call micromatch isMatch again for same file and selector", () => {
      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(isMatchSpy).toHaveBeenCalled();

      isMatchSpy.mockClear();

      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(isMatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch isMatch again after clearing the cache in the elements instance", () => {
      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(isMatchSpy).toHaveBeenCalled();

      isMatchSpy.mockClear();

      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(isMatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(isMatchSpy).toHaveBeenCalled();
    });
  });
});
