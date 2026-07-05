import { isFileDescriptor } from "./FileDescriptorHelpers";

describe("FileDescriptorHelpers", () => {
  describe("isFileDescriptor", () => {
    it("should return true for an object with pattern and category", () => {
      // Arrange
      const value = { pattern: "src/**/*.ts", category: "component" };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when pattern is a non-empty string array", () => {
      // Arrange
      const value = {
        pattern: ["src/**/*.ts", "lib/**/*.ts"],
        category: "util",
      };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when optional capture is provided", () => {
      // Arrange
      const value = {
        pattern: "src/**/*.ts",
        category: "service",
        capture: ["name"],
      };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for an object with pattern but without category", () => {
      // Arrange
      const value = { pattern: "src/**/*.ts" };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for an object without pattern", () => {
      // Arrange
      const value = { category: "component" };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when category is not a string", () => {
      // Arrange
      const value = { pattern: "src/**/*.ts", category: 123 };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for an empty object", () => {
      // Arrange
      const value = {};

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for null and undefined", () => {
      expect(isFileDescriptor(null)).toBe(false);
      expect(isFileDescriptor(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isFileDescriptor("string")).toBe(false);
      expect(isFileDescriptor(123)).toBe(false);
      expect(isFileDescriptor(true)).toBe(false);
    });

    it("should return false for arrays", () => {
      // Arrange
      const value = [{ pattern: "src/**/*.ts", category: "component" }];

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when pattern is an empty array", () => {
      // Arrange
      const value = { pattern: [], category: "component" };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when pattern is not a string or string array", () => {
      // Arrange
      const value = { pattern: 123, category: "component" };

      // Act
      const result = isFileDescriptor(value);

      // Assert
      expect(result).toBe(false);
    });
  });
});
