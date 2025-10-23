import type {
  LocalElement,
  LocalDependencyElement,
  ExternalDependencyElement,
  BaseElementDescriptor,
  ElementDescriptorWithType,
  ElementDescriptorWithCategory,
  ElementDescriptorWithTypeAndCategory,
} from "../../../src/Descriptor/ElementsDescriptor.types";
import {
  isLocalElement,
  isDependencyElement,
  isExternalDependency,
  isLocalDependency,
  isElement,
  isElementDescriptorMode,
  isElementDescriptorPattern,
  isBaseElementDescriptor,
  isElementDescriptorWithType,
  isElementDescriptorWithCategory,
  isElementDescriptorWithTypeAndCategory,
  isElementDescriptor,
  isDependencyKind,
} from "../../../src/Descriptor/ElementsDescriptorHelpers";

describe("elementHelpers", () => {
  describe("isDependencyKind", () => {
    it("should return true for valid kinds", () => {
      expect(isDependencyKind("type")).toBe(true);
      // Deprecated alias should still be accepted if present in the map
      expect(isDependencyKind("value")).toBe(true);
    });

    it("should return false for invalid kinds and non-strings", () => {
      expect(isDependencyKind(123)).toBe(false);
      expect(isDependencyKind(null)).toBe(false);
      expect(isDependencyKind(undefined)).toBe(false);
      expect(isDependencyKind("invalid-kind")).toBe(false);
      expect(isDependencyKind({})).toBe(false);
    });
  });

  describe("isLocalElement", () => {
    it("should return true for local elements", () => {
      const localElement: LocalElement = {
        category: null,
        type: "component",
        capturedValues: {},
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        isKnown: true,
        isExternal: false,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return true for local elements with category", () => {
      const localElement: LocalElement = {
        category: "react",
        type: null,
        capturedValues: {},
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        isKnown: true,
        isExternal: false,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return true for local elements with type and category", () => {
      const localElement: LocalElement = {
        category: "react",
        type: "component",
        capturedValues: {},
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        isKnown: true,
        isExternal: false,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return false for objects without path property", () => {
      const nonLocalElement: ExternalDependencyElement = {
        category: null,
        type: "dependency",
        capturedValues: {},
        source: "react",
        specifiers: ["useState", "useEffect"],
        isExternal: true,
        isKnown: true,
        path: "foo",
        isBuiltIn: false,
        baseModule: "react",
        kind: "type",
        nodeKind: "import",
      };

      expect(isLocalElement(nonLocalElement)).toBe(false);
    });

    it("should return false for objects without category nor type", () => {
      // @ts-expect-error Check type guard
      const nonLocalElement: LocalDependencyElement = {
        category: null,
        type: null,
        capturedValues: {},
        parents: [],
        capture: null,
        source: "react",
        elementPath: "foo",
        internalPath: "foo",
        isIgnored: false,
        path: "/src/components/Button.tsx",
        specifiers: ["useState", "useEffect"],
        isExternal: false,
        isLocal: true,
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
          capture: null,
          source: "react",
          specifiers: ["Component", "useState"],
          isExternal: true,
          isLocal: false,
          isBuiltIn: false,
          baseModule: "react",
          parents: [],
          path: "/src/deps/react.ts",
          elementPath: "/src/deps",
          internalPath: "react.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(dependencyElement)).toBe(true);
      });

      it("should return false for non-dependency elements", () => {
        const nonDependencyElement = {
          type: "utils",
          category: null,
          capturedValues: {},
          capture: null,
          parents: [],
          path: "/src/utils/helpers.ts",
          elementPath: "/src/utils",
          internalPath: "helpers.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(nonDependencyElement)).toBe(false);
      });

      it("should return false for elements without category nor type", () => {
        const nonDependencyElement = {
          type: null,
          category: "other",
          capturedValues: {},
          capture: null,
          parents: [],
          path: "/src/utils/helpers.ts",
          elementPath: "/src/utils",
          internalPath: "helpers.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(nonDependencyElement)).toBe(false);
      });

      it("should return false for elements without capturedValues", () => {
        const nonDependencyElement = {
          type: null,
          category: "category",
          capturedValues: {},
          capture: null,
          parents: [],
          path: "/src/utils/helpers.ts",
          elementPath: "/src/utils",
          internalPath: "helpers.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(nonDependencyElement)).toBe(false);
      });

      it("should return false for objects that don't comply with type contract", () => {
        expect(isDependencyElement({})).toBe(false);

        expect(
          isDependencyElement({
            source: undefined,
            capturedValues: {},
            capture: null,
          }),
        ).toBe(false);
        expect(isDependencyElement(null)).toBe(false);
      });

      it("should return false for primitive values and edge cases", () => {
        expect(isDependencyElement(undefined)).toBe(false);
        expect(isDependencyElement("not-an-object")).toBe(false);
        expect(isDependencyElement([])).toBe(false);
      });

      it("should validate source property for dependency elements", () => {
        const elementWithNullSource = {
          type: "component",
          category: null,
          capturedValues: {},
          capture: null,
          source: null,
          specifiers: ["test"],
          isExternal: true,
          isLocal: false,
          isBuiltIn: false,
          baseModule: "test",
          parents: [],
          path: "/src/deps/test.ts",
          elementPath: "/src/deps",
          internalPath: "test.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(elementWithNullSource)).toBe(false);

        const elementWithEmptyStringSource = {
          type: "component",
          category: null,
          capturedValues: {},
          capture: null,
          source: "",
          specifiers: ["test"],
          isExternal: true,
          isLocal: false,
          isBuiltIn: false,
          baseModule: "test",
          parents: [],
          path: "/src/deps/test.ts",
          elementPath: "/src/deps",
          internalPath: "test.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(elementWithEmptyStringSource)).toBe(true);

        const elementWithUndefinedSource = {
          type: "component",
          category: null,
          capturedValues: {},
          capture: null,
          source: undefined,
          specifiers: ["test"],
          isExternal: true,
          isLocal: false,
          isBuiltIn: false,
          baseModule: "test",
          parents: [],
          path: "/src/deps/test.ts",
          elementPath: "/src/deps",
          internalPath: "test.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(elementWithUndefinedSource)).toBe(false);
      });

      it("should return true for objects with minimal required properties", () => {
        const minimalDependencyElement = {
          type: "component",
          category: null,
          capturedValues: {},
          capture: null,
          source: "react",
          specifiers: null,
          isExternal: true,
          isLocal: false,
          isBuiltIn: false,
          baseModule: "react",
          parents: [],
          path: "/src/deps/react.ts",
          elementPath: "/src/deps",
          internalPath: "react.ts",
          isIgnored: false,
        };

        expect(isDependencyElement(minimalDependencyElement)).toBe(true);
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
        specifiers: ["Button", "ButtonProps"],
        isExternal: false,
        isKnown: true,
        kind: "type",
        nodeKind: "import",
      };

      expect(isLocalDependency(localDependency)).toBe(true);
    });

    it("should return false for objects without category nor type", () => {
      // @ts-expect-error Check type guards
      const nonLocalDependency: ExternalDependencyElement = {
        type: null,
        category: null,
        capturedValues: {},
        capture: null,
        source: "lodash",
        specifiers: ["isEmpty", "merge"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "lodash",
        isLocal: false,
      };

      expect(isLocalDependency(nonLocalDependency)).toBe(false);
    });

    it("should return false for objects without capturedValues", () => {
      // @ts-expect-error Check type guards
      const nonLocalDependency: ExternalDependencyElement = {
        type: null,
        category: "category",
        source: "lodash",
        specifiers: ["isEmpty", "merge"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "lodash",
        path: "foo",
        kind: "type",
        nodeKind: "import",
      };

      expect(isLocalDependency(nonLocalDependency)).toBe(false);
    });

    it("should return false for non-local dependencies", () => {
      const nonLocalDependency: ExternalDependencyElement = {
        isKnown: true,
        type: "dependency",
        category: null,
        capturedValues: {},
        source: "lodash",
        specifiers: ["isEmpty", "merge"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "lodash",
        kind: "type",
        nodeKind: "import",
        path: "foo",
      };

      expect(isLocalDependency(nonLocalDependency)).toBe(false);
    });

    it("should return false for objects that don't comply with type contract", () => {
      expect(isLocalDependency({})).toBe(false);
      expect(isLocalDependency({ path: undefined })).toBe(false);
      expect(isLocalDependency(null)).toBe(false);
    });

    it("should return false for primitive values and invalid objects", () => {
      expect(isLocalDependency(undefined)).toBe(false);
      expect(isLocalDependency(42)).toBe(false);
      expect(isLocalDependency({ source: "valid-source" })).toBe(false);
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
        baseModule: "react",
      };

      expect(isLocalDependency(dependencyButNotLocal)).toBe(false);

      // Test object that passes both but has isLocal set to false
      const localElementButNotLocalDependency: LocalElement = {
        type: "test",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/test.ts",
        elementPath: "/src",
        internalPath: "test.ts",
        isKnown: true,
        isExternal: false,
      };

      // LocalElement is not a dependency, so should return false
      expect(isLocalDependency(localElementButNotLocalDependency)).toBe(false);

      // Test object that has all properties but isLocal is false
      const dependencyWithLocalFalse = {
        type: "utils",
        category: null,
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/utils/helper.ts",
        elementPath: "/src/utils",
        internalPath: "helper.ts",
        isIgnored: false,
        source: "../constants",
        specifiers: ["API_URL"],
        isExternal: false,
        isLocal: false, // This should make it fail
      };

      // Should return false because isLocal is false
      expect(isLocalDependency(dependencyWithLocalFalse)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalLocalDependency = {
        type: "component",
        category: null,
        capturedValues: {},
        path: "/src/utils/helper.ts", // Required for isLocalElement
        source: "../constants", // Required for isDependencyElement
        isLocal: true, // Required for isLocalDependency
        // Missing other properties, but these are the minimal requirements
      };

      expect(isLocalDependency(minimalLocalDependency)).toBe(true);
    });
  });

  describe("isExternalDependency", () => {
    it("should return true for external dependencies", () => {
      const externalDependency: ExternalDependencyElement = {
        type: "dependency",
        category: null,
        capturedValues: {},
        source: "fs",
        specifiers: ["readFileSync", "writeFileSync"],
        isExternal: true,
        isBuiltIn: true,
        baseModule: "fs",
        kind: "type",
        nodeKind: "import",
        path: "foo",
        isKnown: true,
      };

      expect(isExternalDependency(externalDependency)).toBe(true);
    });

    it("should return false for objects without category nor type", () => {
      // @ts-expect-error Check type guard
      const externalDependency: ExternalDependencyElement = {
        type: null,
        category: null,
        capturedValues: {},
        capture: null,
        source: "fs",
        specifiers: ["readFileSync", "writeFileSync"],
        isExternal: true,
        isBuiltIn: true,
        baseModule: "fs",
        isLocal: false,
      };

      expect(isExternalDependency(externalDependency)).toBe(false);
    });

    it("should return true for object without capturedValues", () => {
      // @ts-expect-error Check type guard
      const externalDependency: ExternalDependencyElement = {
        type: "dependency",
        category: null,
        source: "fs",
        specifiers: ["readFileSync", "writeFileSync"],
        isExternal: true,
        isBuiltIn: true,
        baseModule: "fs",
      };

      expect(isExternalDependency(externalDependency)).toBe(false);
    });

    it("should return false for non-external dependencies", () => {
      const nonExternalDependency: LocalDependencyElement = {
        type: "service",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/services/api.ts",
        elementPath: "/src/services",
        internalPath: "api.ts",
        isExternal: false,
        isKnown: true,
        source: "../utils/http",
        specifiers: ["HttpClient"],
        kind: "type",
        nodeKind: "import",
      };

      expect(isExternalDependency(nonExternalDependency)).toBe(false);
    });

    it("should return false for objects that don't comply with type contract", () => {
      expect(isExternalDependency({})).toBe(false);
      expect(isExternalDependency({ isExternal: false })).toBe(false);
      expect(isExternalDependency(null)).toBe(false);
    });

    it("should return false for primitive values and malformed objects", () => {
      expect(isExternalDependency(undefined)).toBe(false);
      expect(isExternalDependency(false)).toBe(false);
      expect(isExternalDependency({ isExternal: true })).toBe(false);
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
        baseModule: null, // Invalid baseModule
        isLocal: false,
      };

      expect(isExternalDependency(elementWithInvalidBaseModule)).toBe(false);
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
        baseModule: "helper",
        isLocal: true,
      };

      expect(isExternalDependency(dependencyButNotExternal)).toBe(false);

      // Test object that fails isDependencyElement check
      const notADependency = {
        type: "component",
        category: null,
        capturedValues: {},
        source: null,
        isExternal: true,
        isBuiltIn: false,
        baseModule: "test",
      };

      expect(isExternalDependency(notADependency)).toBe(false);

      // Test object with valid isExternal but invalid baseModule type
      const externalWithInvalidBaseModule = {
        type: "component",
        category: null,
        capturedValues: {},
        source: "lodash",
        specifiers: ["map"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: 123, // Should be string
        isLocal: false,
      };

      expect(isExternalDependency(externalWithInvalidBaseModule)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalExternalDependency = {
        type: "component",
        category: null,
        capturedValues: {},
        source: "lodash", // Required for isDependencyElement
        isExternal: true, // Required for isExternalDependency
        baseModule: "lodash", // Required for isExternalDependency (must be string)
        // Missing other properties, but these are the minimal requirements
      };

      expect(isExternalDependency(minimalExternalDependency)).toBe(true);
    });
  });

  describe("isElement", () => {
    it("should return true for local elements", () => {
      const localElement: LocalElement = {
        type: "component",
        category: null,
        capturedValues: {},
        parents: [],
        path: "/src/components/Header.tsx",
        elementPath: "/src/components",
        internalPath: "Header.tsx",
        isKnown: true,
        isExternal: false,
      };

      expect(isElement(localElement)).toBe(true);
    });

    it("should return false for objects without category nor type", () => {
      // @ts-expect-error Check type guards
      const localElement: LocalElement = {
        type: null,
        category: null,
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/components/Header.tsx",
        elementPath: "/src/components",
        internalPath: "Header.tsx",
        isIgnored: false,
      };

      expect(isElement(localElement)).toBe(false);
    });

    it("should return false for objects with type and category", () => {
      const localElement: LocalElement = {
        type: "type",
        category: "category",
        capturedValues: {},
        parents: [],
        path: "/src/components/Header.tsx",
        elementPath: "/src/components",
        internalPath: "Header.tsx",
        isExternal: false,
        isKnown: true,
      };

      expect(isElement(localElement)).toBe(true);
    });

    it("should return false for objects without capturedValues", () => {
      // @ts-expect-error Check type guards
      const localElement: LocalElement = {
        type: null,
        category: "category",
        parents: [],
        path: "/src/components/Header.tsx",
        elementPath: "/src/components",
        internalPath: "Header.tsx",
      };

      expect(isElement(localElement)).toBe(false);
    });

    it("should return true for external dependency elements", () => {
      const externalDependency: ExternalDependencyElement = {
        type: "dependency",
        category: null,
        capturedValues: {},
        path: "foo",
        source: "lodash",
        specifiers: ["map", "filter"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "lodash",
        kind: "type",
        nodeKind: "import",
        isKnown: true,
      };

      expect(isElement(externalDependency)).toBe(true);
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
        specifiers: ["PI", "E"],
        isExternal: false,
        kind: "type",
        nodeKind: "import",
        isKnown: true,
      };

      expect(isElement(localDependency)).toBe(true);
    });

    it("should return false for objects that are neither local nor dependency elements", () => {
      expect(isElement({})).toBe(false);
      expect(isElement({ randomProperty: "value" })).toBe(false);
      expect(isElement(null)).toBe(false);
      expect(isElement(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isElement("string")).toBe(false);
      expect(isElement(123)).toBe(false);
      expect(isElement(true)).toBe(false);
      expect(isElement([])).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalLocalElement = {
        type: "component",
        category: null,
        capturedValues: {},
        path: "/src/test.ts",
        // Missing other properties, but path is all that's required for isLocalElement
      };

      const minimalDependencyElement = {
        type: "component",
        category: null,
        capturedValues: {},
        source: "react",
        // Missing other properties, but source is all that's required for isDependencyElement
      };

      expect(isElement(minimalLocalElement)).toBe(true); // Has path, so it's a local element
      expect(isElement(minimalDependencyElement)).toBe(true); // Has source, so it's a dependency element
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
          true,
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
          }),
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
          }),
        ).toBe(false);
      });
    });

    describe("isElementDescriptorWithTypeAndCategory", () => {
      it("should return true when both type and category are present", () => {
        const both: ElementDescriptorWithTypeAndCategory = {
          pattern: ["src/**/*.ts"],
          type: "service",
          category: "infrastructure",
        };

        expect(isElementDescriptorWithTypeAndCategory(both)).toBe(true);
      });

      it("should return false when one of type or category is missing or invalid", () => {
        expect(
          isElementDescriptorWithTypeAndCategory({
            pattern: ["src/**/*.ts"],
            type: null,
            category: "category",
          }),
        ).toBe(false);
        expect(
          isElementDescriptorWithTypeAndCategory({
            pattern: ["src/**/*.ts"],
            type: "x",
            category: null,
          }),
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
