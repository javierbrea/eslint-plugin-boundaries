import type { Matcher } from "./index";
import { Elements } from "./index";

describe("Elements files API", () => {
  let matcher: Matcher;
  let elements: Elements;

  beforeEach(() => {
    elements = new Elements({
      includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      ignorePaths: ["**/__tests__/**"],
    });

    matcher = elements.getMatcher({
      elementDescriptors: [
        {
          type: "component",
          pattern: "src/components/*.tsx",
          mode: "file",
        },
      ],
      fileDescriptors: [
        {
          category: ["ui", "presentation"],
          pattern: "src/components/*.tsx",
        },
        {
          category: "misc",
          pattern: "src/misc/*.ts",
        },
      ],
    });
  });

  afterEach(() => {
    elements.clearCache();
  });

  it("should describe files using the new matcher API", () => {
    const file = matcher.describeFile("/project/src/components/Button.tsx");

    expect(file).toEqual(
      expect.objectContaining({
        category: ["ui", "presentation"],
        origin: "local",
        isIgnored: false,
        isUnknown: false,
      })
    );
    expect(file.element).toEqual(
      expect.objectContaining({
        type: "component",
      })
    );
  });

  it("should match files against file selectors", () => {
    expect(
      matcher.isFileMatch("/project/src/components/Button.tsx", {
        category: "ui",
        element: { type: "component" },
      })
    ).toBe(true);

    expect(
      matcher.isFileMatch("/project/src/components/Button.tsx", {
        category: "misc",
      })
    ).toBe(false);
  });

  it("should get the matching file selector", () => {
    expect(
      matcher.getFileSelectorMatching("/project/src/components/Button.tsx", [
        { category: "misc" },
        { category: "presentation", element: { type: "component" } },
      ])
    ).toEqual({
      category: "presentation",
      element: { type: "component" },
    });
  });

  it("should describe elements when only element descriptors are configured", () => {
    const legacyMatcher = elements.getMatcher({
      elementDescriptors: [
        {
          type: "component",
          pattern: "src/components/*.tsx",
          mode: "file",
        },
      ],
    });

    expect(
      legacyMatcher.describeElement("/project/src/components/Button.tsx")
    ).toEqual(
      expect.objectContaining({
        type: "component",
      })
    );
  });

  it("should throw when file APIs are used without file descriptors", () => {
    const legacyMatcher = elements.getMatcher({
      elementDescriptors: [
        {
          type: "component",
          pattern: "src/components/*.tsx",
          mode: "file",
        },
      ],
    });

    expect(() =>
      legacyMatcher.describeFile("/project/src/components/Button.tsx")
    ).toThrow(
      "Files descriptor is not configured. Please provide fileDescriptors when creating the matcher."
    );

    expect(() =>
      legacyMatcher.isFileMatch("/project/src/components/Button.tsx", {
        category: "ui",
      })
    ).toThrow(
      "Files matcher is not configured. Please provide fileDescriptors when creating the matcher."
    );
  });
});
