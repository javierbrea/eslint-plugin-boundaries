import type { FileDescription } from "./FileDescription.types";
import {
  isFileDescription,
  isUnknownFileDescription,
  isKnownFileDescription,
  isIgnoredFileDescription,
} from "./FileDescriptionHelpers";

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

describe("FileDescriptionHelpers", () => {
  describe("isFileDescription", () => {
    it("should return true for a valid file description", () => {
      // Arrange
      const value = createValidFileDescription();

      // Act & Assert
      expect(isFileDescription(value)).toBe(true);
    });

    it("should return true when categories is null", () => {
      // Arrange
      const value = createValidFileDescription({ categories: null });

      // Act & Assert
      expect(isFileDescription(value)).toBe(true);
    });

    it("should return true when path is null", () => {
      // Arrange
      const value = createValidFileDescription({ path: null });

      // Act & Assert
      expect(isFileDescription(value)).toBe(true);
    });

    it("should return true when captured is null", () => {
      // Arrange
      const value = createValidFileDescription({ captured: null });

      // Act & Assert
      expect(isFileDescription(value)).toBe(true);
    });

    it("should return false when categories property is missing", () => {
      // Arrange
      const { categories: _categories, ...value } =
        createValidFileDescription();

      // Act & Assert
      expect(isFileDescription(value)).toBe(false);
    });

    it("should return false when path property is missing", () => {
      // Arrange
      const { path: _path, ...value } = createValidFileDescription();

      // Act & Assert
      expect(isFileDescription(value)).toBe(false);
    });

    it("should return false when captured property is missing", () => {
      // Arrange
      const { captured: _captured, ...value } = createValidFileDescription();

      // Act & Assert
      expect(isFileDescription(value)).toBe(false);
    });

    it("should return false when isIgnored property is missing", () => {
      // Arrange
      const { isIgnored: _isIgnored, ...value } = createValidFileDescription();

      // Act & Assert
      expect(isFileDescription(value)).toBe(false);
    });

    it("should return false when isUnknown property is missing", () => {
      // Arrange
      const { isUnknown: _isUnknown, ...value } = createValidFileDescription();

      // Act & Assert
      expect(isFileDescription(value)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isFileDescription({})).toBe(false);
    });

    it.each(["string", 123, null, undefined, [], true])(
      "should return false for non-object value: %p",
      (value) => {
        expect(isFileDescription(value)).toBe(false);
      }
    );
  });

  describe("isUnknownFileDescription", () => {
    it("should return true for an unknown file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: false,
        isUnknown: true,
        captured: null,
        categories: null,
      });

      // Act & Assert
      expect(isUnknownFileDescription(value)).toBe(true);
    });

    it("should return false for a known file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: false,
        isUnknown: false,
      });

      // Act & Assert
      expect(isUnknownFileDescription(value)).toBe(false);
    });

    it("should return true for an ignored file description because isUnknown is true", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: true,
        isUnknown: true,
        captured: null,
        categories: null,
      });

      // Act & Assert
      expect(isUnknownFileDescription(value)).toBe(true);
    });

    it("should return false when isUnknown is false even if isIgnored is true", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: true,
        isUnknown: false,
        captured: null,
        categories: null,
      });

      // Act & Assert
      expect(isUnknownFileDescription(value)).toBe(false);
    });

    it("should return false when value is not a file description", () => {
      // Arrange
      const value = { path: "src/foo.ts" };

      // Act & Assert
      expect(isUnknownFileDescription(value)).toBe(false);
    });

    it.each(["string", 123, null, undefined, [], true])(
      "should return false for non-object value: %p",
      (value) => {
        expect(isUnknownFileDescription(value)).toBe(false);
      }
    );
  });

  describe("isKnownFileDescription", () => {
    it("should return true for a known file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: false,
        isUnknown: false,
      });

      // Act & Assert
      expect(isKnownFileDescription(value)).toBe(true);
    });

    it("should return false for an unknown file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: false,
        isUnknown: true,
      });

      // Act & Assert
      expect(isKnownFileDescription(value)).toBe(false);
    });

    it("should return false for an ignored file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: true,
        isUnknown: true,
      });

      // Act & Assert
      expect(isKnownFileDescription(value)).toBe(false);
    });

    it("should return false when value is not a file description", () => {
      // Arrange
      const value = { path: "src/foo.ts" };

      // Act & Assert
      expect(isKnownFileDescription(value)).toBe(false);
    });

    it.each(["string", 123, null, undefined, [], true])(
      "should return false for non-object value: %p",
      (value) => {
        expect(isKnownFileDescription(value)).toBe(false);
      }
    );
  });

  describe("isIgnoredFileDescription", () => {
    it("should return true for an ignored file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: true,
        isUnknown: true,
        captured: null,
        categories: null,
      });

      // Act & Assert
      expect(isIgnoredFileDescription(value)).toBe(true);
    });

    it("should return false for a known file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: false,
        isUnknown: false,
      });

      // Act & Assert
      expect(isIgnoredFileDescription(value)).toBe(false);
    });

    it("should return false for an unknown file description", () => {
      // Arrange
      const value = createValidFileDescription({
        isIgnored: false,
        isUnknown: true,
      });

      // Act & Assert
      expect(isIgnoredFileDescription(value)).toBe(false);
    });

    it("should return false when value is not a file description", () => {
      // Arrange
      const value = { path: "src/foo.ts" };

      // Act & Assert
      expect(isIgnoredFileDescription(value)).toBe(false);
    });

    it.each(["string", 123, null, undefined, [], true])(
      "should return false for non-object value: %p",
      (value) => {
        expect(isIgnoredFileDescription(value)).toBe(false);
      }
    );
  });
});
