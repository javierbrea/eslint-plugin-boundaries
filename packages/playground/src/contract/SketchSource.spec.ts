import type { Sketch } from "./Sketch.types";
import { EMPTY_SKETCH, SketchSource } from "./SketchSource";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.ts", kind: "file" }],
  dependencies: [],
};

describe("SketchSource", () => {
  describe("capabilities", () => {
    it("should allow editing everything", () => {
      // Arrange
      const source = new SketchSource();

      // Act
      const capabilities = source.capabilities;

      // Assert
      expect(capabilities).toEqual({
        editTree: true,
        editDependencies: true,
        editConfig: true,
      });
    });
  });

  describe("load", () => {
    it("should return the sketch it was created with", async () => {
      // Arrange
      const source = new SketchSource(SKETCH);

      // Act
      const sketch = await source.load();

      // Assert
      expect(sketch).toBe(SKETCH);
    });

    it("should return the empty sketch when it was created without one", async () => {
      // Arrange
      const source = new SketchSource();

      // Act
      const sketch = await source.load();

      // Assert
      expect(sketch).toBe(EMPTY_SKETCH);
    });
  });
});
