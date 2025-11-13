import micromatch from "micromatch";

import type { Matcher } from "../../src/index";
import {
  Elements,
  isIgnoredElement,
  isKnownLocalElement,
  isExternalDependencyElement,
  isUnknownLocalElement,
  isCoreDependencyElement,
  isElementDescription,
  isLocalDependencyElement,
  isDependencyDescription,
  isInternalDependency,
} from "../../src/index";

describe("Descriptors", () => {
  let matcher: Matcher;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "capture");

    elements = new Elements({
      includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      ignorePaths: ["**/src/**/__tests__/**"],
    });
    matcher = elements.getMatcher([
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
    ]);
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

    it("should return same result for same path in describeElement and describeDependencyElement except for source", () => {
      const element1 = matcher.describeElement(
        "/project/foo/utils/testUtil.ts"
      );
      const element2 = matcher.describeDependencyElement(
        "foo",
        "/project/foo/utils/testUtil.ts"
      );

      expect({ ...element1, source: undefined }).toEqual({
        ...element2,
        source: undefined,
      });
    });

    it("should exclude files when only ignorePaths is provided", () => {
      const otherDescriptors = elements.getMatcher(
        [
          {
            type: "component",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
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
          [
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
          {
            ignorePaths: ["**/src/**/*.tsx"],
          }
        )
      ).toThrow(
        "Element descriptor at index 1 must have a pattern, and either a 'type' or 'category' defined."
      );
    });

    it("should not include files when includePaths do not match", () => {
      const otherDescriptors = elements.getMatcher(
        [
          {
            type: "component",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
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
        [
          {
            type: "component",
            category: "react",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
        {}
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx"
      );

      expect(element).toEqual({
        type: "component",
        category: "react",
        captured: {
          fileName: "Button",
        },
        elementPath: "/project/src/components/Button.tsx",
        internalPath: "Button.tsx",
        parents: [],
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        path: "/project/src/components/Button.tsx",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
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
        category: "react",
        captured: {
          fileName: "Button",
        },
        elementPath: "/project/src/components/Button.tsx",
        internalPath: "Button.tsx",
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
        category: "business-logic",
        captured: {
          elementName: "math",
          testFileName: "math",
          businessLogicArea: "utils",
          root: "/project",
        },
        isUnknown: false,
        isIgnored: false,
        elementPath: "/project/src/utils/math/math.test.ts",
        internalPath: "math.test.ts",
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
        type: null,
        category: "business-logic",
        captured: null,
        elementPath: "/project/src/modules/user",
        internalPath: "foo.ts",
        path: "/project/src/modules/user/foo.ts",
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
        category: null,
        captured: {
          baseFolder: "/project",
          serviceName: "payment",
          serviceFileName: "PaymentService",
        },
        elementPath: "/project/src/services/payment/PaymentService.ts",
        path: "/project/src/services/payment/PaymentService.ts",
        internalPath: "PaymentService.ts",
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
        category: null,
        captured: null,
        baseSource: null,
        elementPath: null,
        internalPath: null,
        parents: null,
        source: null,
        path: "/project/src/misc/other.ts",
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
        category: null,
        captured: null,
        isIgnored: false,
        elementPath: "/project/src/utils/math/mathUtil.ts",
        internalPath: "mathUtil.ts",
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
        type: null,
        category: "business-logic",
        captured: null,
        isIgnored: false,
        elementPath: "/project/src/foo/var/modules/notification/modules/email",
        internalPath: "EmailService.ts",
        origin: "local",
        path: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        isUnknown: false,
        parents: [
          {
            type: null,
            captured: null,
            category: "business-logic",
            elementPath: "/project/src/foo/var/modules/notification",
          },
          {
            type: "foo",
            captured: null,
            category: null,
            elementPath: "/project/src/foo/var",
          },
        ],
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to local dependency elements correctly", () => {
      const element = matcher.describeDependencyElement(
        "math/index",
        "/project/src/utils/math/index.ts"
      );

      expect(element).toEqual({
        type: "utility",
        category: null,
        isIgnored: false,
        captured: null,
        internalPath: "index.ts",
        elementPath: "/project/src/utils/math/index.ts",
        source: "math/index",
        origin: "local",
        parents: [],
        path: "/project/src/utils/math/index.ts",
        isUnknown: false,
      });
      expect(isLocalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    // TODO: Add "external" mode to descriptors, and test known external elements too
    it("should assign descriptions to unknown external dependency elements correctly", () => {
      const element = matcher.describeDependencyElement(
        "react",
        "/project/node_modules/react/index.tsx"
      );

      expect(element).toEqual({
        type: null,
        category: null,
        captured: null,
        elementPath: null,
        parents: null,
        internalPath: "",
        source: "react",
        baseSource: "react",
        isIgnored: false,
        origin: "external",
        path: "/project/node_modules/react/index.tsx",
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to unknown scoped external dependency elements correctly", () => {
      const element = matcher.describeDependencyElement(
        "@mui/icons-material",
        "/project/node_modules/@mui/icons-material/index.tsx"
      );

      expect(element).toEqual({
        type: null,
        category: null,
        captured: null,
        elementPath: null,
        internalPath: "",
        isIgnored: false,
        parents: null,
        source: "@mui/icons-material",
        baseSource: "@mui/icons-material",
        origin: "external",
        path: "/project/node_modules/@mui/icons-material/index.tsx",
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to unknown scoped external dependency with path elements correctly", () => {
      const element = matcher.describeDependencyElement(
        "@mui/icons-material/foo",
        "/project/node_modules/@mui/icons-material/index.tsx"
      );

      expect(element).toEqual({
        type: null,
        category: null,
        captured: null,
        elementPath: null,
        parents: null,
        internalPath: "/foo",
        source: "@mui/icons-material/foo",
        baseSource: "@mui/icons-material",
        isIgnored: false,
        origin: "external",
        path: "/project/node_modules/@mui/icons-material/index.tsx",
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to external elements correctly", () => {
      const element = matcher.describeDependencyElement("react");

      expect(element).toEqual({
        type: null,
        category: null,
        captured: null,
        elementPath: null,
        internalPath: "",
        parents: null,
        source: "react",
        baseSource: "react",
        isIgnored: false,
        origin: "external",
        path: null,
        isUnknown: true,
      });
      expect(isExternalDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to core elements correctly", () => {
      const element = matcher.describeDependencyElement("node:fs");

      expect(element).toEqual({
        type: null,
        category: null,
        captured: null,
        elementPath: null,
        internalPath: null,
        parents: null,
        source: "node:fs",
        baseSource: "node:fs",
        isIgnored: false,
        origin: "core",
        path: null,
        isUnknown: true,
      });
      expect(isCoreDependencyElement(element)).toBe(true);
      expect(isElementDescription(element)).toBe(true);
    });

    it("should assign descriptions to core elements without node prefix correctly", () => {
      const element = matcher.describeDependencyElement("fs");

      expect(element).toEqual({
        type: null,
        category: null,
        captured: null,
        elementPath: null,
        internalPath: null,
        parents: null,
        source: "fs",
        baseSource: "fs",
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
      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      matcher.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
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
      matcher.describeDependencyElement(
        "@mui/icons-material/foo",
        "/project/node_modules/@mui/icons-material/index.tsx"
      );

      expect(micromatchSpy).not.toHaveBeenCalled();
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

      expect(dependency).toEqual({
        from: {
          captured: {
            fileName: "Button",
          },
          category: "react",
          elementPath: "/project/src/components/Button.tsx",
          internalPath: "Button.tsx",
          isIgnored: false,
          origin: "local",
          parents: [],
          path: "/project/src/components/Button.tsx",
          type: "component",
          isUnknown: false,
        },
        to: {
          captured: null,
          baseSource: null,
          elementPath: null,
          internalPath: null,
          parents: null,
          category: null,
          origin: "local",
          path: "/project/src/bar/Baz.ts",
          isIgnored: false,
          source: "project/bar",
          type: null,
          isUnknown: true,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          category: null,
          baseSource: null,
          elementPath: null,
          internalPath: null,
          parents: null,
          source: null,
          captured: null,
          origin: "local",
          path: "/project/src/var/Baz.ts",
          isIgnored: false,
          type: null,
          isUnknown: true,
        },
        to: {
          captured: null,
          category: null,
          origin: "local",
          path: "/project/src/bar/Baz.ts",
          isIgnored: false,
          source: "project/bar",
          type: null,
          isUnknown: true,
          baseSource: null,
          elementPath: null,
          internalPath: null,
          parents: null,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          baseSource: null,
          elementPath: null,
          internalPath: null,
          parents: null,
          source: null,
          category: null,
          captured: null,
          origin: null,
          isIgnored: true,
          path: "/var/var/Baz.ts",
          type: null,
          isUnknown: true,
        },
        to: {
          baseSource: null,
          elementPath: null,
          internalPath: null,
          parents: null,
          captured: null,
          category: null,
          origin: null,
          isIgnored: true,
          path: "/var/bar/Baz.ts",
          source: "project/bar",
          type: null,
          isUnknown: true,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: "component",
          category: "react",
          captured: {
            fileName: "Button",
          },
          elementPath: "/project/src/components/Button.tsx",
          internalPath: "Button.tsx",
          parents: [],
          isIgnored: false,
          origin: "local",
          path: "/project/src/components/Button.tsx",
          isUnknown: false,
        },
        to: {
          type: "test",
          category: "business-logic",
          isIgnored: false,
          captured: {
            elementName: "math",
            testFileName: "math",
            businessLogicArea: "utils",
            root: "/project",
          },
          elementPath: "/project/src/utils/math/math.test.ts",
          internalPath: "math.test.ts",
          parents: [],
          origin: "local",
          path: "/project/src/utils/math/math.test.ts",
          source: "../utils/math/math.test.ts",
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          captured: {
            fileName: "Button",
          },
          category: "react",
          elementPath: "/project/src/components/Button.tsx",
          internalPath: "Button.tsx",
          origin: "local",
          parents: [],
          path: "/project/src/components/Button.tsx",
          type: "component",
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          baseSource: "react",
          captured: null,
          elementPath: null,
          parents: null,
          category: null,
          origin: "external",
          path: "/project/node_modules/react/index.tsx",
          internalPath: "",
          source: "react",
          type: null,
          isIgnored: false,
          isUnknown: true,
        },
        dependency: {
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

    it("should describe dependency to core elements correctly", () => {
      const dependency = matcher.describeDependency({
        from: "/project/src/components/Button.tsx",
        source: "fs",
        kind: "type",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toEqual({
        from: {
          captured: {
            fileName: "Button",
          },
          category: "react",
          elementPath: "/project/src/components/Button.tsx",
          internalPath: "Button.tsx",
          origin: "local",
          parents: [],
          path: "/project/src/components/Button.tsx",
          type: "component",
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          baseSource: "fs",
          captured: null,
          elementPath: null,
          internalPath: null,
          parents: null,
          category: null,
          origin: "core",
          path: null,
          source: "fs",
          type: null,
          isIgnored: false,
          isUnknown: true,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath: "/project/src/foo/var/modules/notification",
          internalPath: "NotificationService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/NotificationService.ts",
          parents: [
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "./modules/email/EmailService",
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/email",
          internalPath: "EmailService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath: "/project/src/foo/var/modules/notification",
          internalPath: "NotificationService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/NotificationService.ts",
          parents: [
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "./EmailService",
          type: null,
          category: "business-logic",
          captured: null,
          elementPath: "/project/src/foo/var/modules/notification",
          internalPath: "EmailService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/EmailService.ts",
          parents: [
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath: "/project/src/foo/var/modules/notification",
          internalPath: "NotificationService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/NotificationService.ts",
          parents: [
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "./modules/email/modules/send/SendService",
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/email/modules/send",
          internalPath: "SendService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/modules/send/SendService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath:
                "/project/src/foo/var/modules/notification/modules/email",
            },
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/phone",
          internalPath: "PhoneService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/phone/PhoneService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "../email/EmailService",
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/email",
          internalPath: "EmailService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/email",
          internalPath: "EmailService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "../../NotificationService",

          type: null,
          category: "business-logic",
          captured: null,
          elementPath: "/project/src/foo/var/modules/notification",
          internalPath: "NotificationService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/NotificationService.ts",
          parents: [
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/email/modules/send",
          internalPath: "SendService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/modules/send/SendService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath:
                "/project/src/foo/var/modules/notification/modules/email",
            },
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "./modules/email/modules/send/SendService",
          type: null,
          category: "business-logic",
          captured: null,
          elementPath: "/project/src/foo/var/modules/notification",
          internalPath: "NotificationService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/NotificationService.ts",
          parents: [
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/phone/modules/sms",
          internalPath: "SmsService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          parents: [
            {
              captured: null,
              category: "business-logic",
              elementPath:
                "/project/src/foo/var/modules/notification/modules/phone",
              type: null,
            },
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "../../../email/EmailService",
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/email",
          internalPath: "EmailService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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

      expect(dependency).toEqual({
        from: {
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/email",
          internalPath: "EmailService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
          parents: [
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        to: {
          source: "../../../email/EmailService",
          type: null,
          category: "business-logic",
          captured: null,
          elementPath:
            "/project/src/foo/var/modules/notification/modules/phone/modules/sms",
          internalPath: "SmsService.ts",
          origin: "local",
          path: "/project/src/foo/var/modules/notification/modules/phone/modules/sms/SmsService.ts",
          parents: [
            {
              captured: null,
              category: "business-logic",
              elementPath:
                "/project/src/foo/var/modules/notification/modules/phone",
              type: null,
            },
            {
              type: null,
              captured: null,
              category: "business-logic",
              elementPath: "/project/src/foo/var/modules/notification",
            },
            {
              type: "foo",
              captured: null,
              category: null,
              elementPath: "/project/src/foo/var",
            },
          ],
          isIgnored: false,
          isUnknown: false,
        },
        dependency: {
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
