import { MemoryStore } from "./MemoryStore";
import type { Sketch } from "./Sketch.types";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.ts", kind: "file" }],
  dependencies: [],
};

describe("MemoryStore", () => {
  describe("load", () => {
    it("should return undefined when nothing is saved", async () => {
      // Arrange
      const store = new MemoryStore();

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toBeUndefined();
    });

    it("should return the sketch it was created with", async () => {
      // Arrange
      const store = new MemoryStore(SKETCH);

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toBe(SKETCH);
    });
  });

  describe("save", () => {
    it("should replace the saved sketch", async () => {
      // Arrange
      const store = new MemoryStore({
        config: "{}",
        tree: [],
        dependencies: [],
      });

      // Act
      await store.save(SKETCH);

      // Assert
      await expect(store.load()).resolves.toBe(SKETCH);
    });
  });
});
