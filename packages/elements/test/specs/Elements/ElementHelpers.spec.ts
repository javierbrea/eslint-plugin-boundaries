import {
  isLocalElement,
  isDependencyElement,
  isExternalDependency,
  isLocalDependency,
} from "../../../src/Elements/ElementHelpers";
import type {
  LocalElement,
  LocalDependencyElement,
  ExternalDependencyElement,
} from "../../../src/Elements/ElementsDescriptor.types";

describe("elementHelpers", () => {
  describe("isLocalElement", () => {
    it("should return true for local elements", () => {
      const localElement: LocalElement = {
        parents: [],
        path: "/src/components/Button.tsx",
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        isIgnored: false,
      };

      expect(isLocalElement(localElement)).toBe(true);
    });

    it("should return false for non-local elements", () => {
      const nonLocalElement: ExternalDependencyElement = {
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
      // @ts-expect-error - Testing behavior with invalid object
      expect(isLocalElement({})).toBe(false);

      // @ts-expect-error - Testing behavior with partial object
      expect(isLocalElement({ isLocal: false })).toBe(false);

      // @ts-expect-error - Testing behavior with null and undefined
      expect(isLocalElement(null)).toBe(false);
      expect(isLocalElement(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      // @ts-expect-error - Testing behavior with primitive values
      expect(isLocalElement("string")).toBe(false);

      // @ts-expect-error - Testing behavior with primitive values
      expect(isLocalElement(123)).toBe(false);

      // @ts-expect-error - Testing behavior with primitive values
      expect(isLocalElement(true)).toBe(false);
    });

    it("should validate required properties for local elements", () => {
      // Test that path property is required and checked
      const elementWithoutPath: Partial<LocalElement> = {
        parents: [],
        elementPath: "/src/components",
        internalPath: "Button.tsx",
        isIgnored: false,
      };

      // @ts-expect-error - Testing behavior with missing path
      expect(isLocalElement(elementWithoutPath)).toBe(false);
    });
  });

  describe("isDependencyElement", () => {
    it("should return true for dependency elements", () => {
      const dependencyElement: ExternalDependencyElement = {
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
        parents: [],
        path: "/src/utils/helpers.ts",
        elementPath: "/src/utils",
        internalPath: "helpers.ts",
        isIgnored: false,
      };

      expect(isDependencyElement(nonDependencyElement)).toBe(false);
    });

    it("should return false for objects that don't comply with type contract", () => {
      // @ts-expect-error - Testing behavior with invalid object
      expect(isDependencyElement({})).toBe(false);

      // @ts-expect-error - Testing behavior with partial object
      expect(isDependencyElement({ source: undefined })).toBe(false);

      // @ts-expect-error - Testing behavior with null
      expect(isDependencyElement(null)).toBe(false);
    });

    it("should return false for primitive values and edge cases", () => {
      // @ts-expect-error - Testing behavior with undefined
      expect(isDependencyElement(undefined)).toBe(false);

      // @ts-expect-error - Testing behavior with primitive values
      expect(isDependencyElement("not-an-object")).toBe(false);

      // @ts-expect-error - Testing behavior with arrays
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

      // @ts-expect-error - Testing behavior with null source
      expect(isDependencyElement(elementWithNullSource)).toBe(false);

      const elementWithEmptyStringSource = {
        source: "",
        specifiers: ["test"],
        isExternal: true,
        isBuiltIn: false,
        baseModule: "test",
      };

      // @ts-expect-error - Testing behavior with empty string source (still valid string)
      expect(isDependencyElement(elementWithEmptyStringSource)).toBe(true);
    });
  });

  describe("isLocalDependency", () => {
    it("should return true for local dependencies", () => {
      const localDependency: LocalDependencyElement = {
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
  });

  describe("isExternalDependency", () => {
    it("should return true for external dependencies", () => {
      const externalDependency: ExternalDependencyElement = {
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
  });
});
