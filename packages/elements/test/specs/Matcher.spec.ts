/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type {
  ElementsSelector,
  ElementSelectorData,
  DescribeDependencyOptions,
  DependencySelector,
  Matcher,
  BaseElementSelectorWithOptions,
} from "../../src/index";
import { Elements, normalizeElementsSelector } from "../../src/index";

describe("Matcher", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "isMatch");

    elements = new Elements();
    matcher = elements.getMatcher(
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

  describe("when matching elements", () => {
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
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { isIgnored: "false" },
        expected: false,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { isUnknown: false },
        expected: false,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { isUnknown: true },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { baseSource: "bar" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { baseSource: "" },
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
        selector: { type: ["foo", "{{ element.type }}"] },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { type: ["foo", "{{ foo.type }}"] },
          { type: ["foo", "{{ element.type }}"] },
        ],
        expected: true,
        expectedMatch: { type: ["foo", "{{ element.type }}"] },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "component",
        expected: true,
        expectedMatch: { type: "component" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: ["foo", "{{ element.type }}"],
        expected: true,
        expectedMatch: { type: "{{ element.type }}" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "{{ element.type }}",
        expected: true,
        expectedMatch: { type: "{{ element.type }}" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "{{ foo }}",

        expected: true,
        expectedMatch: { type: "{{ foo }}" },
        extraTemplateData: { foo: "component" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: ["{{ bar }}", "{{ foo }}"],

        expected: true,
        expectedMatch: { type: "{{ foo }}" },
        extraTemplateData: { foo: "component" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "{{ foo }}",
        expected: false,
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
        expectedMatch: { type: "${element.type}" },
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
        selector: [{ category: "foo" }, { category: "react" }],
        expected: true,
        expectedMatch: { category: "react" },
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
        selector: [
          { type: "component" },
          { type: "component", category: "react" },
        ],
        expected: true,
        expectedMatch: { type: "component" }, // NOTE: First match wins
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { path: "/project/src/components/Button.tsx" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { path: "/project/src/components/**/*" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { path: "/project/src/foo/**/*" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { elementPath: "/project/src/components/Button.tsx" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { elementPath: "/project/src/components/**/*" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { elementPath: "/project/src/foo/**/*" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: "Button.tsx" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: "Button.*" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: ["*.*"] },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: "Foo.*" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          type: "component",
          category: "react",
          origin: "local",
          isIgnored: false,
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          type: "component",
          category: "react",
          origin: "local",
          isIgnored: true,
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          type: "component",
          category: "react",
          origin: "local",
          internalPath: "foo",
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          type: "component",
          category: "react",
          origin: "local",
          internalPath: "**/Button.tsx",
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          type: "component",
          category: "react",
          origin: "local",
          internalPath: "Button.tsx",
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: "Button" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: "{{ element.captured.fileName }}" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: "{{ element.captured.foo }}" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: ["component", { fileName: "Button" }],
        expected: true,
        expectedMatch: {
          type: "component",
          captured: { fileName: "Button" },
        },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: ["foo", "Button"] } },
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
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { captured: { fileName: "" } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { captured: { foo: "bar" } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { captured: { foo: "" } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { captured: { foo: [""] } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { origin: "local" },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { origin: ["local", "foo"] },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { origin: ["var", "foo"] },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { internalPath: "foo.ts" },
        expected: true,
      },
    ])(
      "should return $expected when checking if $filePath matches the selector $selector",
      // @ts-expect-error: Testing some invalid cases too
      ({
        filePath,
        expected,
        selector,
        extraTemplateData,
        expectedMatch,
      }: {
        filePath: string;
        expected: boolean;
        selector: ElementsSelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: ElementSelectorData;
      }) => {
        const matchResult = extraTemplateData
          ? matcher.isMatch(filePath, selector, { extraTemplateData })
          : matcher.isMatch(filePath, selector);

        expect(matchResult).toBe(expected);

        if (expected) {
          const selectorMatchingResult = matcher.getSelectorMatching(
            filePath,
            selector,
            extraTemplateData ? { extraTemplateData } : undefined
          );

          // eslint-disable-next-line jest/no-conditional-expect
          expect(selectorMatchingResult).toStrictEqual(
            expectedMatch || selector
          );

          const description = matcher.describeElement(filePath);

          const selectorMatchingFromDescription =
            matcher.getSelectorMatchingDescription(
              description,
              selector,
              extraTemplateData ? { extraTemplateData } : undefined
            );

          // eslint-disable-next-line jest/no-conditional-expect
          expect(selectorMatchingFromDescription).toStrictEqual(
            expectedMatch || selector
          );
        }
      }
    );

    it("should match using legacy string selector", () => {
      const result = matcher.isMatch(
        "/project/src/components/Button.tsx",
        "component"
      );

      expect(result).toBe(true);
    });

    it("should match using legacy string selector with template", () => {
      const result = matcher.isMatch(
        "/project/src/components/Button.tsx",
        "{{ element.type }}"
      );

      expect(result).toBe(true);
    });

    it("should match using legacy string selector with legacy template", () => {
      const result = matcher.isMatch(
        "/project/src/components/Button.tsx",
        "${ element.type }"
      );

      expect(result).toBe(true);
    });

    it("should not match using legacy template with legacyTemplates disabled", () => {
      matcher = elements.getMatcher(
        [
          {
            type: "component",
            category: "react",
            pattern: "src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
        {
          includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
          ignorePaths: ["**/src/**/__tests__/**"],
          legacyTemplates: false,
        }
      );

      const result = matcher.isMatch(
        "/project/src/components/Button.tsx",
        "${ element.type }"
      );

      expect(result).toBe(false);

      const newTemplateResult = matcher.isMatch(
        "/project/src/components/Button.tsx",
        "{{ element.type }}"
      );

      expect(newTemplateResult).toBe(true);
    });

    it("should match using legacy string selectors", () => {
      const result = matcher.isMatch("/project/src/components/Button.tsx", [
        "component",
        "foo",
      ]);

      expect(result).toBe(true);
    });

    it("should match using legacy string selector with options", () => {
      const result = matcher.isMatch("/project/src/components/Button.tsx", [
        "component",
        { fileName: "Button" },
      ]);

      expect(result).toBe(true);
    });

    it("should match using legacy string selectors with options", () => {
      const result = matcher.isMatch("/project/src/components/Button.tsx", [
        ["component", { fileName: "Button" }],
        ["foo", { fileName: "Foo" }],
      ]);

      expect(result).toBe(true);
    });

    it("should throw an error when using invalid selector", () => {
      expect(() =>
        // @ts-expect-error: Testing invalid selector
        matcher.isMatch("/project/src/modules/user/foo.ts", { var: "baz" })
      ).toThrow();
    });

    it("should throw an error when using invalid selector in getSelectorMatchingDescription", () => {
      expect(() =>
        // @ts-expect-error: Testing invalid selector
        matcher.getSelectorMatchingDescription({}, { var: "baz" })
      ).toThrow();
    });

    it("should not call to micromatch after matching with same options", () => {
      const result = matcher.isMatch("/project/src/components/Button.tsx", {
        type: "component",
        category: "react",
        origin: "local",
      });

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isMatch("/project/src/components/Button.tsx", {
        type: "component",
        category: "react",
        origin: "local",
      });

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      matcher.isMatch("/project/src/components/Button.tsx", {
        type: "component",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.isMatch("/project/src/components/Button.tsx", {
        type: "component",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isMatch("/project/src/components/Button.tsx", {
        type: "component",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("when matching dependencies", () => {
    // eslint-disable-next-line jest/prefer-ending-with-an-expect
    it.each([
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { type: "component" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: "{{ from.type }}",
        },
        expected: true,
        expectedMatch: {
          from: { type: "{{ from.type }}" },
        },
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: "${ from.type }",
        },
        expected: true,
        expectedMatch: {
          from: { type: "${ from.type }" },
        },
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { type: "foo" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { path: "/project/src/components/Button.tsx" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { path: "foo" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { elementPath: "**/*" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { elementPath: "foo" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { isIgnored: false },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { isIgnored: true },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { origin: "foo" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: [{ origin: "local" }, "var"],
        },
        expected: true,
        expectedMatch: {
          to: { origin: "local" },
        },
      },
      // Category tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { category: "business-logic" },
        },
        expected: true,
      },
      // Type tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: "component",
        },
        expected: true,
        expectedMatch: {
          to: { type: "component" },
        },
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: ["foo"],
        },
        expected: false,
      },
      // Captured tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: ["component", { fileName: "Button" }],
        },
        expected: true,
        expectedMatch: {
          to: { type: "component", captured: { fileName: "Button" } },
        },
      },
      // Legacy options style
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: ["component", { fileName: "foo" }],
        },
        expected: false,
      },
      // Template tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { type: "{{ to.type }}" },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          from: { type: "{{ from.type }}" },
        },
        expected: true,
      },
      // Path tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          from: {
            type: "{{ from.type }}",
            captured: { root: "{{ from.captured.root }}" },
          },
          to: { path: "{{ to.path }}" },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { path: "**/Foo.tsx" },
        },
        expected: false,
      },
      // Element Path tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { elementPath: "**" },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { elementPath: "foo" },
        },
        expected: false,
      },
      // IsIgnored tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { isIgnored: false },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { isIgnored: true },
        },
        expected: false,
      },
      // isUnknown tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { isUnknown: false },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { isUnknown: true },
        },
        expected: false,
      },
      // InternalPath tests
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { type: "{{ to.type }}", internalPath: "**/Button.tsx" },
        },
        expected: true,
      },
      {
        dependency: {
          to: "/project/src/components/Button.tsx",
          from: "/project/src/utils/math/math.test.ts",
          source: "../components/Button.tsx",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        selector: {
          to: { type: "{{ to.type }}", internalPath: ["foo", "**/Button.tsx"] },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { source: "react", origin: ["external", "local"] },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { source: "foo" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { elementPath: "*" }, // Unknown element, so elementPath is not set
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { isUnknown: true },
        },
        expected: true,
      },
      // BaseSource tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { baseSource: "react", origin: ["external", "local"] },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { baseSource: "foo" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { relationship: "foo" },
        },
        expected: false,
      },
      // NodeKind tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { nodeKind: "ImportDeclaration" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { nodeKind: ["Import*"] },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { nodeKind: "{{ to.nodeKind }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { nodeKind: "{{ to.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
        },
        selector: {
          to: { nodeKind: ["Import*"] },
        },
        expected: false,
      },
      // Kind tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { kind: "t*" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { kind: "{{ to.kind }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { kind: "{{ to.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: 2,
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { kind: "t*" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: 2,
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { kind: "2" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { kind: "t*" },
        },
        expected: false,
      },
      // Specifier tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          to: { specifiers: "foo" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          to: { specifiers: ["var", "b*"] },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          to: { specifiers: "{{ lookup to.specifiers 0 }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: ["foo", "bar"],
        },
        selector: {
          to: { specifiers: "{{ to.specifiers.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { specifiers: "foo" },
        },
        expected: false,
      },
      // Relationship tests
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { relationship: "uncle" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { relationship: "{{ to.relationship }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { relationship: "{{ to.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { relationship: "nephew" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { relationship: "{{ from.relationship }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { relationship: "{{ from.foo }}" },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { relationship: "uncle" },
          from: { relationship: "nephew" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { relationship: "{{ to.relationship }}" },
          from: { relationship: "{{ from.relationship }}" },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          source: "../../../email/EmailService",
          kind: "value",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { relationship: "uncle" },
          from: { relationship: "foo" },
        },
        expected: false,
      },
    ])(
      "should return $expected when checking if dependency matches the selector $selector",
      // @ts-expect-error: Testing some invalid cases too
      ({
        dependency,
        expected,
        selector,
        extraTemplateData,
        expectedMatch,
      }: {
        dependency: DescribeDependencyOptions;
        expected: boolean;
        selector: DependencySelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: DependencySelector;
      }) => {
        const result = extraTemplateData
          ? matcher.isMatch(dependency, selector, { extraTemplateData })
          : matcher.isMatch(dependency, selector);

        if (result !== expected) {
          console.error(
            "Mismatch on:",
            JSON.stringify(
              {
                dependency,
                selector,
                extraTemplateData,
                expectedMatch,
                description: matcher.describeDependency(dependency),
              },
              null,
              2
            )
          );
        }

        expect(result).toBe(expected);

        if (expected) {
          const selectorMatchingResult = matcher.getSelectorMatching(
            dependency,
            selector,
            extraTemplateData ? { extraTemplateData } : undefined
          );

          const expectedSelectorMatching = expectedMatch || selector;
          const fromMatch = expectedSelectorMatching?.from || null;
          const toMatch = expectedSelectorMatching?.to || null;

          const expectedMatchResult = {
            from: fromMatch,
            to: toMatch,
            isMatch: true,
          };

          // eslint-disable-next-line jest/no-conditional-expect
          expect(selectorMatchingResult).toStrictEqual(expectedMatchResult);

          const description = matcher.describeDependency(dependency);
          try {
            const selectorMatchingFromDescription =
              matcher.getSelectorMatchingDescription(
                description,
                selector,
                extraTemplateData ? { extraTemplateData } : undefined
              );

            // eslint-disable-next-line jest/no-conditional-expect
            expect(selectorMatchingFromDescription).toStrictEqual(
              expectedMatchResult
            );
          } catch {
            // Some selectors are not valid intentionally to test results in such cases
          }
        }
      }
    );

    it("should match using legacy string selector", () => {
      const result = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/services/api/api.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: "component",
          to: "service",
        }
      );

      expect(result).toBe(true);
    });

    it("should match using legacy string selector with options", () => {
      const result = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: ["component", { fileName: "Button" }],
        }
      );

      expect(result).toBe(true);
    });

    it("should throw an error when using invalid dependency selector", () => {
      expect(() =>
        // @ts-expect-error: Testing invalid selector
        matcher.isMatch(
          {
            from: "/project/src/components/Button.tsx",
            to: "/project/src/utils/math/math.test.ts",
            source: "../utils/math/math.test.ts",
            kind: "value",
            nodeKind: "Import",
            specifiers: ["calculateSum", "calculateAvg"],
          },
          { var: "baz" }
        )
      ).toThrow();
    });

    it("should throw an error when using invalid dependency description in getSelectorMatchingDescription", () => {
      expect(() =>
        matcher.getSelectorMatchingDescription(
          // @ts-expect-error: Testing invalid description
          {},
          {
            from: { type: "component" },
            to: { var: "baz" },
          }
        )
      ).toThrow();
    });

    it("should throw an error when using invalid element selector", () => {
      expect(() =>
        // @ts-expect-error: Testing invalid selector
        matcher.isMatch(
          {
            from: "/project/src/components/Button.tsx",
            to: "/project/src/utils/math/math.test.ts",
            source: "../utils/math/math.test.ts",
            kind: "value",
            nodeKind: "Import",
            specifiers: ["calculateSum", "calculateAvg"],
          },
          { to: { var: "baz" } }
        )
      ).toThrow();
    });

    it("should not call to micromatch after matching with same options", () => {
      const result = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      const result = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call when using same selector", () => {
      const result = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
          to: { type: "component" }, // Same as from, it should not normalize again
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { type: "component" },
          to: { type: "component" },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("normalizeElementsSelector public method", () => {
    it.each([
      {
        selector: "component",
        expected: [{ type: "component" }],
      },
      {
        selector: [
          "component",
          { fileName: "Button" },
        ] as BaseElementSelectorWithOptions,
        expected: [{ type: "component", captured: { fileName: "Button" } }],
      },
      {
        selector: [
          "component",
          ["foo", { bar: "baz" }] as BaseElementSelectorWithOptions,
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
        selector: ElementsSelector;
        expected: ElementSelectorData[];
      }) => {
        const normalized = normalizeElementsSelector(selector);

        expect(normalized).toStrictEqual(expected);
      }
    );
  });
});
