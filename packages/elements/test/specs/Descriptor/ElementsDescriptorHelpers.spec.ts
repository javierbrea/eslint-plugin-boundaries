import type {
  LocalElement,
  LocalDependencyElement,
  ExternalDependencyElement,
} from "../../../src/Descriptor/ElementsDescriptor.types";
import {
  isLocalElement,
  isDependencyElement,
  isExternalDependency,
  isLocalDependency,
  isElement,
} from "../../../src/Descriptor/ElementsDescriptorHelpers";

describe("elementHelpers", () => {
  describe("isLocalElement", () => {
    it("should return true for local elements", () => {
      const localElement: LocalElement = {
        type: "component",
        types: ["component"],
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        isIgnored: false,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return false for objects without path property", () => {
      const nonLocalElement: ExternalDependencyElement = {
        type: "dependency",
        types: ["dependency"],
        capturedValues: {},
        capture: null,
        source: "react",
        specifiers: ["useState", "useEffect"],
        isExternal: true,
        isLocal: false,
        isBuiltIn: false,
        baseModule: "react",
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

    it("should return true for objects with minimal required properties", () => {
      const minimalLocalElement = {
        path: "/src/test.ts",
        // Missing other properties, but path is all that's required for isLocalElement
      };

      expect(isLocalElement(minimalLocalElement)).toBe(true);
    });
  });

  describe("isDependencyElement", () => {
    it("should return true for dependency elements", () => {
      const dependencyElement: ExternalDependencyElement = {
        type: "dependency",
        types: ["dependency"],
        capturedValues: {},
        capture: null,
        source: "react",
        specifiers: ["Component", "useState"],
        isExternal: true,
        isLocal: false,
        isBuiltIn: false,
        baseModule: "react",
      };

      expect(isDependencyElement(dependencyElement)).toBe(true);
    });

    it("should return false for non-dependency elements", () => {
      const nonDependencyElement: LocalElement = {
        type: "utils",
        types: ["utils"],
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
      expect(isDependencyElement({ source: undefined })).toBe(false);
      expect(isDependencyElement(null)).toBe(false);
    });

    it("should return false for primitive values and edge cases", () => {
      expect(isDependencyElement(undefined)).toBe(false);
      expect(isDependencyElement("not-an-object")).toBe(false);
      expect(isDependencyElement([])).toBe(false);
    });

    it("should validate source property for dependency elements", () => {
      // Test that source property is properly validated
      const elementWithNullSource = {
        source: null,
        specifiers: ["test"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "test",
      };

      expect(isDependencyElement(elementWithNullSource)).toBe(false);

      const elementWithEmptyStringSource = {
        source: "",
        specifiers: ["test"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "test",
      };

      expect(isDependencyElement(elementWithEmptyStringSource)).toBe(true);

      const elementWithUndefinedSource = {
        source: undefined,
        specifiers: ["test"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "test",
      };

      expect(isDependencyElement(elementWithUndefinedSource)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalDependencyElement = {
        source: "react",
        // Missing other properties, but source is all that's required for isDependencyElement
      };

      expect(isDependencyElement(minimalDependencyElement)).toBe(true);
    });
  });

  describe("isLocalDependency", () => {
    it("should return true for local dependencies", () => {
      const localDependency: LocalDependencyElement = {
        type: "component",
        types: ["component"],
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/components/Button/index.ts",
        elementPath: "/src/components/Button",
        internalPath: "index.ts",
        isIgnored: false,
        isLocal: true,
        source: "./Button.component",
        specifiers: ["Button", "ButtonProps"],
        isExternal: false,
      };

      expect(isLocalDependency(localDependency)).toBe(true);
    });

    it("should return false for non-local dependencies", () => {
      const nonLocalDependency: ExternalDependencyElement = {
        type: "dependency",
        types: ["dependency"],
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

    it("should return false for objects that don't comply with type contract", () => {
      // @ts-expect-error - Testing behavior with invalid object
      expect(isLocalDependency({})).toBe(false);

      // @ts-expect-error - Testing behavior with partial object
      expect(isLocalDependency({ path: undefined })).toBe(false);

      // @ts-expect-error - Testing behavior with null
      expect(isLocalDependency(null)).toBe(false);
    });

    it("should return false for primitive values and invalid objects", () => {
      // @ts-expect-error - Testing behavior with undefined
      expect(isLocalDependency(undefined)).toBe(false);

      // @ts-expect-error - Testing behavior with primitive values
      expect(isLocalDependency(42)).toBe(false);

      // @ts-expect-error - Testing behavior with object missing required properties
      expect(isLocalDependency({ source: "valid-source" })).toBe(false);
    });

    it("should validate all required properties for local dependencies", () => {
      // Test object that passes isDependencyElement but fails isLocalElement
      const dependencyButNotLocal = {
        source: "react",
        specifiers: ["useState"],
        isExternal: true,
        isLocal: true, // This is set but no path property
        isBuiltIn: false,
        baseModule: "react",
      };

      // @ts-expect-error - Testing behavior with missing path
      expect(isLocalDependency(dependencyButNotLocal)).toBe(false);

      // Test object that passes both but has isLocal set to false
      const localElementButNotLocalDependency: LocalElement = {
        type: "test",
        types: ["test"],
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/test.ts",
        elementPath: "/src",
        internalPath: "test.ts",
        isIgnored: false,
      };

      // LocalElement is not a dependency, so should return false
      expect(isLocalDependency(localElementButNotLocalDependency)).toBe(false);

      // Test object that has all properties but isLocal is false
      const dependencyWithLocalFalse = {
        type: "utils",
        types: ["utils"],
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
        path: "/src/utils/helper.ts", // Required for isLocalElement
        source: "../constants", // Required for isDependencyElement
        isLocal: true, // Required for isLocalDependency
        // Missing other properties, but these are the minimal requirements
      };

      // @ts-expect-error - Testing behavior with minimal properties
      expect(isLocalDependency(minimalLocalDependency)).toBe(true);
    });
  });

  describe("isExternalDependency", () => {
    it("should return true for external dependencies", () => {
      const externalDependency: ExternalDependencyElement = {
        type: "dependency",
        types: ["dependency"],
        capturedValues: {},
        capture: null,
        source: "fs",
        specifiers: ["readFileSync", "writeFileSync"],
        isExternal: true,
        isBuiltIn: true,
        baseModule: "fs",
        isLocal: false,
      };

      expect(isExternalDependency(externalDependency)).toBe(true);
    });

    it("should return false for non-external dependencies", () => {
      const nonExternalDependency: LocalDependencyElement = {
        type: "service",
        types: ["service"],
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/services/api.ts",
        elementPath: "/src/services",
        internalPath: "api.ts",
        isIgnored: false,
        isLocal: true,
        isExternal: false,
        source: "../utils/http",
        specifiers: ["HttpClient"],
      };

      expect(isExternalDependency(nonExternalDependency)).toBe(false);
    });

    it("should return false for objects that don't comply with type contract", () => {
      // @ts-expect-error - Testing behavior with invalid object
      expect(isExternalDependency({})).toBe(false);

      // @ts-expect-error - Testing behavior with partial object
      expect(isExternalDependency({ isExternal: false })).toBe(false);

      // @ts-expect-error - Testing behavior with null
      expect(isExternalDependency(null)).toBe(false);
    });

    it("should return false for primitive values and malformed objects", () => {
      // @ts-expect-error - Testing behavior with undefined
      expect(isExternalDependency(undefined)).toBe(false);

      // @ts-expect-error - Testing behavior with primitive values
      expect(isExternalDependency(false)).toBe(false);

      // @ts-expect-error - Testing behavior with object missing critical properties
      expect(isExternalDependency({ isExternal: true })).toBe(false);
    });

    it("should validate baseModule property is a string", () => {
      const elementWithInvalidBaseModule = {
        source: "react",
        specifiers: ["useState"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: null, // Invalid baseModule
        isLocal: false,
      };

      // @ts-expect-error - Testing behavior with invalid baseModule
      expect(isExternalDependency(elementWithInvalidBaseModule)).toBe(false);
    });

    it("should validate all required conditions for external dependencies", () => {
      // Test object that passes isDependencyElement but isExternal is false
      const dependencyButNotExternal = {
        source: "../utils/helper",
        specifiers: ["helper"],
        isExternal: false, // This should make it fail
        isBuiltIn: false,
        baseModule: "helper",
        isLocal: true,
      };

      // @ts-expect-error - Testing behavior with isExternal: false
      expect(isExternalDependency(dependencyButNotExternal)).toBe(false);

      // Test object that fails isDependencyElement check
      const notADependency = {
        source: null,
        isExternal: true,
        isBuiltIn: false,
        baseModule: "test",
      };

      // @ts-expect-error - Testing behavior with null source
      expect(isExternalDependency(notADependency)).toBe(false);

      // Test object with valid isExternal but invalid baseModule type
      const externalWithInvalidBaseModule = {
        source: "lodash",
        specifiers: ["map"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: 123, // Should be string
        isLocal: false,
      };

      // @ts-expect-error - Testing behavior with non-string baseModule
      expect(isExternalDependency(externalWithInvalidBaseModule)).toBe(false);
    });

    it("should return true for objects with minimal required properties", () => {
      const minimalExternalDependency = {
        source: "lodash", // Required for isDependencyElement
        isExternal: true, // Required for isExternalDependency
        baseModule: "lodash", // Required for isExternalDependency (must be string)
        // Missing other properties, but these are the minimal requirements
      };

      // @ts-expect-error - Testing behavior with minimal properties
      expect(isExternalDependency(minimalExternalDependency)).toBe(true);
    });
  });

  describe("isElement", () => {
    it("should return true for local elements", () => {
      const localElement: LocalElement = {
        type: "component",
        types: ["component"],
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/components/Header.tsx",
        elementPath: "/src/components",
        internalPath: "Header.tsx",
        isIgnored: false,
      };

      expect(isElement(localElement)).toBe(true);
    });

    it("should return true for external dependency elements", () => {
      const externalDependency: ExternalDependencyElement = {
        type: "dependency",
        types: ["dependency"],
        capturedValues: {},
        capture: null,
        source: "lodash",
        specifiers: ["map", "filter"],
        isExternal: true,
        isLocal: false,
        isBuiltIn: false,
        baseModule: "lodash",
      };

      expect(isElement(externalDependency)).toBe(true);
    });

    it("should return true for local dependency elements", () => {
      const localDependency: LocalDependencyElement = {
        type: "utils",
        types: ["utils"],
        capturedValues: {},
        capture: null,
        parents: [],
        path: "/src/utils/math.ts",
        elementPath: "/src/utils",
        internalPath: "math.ts",
        isIgnored: false,
        isLocal: true,
        source: "./constants",
        specifiers: ["PI", "E"],
        isExternal: false,
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
        path: "/src/test.ts",
        // Missing other properties, but path is all that's required for isLocalElement
      };

      const minimalDependencyElement = {
        source: "react",
        // Missing other properties, but source is all that's required for isDependencyElement
      };

      expect(isElement(minimalLocalElement)).toBe(true); // Has path, so it's a local element
      expect(isElement(minimalDependencyElement)).toBe(true); // Has source, so it's a dependency element
    });
  });
});
