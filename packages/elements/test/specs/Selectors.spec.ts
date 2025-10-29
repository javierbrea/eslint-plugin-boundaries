// import micromatch from "micromatch";

import type { Descriptors, ElementSelector } from "../../src/index";
import { Elements } from "../../src/index";

describe("Selectors", () => {
  let descriptors: Descriptors;
  let elements: Elements;
  // let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // micromatchSpy = jest.spyOn(micromatch, "capture");

    elements = new Elements();
    descriptors = elements.getDescriptors(
      [
        {
          type: "component",
          category: "react",
          pattern: "src/components/*.tsx",
          mode: "file",
          capture: ["fileName"],
        },
        {
          type: "test",
          category: "business-logic",
          pattern: ["*/*.test.ts", "*/*.spec.ts"],
          basePattern: "**/src/*",
          mode: "file",
          capture: ["elementName", "testFileName"],
          baseCapture: ["root", "businessLogicArea"],
        },
        {
          category: "business-logic",
          pattern: ["modules/*"],
        },
        {
          type: "foo",
          pattern: ["foo/*"],
        },
        {
          type: "service",
          pattern: ["**/src/services/*/*.ts"],
          mode: "full",
          capture: ["baseFolder", "serviceName", "serviceFileName"],
        },
        { type: "utility", pattern: "src/utils/**/*.ts", mode: "file" },
      ],
      {
        includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
        ignorePaths: ["**/src/**/__tests__/**"],
      }
    );
  });

  afterEach(() => {
    elements.clearCache();
  });

  // TODO: Rename to "getElementDescription"/"getDependencyDescription"/"getDependencyElementDescription"?
  describe("isElementMatch", () => {
    it.each([
      // TODO: Add isIgnored, isUnknown properties to all descriptions. Expose in selectors too?
      {
        filePath: "/project/src/misc/other.ts",
        selector: {}, // TODO: Should empty selector match everything expecting ignored files? No, it shouldn't.
        expected: false,
      },
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: {},
        expected: false,
      },
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { isIgnored: "true" }, // TODO: Should this match?
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { baseSource: "bar" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "component" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "{{ element.type }}" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        // TODO: Support micromatch patterns in type and category selectors too. Fix types
        selector: { type: ["foo", "{{ element.type }}"] },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "component",
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: ["foo", "{{ element.type }}"],
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "{{ element.type }}",
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "{{ foo }}",
        expected: true,
        extraTemplateData: { foo: "component" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "{{ element.category }}",
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "${element.type}",
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "${element.category}",
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "foo" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { category: "react" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { category: "foo" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "component", category: "react" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: "Button" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: "Button", foo: "bar" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: "Foo" } },
        expected: false,
      },
    ])(
      "should return $expected when checking if $filePath matches the selector $selector",
      // @ts-expect-error: Testing some invalid cases too
      ({
        filePath,
        expected,
        selector,
        extraTemplateData,
      }: {
        filePath: string;
        expected: boolean;

        selector: ElementSelector;
        extraTemplateData?: Record<string, unknown>;
      }) => {
        const element = descriptors.describeElement(filePath);

        // TODO: Add isElementMatch methods to Descriptors directly? This is the best option for now though.
        // eslint-disable-next-line jest/no-conditional-in-test
        const result = extraTemplateData
          ? elements.isElementMatch(element, selector, { extraTemplateData })
          : elements.isElementMatch(element, selector);

        expect(result).toBe(expected);
      }
    );
  });

  // TODO: Test invalid selector
  // TODO: Test getSelectorMatching
  // TODO: Test isDependencyMatch
  // TODO: Test getDependencySelectorsMatching
  // TODO: Test normalizeElementsSelector
  // TODO: Test cache clearing
});
