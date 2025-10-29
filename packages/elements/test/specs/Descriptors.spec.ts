import micromatch from "micromatch";

import type { Descriptors } from "../../src/index";
import {
  Elements,
  isIgnoredElement,
  isKnownLocalElement,
  isExternalDependency,
  isUnknownLocalElement,
  isCoreDependency,
  isElement,
  isLocalDependency,
  isDependencyDescription,
} from "../../src/index";

describe("descriptors", () => {
  let descriptors: Descriptors;
  let elements: Elements;
  let micromatchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatchSpy = jest.spyOn(micromatch, "capture");

    elements = new Elements({
      rootPath: "/project",
      includePaths: ["**/src/**/*.ts", "**/src/**/*.tsx"],
      ignorePaths: ["**/src/**/__tests__/**"],
    });
    descriptors = elements.getDescriptors([
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
      const element = descriptors.describeElement(
        "/project/src/utils/__tests__/testUtil.ts",
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should not include elements not included in includePaths", () => {
      const element = descriptors.describeElement(
        "/project/foo/utils/testUtil.ts",
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should exclude files when only ignorePaths is provided", () => {
      const otherDescriptors = elements.getDescriptors(
        [
          {
            type: "component",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
        {
          rootPath: "/project",
          ignorePaths: ["**/src/**/*.tsx"],
        },
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx",
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should not include files when includePaths do not match", () => {
      const otherDescriptors = elements.getDescriptors(
        [
          {
            type: "component",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
        {
          rootPath: "/project",
          includePaths: ["**/src/**/*.md"],
        },
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx",
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should include every file by default", () => {
      const otherDescriptors = elements.getDescriptors(
        [
          {
            type: "component",
            category: "react",
            pattern: "/project/src/components/*.tsx",
            mode: "file",
            capture: ["fileName"],
          },
        ],
        {
          rootPath: "/project",
        },
      );

      const element = otherDescriptors.describeElement(
        "/project/src/components/Button.tsx",
      );

      expect(element).toEqual({
        type: "component",
        category: "react",
        capturedValues: {
          fileName: "Button",
        },
        elementPath: "/project/src/components/Button.tsx",
        internalPath: "Button.tsx",
        parents: [],
        origin: "local",
        path: "/project/src/components/Button.tsx",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });
  });

  describe("element descriptions", () => {
    it("should return unknown elements when no path is provided", () => {
      const element = descriptors.describeElement();

      expect(isUnknownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to local elements correctly", () => {
      const element = descriptors.describeElement(
        "/project/src/components/Button.tsx",
      );

      expect(element).toEqual({
        type: "component",
        category: "react",
        capturedValues: {
          fileName: "Button",
        },
        elementPath: "/project/src/components/Button.tsx",
        internalPath: "Button.tsx",
        parents: [],
        origin: "local",
        path: "/project/src/components/Button.tsx",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to local elements with basePattern correctly", () => {
      const element = descriptors.describeElement(
        "/project/src/utils/math/math.test.ts",
      );

      expect(element).toEqual({
        type: "test",
        category: "business-logic",
        capturedValues: {
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
      });

      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptors without capture properties correctly", () => {
      const element = descriptors.describeElement(
        "/project/src/modules/user/foo.ts",
      );

      expect(element).toEqual({
        type: null,
        category: "business-logic",
        capturedValues: null,
        elementPath: "/project/src/modules/user",
        internalPath: "foo.ts",
        path: "/project/src/modules/user/foo.ts",
        parents: [],
        origin: "local",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to local elements in full mode correctly", () => {
      const element = descriptors.describeElement(
        "/project/src/services/payment/PaymentService.ts",
      );

      expect(element).toEqual({
        type: "service",
        category: null,
        capturedValues: {
          baseFolder: "/project",
          serviceName: "payment",
          serviceFileName: "PaymentService",
        },
        elementPath: "/project/src/services/payment/PaymentService.ts",
        path: "/project/src/services/payment/PaymentService.ts",
        internalPath: "PaymentService.ts",
        parents: [],
        origin: "local",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign unknown local element description when no descriptor matches", () => {
      const element = descriptors.describeElement("/project/src/misc/other.ts");

      expect(element).toEqual({
        type: null,
        category: null,
        capturedValues: null,
        path: "/project/src/misc/other.ts",
        origin: "local",
      });
      expect(isUnknownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should not assign category when not specified in the descriptor", () => {
      const element = descriptors.describeElement(
        "/project/src/utils/math/mathUtil.ts",
      );

      expect(element).toEqual({
        type: "utility",
        category: null,
        capturedValues: null,
        elementPath: "/project/src/utils/math/mathUtil.ts",
        internalPath: "mathUtil.ts",
        origin: "local",
        parents: [],
        path: "/project/src/utils/math/mathUtil.ts",
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to local elements using captured parent folders", () => {
      const element = descriptors.describeElement(
        "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
      );

      expect(element).toEqual({
        type: null,
        category: "business-logic",
        capturedValues: null,
        elementPath: "/project/src/foo/var/modules/notification/modules/email",
        internalPath: "EmailService.ts",
        origin: "local",
        path: "/project/src/foo/var/modules/notification/modules/email/EmailService.ts",
        parents: [
          {
            type: null,
            capturedValues: null,
            category: "business-logic",
            elementPath: "/project/src/foo/var/modules/notification",
          },
          {
            type: "foo",
            capturedValues: null,
            category: null,
            elementPath: "/project/src/foo/var",
          },
        ],
      });
      expect(isKnownLocalElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to local dependency elements correctly", () => {
      const element = descriptors.describeElement(
        "/project/src/utils/math/index.ts",
        "math/index",
      );

      expect(element).toEqual({
        type: "utility",
        category: null,
        capturedValues: null,
        internalPath: "index.ts",
        elementPath: "/project/src/utils/math/index.ts",
        source: "math/index",
        baseSource: "math",
        origin: "local",
        parents: [],
        path: "/project/src/utils/math/index.ts",
      });
      expect(isLocalDependency(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    // TODO: Add "external" mode to descriptors, and test known external elements too
    it("should assign descriptions to unknown external dependency elements correctly", () => {
      // TODO: Should this be exposed as a different method? describeDependencyElement?
      const element = descriptors.describeElement(
        "/project/node_modules/react/index.tsx",
        "react",
      );

      expect(element).toEqual({
        type: null,
        category: null,
        capturedValues: null,
        internalPath: "",
        source: "react",
        baseSource: "react",
        origin: "external",
        path: "/project/node_modules/react/index.tsx",
      });
      expect(isExternalDependency(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to unknown scoped external dependency elements correctly", () => {
      const element = descriptors.describeElement(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material",
      );

      expect(element).toEqual({
        type: null,
        category: null,
        capturedValues: null,
        internalPath: "",
        source: "@mui/icons-material",
        baseSource: "@mui/icons-material",
        origin: "external",
        path: "/project/node_modules/@mui/icons-material/index.tsx",
      });
      expect(isExternalDependency(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to unknown scoped external dependency with path elements correctly", () => {
      const element = descriptors.describeElement(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material/foo",
      );

      expect(element).toEqual({
        type: null,
        category: null,
        capturedValues: null,
        internalPath: "/foo",
        source: "@mui/icons-material/foo",
        baseSource: "@mui/icons-material",
        origin: "external",
        path: "/project/node_modules/@mui/icons-material/index.tsx",
      });
      expect(isExternalDependency(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to unknown core elements correctly", () => {
      const element = descriptors.describeElement(undefined, "node:fs");

      expect(element).toEqual({
        type: null,
        category: null,
        capturedValues: null,
        source: "node:fs",
        baseSource: "node:fs",
        origin: "core",
        path: null,
      });
      expect(isCoreDependency(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should assign descriptions to unknown core elements without node prefix correctly", () => {
      const element = descriptors.describeElement(undefined, "fs");

      expect(element).toEqual({
        type: null,
        category: null,
        capturedValues: null,
        source: "fs",
        baseSource: "fs",
        origin: "core",
        path: null,
      });
      expect(isCoreDependency(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });

    it("should ignore external dependency elements based on ignorePaths", () => {
      const otherDescriptors = elements.getDescriptors([], {
        rootPath: "/project",
        ignorePaths: ["**/node_modules/**"],
      });

      const element = otherDescriptors.describeElement(
        "/project/node_modules/react/index.tsx",
        "react",
      );

      expect(element).toEqual(expect.objectContaining({ isIgnored: true }));
      expect(isIgnoredElement(element)).toBe(true);
      expect(isElement(element)).toBe(true);
    });
  });

  describe("elements descriptor cache", () => {
    it("should not call micromatch multiple times for the same element", () => {
      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache", () => {
      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      descriptors.clearCache();

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data", () => {
      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = descriptors.serializeCache();

      descriptors.clearCache();

      descriptors.setCacheFromSerialized(serializedCache);

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = elements.serializeCache();

      descriptors.clearCache();

      elements.setCacheFromSerialized(serializedCache);

      descriptors.describeElement("/project/src/utils/math/index.ts");

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch more than one per same file when getting dependency elements for the same file but different sources", () => {
      descriptors.describeElement(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material/foo",
      );

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeElement(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material/var",
      );

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again when getting same dependency element after clearing cache", () => {
      descriptors.describeElement(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material/foo",
      );

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeElement(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material/foo",
      );

      expect(micromatchSpy).not.toHaveBeenCalled();

      descriptors.clearCache();

      descriptors.describeElement(
        "/project/node_modules/@mui/icons-material/index.tsx",
        "@mui/icons-material/foo",
      );

      expect(micromatchSpy).toHaveBeenCalled();
    });
  });

  describe("dependency descriptions", () => {
    it("should return dependency to unknown elements", () => {
      const dependency = descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
        nodeKind: "ImportDeclaration",
      });

      expect(dependency).toEqual({
        from: {
          capturedValues: {
            fileName: "Button",
          },
          category: "react",
          elementPath: "/project/src/components/Button.tsx",
          internalPath: "Button.tsx",
          origin: "local",
          parents: [],
          path: "/project/src/components/Button.tsx",
          type: "component",
        },
        to: {
          baseSource: "project",
          capturedValues: null,
          category: null,
          origin: "local",
          path: "/project/src/bar/Baz.ts",
          source: "project/bar",
          type: null,
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
      const dependency = descriptors.describeDependency({
        from: "/project/src/var/Baz.ts",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
        specifiers: ["foo", "bar"],
      });

      expect(dependency).toEqual({
        from: {
          category: null,
          capturedValues: null,
          origin: "local",
          path: "/project/src/var/Baz.ts",
          type: null,
        },
        to: {
          baseSource: "project",
          capturedValues: null,
          category: null,
          origin: "local",
          path: "/project/src/bar/Baz.ts",
          source: "project/bar",
          type: null,
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
      const dependency = descriptors.describeDependency({
        from: "/var/var/Baz.ts",
        to: "/var/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
        specifiers: ["foo", "bar"],
      });

      // TODO: Ignored elements should have path, source, baseSource?
      expect(dependency).toEqual({
        from: {
          category: null,
          capturedValues: null,
          origin: "local",
          isIgnored: true,
          path: null,
          type: null,
        },
        to: {
          capturedValues: null,
          category: null,
          origin: "local",
          isIgnored: true,
          path: null,
          type: null,
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
      const dependency = descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/utils/math/math.test.ts",
        source: "../utils/math/math.test.ts",
        kind: "value",
        nodeKind: "Import",
        specifiers: ["calculateSum", "calculateAvg"],
      });

      // TODO: Ignored elements should have path, source, baseSource?
      expect(dependency).toEqual({
        from: {
          type: "component",
          category: "react",
          capturedValues: {
            fileName: "Button",
          },
          elementPath: "/project/src/components/Button.tsx",
          internalPath: "Button.tsx",
          parents: [],
          origin: "local",
          path: "/project/src/components/Button.tsx",
        },
        to: {
          type: "test",
          category: "business-logic",
          capturedValues: {
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
          // TODO: Makes sense to have source and baseSource in local elements with relative paths?
          baseSource: "..",
          source: "../utils/math/math.test.ts",
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
  });

  describe("dependency descriptor cache", () => {
    it("should not call micromatch multiple times for the same element", () => {
      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache", () => {
      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      descriptors.clearCache();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should call micromatch again after clearing the cache in the elements instance", () => {
      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      elements.clearCache();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data", () => {
      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = descriptors.serializeCache();

      descriptors.clearCache();

      descriptors.setCacheFromSerialized(serializedCache);

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch again after filling the cache with serialized data in elements", () => {
      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();

      const serializedCache = elements.serializeCache();

      descriptors.clearCache();

      elements.setCacheFromSerialized(serializedCache);

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });

    it("should not call micromatch more than one per same file when getting dependency elements for the same file but different sources", () => {
      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/bar",
        kind: "type",
      });

      expect(micromatchSpy).toHaveBeenCalled();

      jest.clearAllMocks();

      descriptors.describeDependency({
        from: "/project/src/components/Button.tsx",
        to: "/project/src/bar/Baz.ts",
        source: "project/foo",
        kind: "type",
      });

      expect(micromatchSpy).not.toHaveBeenCalled();
    });
  });

  // TODO: Validate that descriptors have at least type or category. Both being null has no sense
});
