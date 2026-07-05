import type { ElementDescription } from "./ElementDescription.types";
import {
  isElementDescription,
  isIgnoredElementDescription,
  isKnownElementDescription,
  isUnknownElementDescription,
} from "./ElementDescriptionHelpers";

function createElementDescription(
  overrides: Partial<ElementDescription> = {}
): ElementDescription {
  return {
    path: "/some/path",
    captured: { key: "value" },
    isIgnored: false,
    isUnknown: false,
    types: ["component"],
    category: "ui",
    filePath: "/some/file.ts",
    fileInternalPath: "file.ts",
    parents: [],
    ...overrides,
  } as ElementDescription;
}

describe("ElementDescriptionHelpers", () => {
  describe("isElementDescription", () => {
    it("should return true for a valid element description", () => {
      // Arrange
      const value = createElementDescription();

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when types and parents are null or empty", () => {
      // Arrange
      const value = createElementDescription({
        types: null,
        parents: [],
      });

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for null", () => {
      // Arrange
      const value = null;

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for undefined", () => {
      // Arrange
      const value = undefined;

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for a non-object value", () => {
      // Arrange
      const value = "not an object";

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for an empty object", () => {
      // Arrange
      const value = {};

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when base description properties are missing", () => {
      // Arrange
      const value = { types: ["component"], parents: [] };

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when 'types' property is missing", () => {
      // Arrange
      const value = {
        path: "/some/path",
        captured: null,
        isIgnored: false,
        isUnknown: false,
        parents: [],
      };

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when 'parents' property is missing", () => {
      // Arrange
      const value = {
        path: "/some/path",
        captured: null,
        isIgnored: false,
        isUnknown: false,
        types: ["component"],
      };

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for arrays", () => {
      // Arrange
      const value = [1, 2, 3];

      // Act
      const result = isElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("isUnknownElementDescription", () => {
    it("should return true for an unknown element description", () => {
      // Arrange
      const value = createElementDescription({
        isUnknown: true,
        isIgnored: false,
      });

      // Act
      const result = isUnknownElementDescription(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for a known element description", () => {
      // Arrange
      const value = createElementDescription({
        isUnknown: false,
        isIgnored: false,
      });

      // Act
      const result = isUnknownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for an ignored element description with isUnknown true", () => {
      // Arrange
      const value = createElementDescription({
        isIgnored: true,
        isUnknown: true,
      });

      // Act
      const result = isUnknownElementDescription(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for an ignored element description with isUnknown false", () => {
      // Arrange
      const value = createElementDescription({
        isIgnored: true,
        isUnknown: false,
      });

      // Act
      const result = isUnknownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for a non-element value", () => {
      // Arrange
      const value = { path: "/some/path" };

      // Act
      const result = isUnknownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for null", () => {
      // Arrange
      const value = null;

      // Act
      const result = isUnknownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("isKnownElementDescription", () => {
    it("should return true for a known element description", () => {
      // Arrange
      const value = createElementDescription({
        isIgnored: false,
        isUnknown: false,
      });

      // Act
      const result = isKnownElementDescription(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for an unknown element description", () => {
      // Arrange
      const value = createElementDescription({
        isUnknown: true,
        isIgnored: false,
      });

      // Act
      const result = isKnownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for an ignored element description", () => {
      // Arrange
      const value = createElementDescription({
        isIgnored: true,
        isUnknown: true,
      });

      // Act
      const result = isKnownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for a non-element value", () => {
      // Arrange
      const value = "not-an-element";

      // Act
      const result = isKnownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for null", () => {
      // Arrange
      const value = null;

      // Act
      const result = isKnownElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("isIgnoredElementDescription", () => {
    it("should return true for an ignored element description", () => {
      // Arrange
      const value = createElementDescription({
        isIgnored: true,
        isUnknown: true,
      });

      // Act
      const result = isIgnoredElementDescription(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for a known element description", () => {
      // Arrange
      const value = createElementDescription({
        isIgnored: false,
        isUnknown: false,
      });

      // Act
      const result = isIgnoredElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for an unknown element description", () => {
      // Arrange
      const value = createElementDescription({
        isUnknown: true,
        isIgnored: false,
      });

      // Act
      const result = isIgnoredElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for a non-element value", () => {
      // Arrange
      const value = 42;

      // Act
      const result = isIgnoredElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for null", () => {
      // Arrange
      const value = null;

      // Act
      const result = isIgnoredElementDescription(value);

      // Assert
      expect(result).toBe(false);
    });
  });
});
