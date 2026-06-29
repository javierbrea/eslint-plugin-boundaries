/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import type {
  ElementSelector,
  EntitySelector,
  EntitySingleSelector,
  Matcher,
  ElementDescription,
} from "../index";
import { normalizeEntitySelector, Elements } from "../index";

describe("isEntityMatch | Integration", () => {
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

  describe("parents array query", () => {
    // /project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts
    // has parents: [sms-module, phone-module, notification-module, foo-element]
    // parents[0] is the closest parent (sms), parents[-1] is the outermost (foo)
    const deepPath =
      "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts";

    it("anyOf: matches when any ancestor has the given type", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: { parents: { anyOf: [{ type: "foo" }] } },
        })
      ).toBe(true);
    });

    it("anyOf: does not match when no ancestor has the given type", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: { parents: { anyOf: [{ type: "service" }] } },
        })
      ).toBe(false);
    });

    it("noneOf: matches when the forbidden ancestor type is absent", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: { parents: { noneOf: [{ type: "service" }] } },
        })
      ).toBe(true);
    });

    it("noneOf: does not match when the forbidden ancestor type is present", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: { parents: { noneOf: [{ type: "module" }] } },
        })
      ).toBe(false);
    });

    it("hasLength: 0 matches top-level elements (no parents)", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { parents: { hasLength: 0 } },
        })
      ).toBe(true);
    });

    it("hasLength: 0 does not match elements with parents", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: { parents: { hasLength: 0 } },
        })
      ).toBe(false);
    });

    it("atIndex -1: matches the outermost ancestor type", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: {
            parents: { atIndex: { index: -1, matches: { type: "foo" } } },
          },
        })
      ).toBe(true);
    });

    it("atIndex 0: matches the closest parent type", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: {
            parents: { atIndex: { index: 0, matches: { type: "module" } } },
          },
        })
      ).toBe(true);
    });

    it("allOf: matches when all required ancestor types are present", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: {
            parents: { allOf: [{ type: "module" }, { type: "foo" }] },
          },
        })
      ).toBe(true);
    });

    it("allOf: does not match when a required ancestor type is absent", () => {
      expect(
        matcher.isEntityMatch(deepPath, {
          element: {
            parents: { allOf: [{ type: "module" }, { type: "service" }] },
          },
        })
      ).toBe(false);
    });
  });

  describe("types array query", () => {
    it("anyOf: matches when any type is in the list", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { anyOf: ["component", "service"] } },
        })
      ).toBe(true);
    });

    it("anyOf: does not match when no type is in the list", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { anyOf: ["service", "module"] } },
        })
      ).toBe(false);
    });

    it("allOf: matches when all required types are present", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { allOf: ["component"] } },
        })
      ).toBe(true);
    });

    it("allOf: does not match when a required type is missing", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { allOf: ["component", "service"] } },
        })
      ).toBe(false);
    });

    it("noneOf: matches when none of the forbidden types are present", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { noneOf: ["service", "module"] } },
        })
      ).toBe(true);
    });

    it("noneOf: does not match when a forbidden type is present", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { noneOf: ["component"] } },
        })
      ).toBe(false);
    });

    it("hasLength: matches when type count equals hasLength", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { hasLength: 1 } },
        })
      ).toBe(true);
    });

    it("hasLength: does not match when type count differs", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { hasLength: 2 } },
        })
      ).toBe(false);
    });

    it("atIndex: matches the type at index 0", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { atIndex: { index: 0, matches: "component" } } },
        })
      ).toBe(true);
    });

    it("atIndex: matches the last type using index -1", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { atIndex: { index: -1, matches: "component" } } },
        })
      ).toBe(true);
    });

    it("equalsTo: matches when types exactly equal the ordered list", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { equalsTo: ["component"] } },
        })
      ).toBe(true);
    });

    it("equalsTo: does not match when the list length differs", () => {
      expect(
        matcher.isEntityMatch("/project/src/components/Button.tsx", {
          element: { types: { equalsTo: ["component", "extra"] } },
        })
      ).toBe(false);
    });
  });
});
