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

  describe("clear", () => {
    it("should forget the sketch it was created with", async () => {
      // Arrange
      const store = new MemoryStore(SKETCH);

      // Act
      await store.clear();

      // Assert
      await expect(store.load()).resolves.toBeUndefined();
    });

    it("should forget a sketch that was saved", async () => {
      // Arrange
      const store = new MemoryStore();

      await store.save(SKETCH);

      // Act
      await store.clear();

      // Assert
      await expect(store.load()).resolves.toBeUndefined();
    });

    it("should keep working when nothing is saved", async () => {
      // Arrange
      const store = new MemoryStore();

      // Act
      const cleared = store.clear();

      // Assert
      await expect(cleared).resolves.toBeUndefined();
    });
  });

  describe("share and subscribe", () => {
    it("should not have them, so the playground draws no Share", () => {
      // Arrange
      const store = new MemoryStore();

      // Act
      const optional = ["share", "subscribe"].filter(
        (member) => member in store
      );

      // Assert
      expect(optional).toEqual([]);
    });
  });
});
