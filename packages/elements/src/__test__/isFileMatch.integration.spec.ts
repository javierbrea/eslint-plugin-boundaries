/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type { FileSingleSelector, FileSelector, Matcher } from "../index";
import { normalizeFileSelector, Elements } from "../index";

describe("isFileMatch | Integration", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "isMatch");

    elements = new Elements();
    matcher = elements.getMatcher(
      {
        files: [
          { pattern: "**/*.tsx", category: "react" },
          { pattern: "**/*.spec.ts", category: "spec" },
          { pattern: "**/modules/**/*.ts", category: "module-file" },
          {
            pattern: ["*/*.test.ts"],
            basePattern: "**/src/*",
            category: "test",
            capture: ["testFileName"],
            baseCapture: ["root", "area"],
          },
        ],
      },
      {
        includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
        ignorePaths: ["**/src/**/__tests__/**"],
      }
    );
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("when matching files using file selectors", () => {
    // eslint-disable-next-line jest/prefer-ending-with-an-expect
    it.each([
      // isIgnored tests
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
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { isIgnored: "false" as unknown as boolean },
        expected: false,
      },
      // Ignored file with captured selector returns false (no captured values)
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { captured: [{ testFileName: "testUtil" }] },
        expected: false,
      },
      // isUnknown tests
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
      // Unknown file with captured selector returns false (no captured values)
      {
        filePath: "/project/src/misc/other.ts",
        selector: { captured: [{ testFileName: "other" }] },
        expected: false,
      },
      // categories tests
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "react" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "spec" },
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
      // File with multiple categories
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
        filePath: "/project/src/modules/user/user.spec.ts",
        selector: { categories: ["spec", "module-file"] },
        expected: true,
      },
      // path tests
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
      // Template tests
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
      // extraTemplateData tests
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "{{ foo }}" },
        expected: true,
        extraTemplateData: { foo: "react" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [{ categories: "{{ bar }}" }, { categories: "{{ foo }}" }],
        expected: true,
        expectedMatch: { categories: "{{ foo }}" },
        extraTemplateData: { foo: "react" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "{{ foo }}" },
        expected: false,
      },
      // Array selectors (OR logic)
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
      // Combined selector properties
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "react", isIgnored: false },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { categories: "react", isIgnored: true },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          categories: "react",
          path: "/project/src/components/Button.tsx",
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          categories: "react",
          path: "/project/src/services/**",
        },
        expected: false,
      },
      // Captured values
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
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: {
          captured: { testFileName: "{{ file.captured.unknown }}" },
        },
        expected: false,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: { captured: { testFileName: ["math", "other"] } },
        expected: true,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: { captured: { testFileName: "math", root: "/project" } },
        expected: true,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: { captured: { testFileName: "math", root: "/other" } },
        expected: false,
      },
      // Captured selector with extra key that does not exist in captured values
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: { captured: { testFileName: "math", unknownKey: "value" } },
        expected: false,
      },
      // Captured array (OR logic)
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: {
          captured: [{ testFileName: "math" }, { testFileName: "other" }],
        },
        expected: true,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: {
          captured: [{ testFileName: "other" }, { testFileName: "math" }],
        },
        expected: true,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: {
          captured: [{ testFileName: "foo" }, { testFileName: "bar" }],
        },
        expected: false,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: { captured: [] },
        expected: false,
      },
      // File without captured values
      {
        filePath: "/project/src/misc/other.ts",
        selector: { captured: { testFileName: "other" } },
        expected: false,
      },
      // Combined: categories and captured
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: {
          categories: "test",
          captured: { testFileName: "math" },
        },
        expected: true,
      },
      {
        filePath: "/project/src/utils/math/math.test.ts",
        selector: {
          categories: "spec",
          captured: { testFileName: "math" },
        },
        expected: false,
      },
    ])(
      "should return $expected when checking if $filePath matches the selector $selector",
      // @ts-expect-error: There is a problem with captured values because it is inferring undefined values in some objects, probably because we use different captured values in different test cases
      ({
        filePath,
        expected,
        selector,
        extraTemplateData,
        expectedMatch,
      }: {
        filePath: string;
        expected: boolean;
        selector: FileSelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: FileSingleSelector;
      }) => {
        const matchResult = extraTemplateData
          ? matcher.isFileMatch(filePath, selector, { extraTemplateData })
          : matcher.isFileMatch(filePath, selector);

        const convertedSelector = normalizeFileSelector(selector);

        if (matchResult !== expected) {
          console.error(
            "Mismatch on:",
            JSON.stringify(
              {
                filePath,
                selector,
                convertedSelector,
                extraTemplateData,
                expectedMatch,
                description: matcher.describeFile(filePath),
              },
              null,
              2
            )
          );
        }

        expect(matchResult).toBe(expected);

        if (expected) {
          const selectorMatchingResult = matcher.getFileSelectorMatching(
            filePath,
            selector,
            extraTemplateData ? { extraTemplateData } : undefined
          );

          const convertedMatchingResult = selectorMatchingResult
            ? normalizeFileSelector(selectorMatchingResult)
            : null;

          const convertedExpectedSelector = normalizeFileSelector(
            expectedMatch || selector
          );

          // eslint-disable-next-line jest/no-conditional-expect
          expect(convertedMatchingResult).toStrictEqual(
            convertedExpectedSelector
          );
        }
      }
    );

    it("should throw an error when using invalid selector", () => {
      const invalidSelector = { foo: "var" } as unknown as FileSelector;

      expect(() =>
        matcher.getFileSelectorMatchingDescription(
          matcher.describeFile("/project/src/components/Button.tsx"),
          invalidSelector
        )
      ).toThrow();
    });

    it("should match using file selector", () => {
      const result = matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(result).toBe(true);
    });

    it("should match using file selector with template", () => {
      const result = matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "{{ file.categories.[0] }}",
      });

      expect(result).toBe(true);
    });

    it("should match using file selectors array", () => {
      const result = matcher.isFileMatch("/project/src/components/Button.tsx", [
        { categories: "test" },
        { categories: "react" },
      ]);

      expect(result).toBe(true);
    });

    it("should match using file selector with captured", () => {
      const result = matcher.isFileMatch(
        "/project/src/utils/math/math.test.ts",
        { captured: { testFileName: "math" } }
      );

      expect(result).toBe(true);
    });

    it("should throw an error when using invalid selector in isFileMatch", () => {
      const invalidSelector = { foo: "var" } as unknown as FileSelector;

      expect(() =>
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          invalidSelector
        )
      ).toThrow();
    });

    it("should not call to micromatch after matching with same options", () => {
      const result = matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isFileMatch(
        "/project/src/components/Button.tsx",
        { categories: "react" }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isFileMatch("/project/src/components/Button.tsx", {
        categories: "react",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("categories array query", () => {
    it("anyOf: matches when at least one category is in the list", () => {
      expect(
        matcher.isFileMatch("/project/src/modules/user/user.spec.ts", {
          categories: { anyOf: ["spec", "unknown"] },
        })
      ).toBe(true);
    });

    it("anyOf: does not match when no category is in the list", () => {
      expect(
        matcher.isFileMatch("/project/src/modules/user/user.spec.ts", {
          categories: { anyOf: ["react", "test"] },
        })
      ).toBe(false);
    });

    it("allOf: matches when all required categories are present", () => {
      expect(
        matcher.isFileMatch("/project/src/modules/user/user.spec.ts", {
          categories: { allOf: ["spec", "module-file"] },
        })
      ).toBe(true);
    });

    it("allOf: does not match when a required category is missing", () => {
      expect(
        matcher.isFileMatch("/project/src/modules/user/user.spec.ts", {
          categories: { allOf: ["spec", "react"] },
        })
      ).toBe(false);
    });

    it("noneOf: matches when none of the forbidden categories are present", () => {
      expect(
        matcher.isFileMatch("/project/src/components/Button.tsx", {
          categories: { noneOf: ["spec", "module-file"] },
        })
      ).toBe(true);
    });

    it("noneOf: does not match when a forbidden category is present", () => {
      expect(
        matcher.isFileMatch("/project/src/components/Button.tsx", {
          categories: { noneOf: ["react"] },
        })
      ).toBe(false);
    });

    it("hasLength: matches when category count equals hasLength", () => {
      expect(
        matcher.isFileMatch("/project/src/components/Button.tsx", {
          categories: { hasLength: 1 },
        })
      ).toBe(true);
    });

    it("hasLength: does not match when category count differs", () => {
      expect(
        matcher.isFileMatch("/project/src/components/Button.tsx", {
          categories: { hasLength: 3 },
        })
      ).toBe(false);
    });

    it("atIndex: matches the category at index 0", () => {
      expect(
        matcher.isFileMatch("/project/src/components/Button.tsx", {
          categories: { atIndex: { index: 0, matches: "react" } },
        })
      ).toBe(true);
    });

    it("atIndex: matches the last category using index -1", () => {
      // user.spec.ts categories = ["spec", "module-file"] — last is "module-file"
      expect(
        matcher.isFileMatch("/project/src/modules/user/user.spec.ts", {
          categories: { atIndex: { index: -1, matches: "module-file" } },
        })
      ).toBe(true);
    });

    it("equalsTo: matches exact ordered categories", () => {
      expect(
        matcher.isFileMatch("/project/src/components/Button.tsx", {
          categories: { equalsTo: ["react"] },
        })
      ).toBe(true);
    });

    it("equalsTo: does not match when order is wrong", () => {
      // user.spec.ts categories = ["spec", "module-file"] — reversed order must fail
      expect(
        matcher.isFileMatch("/project/src/modules/user/user.spec.ts", {
          categories: { equalsTo: ["module-file", "spec"] },
        })
      ).toBe(false);
    });
  });

  describe("expand items in file.categories", () => {
    it("anyOf expand: matches when file shares a category with the from file", () => {
      // Button.tsx categories = ["react"]
      // from file also has category "react"
      expect(
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          { categories: { anyOf: [{ expand: "{{ from.file.categories }}" }] } },
          {
            extraTemplateData: {
              from: { file: { categories: ["react"] } },
            },
          }
        )
      ).toBe(true);
    });

    it("anyOf expand: does not match when file shares no category with the from file", () => {
      // Button.tsx categories = ["react"]
      // from file has category "spec" only
      expect(
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          { categories: { anyOf: [{ expand: "{{ from.file.categories }}" }] } },
          {
            extraTemplateData: {
              from: { file: { categories: ["spec"] } },
            },
          }
        )
      ).toBe(false);
    });

    it("noneOf expand: matches when file shares no category with the from file", () => {
      // Button.tsx categories = ["react"]
      // from file has category "spec" → no overlap
      expect(
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          {
            categories: { noneOf: [{ expand: "{{ from.file.categories }}" }] },
          },
          {
            extraTemplateData: {
              from: { file: { categories: ["spec"] } },
            },
          }
        )
      ).toBe(true);
    });

    it("noneOf expand: does not match when file shares a category with the from file", () => {
      // Button.tsx categories = ["react"]
      // from file also has category "react"
      expect(
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          {
            categories: { noneOf: [{ expand: "{{ from.file.categories }}" }] },
          },
          {
            extraTemplateData: {
              from: { file: { categories: ["react"] } },
            },
          }
        )
      ).toBe(false);
    });

    it("noneOf expand: always passes when expand resolves to null", () => {
      // from.file.categories is null → empty noneOf → always passes
      expect(
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          {
            categories: { noneOf: [{ expand: "{{ from.file.categories }}" }] },
          },
          {
            extraTemplateData: {
              from: { file: { categories: null } },
            },
          }
        )
      ).toBe(true);
    });

    it("mixed noneOf: excludes both static and dynamic categories", () => {
      // Button.tsx categories = ["react"]
      // noneOf: ["spec", { expand: "{{ from.file.categories }}" }]
      // from has categories ["module-file"] → noneOf = ["spec", "module-file"]
      // "react" is in neither → passes
      expect(
        matcher.isFileMatch(
          "/project/src/components/Button.tsx",
          {
            categories: {
              noneOf: ["spec", { expand: "{{ from.file.categories }}" }],
            },
          },
          {
            extraTemplateData: {
              from: { file: { categories: ["module-file"] } },
            },
          }
        )
      ).toBe(true);
    });
  });
});
