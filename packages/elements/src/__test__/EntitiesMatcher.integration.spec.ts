/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type {
  ElementSelector,
  EntitySelector,
  EntitySingleSelector,
  DependencyDescriptorOptions,
  DependencySingleSelector,
  Matcher,
  ElementDescription,
  ElementSelectorNormalized,
} from "../index";
import {
  normalizeDependencySelector,
  normalizeEntitySelector,
  Elements,
  normalizeElementSelector,
} from "../index";

describe("Entities Matcher | Integration", () => {
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
            // v7 folder-based element: all files under src/components/ are "component" elements
            type: "component",
            pattern: "src/components",
          },
          {
            type: "module",
            pattern: ["modules/*"],
            capture: ["moduleName"],
          },
          {
            type: "foo",
            pattern: ["foo/*"],
          },
          {
            // partialMatch: false replaces deprecated mode: "full"
            type: "service",
            pattern: ["**/src/services/*"],
            partialMatch: false,
            capture: ["baseFolder", "serviceName"],
          },
          { type: "utility", pattern: "src/utils" },
        ],
        files: [
          { pattern: "**/*.tsx", category: "react" },
          { pattern: "**/*.test.ts", category: "test" },
          { pattern: "**/*.spec.ts", category: "test" },
          { pattern: "**/modules/**", category: "business-logic" },
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
        selector: { element: { isIgnored: true } },
        expected: true,
      },
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: { element: { isIgnored: false } },
        expected: false,
      },
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: {
          element: { isIgnored: "false" as unknown as boolean },
        },
        expected: false,
      },
      // Test captured array with ignored element (captured: null)
      {
        filePath: "/project/src/utils/__tests__/testUtil.ts",
        selector: {
          element: { captured: [{ type: "test" }] },
        },
        expected: false,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { element: { isUnknown: false } },
        expected: false,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { element: { isUnknown: true } },
        expected: true,
      },
      // Test captured array with unknown element (captured: null)
      {
        filePath: "/project/src/misc/other.ts",
        selector: {
          element: { captured: [{ type: "foo" }] },
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { types: "component" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "{{ element.type }}" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "{{ element.types.[0] }}" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { types: "{{ element.types.[0] }}" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { types: ["foo", "{{ element.types.[0] }}"] } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: {
            types: [
              "foo",
              "{{ element.types.[0] }}",
              "{{ element.types.[0] }}",
              "",
            ],
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { element: { types: ["foo", "{{ foo.type }}"] } },
          { element: { types: ["foo", "{{ element.types.[0] }}"] } },
        ],
        expected: true,
        expectedMatch: {
          element: { types: ["foo", "{{ element.types.[0] }}"] },
        },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "component" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { element: { type: "foo" } },
          { element: { type: "{{ element.types.[0] }}" } },
        ],
        expected: true,
        expectedMatch: { element: { type: "{{ element.types.[0] }}" } },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "{{ element.types.[0] }}" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "{{ foo }}" } },

        expected: true,
        expectedMatch: { element: { type: "{{ foo }}" } },
        extraTemplateData: { foo: "component" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { element: { type: "{{ bar }}" } },
          { element: { type: "{{ foo }}" } },
        ],

        expected: true,
        expectedMatch: { element: { type: "{{ foo }}" } },
        extraTemplateData: { foo: "component" },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "{{ foo }}" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        // element.category is deprecated — resolves to undefined, so the template produces no match
        selector: { element: { type: "{{ element.category }}" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { types: "foo" } },
        expected: false,
      },
      // Singular type selector: matches against first type only
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "component" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "foo" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "{{ element.type }}" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "{{ element.types.[0] }}" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "component", types: "component" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { type: "foo", types: "component" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { file: { categories: "react" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { file: { categories: "foo" } },
          { file: { categories: "react" } },
        ],
        expected: true,
        expectedMatch: { file: { categories: "react" } },
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { file: { categories: "foo" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: "component" },
          file: { categories: "react" },
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: [
          { element: { types: "component" } },
          { element: { types: "component" }, file: { categories: "react" } },
        ],
        expected: true,
        expectedMatch: { element: { types: "component" } }, // NOTE: First match wins
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { file: { path: "/project/src/components/Button.tsx" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { file: { path: "/project/src/components/**/*" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { file: { path: "/project/src/foo/**/*" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        // In v7 folder mode, element.path is the folder, not the file path
        selector: { element: { path: "/project/src/components" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { path: "/project/**" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { path: "/project/src/foo/**/*" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { fileInternalPath: "Button.tsx" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { fileInternalPath: "Button.*" } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { fileInternalPath: ["*.*"] } },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: { element: { fileInternalPath: "Foo.*" } },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: "component", isIgnored: false },
          file: { categories: "react" },
          module: { origin: "local" },
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: "component", isIgnored: true },
          file: { categories: "react" },
          module: { origin: "local" },
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: [] },
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: [undefined] },
        } as unknown as EntitySingleSelector,
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: "component", fileInternalPath: "foo" },
          file: { categories: "react" },
          module: { origin: "local" },
        },
        expected: false,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: "component", fileInternalPath: "**/Button.tsx" },
          file: { categories: "react" },
          module: { origin: "local" },
        },
        expected: true,
      },
      {
        filePath: "/project/src/components/Button.tsx",
        selector: {
          element: { types: "component", fileInternalPath: "Button.tsx" },
          file: { categories: "react" },
          module: { origin: "local" },
        },
        expected: true,
      },
      // Captured value tests — uses module element which naturally captures moduleName
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: { captured: { moduleName: "user" } },
        },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: {
              moduleName: "{{ element.captured.moduleName }}",
            },
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: {
              moduleName: "{{ element.captured.foo }}",
            },
          },
        },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: { type: "module", captured: { moduleName: "user" } },
        },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: {
              moduleName: ["foo", "user"],
            },
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: {
              moduleName: "user",
              extraKey: "bar",
            },
          },
        },
        expected: false,
      },
      // Array of captured values (OR logic)
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: [{ moduleName: "user" }, { moduleName: "admin" }],
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: [{ moduleName: "admin" }, { moduleName: "user" }],
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: [{ moduleName: "admin" }, { moduleName: "payment" }],
          },
        },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: [
              { moduleName: "user", extraKey: "bar" },
              { moduleName: "admin" },
            ],
          },
        },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: {
            captured: [{ moduleName: "admin" }, { moduleName: "user" }],
          },
        },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: { captured: [] },
        },
        expected: false,
      },
      // Test with array captured when element has no captured values
      {
        filePath: "/project/src/utils/helpers/string.ts",
        selector: {
          element: { captured: [{ type: "utility" }] },
        },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: { captured: { moduleName: "admin" } },
        },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: {
          element: { captured: { moduleName: "" } },
        },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { element: { captured: { moduleName: [""] } } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { element: { captured: { foo: "bar" } } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { element: { captured: { foo: "" } } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { element: { captured: { foo: [""] } } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { module: { origin: "local" } },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { module: { origin: ["local", "foo"] } },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { module: { origin: ["var", "foo"] } },
        expected: false,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { element: { fileInternalPath: "foo.ts" } },
        expected: true,
      },
      {
        filePath: "/project/src/modules/user/foo.ts",
        selector: { element: { parent: null } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { element: { parent: { type: "module" } } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          element: { parent: { path: "{{ element.parents.0.path }}" } },
        },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { element: { parent: { type: "foo" } } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        // In v7, type: null means "type IS null" — parent has type "module" so this is false
        selector: { element: { parent: { type: null } } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { element: { parent: { path: "foo" } } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { element: { parent: { path: "**" } } },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: { element: { parent: { type: "foo" } } },
        expected: false,
      },
      {
        filePath: "/project/src/misc/other.ts",
        selector: { element: { parent: { type: "module" } } },
        expected: false,
      },
      // Parent types (plural) selector
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        // types: null means "types IS null" — parent has type "module" so this is false
        selector: { element: { parent: { types: null } } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        selector: { element: { parent: { types: null } } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        selector: { element: { parent: { types: "foo" } } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        selector: { element: { parent: { type: null, types: null } } },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          element: {
            parent: {
              captured: {
                moduleName: "{{ element.parents.0.captured.moduleName }}",
              },
            },
          },
        },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          element: { parent: null },
        },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          element: {
            parent: {
              captured: [
                { moduleName: "foo" },
                { moduleName: "{{ element.parents.0.captured.moduleName }}" },
              ],
            },
          },
        },
        expected: true,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          element: {
            parent: {
              captured: [],
            },
          },
        },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          element: {
            parent: {
              captured: [{ moduleName: "foo" }, { moduleName: "bar" }],
            },
          },
        },
        expected: false,
      },
      {
        filePath:
          "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        selector: {
          file: { categories: "business-logic" },
          element: {
            parent: {
              captured: {
                moduleName: "{{ element.parents.0.captured.moduleName }}",
              },
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
        selector: EntitySelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: EntitySelector;
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

    it("should match using entity selector", () => {
      const result = matcher.isEntityMatch(
        "/project/src/components/Button.tsx",
        { element: { type: "component" } }
      );

      expect(result).toBe(true);
    });

    it("should match using entity selector with template", () => {
      const result = matcher.isEntityMatch(
        "/project/src/components/Button.tsx",
        { element: { type: "{{ element.types.[0] }}" } }
      );

      expect(result).toBe(true);
    });

    it("should match using entity selectors", () => {
      const result = matcher.isEntityMatch(
        "/project/src/components/Button.tsx",
        [{ element: { type: "component" } }, { element: { type: "foo" } }]
      );

      expect(result).toBe(true);
    });

    it("should match using entity selector with captured", () => {
      const result = matcher.isEntityMatch("/project/src/modules/user/foo.ts", {
        element: { type: "module", captured: { moduleName: "user" } },
      });

      expect(result).toBe(true);
    });

    it("should throw an error when using invalid selector in isEntityMatch", () => {
      const invalidSelector = {
        var: "baz",
      } as unknown as ElementSelector;

      expect(() =>
        matcher.isEntityMatch(
          "/project/src/modules/user/foo.ts",
          invalidSelector as unknown as EntitySelector
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
      const result = matcher.isEntityMatch(
        "/project/src/components/Button.tsx",
        {
          element: { types: "component" },
          file: { categories: "react" },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isEntityMatch(
        "/project/src/components/Button.tsx",
        {
          element: { types: "component" },
          file: { categories: "react" },
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      matcher.isEntityMatch("/project/src/components/Button.tsx", {
        element: { types: "component" },
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.isEntityMatch("/project/src/components/Button.tsx", {
        element: { types: "component" },
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isEntityMatch("/project/src/components/Button.tsx", {
        element: { types: "component" },
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("when matching dependencies using element selectors", () => {
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
          from: { element: { types: "component" } },
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
          from: { element: { type: "{{ from.types.[0] }}" } },
        },
        expected: true,
        expectedMatch: {
          from: { element: { type: "{{ from.types.[0] }}" } },
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
          from: { element: { types: "foo" } },
        },
        expected: false,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: { element: { parent: { type: "module" } } },
        },
        expected: true,
      },
      {
        dependency: {
          from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          to: "/project/src/bar/Baz.ts",
          source: "project/bar",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          from: {
            element: {
              parent: {
                captured: {
                  moduleName: "{{ from.parents.0.captured.moduleName }}",
                },
              },
            },
          },
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
          from: { file: { path: "/project/src/components/Button.tsx" } },
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
          from: { file: { path: "foo" } },
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
          from: { element: { path: "**/*" } },
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
          from: { element: { path: "foo" } },
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
          from: { element: { isIgnored: false } },
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
          from: { element: { isIgnored: true } },
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
          to: { module: { origin: "foo" } },
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
          to: [{ module: { origin: "local" } }, { element: { type: "var" } }],
        },
        expected: true,
        expectedMatch: {
          to: { module: { origin: "local" } },
        },
      },
      // File category tests (replaces deprecated element category)
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
          to: { file: { categories: "test" } },
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
          to: { element: { type: "component" } },
        },
        expected: true,
        expectedMatch: {
          to: { element: { type: "component" } },
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
          to: [{ element: { type: "foo" } }],
        },
        expected: false,
      },
      // Captured tests using module element
      {
        dependency: {
          to: "/project/src/modules/user/foo.ts",
          from: "/project/src/components/Button.tsx",
          source: "../modules/user/foo.ts",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["UserService"],
        },
        selector: {
          to: { element: { type: "module", captured: { moduleName: "user" } } },
        },
        expected: true,
        expectedMatch: {
          to: { element: { type: "module", captured: { moduleName: "user" } } },
        },
      },
      {
        dependency: {
          to: "/project/src/modules/user/foo.ts",
          from: "/project/src/components/Button.tsx",
          source: "../modules/user/foo.ts",
          kind: "type",
          nodeKind: "Import",
          specifiers: ["UserService"],
        },
        selector: {
          to: {
            element: { type: "module", captured: { moduleName: "admin" } },
          },
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
          to: { element: { types: "{{ to.types.[0] }}" } },
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
          from: { element: { type: "{{ from.types.[0] }}" } },
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
            element: { types: "{{ from.types.[0] }}" },
          },
          to: { file: { path: "{{ to.file.path }}" } },
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
          to: { file: { path: "**/Foo.tsx" } },
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
          to: { element: { path: "**" } },
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
          to: { element: { path: "foo" } },
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
          to: { element: { isIgnored: false } },
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
          to: { element: { isIgnored: true } },
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
          to: { element: { isUnknown: false } },
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
          to: { element: { isUnknown: true } },
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
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: "**/Button.tsx",
            },
          },
        },
        expected: true,
        expectedMatch: {
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: "**/Button.tsx",
            },
          },
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
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: ["foo", "**/Button.tsx"],
            },
          },
        },
        expected: true,
        expectedMatch: {
          to: {
            element: {
              types: "{{ to.types.[0] }}",
              fileInternalPath: ["foo", "**/Button.tsx"],
            },
          },
        },
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
          to: { module: { origin: ["external", "local"] } },
          dependency: { source: "react" },
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
          dependency: { source: "foo" },
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
          to: { element: { path: "*" } }, // Unknown element, so element path is not set
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
          to: { element: { isUnknown: true } },
        },
        expected: true,
      },
      // Module tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          to: { module: { origin: ["external", "local"], source: "react" } },
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
          to: { module: { source: "foo" } },
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
          to: { module: { origin: ["external", "local"], source: "react" } },
          dependency: { source: "react" },
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
          dependency: { relationship: { to: "foo" } },
        },
        expected: false,
      },
      // Dependency metadata source tests
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: {
          dependency: { source: "react" },
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
          to: { module: { source: "react" } },
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
        selector: [
          { dependency: { source: "foo" } },
          { to: { module: { source: "react" } } },
        ],
        expected: true,
        expectedMatch: {
          to: { module: { source: "react" } },
        },
      },
      {
        dependency: {
          from: "/project/src/components/Button.tsx",
          to: "/project/node_modules/react/index.tsx",
          source: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
        },
        selector: [
          { dependency: { source: "foo" } },
          { to: { module: { source: "bar" } } },
        ],
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
          dependency: { nodeKind: "ImportDeclaration" },
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
          dependency: { nodeKind: ["Import*"] },
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
          dependency: { nodeKind: "{{ dependency.nodeKind }}" },
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
          dependency: { nodeKind: "{{ to.foo }}" },
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
          dependency: { nodeKind: ["Import*"] },
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
          dependency: { kind: "t*" },
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
          dependency: { kind: "{{ dependency.kind }}" },
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
          dependency: { kind: "{{ to.foo }}" },
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
          dependency: { kind: "t*" },
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
          dependency: { kind: "2" },
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
          dependency: { kind: "t*" },
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
          dependency: { specifiers: "foo" },
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
          dependency: { specifiers: ["var", "b*"] },
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
          dependency: { specifiers: "{{ lookup dependency.specifiers 0 }}" },
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
          dependency: { specifiers: "{{ dependency.specifiers.foo }}" },
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
          dependency: { specifiers: "foo" },
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
          dependency: { relationship: { to: "uncle" } },
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
          dependency: {
            relationship: { to: "{{ dependency.relationship.to }}" },
          },
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
          dependency: { relationship: { to: "{{ to.foo }}" } },
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
          dependency: { relationship: { from: "nephew" } },
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
          dependency: {
            relationship: { from: "{{ dependency.relationship.from }}" },
          },
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
          dependency: { relationship: { from: "{{ from.foo }}" } },
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
          dependency: {
            relationship: {
              to: "uncle",
              from: "nephew",
            },
          },
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
          dependency: {
            relationship: {
              to: "{{ dependency.relationship.to }}",
              from: "{{ dependency.relationship.from }}",
            },
          },
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
          dependency: {
            relationship: {
              to: "uncle",
              from: "foo",
            },
          },
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
        dependency: DependencyDescriptorOptions;
        expected: boolean;
        selector: DependencySingleSelector;
        extraTemplateData?: Record<string, unknown>;
        expectedMatch?: DependencySingleSelector;
      }) => {
        const result = extraTemplateData
          ? matcher.isDependencyMatch(dependency, selector, {
              extraTemplateData,
            })
          : matcher.isDependencyMatch(dependency, selector);

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
          const selectorMatchingResult = matcher.getDependencySelectorMatching(
            dependency,
            selector,
            extraTemplateData ? { extraTemplateData } : undefined
          );

          const convertedMatchingResult = selectorMatchingResult
            ? normalizeDependencySelector(selectorMatchingResult)
            : null;

          const convertedSelector =
            expectedMatch || selector
              ? normalizeDependencySelector(expectedMatch || selector)
              : null;

          // eslint-disable-next-line jest/no-conditional-expect
          expect(convertedMatchingResult).toStrictEqual(convertedSelector);
        }
      }
    );

    it("should match using entity selector in from and to", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/services/api/api.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { type: "component" } },
          to: { element: { type: "service" } },
        }
      );

      expect(result).toBe(true);
    });

    it("should match using entity selector with captured in from", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/modules/user/foo.ts",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: {
            element: { type: "module", captured: { moduleName: "user" } },
          },
        }
      );

      expect(result).toBe(true);
    });

    it("should support dependency selector arrays", () => {
      const dependency = {
        from: "/project/src/components/Button.tsx",
        to: "/project/node_modules/react/index.tsx",
        source: "react",
        kind: "value" as const,
        nodeKind: "ImportDeclaration",
      };

      expect(
        matcher.isDependencyMatch(dependency, {
          dependency: [{ kind: "type" }, { kind: "value" }],
        })
      ).toBe(true);

      expect(
        matcher.getDependencySelectorMatching(dependency, {
          dependency: [{ kind: "type" }, { kind: "value" }],
        })
      ).toStrictEqual({
        dependency: { kind: "value" },
      });
    });

    it("should throw an error when using invalid dependency selector", () => {
      const invalidSelector = {
        var: "baz",
      } as unknown as DependencySingleSelector;

      expect(() =>
        matcher.isDependencyMatch(
          {
            from: "/project/src/components/Button.tsx",
            to: "/project/src/utils/math/math.test.ts",
            source: "../utils/math/math.test.ts",
            kind: "value",
            nodeKind: "Import",
            specifiers: ["calculateSum", "calculateAvg"],
          },
          invalidSelector
        )
      ).toThrow();
    });

    it("should throw an error when using invalid dependency description in getDependencySelectorMatchingDescription", () => {
      expect(() =>
        matcher.getDependencySelectorMatchingDescription(
          // @ts-expect-error: Testing invalid description
          {},
          {
            from: { element: { types: "component" } },
            to: { element: { types: "foo" } },
          }
        )
      ).toThrow();
    });

    it("should throw an error when using invalid element selector", () => {
      const invalidSelector = {
        to: { var: "baz" },
      } as unknown as DependencySingleSelector;

      expect(() =>
        matcher.isDependencyMatch(
          {
            from: "/project/src/components/Button.tsx",
            to: "/project/src/utils/math/math.test.ts",
            source: "../utils/math/math.test.ts",
            kind: "value",
            nodeKind: "Import",
            specifiers: ["calculateSum", "calculateAvg"],
          },
          invalidSelector
        )
      ).toThrow();
    });

    it("should not call to micromatch after matching with same options", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call again to micromatch after clearing cache", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call when using same selector", () => {
      const result = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
      expect(result).toBe(true);

      micromatchSpy.mockClear();

      const result2 = matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
          to: { element: { types: "component" } }, // Same as from, it should not normalize again
        }
      );

      expect(result2).toBe(true);
      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.isDependencyMatch(
        {
          from: "/project/src/components/Button.tsx",
          to: "/project/src/components/Button.tsx",
          source: "../utils/math/math.test.ts",
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
        },
        {
          from: { element: { types: "component" } },
          to: { element: { types: "component" } },
        }
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("normalizeElementSelector public method", () => {
    it.each([
      {
        selector: { type: "component" },
        expected: [{ type: "component" }],
      },
      {
        selector: { type: "component", captured: { fileName: "Button" } },
        expected: [{ type: "component", captured: { fileName: "Button" } }],
      },
      {
        selector: [
          { type: "component" },
          { type: "foo", captured: { bar: "baz" } },
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
        selector: ElementSelector;
        expected: ElementSelectorNormalized;
      }) => {
        const normalized = normalizeElementSelector(selector);

        expect(normalized).toStrictEqual(expected);
      }
    );
  });
});
