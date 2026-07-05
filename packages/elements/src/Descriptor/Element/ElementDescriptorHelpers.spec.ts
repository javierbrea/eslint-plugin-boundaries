import { isElementDescriptor } from "./ElementDescriptorHelpers";

describe("ElementDescriptorHelpers", () => {
  describe("isElementDescriptor", () => {
    it("should return true for an object with pattern and type", () => {
      // Arrange
      const value = { pattern: "src/**/*.ts", type: "component" };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for an object with pattern and category", () => {
      // Arrange
      const value = { pattern: "src/**/*.ts", category: "ui" };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for an object with pattern, type and category", () => {
      // Arrange
      const value = {
        pattern: "src/**/*.ts",
        type: "component",
        category: "ui",
      };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when pattern is a non-empty string array", () => {
      // Arrange
      const value = { pattern: ["src/**/*.ts", "lib/**/*.ts"], type: "util" };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for an object with pattern but without type or category", () => {
      // Arrange
      const value = { pattern: "src/**/*.ts" };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for an object without pattern", () => {
      // Arrange
      const value = { type: "component" };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for an empty object", () => {
      // Arrange
      const value = {};

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for null and undefined", () => {
      expect(isElementDescriptor(null)).toBe(false);
      expect(isElementDescriptor(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isElementDescriptor("string")).toBe(false);
      expect(isElementDescriptor(123)).toBe(false);
      expect(isElementDescriptor(true)).toBe(false);
    });

    it("should return false for arrays", () => {
      // Arrange
      const value = [{ pattern: "src/**/*.ts", type: "component" }];

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when pattern is an empty array", () => {
      // Arrange
      const value = { pattern: [], type: "component" };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when pattern is not a string or string array", () => {
      // Arrange
      const value = { pattern: 123, type: "component" };

      // Act
      const result = isElementDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });
  });
});
