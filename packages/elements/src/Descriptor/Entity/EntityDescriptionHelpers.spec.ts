import type { ElementDescription } from "../Element/ElementDescription.types";
import type { FileDescription } from "../File/FileDescription.types";
import type { ModuleDescription } from "../Module/ModuleDescription.types";

import type { EntityDescription } from "./EntityDescription.types";
import { isEntityDescription } from "./EntityDescriptionHelpers";

function createValidElementDescription(
  overrides?: Partial<ElementDescription>
): ElementDescription {
  return {
    path: "src/components/Foo.ts",
    captured: { name: "Foo" },
    isIgnored: false,
    isUnknown: false,
    types: ["component"],
    category: "component",
    filePath: "src/components/Foo.ts",
    fileInternalPath: "Foo.ts",
    parents: [],
    ...overrides,
  };
}

function createValidFileDescription(
  overrides?: Partial<FileDescription>
): FileDescription {
  return {
    path: "src/components/Foo.ts",
    captured: { name: "Foo" },
    isIgnored: false,
    isUnknown: false,
    categories: ["component"],
    ...overrides,
  };
}

function createValidModuleDescription(
  overrides?: Partial<ModuleDescription>
): ModuleDescription {
  return {
    origin: "local",
    source: null,
    internalPath: null,
    ...overrides,
  };
}

function createValidEntityDescription(
  overrides?: Partial<EntityDescription>
): EntityDescription {
  return {
    element: createValidElementDescription(),
    file: createValidFileDescription(),
    module: createValidModuleDescription(),
    ...overrides,
  };
}

describe("EntityDescriptionHelpers", () => {
  describe("isEntityDescription", () => {
    it("should return true for a valid entity description", () => {
      // Arrange
      const value = createValidEntityDescription();

      // Act & Assert
      expect(isEntityDescription(value)).toBe(true);
    });

    it("should return true when element has null values", () => {
      // Arrange
      const value = createValidEntityDescription({
        element: createValidElementDescription({
          path: null,
          captured: null,
          types: null,
          category: null,
          filePath: null,
          fileInternalPath: null,
        }),
      });

      // Act & Assert
      expect(isEntityDescription(value)).toBe(true);
    });

    it("should return true when file has null values", () => {
      // Arrange
      const value = createValidEntityDescription({
        file: createValidFileDescription({
          path: null,
          captured: null,
          categories: null,
        }),
      });

      // Act & Assert
      expect(isEntityDescription(value)).toBe(true);
    });

    it("should return true when module has different origins", () => {
      // Arrange
      const value = createValidEntityDescription({
        module: createValidModuleDescription({
          origin: "external",
          source: "lodash",
          internalPath: "index.js",
        }),
      });

      // Act & Assert
      expect(isEntityDescription(value)).toBe(true);
    });

    it("should return false when element property is missing", () => {
      // Arrange
      const { element: _element, ...value } = createValidEntityDescription();

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false when file property is missing", () => {
      // Arrange
      const { file: _file, ...value } = createValidEntityDescription();

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false when module property is missing", () => {
      // Arrange
      const { module: _module, ...value } = createValidEntityDescription();

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false when element is not a valid ElementDescription", () => {
      // Arrange
      const value = {
        element: { invalid: true },
        file: createValidFileDescription(),
        module: createValidModuleDescription(),
      };

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false when element is missing types property", () => {
      // Arrange
      const { types: _types, ...invalidElement } =
        createValidElementDescription();
      const value = {
        element: invalidElement,
        file: createValidFileDescription(),
        module: createValidModuleDescription(),
      };

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false when element is missing parents property", () => {
      // Arrange
      const { parents: _parents, ...invalidElement } =
        createValidElementDescription();
      const value = {
        element: invalidElement,
        file: createValidFileDescription(),
        module: createValidModuleDescription(),
      };

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false when file is not a valid FileDescription", () => {
      // Arrange
      const value = {
        element: createValidElementDescription(),
        file: { invalid: true },
        module: createValidModuleDescription(),
      };

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false when file is missing categories property", () => {
      // Arrange
      const { categories: _categories, ...invalidFile } =
        createValidFileDescription();
      const value = {
        element: createValidElementDescription(),
        file: invalidFile,
        module: createValidModuleDescription(),
      };

      // Act & Assert
      expect(isEntityDescription(value)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isEntityDescription({})).toBe(false);
    });

    it.each(["string", 123, null, undefined, [], true])(
      "should return false for non-object value: %p",
      (value) => {
        expect(isEntityDescription(value)).toBe(false);
      }
    );
  });
});
