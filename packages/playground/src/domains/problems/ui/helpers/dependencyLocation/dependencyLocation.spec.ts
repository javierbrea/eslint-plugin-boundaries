import { getDependencyLocation } from "./dependencyLocation";

describe("dependencyLocation", () => {
  describe("getDependencyLocation", () => {
    it("should give the file of the dependency, its line after a colon and the source of its statement", () => {
      // Act
      const where = getDependencyLocation(
        { path: "src/modules/checkout/index.js", index: 2 },
        "../../components/atoms/Button/Button.spec.js"
      );

      // Assert
      expect(where).toEqual({
        path: "src/modules/checkout/index.js",
        position: ":3",
        source: "../../components/atoms/Button/Button.spec.js",
      });
    });

    it.each<[number, string]>([
      [0, ":1"],
      [7, ":8"],
    ])("should number the line of the position %i as %s", (index, position) => {
      // Act
      const where = getDependencyLocation(
        { path: "src/index.js", index },
        "./x"
      );

      // Assert
      expect(where.position).toBe(position);
    });
  });
});
