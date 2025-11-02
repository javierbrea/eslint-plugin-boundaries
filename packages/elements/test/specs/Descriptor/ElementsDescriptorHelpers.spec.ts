import type {
  LocalDependencyElement,
  ExternalDependencyElement,
  BaseElementDescriptor,
  ElementDescriptorWithType,
  ElementDescriptorWithCategory,
  ElementDescriptorWithTypeAndCategory,
  FileElement,
} from "../../../src/Descriptor/ElementsDescriptor.types";
import {
  isLocalElement,
  isDependencyElementDescription,
  isExternalDependencyElement,
  isLocalDependencyElement,
  isElementDescription,
  isElementDescriptorMode,
  isElementDescriptorPattern,
  isBaseElementDescriptor,
  isElementDescriptorWithType,
  isElementDescriptorWithCategory,
  isElementDescriptor,
} from "../../../src/Descriptor/ElementsDescriptorHelpers";

describe("elementHelpers", () => {
  describe("isLocalElement", () => {
    it("should return true for local elements", () => {
      const localElement: FileElement = {
        category: null,
        type: "component",
        capturedValues: {},
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        source: null,
        baseSource: null,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return true for local elements with category", () => {
      const localElement: FileElement = {
        category: "react",
        type: null,
        capturedValues: {},
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        source: null,
        baseSource: null,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return true for local elements with type and category", () => {
      const localElement: FileElement = {
        category: "react",
        type: "component",
        capturedValues: {},
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        source: null,
        baseSource: null,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return false for objects without path property", () => {
      const nonLocalElement: ExternalDependencyElement = {
        category: null,
        type: "dependency",
        capturedValues: {},
        source: "react",
        path: "foo",
        baseSource: "react",
        internalPath: "react/index.js",
        origin: "external",
        isIgnored: false,
        isUnknown: true,
        parents: null,
        elementPath: null,
      };

      expect(isLocalElement(nonLocalElement)).toBe(false);
    });

    it("should return false for objects that don't comply with type contract", () => {
      expect(isLocalElement({})).toBe(false);
      expect(isLocalElement({ isLocal: false })).toBe(false);
      expect(isLocalElement(null)).toBe(false);
      expect(isLocalElement(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isLocalElement("string")).toBe(false);
      expect(isLocalElement(123)).toBe(false);
      expect(isLocalElement(true)).toBe(false);
    });

    describe("isDependencyElement", () => {
      it("should return true for dependency elements", () => {
        const dependencyElement = {
          type: "dependency",
          category: null,
          capturedValues: {},
          source: "react",
          baseSource: "react",
          parents: [],
          path: "/src/deps/react.ts",
          elementPath: "/src/deps",
          internalPath: "react.ts",
          origin: "external",
          isIgnored: false,
          isUnknown: false,
        };

        expect(isDependencyElementDescription(dependencyElement)).toBe(true);
      });

      it("should return false for non-dependency elements", () => {
        const nonDependencyElement = {
          type: "utils",
          category: null,
          capturedValues: {},
          parents: [],
          path: "/src/utils/helpers.ts",
          elementPath: "/src/utils",
          internalPath: "helpers.ts",
          isIgnored: false,
          isUnknown: false,
        };

        expect(isDependencyElementDescription(nonDependencyElement)).toBe(
          false
        );
      });

      it("should return false for elements without category nor type", () => {
        const nonDependencyElement = {
          type: null,
          category: "other",
          capturedValues: {},
          parents: [],
          path: "/src/utils/helpers.ts",
          elementPath: "/src/utils",
          internalPath: "helpers.ts",
          isIgnored: false,
          isUnknown: false,
        };

        expect(isDependencyElementDescription(nonDependencyElement)).toBe(
          false
        );
      });

      it("should return false for elements without capturedValues", () => {
        const nonDependencyElement = {
          type: null,
          category: "category",
          capturedValues: {},
          parents: [],
          path: "/src/utils/helpers.ts",
          elementPath: "/src/utils",
          internalPath: "helpers.ts",
          isIgnored: false,
          isUnknown: false,
        };

        expect(isDependencyElementDescription(nonDependencyElement)).toBe(
          false
        );
      });

      it("should return false for objects that don't comply with type contract", () => {
        expect(isDependencyElementDescription({})).toBe(false);

        expect(
          isDependencyElementDescription({
            source: undefined,
            capturedValues: {},
          })
        ).toBe(false);
        expect(isDependencyElementDescription(null)).toBe(false);
      });

      it("should return false for primitive values and edge cases", () => {
        expect(isDependencyElementDescription(undefined)).toBe(false);
        expect(isDependencyElementDescription("not-an-object")).toBe(false);
        expect(isDependencyElementDescription([])).toBe(false);
      });

      it("should validate source property for dependency elements", () => {
        const elementWithNullSource = {
          type: "component",
          category: null,
          capturedValues: {},
          source: null,
          baseSource: "test",
          parents: [],
          path: "/src/deps/test.ts",
          elementPath: "/src/deps",
          internalPath: "test.ts",
          origin: "external",
          isIgnored: false,
          isUnknown: false,
        };

        expect(isDependencyElementDescription(elementWithNullSource)).toBe(
          false
        );

        const elementWithEmptyStringSource = {
          type: "component",
          category: null,
          capturedValues: {},
          source: "",
          baseSource: "test",
          parents: [],
          path: "/src/deps/test.ts",
          elementPath: "/src/deps",
          internalPath: "test.ts",
          origin: "external",
          isIgnored: false,
          isUnknown: false,
        };

        expect(
          isDependencyElementDescription(elementWithEmptyStringSource)
        ).toBe(true);

        const elementWithUndefinedSource = {
          type: "component",
          category: null,
          capturedValues: {},
          source: undefined,
          baseSource: "test",
          parents: [],
          path: "/src/deps/test.ts",
          elementPath: "/src/deps",
          internalPath: "test.ts",
          origin: "external",
          isIgnored: false,
          isUnknown: false,
        };

        expect(isDependencyElementDescription(elementWithUndefinedSource)).toBe(
          false
        );
      });

      it("should return true for objects with minimal required properties", () => {
        const minimalDependencyElement = {
          type: "component",
          category: null,
          capturedValues: {},
          source: "react",
          baseSource: "react",
          parents: [],
          path: "/src/deps/react.ts",
          elementPath: "/src/deps",
          internalPath: "react.ts",
          origin: "external",
          isUnknown: false,
          isIgnored: false,
        };

        expect(isDependencyElementDescription(minimalDependencyElement)).toBe(
          true
        );
      });
    });
  });

  describe("isLocalDependency", () => {
    it("should return true for local dependencies", () => {
      const localDependency: LocalDependencyElement = {
        type: "component",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/components/Button/index.ts",
        elementPath: "/src/components/Button",
        internalPath: "index.ts",
        source: "./Button.component",
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        baseSource: null,
      };

      expect(isLocalDependencyElement(localDependency)).toBe(true);
    });

    it("should return false for objects without category nor type", () => {
      const nonLocalDependency: ExternalDependencyElement = {
        type: null,
        category: null,
        capturedValues: {},
        source: "lodash",
        path: "foo",
        origin: "external",
        internalPath: "lodash/index.js",
        baseSource: "./components/Button",
        isIgnored: false,
        isUnknown: true,
        parents: null,
        elementPath: null,
      };

      expect(isLocalDependencyElement(nonLocalDependency)).toBe(false);
    });

    it("should return false for objects without capturedValues", () => {
      const nonLocalDependency: ExternalDependencyElement = {
        type: null,
        category: null,
        source: "lodash",
        path: "foo",
        origin: "external",
        internalPath: "lodash/index.js",
        baseSource: "./components/Button",
        capturedValues: null,
        isUnknown: true,
        isIgnored: false,
        parents: null,
        elementPath: null,
      };

      expect(isLocalDependencyElement(nonLocalDependency)).toBe(false);
    });

    it("should return false for non-local dependencies", () => {
      const nonLocalDependency: ExternalDependencyElement = {
        type: null,
        category: null,
        source: "lodash",
        path: "foo",
        // @ts-expect-error Check type guards
        origin: "local",
        internalPath: "lodash/index.js",
        baseSource: "./components/Button",
        isUnknown: true,
        isIgnored: false,
      };

      expect(isLocalDependencyElement(nonLocalDependency)).toBe(false);
    });

    it("should return false for objects that don't comply with type contract", () => {
      expect(isLocalDependencyElement({})).toBe(false);
      expect(isLocalDependencyElement({ path: undefined })).toBe(false);
      expect(isLocalDependencyElement(null)).toBe(false);
    });

    it("should return false for primitive values and invalid objects", () => {
      expect(isLocalDependencyElement(undefined)).toBe(false);
      expect(isLocalDependencyElement(42)).toBe(false);
      expect(isLocalDependencyElement({ source: "valid-source" })).toBe(false);
    });

    it("should validate all required properties for local dependencies", () => {
      // Test object that passes isDependencyElement but fails isLocalElement
      const dependencyButNotLocal = {
        type: "component",
        category: null,
        capturedValues: {},
        source: "react",
        specifiers: ["useState"],
        isExternal: true,
        isLocal: true, // This is set but no path property
        isBuiltIn: false,
        baseSource: "react",
        isIgnored: false,
        isUnknown: false,
      };

      expect(isLocalDependencyElement(dependencyButNotLocal)).toBe(false);

      // Test object that passes both but has isLocal set to false
      const localElementButNotLocalDependency: FileElement = {
        type: "test",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/test.ts",
        elementPath: "/src",
        internalPath: "test.ts",
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        source: null,
        baseSource: null,
      };

      // LocalElement is not a dependency, so should return false
      expect(isLocalDependencyElement(localElementButNotLocalDependency)).toBe(
        false
      );

      // Test object that has all properties but isLocal is false
      const dependencyWithLocalFalse = {
        type: "utils",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/utils/helper.ts",
        elementPath: "/src/utils",
        internalPath: "helper.ts",
        source: "../constants",
        specifiers: ["API_URL"],
        isUnknown: true,
        isIgnored: false,
      };

      // Should return false because isLocal is false
      expect(isLocalDependencyElement(dependencyWithLocalFalse)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalLocalDependency = {
        type: "component",
        category: null,
        capturedValues: {},
        path: "/src/utils/helper.ts", // Required for isLocalElement
        source: "../constants", // Required for isDependencyElement
        baseSource: "../utils", // Required for isDependencyElement
        origin: "local",
        isUnknown: true,
        isIgnored: false,
      };

      expect(isLocalDependencyElement(minimalLocalDependency)).toBe(true);
    });
  });

  describe("isExternalDependency", () => {
    it("should return true for external dependencies", () => {
      const externalDependency: ExternalDependencyElement = {
        type: "dependency",
        category: null,
        capturedValues: {},
        source: "fs",
        baseSource: "fs",
        internalPath: "fs/index.js",
        path: "foo",
        origin: "external",
        isIgnored: false,
        isUnknown: true,
        parents: null,
        elementPath: null,
      };

      expect(isExternalDependencyElement(externalDependency)).toBe(true);
    });

    it("should return false for non-external dependencies", () => {
      const externalDependency: ExternalDependencyElement = {
        type: null,
        category: null,
        source: "fs",
        baseSource: "fs",
        internalPath: "fs/index.js",
        path: "foo",
        // @ts-expect-error Check type guard
        origin: "local",
        isUnknown: true,
      };

      expect(isExternalDependencyElement(externalDependency)).toBe(false);
    });

    it("should return false for objects that don't comply with type contract", () => {
      expect(isExternalDependencyElement({})).toBe(false);
      expect(isExternalDependencyElement({ isExternal: false })).toBe(false);
      expect(isExternalDependencyElement(null)).toBe(false);
    });

    it("should return false for primitive values and malformed objects", () => {
      expect(isExternalDependencyElement(undefined)).toBe(false);
      expect(isExternalDependencyElement(false)).toBe(false);
      expect(isExternalDependencyElement({ isExternal: true })).toBe(false);
    });

    it("should validate baseModule property is a string", () => {
      const elementWithInvalidBaseModule = {
        type: "component",
        category: null,
        capturedValues: {},
        source: "react",
        specifiers: ["useState"],
        isExternal: true,
        isBuiltIn: false,
        baseSource: null, // Invalid baseModule
        isLocal: false,
      };

      expect(isExternalDependencyElement(elementWithInvalidBaseModule)).toBe(
        false
      );
    });

    it("should validate all required conditions for external dependencies", () => {
      // Test object that passes isDependencyElement but isExternal is false
      const dependencyButNotExternal = {
        type: "component",
        category: null,
        capturedValues: {},
        source: "../utils/helper",
        specifiers: ["helper"],
        isExternal: false, // This should make it fail
        isBuiltIn: false,
        baseSource: "helper",
        isLocal: true,
      };

      expect(isExternalDependencyElement(dependencyButNotExternal)).toBe(false);

      // Test object that fails isDependencyElement check
      const notADependency = {
        type: "component",
        category: null,
        capturedValues: {},
        source: null,
        isExternal: true,
        isBuiltIn: false,
        baseSource: "test",
      };

      expect(isExternalDependencyElement(notADependency)).toBe(false);

      // Test object with valid isExternal but invalid baseModule type
      const externalWithInvalidBaseModule = {
        type: "component",
        category: null,
        capturedValues: {},
        source: "lodash",
        specifiers: ["map"],
        isExternal: true,
        isBuiltIn: false,
        baseSource: 123, // Should be string
        isLocal: false,
      };

      expect(isExternalDependencyElement(externalWithInvalidBaseModule)).toBe(
        false
      );
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalExternalDependency = {
        isUnknown: true,
        isIgnored: false,
        type: "component",
        path: "foo",
        category: null,
        capturedValues: {},
        source: "lodash", // Required for isDependencyElement
        origin: "external",
        baseSource: "lodash", // Required for isExternalDependency (must be string)
        // Missing other properties, but these are the minimal requirements
      };

      expect(isExternalDependencyElement(minimalExternalDependency)).toBe(true);
    });
  });

  describe("isElement", () => {
    it("should return true for local elements", () => {
      const localElement: FileElement = {
        type: "component",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/components/Header.tsx",
        elementPath: "/src/components",
        internalPath: "Header.tsx",
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        source: null,
        baseSource: null,
      };

      expect(isElementDescription(localElement)).toBe(true);
    });

    it("should return false for objects without capturedValues", () => {
      // @ts-expect-error Check type guard
      const localElement: FileElement = {
        type: null,
        category: "category",
        parents: [],
        path: "/src/components/Header.tsx",
        elementPath: "/src/components",
        internalPath: "Header.tsx",
        origin: "local",
      };

      expect(isElementDescription(localElement)).toBe(false);
    });

    it("should return true for external dependency elements", () => {
      const externalDependency: ExternalDependencyElement = {
        type: "dependency",
        category: null,
        capturedValues: {},
        path: "foo",
        source: "lodash",
        baseSource: "lodash",
        origin: "external",
        internalPath: "lodash/index.js",
        isIgnored: false,
        isUnknown: false,
        parents: null,
        elementPath: null,
      };

      expect(isElementDescription(externalDependency)).toBe(true);
    });

    it("should return true for local dependency elements", () => {
      const localDependency: LocalDependencyElement = {
        type: "utils",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/utils/math.ts",
        elementPath: "/src/utils",
        internalPath: "math.ts",
        source: "./constants",
        origin: "local",
        isIgnored: false,
        isUnknown: false,
        baseSource: null,
      };

      expect(isElementDescription(localDependency)).toBe(true);
    });

    it("should return false for objects that are neither local nor dependency elements", () => {
      expect(isElementDescription({})).toBe(false);
      expect(isElementDescription({ randomProperty: "value" })).toBe(false);
      expect(isElementDescription(null)).toBe(false);
      expect(isElementDescription(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isElementDescription("string")).toBe(false);
      expect(isElementDescription(123)).toBe(false);
      expect(isElementDescription(true)).toBe(false);
      expect(isElementDescription([])).toBe(false);
    });

    it("should return true for dependency elements", () => {
      const minimalLocalElement = {
        type: "component",
        category: null,
        capturedValues: {},
        path: "/src/test.ts",
        origin: "local",
        source: "./test",
        baseSource: "./src",
        isUnknown: true,
        isIgnored: false,
      };

      expect(isElementDescription(minimalLocalElement)).toBe(true);
    });

    it("should return true for unknown elements", () => {
      const minimalLocalElement = {
        type: null,
        category: null,
        capturedValues: null,
        path: "/src/test.ts",
        origin: "local",
        isUnknown: true,
        isIgnored: false,
      };

      expect(isElementDescription(minimalLocalElement)).toBe(true);
    });

    it("should return true for ignored elements", () => {
      const minimalLocalElement = {
        type: null,
        category: null,
        capturedValues: {},
        path: "/src/test.ts",
        origin: "local",
        isIgnored: true,
        isUnknown: false,
      };

      expect(isElementDescription(minimalLocalElement)).toBe(true); // Has path, so it's a local element
    });
  });

  describe("element descriptor helpers", () => {
    describe("isElementDescriptorMode", () => {
      it("should return true for valid modes", () => {
        expect(isElementDescriptorMode("folder")).toBe(true);
        expect(isElementDescriptorMode("file")).toBe(true);
        expect(isElementDescriptorMode("full")).toBe(true);
      });

      it("should return false for invalid modes and non-strings", () => {
        expect(isElementDescriptorMode("invalid-mode")).toBe(false);
        expect(isElementDescriptorMode("")).toBe(false);

        expect(isElementDescriptorMode(null)).toBe(false);
        expect(isElementDescriptorMode(undefined)).toBe(false);
        expect(isElementDescriptorMode(123)).toBe(false);
      });
    });

    describe("isElementDescriptorPattern", () => {
      it("should return true for string patterns", () => {
        expect(isElementDescriptorPattern("src/**/*.ts")).toBe(true);
      });

      it("should return true for arrays of strings", () => {
        expect(isElementDescriptorPattern(["src/**/*.ts", "lib/**/*.ts"])).toBe(
          true
        );
      });

      it("should return false for empty arrays or non-strings", () => {
        expect(isElementDescriptorPattern([])).toBe(false);
        expect(isElementDescriptorPattern(["valid", 123])).toBe(false);
        expect(isElementDescriptorPattern({})).toBe(false);
        expect(isElementDescriptorPattern(null)).toBe(false);
      });
    });

    describe("isBaseElementDescriptor", () => {
      it("should return true for valid base descriptors", () => {
        const desc: BaseElementDescriptor = { pattern: "src/**/*.ts" };

        expect(isBaseElementDescriptor(desc)).toBe(true);

        const descArray: BaseElementDescriptor = {
          pattern: ["src/**/*.ts", "lib/**/*.ts"],
        };

        expect(isBaseElementDescriptor(descArray)).toBe(true);
      });

      it("should return false for invalid or missing pattern", () => {
        expect(isBaseElementDescriptor({})).toBe(false);
        expect(isBaseElementDescriptor({ pattern: [] })).toBe(false);
      });
    });

    describe("isElementDescriptorWithType", () => {
      it("should return true for descriptors with type", () => {
        const withType: ElementDescriptorWithType = {
          pattern: "src/**/*.ts",
          type: "component",
        };

        expect(isElementDescriptorWithType(withType)).toBe(true);
      });

      it("should return false for descriptors missing a valid type or pattern", () => {
        expect(isElementDescriptorWithType({})).toBe(false);
        expect(
          isElementDescriptorWithType({
            pattern: [],
            type: "component",
          })
        ).toBe(false);
      });
    });

    describe("isElementDescriptorWithCategory", () => {
      it("should return true for descriptors with category", () => {
        const withCategory: ElementDescriptorWithCategory = {
          pattern: "src/**/*.ts",
          category: "domain",
        };

        expect(isElementDescriptorWithCategory(withCategory)).toBe(true);
      });

      it("should return false for descriptors missing a valid category or pattern", () => {
        expect(isElementDescriptorWithCategory({})).toBe(false);
        expect(
          isElementDescriptorWithCategory({
            pattern: [],
            category: "a",
          })
        ).toBe(false);
      });
    });

    describe("isElementDescriptor", () => {
      it("should return true for descriptors with type, category or both", () => {
        const t: ElementDescriptorWithType = {
          pattern: "src/**/*.ts",
          type: "component",
        };

        const c: ElementDescriptorWithCategory = {
          pattern: "src/**/*.ts",
          category: "domain",
        };

        const both: ElementDescriptorWithTypeAndCategory = {
          pattern: "src/**/*.ts",
          type: "service",
          category: "infra",
        };

        expect(isElementDescriptor(t)).toBe(true);
        expect(isElementDescriptor(c)).toBe(true);
        expect(isElementDescriptor(both)).toBe(true);
      });

      it("should return false for base-only descriptors or invalid objects", () => {
        const base: BaseElementDescriptor = { pattern: "src/**/*.ts" };

        expect(isElementDescriptor(base)).toBe(false);

        expect(isElementDescriptor({})).toBe(false);
      });
    });
  });
});
