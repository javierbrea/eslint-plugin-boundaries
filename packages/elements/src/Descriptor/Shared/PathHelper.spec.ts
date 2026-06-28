import type { DescriptorOptionsNormalized } from "../../Config";
import { Micromatch } from "../../Matcher";

import { PathHelper } from "./PathHelper";

function makeConfig(
  partial: Pick<
    DescriptorOptionsNormalized,
    "rootPath" | "includePaths" | "ignorePaths"
  >
): DescriptorOptionsNormalized {
  return partial as unknown as DescriptorOptionsNormalized;
}

function makeMicromatch(): Micromatch {
  return new Micromatch(false);
}

describe("PathHelper", () => {
  describe("isOutsideRootPath", () => {
    it("should return false when rootPath is not configured", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined }),
        makeMicromatch()
      );

      // Act
      const result = helper.isOutsideRootPath("/some/path/file.ts");

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when filePath starts with rootPath", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: "/root/" }),
        makeMicromatch()
      );

      // Act
      const result = helper.isOutsideRootPath("/root/src/file.ts");

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when filePath does not start with rootPath", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: "/root/" }),
        makeMicromatch()
      );

      // Act
      const result = helper.isOutsideRootPath("/other/src/file.ts");

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("toRelativePath", () => {
    it("should return filePath unchanged when rootPath is not configured", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined }),
        makeMicromatch()
      );

      // Act
      const result = helper.toRelativePath("/absolute/path/file.ts");

      // Assert
      expect(result).toBe("/absolute/path/file.ts");
    });

    it("should return filePath unchanged when path is outside rootPath", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: "/root/" }),
        makeMicromatch()
      );

      // Act
      const result = helper.toRelativePath("/other/path/file.ts");

      // Assert
      expect(result).toBe("/other/path/file.ts");
    });

    it("should strip rootPath prefix when filePath is inside rootPath", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: "/root/" }),
        makeMicromatch()
      );

      // Act
      const result = helper.toRelativePath("/root/src/file.ts");

      // Assert
      expect(result).toBe("src/file.ts");
    });
  });

  describe("pathIsIncluded", () => {
    it("should return true when no includePaths or ignorePaths are configured", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined }),
        makeMicromatch()
      );

      // Act
      const result = helper.pathIsIncluded("src/file.ts");

      // Assert
      expect(result).toBe(true);
    });

    it("should return true when path matches includePaths", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined, includePaths: ["src/**"] }),
        makeMicromatch()
      );

      // Act
      const result = helper.pathIsIncluded("src/file.ts");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when path does not match includePaths", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined, includePaths: ["src/**"] }),
        makeMicromatch()
      );

      // Act
      const result = helper.pathIsIncluded("lib/file.ts");

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when path does not match ignorePaths", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined, ignorePaths: ["test/**"] }),
        makeMicromatch()
      );

      // Act
      const result = helper.pathIsIncluded("src/file.ts");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when path matches ignorePaths", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined, ignorePaths: ["test/**"] }),
        makeMicromatch()
      );

      // Act
      const result = helper.pathIsIncluded("test/file.spec.ts");

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when path matches includePaths but not ignorePaths", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({
          rootPath: undefined,
          includePaths: ["src/**"],
          ignorePaths: ["test/**"],
        }),
        makeMicromatch()
      );

      // Act
      const result = helper.pathIsIncluded("src/file.ts");

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when path matches both includePaths and ignorePaths", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({
          rootPath: undefined,
          includePaths: ["src/**"],
          ignorePaths: ["src/ignored/**"],
        }),
        makeMicromatch()
      );

      // Act
      const result = helper.pathIsIncluded("src/ignored/file.ts");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("getCapturedValues", () => {
    it("should return null when captureConfig is undefined", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined }),
        makeMicromatch()
      );

      // Act
      const result = helper.getCapturedValues(["foo", "bar"], undefined);

      // Assert
      expect(result).toBeNull();
    });

    it("should return empty object when captured array is empty", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined }),
        makeMicromatch()
      );

      // Act
      const result = helper.getCapturedValues([], ["type", "name"]);

      // Assert
      expect(result).toEqual({});
    });

    it("should map captured values to captureConfig keys", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined }),
        makeMicromatch()
      );

      // Act
      const result = helper.getCapturedValues(
        ["components", "Button"],
        ["category", "name"]
      );

      // Assert
      expect(result).toEqual({ category: "components", name: "Button" });
    });

    it("should skip captured values without a corresponding captureConfig key", () => {
      // Arrange
      const helper = new PathHelper(
        makeConfig({ rootPath: undefined }),
        makeMicromatch()
      );

      // Act
      const result = helper.getCapturedValues(
        ["components", "Button", "extra"],
        ["category", "name"]
      );

      // Assert
      expect(result).toEqual({ category: "components", name: "Button" });
    });
  });
});
