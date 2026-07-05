import { normalizePath } from "./Paths";

describe("Paths", () => {
  describe("normalizePath", () => {
    it("should replace backslashes with forward slashes", () => {
      expect(normalizePath("src\\components\\Button")).toBe(
        "src/components/Button"
      );
    });

    it("should replace multiple consecutive backslashes", () => {
      expect(normalizePath("src\\\\components")).toBe("src//components");
    });

    it("should return the same string when no backslashes are present", () => {
      expect(normalizePath("src/components/Button")).toBe(
        "src/components/Button"
      );
    });

    it("should handle empty strings", () => {
      expect(normalizePath("")).toBe("");
    });

    it("should handle strings with only backslashes", () => {
      expect(normalizePath("\\\\\\")).toBe("///");
    });

    it("should handle mixed separators", () => {
      expect(normalizePath("src\\components/utils\\helpers")).toBe(
        "src/components/utils/helpers"
      );
    });

    it("should handle Windows-style absolute paths", () => {
      expect(normalizePath("C:\\Users\\project\\src\\index.ts")).toBe(
        "C:/Users/project/src/index.ts"
      );
    });
  });
});
