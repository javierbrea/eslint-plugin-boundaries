/* eslint-disable jest/no-conditional-in-test */
// TODO: Remove this tests file. It is checking only deprecated methods

import micromatch from "micromatch";

import type {
  ElementsSelector,
  ElementSelectorData,
  DescribeDependencyOptions,
  DependencySelector,
  Matcher,
} from "../../src/index";
import { Elements, normalizeElementsSelector } from "../../src/index";

describe("Selectors", () => {
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

  describe("isElementMatch", () => {
    // eslint-disable-next-line jest/prefer-ending-with-an-expect
    it.each([
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { isIgnored: true },
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
        selector: { type: "component", category: "react", origin: "local" },
        expected: true,
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
        const element = matcher.describeElement(filePath);

        const result = extraTemplateData
          ? elements.isElementMatch(element, selector, { extraTemplateData })
          : elements.isElementMatch(element, selector);

        expect(result).toBe(expected);

        if (expected) {
          const selectorMatchingResult = elements.getElementSelectorMatching(
            element,
            selector,
            extraTemplateData ? { extraTemplateData } : undefined
          );

          // eslint-disable-next-line jest/no-conditional-expect
          expect(selectorMatchingResult).toStrictEqual(
            expectedMatch || selector
          );
        }
      }
    );

    it("should throw an error when using invalid selector", () => {
      const element = matcher.describeElement(
        "/project/src/modules/user/foo.ts"
      );

      // @ts-expect-error: Testing invalid selector
      expect(() => elements.isElementMatch(element, { var: "baz" })).toThrow();
    });

    // TODO: Remove this test when removing deprecated methods
    it("should return false when checking properties that do no exist on description because it is invalid", () => {
      const result = elements.isElementMatch(
        {
          // @ts-expect-error: Testing invalid selector
          foo: "bar",
        },
        { isIgnored: true }
      );

      expect(result).toBe(false);
    });

    // TODO: Remove this test when removing deprecated methods
    it("should return false when checking properties with wrong type in description", () => {
      const result = elements.isElementMatch(
        {
          // @ts-expect-error: Testing invalid selector
          isIgnored: "not-boolean",
        },
        { isIgnored: true }
      );

      expect(result).toBe(false);
    });

    it("should not call to micromatch after matching with same options", () => {
      const element = matcher.describeElement(
        "/project/src/components/Button.tsx"
      );

      const result = elements.isElementMatch(element, {
        type: "component",
        category: "react",
        origin: "local",
      });

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = elements.isElementMatch(element, {
        type: "component",
        category: "react",
        origin: "local",
      });

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      const element = matcher.describeElement(
        "/project/src/components/Button.tsx"
      );

      elements.isElementMatch(element, {
        type: "component",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      elements.isElementMatch(element, {
        type: "component",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      elements.isElementMatch(element, {
        type: "component",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("isDependencyMatch", () => {
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
        const element = matcher.describeDependency(dependency);

        const result = extraTemplateData
          ? elements.isDependencyMatch(element, selector, { extraTemplateData })
          : elements.isDependencyMatch(element, selector);

        expect(result).toBe(expected);

        if (expected) {
          const selectorMatchingResult =
            elements.getDependencySelectorsMatching(
              element,
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
        }
      }
    );

    it("should throw an error when using invalid dependency selector", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/utils/math/math.test.ts",
        source: "../utils/math/math.test.ts",
        kind: "value",
        nodeKind: "Import",
        specifiers: ["calculateSum", "calculateAvg"],
      });

      expect(() =>
        // @ts-expect-error: Testing invalid selector
        elements.isDependencyMatch(dependency, { var: "baz" })
      ).toThrow();
    });

    it("should throw an error when using invalid element selector", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/utils/math/math.test.ts",
        source: "../utils/math/math.test.ts",
        kind: "value",
        nodeKind: "Import",
        specifiers: ["calculateSum", "calculateAvg"],
      });

      expect(() =>
        // @ts-expect-error: Testing invalid selector
        elements.isDependencyMatch(dependency, { to: { var: "baz" } })
      ).toThrow();
    });

    it("should not call to micromatch after matching with same options", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/utils/math/math.test.ts",
        source: "../utils/math/math.test.ts",
        kind: "value",
        nodeKind: "Import",
        specifiers: ["calculateSum", "calculateAvg"],
      });

      const result = elements.isDependencyMatch(dependency, {
        from: { type: "component" },
      });

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = elements.isDependencyMatch(dependency, {
        from: { type: "component" },
      });

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/utils/math/math.test.ts",
        source: "../utils/math/math.test.ts",
        kind: "value",
        nodeKind: "Import",
        specifiers: ["calculateSum", "calculateAvg"],
      });

      const result = elements.isDependencyMatch(dependency, {
        from: { type: "component" },
      });

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = elements.isDependencyMatch(dependency, {
        from: { type: "component" },
      });

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      elements.isDependencyMatch(dependency, {
        from: { type: "component" },
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("normalizeElementsSelector", () => {
    it.each([
      {
        selector: "component",
        expected: [{ type: "component" }],
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
