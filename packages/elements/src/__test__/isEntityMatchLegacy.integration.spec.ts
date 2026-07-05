/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type {
  ElementSelector,
  Matcher,
  ElementDescription,
  BackwardCompatibleEntitySelector,
} from "../index";
import { normalizeEntitySelector, Elements } from "../index";

describe("isEntityMatch | Legacy Syntax | Integration", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "isMatch");

    elements = new Elements();
    matcher = elements.getMatcher(
      {
        elements: [
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
            capture: ["moduleName"],
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

  describe("when matching entities using element selectors", () => {
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
        selector: { isIgnored: "false" as unknown as boolean },
        expected: false,
      },
      // Test captured array with ignored element (captured: null)
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: {
          captured: [{ type: "test" }],
        },
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
      // Test captured array with unknown element (captured: null)
      {
        filePath: "/project/src/misc/other.ts",
        selector: {
          captured: [{ type: "foo" }],
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { types: "component" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "{{ element.type }}" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "{{ element.types.[0] }}" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { types: "{{ element.types.[0] }}" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { types: ["foo", "{{ element.types.[0] }}"] },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: [
            "foo",
            "{{ element.types.[0] }}",
            "{{ element.types.[0] }}",
            "",
          ],
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { types: ["foo", "{{ foo.type }}"] },
          { types: ["foo", "{{ element.types.[0] }}"] },
        ],
        expected: true,
        expectedMatch: { types: ["foo", "{{ element.types.[0] }}"] },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "component",
        expected: true,
        expectedMatch: { type: "component" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: ["foo", "{{ element.types.[0] }}"],
        expected: true,
        expectedMatch: { type: "{{ element.types.[0] }}" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "{{ element.types.[0] }}",
        expected: true,
        expectedMatch: { type: "{{ element.types.[0] }}" },
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
        selector: "${element.types.[0]}",
        expected: true,
        expectedMatch: { type: "${element.types.[0]}" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: "${element.category}",
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { types: "foo" },
        expected: false,
      },
      // Singular type selector: matches against first type only
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "component" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "foo" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "{{ element.type }}" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "{{ element.types.[0] }}" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "component", types: "component" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { type: "foo", types: "component" },
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
        selector: { types: "component", category: "react" },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { types: "component" },
          { types: "component", category: "react" },
        ],
        expected: true,
        expectedMatch: { types: "component" }, // NOTE: First match wins
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
        expectedMatch: { element: { fileInternalPath: "Button.tsx" } },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: "Button.*" },
        expected: true,
        expectedMatch: { element: { fileInternalPath: "Button.*" } },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: ["*.*"] },
        expected: true,
        expectedMatch: { element: { fileInternalPath: ["*.*"] } },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { internalPath: "Foo.*" },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: "component",
          category: "react",
          origin: "local",
          isIgnored: false,
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: "component",
          category: "react",
          origin: "local",
          isIgnored: true,
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: [],
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: [undefined],
        } as unknown as ElementSelector,
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: "component",
          category: "react",
          origin: "local",
          internalPath: "foo",
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: "component",
          category: "react",
          origin: "local",
          internalPath: "**/Button.tsx",
        },
        expected: true,
        expectedMatch: {
          element: {
            types: "component",
            category: "react",
            fileInternalPath: "**/Button.tsx",
          },
          module: { origin: "local" },
        },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          types: "component",
          category: "react",
          origin: "local",
          internalPath: "Button.tsx",
        },
        expected: true,
        expectedMatch: {
          element: {
            types: "component",
            category: "react",
            fileInternalPath: "Button.tsx",
          },
          module: { origin: "local" },
        },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: { fileName: "Button" },
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: {
            fileName: "{{ element.captured.fileName }}",
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: {
            fileName: "{{ element.captured.foo }}",
          },
        },
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
        selector: {
          captured: {
            fileName: ["foo", "Button"],
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: {
            fileName: "Button",
            foo: "bar",
          },
        },
        expected: false,
      },
      // Array of captured values (OR logic)
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: [{ fileName: "Button" }, { fileName: "Icon" }],
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: [{ fileName: "Icon" }, { fileName: "Button" }],
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: [{ fileName: "Icon" }, { fileName: "Card" }],
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: [{ fileName: "Button", foo: "bar" }, { fileName: "Icon" }],
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: [{ fileName: "Icon" }, { fileName: "Button" }],
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: [],
        },
        expected: false,
      },
      // Test with array captured when element has no captured values
      {
        filePath: "/project/src/utils/helpers/string.ts",
        selector: {
          captured: [{ type: "utility" }],
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: { fileName: "Foo" },
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          captured: { fileName: "" },
        },
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
        expectedMatch: { element: { fileInternalPath: "foo.ts" } },
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { parent: null },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { category: "business-logic" } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          parent: { elementPath: "{{ element.parents.0.elementPath }}" },
        },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { type: "foo" } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { type: null } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { elementPath: "foo" } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { elementPath: "**" } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { category: "foo" } },
        expected: false,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { parent: { category: "business-logic" } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { type: null } },
        expected: true,
      },
      // Parent types (plural) selector: matches against all parent types
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { parent: { types: null } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        selector: { parent: { types: null } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        selector: { parent: { types: "foo" } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        selector: { parent: { type: null, types: null } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          parent: {
            captured: {
              moduleName: "{{ element.parents.0.captured.moduleName }}",
            },
          },
        },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          parent: null,
        },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          parent: {
            captured: [
              { moduleName: "foo" },
              { moduleName: "{{ element.parents.0.captured.moduleName }}" },
            ],
          },
        },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          parent: {
            captured: [],
          },
        },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          parent: {
            captured: [{ moduleName: "foo" }, { moduleName: "bar" }],
          },
        },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          category: "business-logic",
          parent: {
            captured: {
              moduleName: "{{ element.parents.0.captured.moduleName }}",
            },
          },
        },
        expected: true,
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
        selector: BackwardCompatibleEntitySelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: BackwardCompatibleEntitySelector;
      }) => {
        const matchResult = extraTemplateData
          ? matcher.isEntityMatch(filePath, selector, { extraTemplateData })
          : matcher.isEntityMatch(filePath, selector);

        const convertedSelector = normalizeEntitySelector(selector);

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
                description: matcher.describeEntity(filePath),
              },
              null,
              2
            )
          );
        }

        expect(matchResult).toBe(expected);

        if (expected) {
          const selectorMatchingResult = matcher.getEntitySelectorMatching(
            filePath,
            selector,
            extraTemplateData ? { extraTemplateData } : undefined
          );

          const convertedMatchingResult = selectorMatchingResult
            ? normalizeEntitySelector(selectorMatchingResult)
            : null;

          const convertedExpectedSelector = normalizeEntitySelector(
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
      const invalidSelector = { foo: "var" } as unknown as ElementSelector;

      expect(() =>
        matcher.getElementSelectorMatchingDescription(
          matcher.describeElement("/project/src/modules/user/foo.ts"),
          invalidSelector
        )
      ).toThrow();
    });

    it("should throw an error when using invalid description", () => {
      const invalidDescription = {
        foo: "var",
      } as unknown as ElementDescription;

      expect(() =>
        matcher.getElementSelectorMatchingDescription(invalidDescription, {
          types: "foo",
        })
      ).toThrow();
    });

    it("should match using legacy string selector", () => {
      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        "component"
      );

      expect(result).toBe(true);
    });

    it("should match using legacy string selector with template", () => {
      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        "{{ element.types.[0] }}"
      );

      expect(result).toBe(true);
    });

    it("should match using legacy string selector with legacy template", () => {
      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        "${ element.types.[0] }"
      );

      expect(result).toBe(true);
    });

    it("should not match using legacy template with legacyTemplates disabled", () => {
      matcher = elements.getMatcher(
        {
          elements: [
            {
              type: "component",
              category: "react",
              pattern: "src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
        },
        {
          includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
          ignorePaths: ["**/src/**/__tests__/**"],
          legacyTemplates: false,
        }
      );

      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        "${ element.types.[0] }"
      );

      expect(result).toBe(false);

      const newTemplateResult = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        "{{ element.types.[0] }}"
      );

      expect(newTemplateResult).toBe(true);
    });

    it("should match using legacy string selectors", () => {
      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        ["component", "foo"]
      );

      expect(result).toBe(true);
    });

    it("should match using legacy string selector with options", () => {
      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        ["component", { fileName: "Button" }]
      );

      expect(result).toBe(true);
    });

    it("should match using legacy string selectors with options", () => {
      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        [
          ["component", { fileName: "Button" }],
          ["foo", { fileName: "Foo" }],
        ]
      );

      expect(result).toBe(true);
    });

    it("should throw an error when using invalid selector in isElementMatch", () => {
      const invalidSelector = {
        var: "baz",
      } as unknown as ElementSelector;

      expect(() =>
        matcher.isElementMatch(
          "/project/src/modules/user/foo.ts",
          invalidSelector
        )
      ).toThrow();
    });

    it("should throw an error when using invalid selector in getSelectorMatchingDescription", () => {
      expect(() =>
        // @ts-expect-error: Testing invalid selector
        matcher.getSelectorMatchingDescription({}, { var: "baz" })
      ).toThrow();
    });

    it("should not call to micromatch after matching with same options", () => {
      const result = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        {
          types: "component",
          category: "react",
          // origin: "local", TODO: Uncomment
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isElementMatch(
        "/project/src/components/Button.tsx",
        {
          types: "component",
          category: "react",
          // origin: "local", TODO: Uncomment
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      matcher.isElementMatch("/project/src/components/Button.tsx", {
        types: "component",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.isElementMatch("/project/src/components/Button.tsx", {
        types: "component",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isElementMatch("/project/src/components/Button.tsx", {
        types: "component",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });
});
