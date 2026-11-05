import { EXAMPLES } from "./examples";
import { QUICK_START_EXAMPLE } from "./quickStart";

describe("examples", () => {
  describe("eXAMPLES", () => {
    it("should list the quick start example", () => {
      // Assert
      expect(EXAMPLES).toEqual([QUICK_START_EXAMPLE]);
    });

    it("should have an id for each example, and no id twice", () => {
      // Act
      const ids = EXAMPLES.map((example) => example.id);

      // Assert
      expect(new Set(ids).size).toBe(EXAMPLES.length);
    });
  });
});
