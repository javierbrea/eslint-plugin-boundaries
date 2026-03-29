/* eslint-disable jest/no-conditional-in-test */

import micromatch from "micromatch";

import {
  convertLegacyDependencySelector,
  convertLegacyEntitySelector,
} from "./Legacy";

import type {
  ElementSelector,
  ElementSingleSelector,
  DependencyDescriptorOptions,
  DependencySingleSelector,
  Matcher,
  SimpleElementSelectorByTypeWithOptions,
  ElementDescription,
  DependencyMatchResult,
} from "./index";
import { Elements, normalizeElementSelector } from "./index";

describe("Entities Legacy Matcher", () => {
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

  describe("when matching dependencies", () => {
    // eslint-disable-next-line jest/prefer-ending-with-an-expect
    it.only.each([
      // Captured tests
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
      /* {
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
      }, */
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
        let result: boolean;
        try {
          result = extraTemplateData
            ? matcher.isDependencyMatch(dependency, selector, {
                extraTemplateData,
              })
            : matcher.isDependencyMatch(dependency, selector);
        } catch (error) {
          console.error(
            "Error while matching:",
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
            ),
            error
          );
          throw error;
        }

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

          const expectedSelectorMatching = expectedMatch || selector;
          const fromMatch = expectedSelectorMatching?.from || undefined;
          const toMatch = expectedSelectorMatching?.to || undefined;
          const dependencyMatch =
            expectedSelectorMatching?.dependency || undefined;

          const convertedExpectedMatchResult = convertLegacyDependencySelector({
            from: fromMatch,
            to: toMatch,
            dependency: dependencyMatch,
          });

          const expectedMatchResultRaw = Array.isArray(
            convertedExpectedMatchResult
          )
            ? convertedExpectedMatchResult[0]
            : convertedExpectedMatchResult;

          const expectedMatchResult: DependencyMatchResult["selector"] = {};

          if (expectedMatchResultRaw?.from) {
            // @ts-expect-error: Creating expected match result based on the selector.
            expectedMatchResult.from = Array.isArray(
              expectedMatchResultRaw.from
            )
              ? expectedMatchResultRaw.from[0]
              : expectedMatchResultRaw.from;

            if (expectedMatchResult.from?.element?.parent) {
              expectedMatchResult.from.element.parent = Array.isArray(
                expectedMatchResult.from.element.parent
              )
                ? expectedMatchResult.from.element.parent[0]
                : expectedMatchResult.from.element.parent;
            }
          }

          if (expectedMatchResultRaw?.to) {
            // @ts-expect-error: Creating expected match result based on the selector.
            expectedMatchResult.to = Array.isArray(expectedMatchResultRaw.to)
              ? expectedMatchResultRaw.to[0]
              : expectedMatchResultRaw.to;

            if (expectedMatchResult.to?.element?.parent) {
              expectedMatchResult.to.element.parent = Array.isArray(
                expectedMatchResult.to.element.parent
              )
                ? expectedMatchResult.to.element.parent[0]
                : expectedMatchResult.to.element.parent;
            }
          }

          if (expectedMatchResultRaw?.dependency) {
            expectedMatchResult.dependency = Array.isArray(
              expectedMatchResultRaw.dependency
            )
              ? expectedMatchResultRaw.dependency[0]
              : expectedMatchResultRaw.dependency;
          }

          // eslint-disable-next-line jest/no-conditional-expect
          expect(selectorMatchingResult).toStrictEqual(expectedMatchResult);

          const description = matcher.describeDependency(dependency);
          try {
            const selectorMatchingFromDescription =
              matcher.getDependencySelectorMatchingDescription(
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
  });
});
