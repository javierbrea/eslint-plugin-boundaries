import micromatch from "micromatch";

import type { Matcher } from "./index";
import {
  Elements,
  isIgnoredElement,
  isKnownLocalElement,
  isExternalDependencyElement,
  isUnknownLocalElement,
  isCoreDependencyElement,
  isElementDescription,
  isDependencyDescription,
  isInternalDependency,
} from "./index";

describe("Elements Descriptors", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  const describeDependencyTarget = (source: string, to?: string) => {
    return matcher.describeDependency({
      from: "/project/src/components/Button.tsx",
      to,
      source,
      kind: "value",
    }).to;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "capture");

    elements = new Elements({
      includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      ignorePaths: ["**/src/**/__tests__/**"],
    });
    matcher = elements.getMatcher({
      elementDescriptors: [
        {
          type: "component",
          pattern: "src/components/*.tsx",
          mode: "file",
          capture: ["fileName"],
        },
        {
          type: "test",
          pattern: ["*/*.test.ts", "*/*.spec.ts"],
          basePattern: "**/src/*",
          mode: "file",
          capture: ["elementName", "testFileName"],
          baseCapture: ["root", "businessLogicArea"],
        },
        {
          type: "business-logic",
          pattern: ["modules/*"],
        },
        {
          type: "foo",
          pattern: ["foo/*"],
        },
        {
          type: "service",
          pattern: ["**/src/services/*/*.ts"],
          fullMatch: true,
          capture: ["baseFolder", "serviceName", "serviceFileName"],
        },
        { type: "utility", pattern: "src/utils/**/*.ts", mode: "file" },
      ],
    });
  });

  afterEach(() => {
    elements.clearCache();
  });

  describe("configuration options", () => {
    it("should ignore files based on ignorePaths", () => {
      const element = matcher.describeElement(
        "/project/src/utils/__tests__/testUtil.ts"
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should not include elements not included in includePaths", () => {
      const element = matcher.describeElement("/project/foo/utils/testUtil.ts");

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should return same result for same path in describeElement and describeDependencyElement", () => {
      const element1 = matcher.describeElement(
        "/project/foo/utils/testUtil.ts"
      );
      const element2 = describeDependencyTarget(
        "foo",
        "/project/foo/utils/testUtil.ts"
      );

      expect({ ...element1, source: undefined, module: undefined }).toEqual({
        ...element2,
        source: undefined,
        module: undefined,
      });
    });

    it("should exclude files when only ignorePaths is provided", () => {
      const otherDescriptors = elements.getMatcher(
        {
          elementDescriptors: [
            {
              type: "component",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
        },
        {
          ignorePaths: ["**/src/**/*.tsx"],
        }
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should throw an error for invalid descriptors", () => {
      expect(() =>
        elements.getMatcher(
          {
            elementDescriptors: [
              {
                type: "component",
                pattern: "/project/src/components/*.tsx",
                mode: "file",
                capture: ["fileName"],
              },
              // @ts-expect-error Testing invalid descriptor
              {
                pattern: "/project/src/components/*.tsx",
                mode: "file",
                capture: ["fileName"],
              },
            ],
          },
          {
            ignorePaths: ["**/src/**/*.tsx"],
          }
        )
      ).toThrow(
        "Element descriptor at index 1 must have a pattern and a 'type' defined."
      );
    });

    it("should not include files when includePaths do not match", () => {
      const otherDescriptors = elements.getMatcher(
        {
          elementDescriptors: [
            {
              type: "component",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
        },
        {
          includePaths: ["**/src/**/*.md"],
        }
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should include every file by default", () => {
      const otherDescriptors = elements.getMatcher(
        {
          elementDescriptors: [
            {
              type: "component",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
              capture: ["fileName"],
            },
          ],
        },
        {}
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual({
        type: "component",
        captured: {
          fileName: "Button",
        },
        parents: [],
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        path: "/project/src/components/Button.tsx",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should collect all matches by default when descriptorsMultiMatch is enabled", () => {
      const otherDescriptors = elements.getMatcher({
        elementDescriptors: [
          {
            type: "component",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
          },
          {
            type: "view",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
          },
        ],
      });

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual(
        expect.objectContaining({
          type: "view",
          isUnknown: false,
        })
      );
    });

    it("should apply descriptorsPriority: first when descriptorsMultiMatch is disabled", () => {
      const firstPriorityMatcher = elements.getMatcher(
        {
          elementDescriptors: [
            {
              type: "component",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
            },
            {
              type: "view",
              pattern: "/project/src/components/*.tsx",
              mode: "file",
            },
          ],
        },
        {
          descriptorsPriority: "first",
        }
      );

      const element = firstPriorityMatcher.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual(
        expect.objectContaining({
          type: "component",
          isUnknown: false,
        })
      );
    });

    it("should use last priority in single mode when configured", () => {
      const singleMatcher = elements.getMatcher(
        {
          elementDescriptors: [
            {
              type: "first",
              pattern: "modules/(*)",
              mode: "folder",
              capture: ["winner"],
            },
            {
              type: "last",
              pattern: "modules/(*)",
              mode: "folder",
              capture: ["winner"],
            },
          ],
        },
        {
          descriptorsPriority: "last",
        }
      );

      const element = singleMatcher.describeElement(
        "/project/src/users/modules/foo/Foo.test.ts"
      );

      expect(element).toEqual(
        expect.objectContaining({
          type: "last",
          captured: {
            winner: "foo",
          },
          isUnknown: false,
        })
      );
    });

    it("should merge captured values in multi mode", () => {
      const multiMatcher = elements.getMatcher({
        elementDescriptors: [
          {
            type: "test",
            pattern: "modules/(*)/*.test.ts",
            mode: "file",
            capture: ["moduleName"],
          },
          {
            type: "domain",
            pattern: "modules/(*)/**/*",
            mode: "file",
            capture: ["domain"],
          },
          {
            type: "module",
            pattern: "modules/(*)",
            mode: "folder",
            capture: ["moduleName"],
          },
        ],
      });

      const element = multiMatcher.describeElement(
        "/project/src/users/modules/foo/Foo.test.ts"
      );

      expect(element).toEqual(
        expect.objectContaining({
          type: "module",
          captured: {
            moduleName: "foo",
          },
          isUnknown: false,
        })
      );
    });

    it("should use priority when selecting elementPath in multi mode", () => {
      const descriptors = [
        {
          type: "module-folder",
          pattern: "modules/(*)",
          mode: "folder" as const,
          capture: ["name"],
        },
        {
          type: "module-file",
          pattern: "modules/*/(*)",
          mode: "file" as const,
          capture: ["name"],
        },
      ];

      const firstPriorityMatcher = elements.getMatcher(
        {
          elementDescriptors: descriptors,
        },
        {
          descriptorsPriority: "first",
        }
      );
      const lastPriorityMatcher = elements.getMatcher(
        {
          elementDescriptors: descriptors,
        },
        {
          descriptorsPriority: "last",
        }
      );

      const firstElement = firstPriorityMatcher.describeElement(
        "/project/src/users/modules/foo/Foo.test.ts"
      );
      const lastElement = lastPriorityMatcher.describeElement(
        "/project/src/users/modules/foo/Foo.test.ts"
      );

      expect(firstElement).toEqual(
        expect.objectContaining({
          captured: {
            name: "foo",
          },
        })
      );
      expect(lastElement).toEqual(
        expect.objectContaining({
          captured: {
            name: "foo",
          },
        })
      );
    });
  });

  describe("element descriptions", () => {
    it("should return unknown elements when no path is provided", () => {
      // @ts-expect-error Testing no path provided
      const element = matcher.describeElement();

      expect(isUnknownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements correctly", () => {
      const element = matcher.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual({
        type: "component",
        captured: {
          fileName: "Button",
        },
        parents: [],
        isIgnored: false,
        isUnknown: false,
        origin: "local",
        path: "/project/src/components/Button.tsx",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements with basePattern correctly", () => {
      const element = matcher.describeElement(
        "/project/src/utils/math/math.test.ts"
      );

      expect(element).toEqual({
        type: "test",
        captured: {
          elementName: "math",
          testFileName: "math",
          businessLogicArea: "utils",
          root: "/project",
        },
        isUnknown: false,
        isIgnored: false,
        parents: [],
        origin: "local",
        path: "/project/src/utils/math/math.test.ts",
      });

      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptors without capture properties correctly", () => {
      const element = matcher.describeElement(
        "/project/src/modules/user/foo.ts"
      );

      expect(element).toEqual({
        type: "business-logic",
        captured: null,
        path: "/project/src/modules/user",
        parents: [],
        origin: "local",
        isIgnored: false,
        isUnknown: false,
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements in full mode correctly", () => {
      const element = matcher.describeElement(
        "/project/src/services/payment/PaymentService.ts"
      );

      expect(element).toEqual({
        type: "service",
        captured: {
          baseFolder: "/project",
          serviceName: "payment",
          serviceFileName: "PaymentService",
        },
        path: "/project/src/services/payment/PaymentService.ts",
        parents: [],
        isIgnored: false,
        origin: "local",
        isUnknown: false,
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign unknown local element description when no descriptor matches", () => {
      const element = matcher.describeElement("/project/src/misc/other.ts");

      expect(element).toEqual({
        type: null,
        captured: null,
        parents: null,
        path: null,
        origin: "local",
        isIgnored: false,
        isUnknown: true,
      });
      expect(isUnknownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should not assign category when not specified in the descriptor", () => {
      const element = matcher.describeElement(
        "/project/src/utils/math/mathUtil.ts"
      );

      expect(element).toEqual({
        type: "utility",
        captured: null,
        isIgnored: false,
        origin: "local",
        parents: [],
        path: "/project/src/utils/math/mathUtil.ts",
        isUnknown: false,
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local elements using captured parent folders", () => {
      const element = matcher.describeElement(
        "/project/src/foo/var/modules/notification/modules/email/EmailService.ts"
      );

      expect(element).toEqual({
        type: "business-logic",
        captured: null,
        isIgnored: false,
        origin: "local",
        path: "/project/src/foo/var/modules/notification/modules/email",
        isUnknown: false,
        parents: [
          {
            type: "business-logic",
            captured: null,
            path: "/project/src/foo/var/modules/notification",
          },
          {
            type: "foo",
            captured: null,
            path: "/project/src/foo/var",
          },
        ],
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local dependency elements correctly", () => {
      const element = describeDependencyTarget(
        "math/index",
        "/project/src/utils/math/index.ts"
      );

      expect(element).toEqual({
        type: "utility",
        isIgnored: false,
        captured: null,
        origin: "local",
        parents: [],
        path: "/project/src/utils/math/index.ts",
        isUnknown: false,
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to unknown external dependency elements correctly", () => {
      const element = describeDependencyTarget(
        "react",
        "/project/node_modules/react/index.tsx"
      );

      expect(element).toEqual({
        type: null,
        captured: null,
        parents: null,
        isIgnored: false,
        origin: "external",
        path: "/project/node_modules/react/index.tsx",
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to unknown scoped external dependency elements correctly", () => {
      const element = describeDependencyTarget(
        "@mui/icons-material",
        "/project/node_modules/@mui/icons-material/index.tsx"
      );

      expect(element).toEqual({
        type: null,
        captured: null,
        isIgnored: false,
        parents: null,
        origin: "external",
        path: "/project/node_modules/@mui/icons-material/index.tsx",
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to unknown scoped external dependency with path elements correctly", () => {
      const element = describeDependencyTarget(
        "@mui/icons-material/foo",
        "/project/node_modules/@mui/icons-material/index.tsx"
      );

      expect(element).toEqual({
        type: null,
        captured: null,
        parents: null,
        isIgnored: false,
        origin: "external",
        path: "/project/node_modules/@mui/icons-material/index.tsx",
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to external elements correctly", () => {
      const element = describeDependencyTarget("react");

      expect(element).toEqual({
        type: null,
        captured: null,
        parents: null,
        isIgnored: false,
        origin: "external",
        path: null,
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to core elements correctly", () => {
      const element = describeDependencyTarget("node:fs");

      expect(element).toEqual({
        type: null,
        captured: null,
        parents: null,
        isIgnored: false,
        origin: "core",
        path: null,
        isUnknown: true,
      });
      expect(isCoreDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to core elements without node prefix correctly", () => {
      const element = describeDependencyTarget("fs");

      expect(element).toEqual({
        type: null,
        captured: null,
        parents: null,
        isIgnored: false,
        origin: "core",
        path: null,
        isUnknown: true,
      });
      expect(isCoreDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });
  });

  describe("elements descriptor cache", () => {
    it("should not call micromatch multiple times for the same element", () => {
      matcher.describeElement("/project/src/components/Button.tsx");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/components/Button.tsx");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch multiple times for the same element if cache is disabled", () => {
      matcher = elements.getMatcher(
        {
          elementDescriptors: [
            { type: "utility", pattern: "src/utils/**/*.ts", mode: "file" },
          ],
        },
        {
          cache: false,
        }
      );
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after clearing the matcher cache, because the global cache is still populated", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      matcher.clearCache();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = matcher.serializeCache();

      matcher.clearCache();

      matcher.setCacheFromSerialized(serializedCache);

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = elements.serializeCache();

      matcher.clearCache();

      elements.setCacheFromSerialized(serializedCache);

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch more when describing external elements", () => {
      describeDependencyTarget(
        "@mui/icons-material/foo",
        "/project/node_modules/@mui/icons-material/index.tsx"
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("dependency descriptions", () => {
    it("should return dependency to unknown elements", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          captured: {
            fileName: "Button",
          },
          isIgnored: false,
          origin: "local",
          parents: [],
          path: "/project/src/components/Button.tsx",
          type: "component",
          isUnknown: false,
        },
        to: {
          captured: null,
          parents: null,
          origin: "local",
          path: null,
          isIgnored: false,
          type: null,
          isUnknown: true,
        },
        dependency: {
          source: "project/bar",
          module: null,
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: null,
            to: null,
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isUnknownLocalElement(dependency.to)).toBe(true);
    });

    it("should return dependency from unknown elements", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/var/Baz.ts",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
        specifiers: ["foo", "bar"],
      });

      expect(dependency).toMatchObject({
        from: {
          parents: null,
          captured: null,
          origin: "local",
          path: null,
          isIgnored: false,
          type: null,
          isUnknown: true,
        },
        to: {
          captured: null,
          origin: "local",
          path: null,
          isIgnored: false,
          type: null,
          isUnknown: true,
          parents: null,
        },
        dependency: {
          source: "project/bar",
          module: null,
          kind: "type",
          nodeKind: null,
          specifiers: ["foo", "bar"],
          relationship: {
            from: null,
            to: null,
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isUnknownLocalElement(dependency.from)).toBe(true);
      expect(isUnknownLocalElement(dependency.to)).toBe(true);
    });

    it("should return dependency between ignored elements", () => {
      const dependency = matcher.describeDependency({
        from: "/var/var/Baz.ts",
        to: "/var/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
        specifiers: ["foo", "bar"],
      });

      expect(dependency).toMatchObject({
        from: {
          parents: null,
          captured: null,
          origin: null,
          isIgnored: true,
          path: null,
          type: null,
          isUnknown: true,
        },
        to: {
          parents: null,
          captured: null,
          origin: null,
          isIgnored: true,
          path: null,
          type: null,
          isUnknown: true,
        },
        dependency: {
          source: "project/bar",
          module: null,
          kind: "type",
          nodeKind: null,
          specifiers: ["foo", "bar"],
          relationship: {
            from: null,
            to: null,
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isIgnoredElement(dependency.from)).toBe(true);
      expect(isIgnoredElement(dependency.to)).toBe(true);
    });

    it("should return dependency between known elements", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/utils/math/math.test.ts",
        source: "../utils/math/math.test.ts",
        kind: "value",
        nodeKind: "Import",
        specifiers: ["calculateSum", "calculateAvg"],
      });

      expect(dependency).toMatchObject({
        from: {
          type: "component",
          captured: {
            fileName: "Button",
          },
          parents: [],
          isIgnored: false,
          origin: "local",
          path: "/project/src/components/Button.tsx",
          isUnknown: false,
        },
        to: {
          type: "test",
          isIgnored: false,
          captured: {
            elementName: "math",
            testFileName: "math",
            businessLogicArea: "utils",
            root: "/project",
          },
          parents: [],
          origin: "local",
          path: "/project/src/utils/math/math.test.ts",
          isUnknown: false,
        },
        dependency: {
          source: "../utils/math/math.test.ts",
          module: null,
          kind: "value",
          nodeKind: "Import",
          specifiers: ["calculateSum", "calculateAvg"],
          relationship: {
            from: null,
            to: null,
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should describe dependency to unknown external elements correctly", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/node_modules/react/index.tsx",
        source: "react",
        kind: "type",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          captured: {
            fileName: "Button",
          },
          origin: "local",
          parents: [],
          path: "/project/src/components/Button.tsx",
          type: "component",
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          captured: null,
          parents: null,
          origin: "external",
          path: "/project/node_modules/react/index.tsx",
          type: null,
          isIgnored: false,
          isUnknown: true,
        },
        dependency: {
          source: "react",
          module: "react",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: null,
            to: null,
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isExternalDependencyElement(dependency.to)).toBe(true);
    });

    it("should set null dependency module for external sources without package segment", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/node_modules/react/index.tsx",
        source: "/react",
        kind: "type",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency.to).toMatchObject({
        origin: "external",
        path: "/project/node_modules/react/index.tsx",
      });
      expect(dependency.dependency).toMatchObject({
        source: "/react",
        module: null,
      });
    });

    it("should describe dependency to core elements correctly", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        source: "fs",
        kind: "type",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          captured: {
            fileName: "Button",
          },
          origin: "local",
          parents: [],
          path: "/project/src/components/Button.tsx",
          type: "component",
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          captured: null,
          parents: null,
          origin: "core",
          path: null,
          type: null,
          isIgnored: false,
          isUnknown: true,
        },
        dependency: {
          source: "fs",
          module: "fs",
          kind: "type",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: null,
            to: null,
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isCoreDependencyElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to child elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/foo/var/modules/notification/NotificationService.ts",
        to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        source: "./modules/email/EmailService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification",
          parents: [
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "./modules/email/EmailService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "parent",
            to: "child",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isInternalDependency(dependency)).toBe(false);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to internal elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/foo/var/modules/notification/NotificationService.ts",
        to: "/project/src/foo/var/modules/notification/EmailService.ts",
        source: "./EmailService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification",
          parents: [
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification",
          parents: [
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "./EmailService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "internal",
            to: "internal",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isInternalDependency(dependency)).toBe(true);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to descendant elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/foo/var/modules/notification/NotificationService.ts",
        to: "/project/src/foo/var/modules/notification/modules/email/modules/send/SendService.ts",
        source: "./modules/email/modules/send/SendService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification",
          parents: [
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/modules/send",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification/modules/email",
            },
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "./modules/email/modules/send/SendService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "ancestor",
            to: "descendant",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isInternalDependency(dependency)).toBe(false);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to sibling elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/foo/var/modules/notification/modules/phone/PhoneService.ts",
        to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        source: "../email/EmailService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/phone",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "../email/EmailService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "sibling",
            to: "sibling",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isInternalDependency(dependency)).toBe(false);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to parent elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        to: "/project/src/foo/var/modules/notification/NotificationService.ts",
        from: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        source: "../../NotificationService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification",
          parents: [
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "../../NotificationService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "child",
            to: "parent",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to ancestor elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        to: "/project/src/foo/var/modules/notification/NotificationService.ts",
        from: "/project/src/foo/var/modules/notification/modules/email/modules/send/SendService.ts",
        source: "./modules/email/modules/send/SendService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/modules/send",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification/modules/email",
            },
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification",
          parents: [
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "./modules/email/modules/send/SendService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "descendant",
            to: "ancestor",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isInternalDependency(dependency)).toBe(false);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to uncle elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        to: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        source: "../../../email/EmailService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/phone/modules/sms",
          parents: [
            {
              captured: null,
              path: "/project/src/foo/var/modules/notification/modules/phone",
              type: "business-logic",
            },
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "../../../email/EmailService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "nephew",
            to: "uncle",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isInternalDependency(dependency)).toBe(false);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });

    it("should assign relationships to nephew elements in dependencies", () => {
      const dependency = matcher.describeDependency({
        to: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
        from: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        source: "../../../email/EmailService",
        kind: "value",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toMatchObject({
        from: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email",
          parents: [
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          type: "business-logic",
          captured: null,
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/phone/modules/sms",
          parents: [
            {
              captured: null,
              path: "/project/src/foo/var/modules/notification/modules/phone",
              type: "business-logic",
            },
            {
              type: "business-logic",
              captured: null,
              path: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              path: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
          source: "../../../email/EmailService",
          module: null,
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: null,
          relationship: {
            from: "uncle",
            to: "nephew",
          },
        },
      });

      expect(isDependencyDescription(dependency)).toBe(true);
      expect(isInternalDependency(dependency)).toBe(false);
      expect(isKnownLocalElement(dependency.from)).toBe(true);
      expect(isKnownLocalElement(dependency.to)).toBe(true);
    });
  });

  describe("pattern matching with rootPath", () => {
    describe("file mode", () => {
      it("should match files inside rootPath with relative patterns", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/app",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "component",
              pattern: "src/components/*.tsx",
              mode: "file",
              capture: ["componentName"],
            },
          ],
        });

        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/app/src/components/Button.tsx"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: "component",
            captured: { componentName: "Button" },
            isUnknown: false,
          })
        );
      });

      it("should match files with right-to-left evaluation even with partial path match", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/app",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "model",
              pattern: "*.model.ts",
              mode: "file",
            },
          ],
        });

        // Right-to-left matching should match the filename pattern
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/app/src/domain/user.model.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: "model",
            isUnknown: false,
          })
        );
      });
    });

    describe("folder mode", () => {
      it("should match folders inside rootPath with relative patterns", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/api",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "service",
              pattern: "src/services/*",
              mode: "folder",
              capture: ["serviceName"],
            },
          ],
        });

        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/api/src/services/auth/AuthService.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: "service",
            captured: { serviceName: "auth" },
            path: "src/services/auth",
            isUnknown: false,
          })
        );
      });

      it("should match folders with right-to-left evaluation", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/apps/web",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "module",
              pattern: "modules/*",
              mode: "folder",
              capture: ["moduleName"],
            },
          ],
        });

        // Should match even if full path is src/features/modules/auth
        const element = matcherWithRoot.describeElement(
          "/monorepo/apps/web/src/features/modules/billing/index.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: "module",
            captured: { moduleName: "billing" },
            isUnknown: false,
          })
        );
      });
    });

    describe("full mode", () => {
      it("should require complete path match from rootPath for files inside", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/lib",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "helper",
              pattern: "src/helpers/**/*.ts",
              fullMatch: true,
            },
          ],
        });

        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/lib/src/helpers/math/sum.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: "helper",
            isUnknown: false,
          })
        );
      });

      it("should not match files with partial path in full mode", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/lib",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "helper",
              pattern: "helpers/*.ts",
              fullMatch: true,
            },
          ],
        });

        // This won't match because in full mode it needs src/helpers/*.ts
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/lib/src/helpers/sum.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: null,
            isUnknown: true,
          })
        );
      });

      it("should not match files outside rootPath with relative patterns", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/app",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "component",
              pattern: "src/components/**/*.tsx",
              fullMatch: true,
            },
          ],
        });

        // File outside rootPath - keeps absolute path, won't match relative pattern
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/shared/src/components/Button.tsx"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: null,
            isUnknown: true,
          })
        );
      });
    });

    describe("files outside rootPath", () => {
      it("should match files outside rootPath in file mode", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/packages/app",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "shared",
              pattern: "*.util.ts",
              mode: "file",
            },
          ],
        });

        // File outside rootPath - right-to-left matching still works
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/shared/src/utils/format.util.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: "shared",
            path: "/monorepo/packages/shared/src/utils/format.util.ts",
            isUnknown: false,
          })
        );
      });

      it("should match files outside rootPath in folder mode", () => {
        const elementsWithRoot = new Elements({
          rootPath: "/monorepo/apps/web",
        });
        const matcherWithRoot = elementsWithRoot.getMatcher({
          elementDescriptors: [
            {
              type: "package",
              pattern: "packages/*",
              mode: "folder",
              capture: ["packageName"],
            },
          ],
        });

        // File outside rootPath - right-to-left matching can still work
        const element = matcherWithRoot.describeElement(
          "/monorepo/packages/utils/src/index.ts"
        );

        expect(element).toEqual(
          expect.objectContaining({
            type: "package",
            captured: { packageName: "utils" },
            isUnknown: false,
          })
        );
      });
    });
  });

  describe("dependency descriptor cache", () => {
    it("should not call micromatch multiple times for the same element", () => {
      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after clearing the cache, because the global cache is still populated", () => {
      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      matcher.clearCache();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data", () => {
      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = matcher.serializeCache();

      matcher.clearCache();

      matcher.setCacheFromSerialized(serializedCache);

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = elements.serializeCache();

      matcher.clearCache();

      elements.setCacheFromSerialized(serializedCache);

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch more than one per same file when getting dependency elements for the same file but different sources", () => {
      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/foo",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });
  });
});
