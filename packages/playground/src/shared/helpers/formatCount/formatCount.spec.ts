import { formatCount } from "./formatCount";

describe("FormatCount", () => {
  describe("formatCount", () => {
    it("should use the singular for one", () => {
      // Act
      const text = formatCount(1, "file", "files");

      // Assert
      expect(text).toBe("1 file");
    });

    it.each([0, 2, 3, 12])("should use the plural for %i", (count) => {
      // Act
      const text = formatCount(count, "file", "files");

      // Assert
      expect(text).toBe(`${count} files`);
    });

    it("should use the nouns it is given", () => {
      // Act
      const one = formatCount(1, "policy", "policies");
      const many = formatCount(4, "policy", "policies");

      // Assert
      expect(one).toBe("1 policy");
      expect(many).toBe("4 policies");
    });
  });
});
