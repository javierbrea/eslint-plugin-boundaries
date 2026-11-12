import { renderHook } from "@testing-library/react";

import type { ProjectSource, Sketch } from "@/contract";
import { SketchSource } from "@/contract";

import { useSourceSketch } from "./sourceSketch.hooks";

const SOURCE_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.ts", kind: "file" }],
  dependencies: [],
};

const OTHER_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/other.ts", kind: "file" }],
  dependencies: [],
};

/**
 * Creates a source whose `load` is a spy, so that a spec can count the loads.
 * @param load What the source does when it is asked for the project.
 * @returns The source.
 */
function createSource(
  load: () => Promise<Sketch> = () => Promise.resolve(SOURCE_SKETCH)
): jest.Mocked<ProjectSource> {
  return {
    capabilities: { editTree: true, editDependencies: true, editConfig: true },
    load: jest.fn(load),
  };
}

describe("useSourceSketch", () => {
  describe("before it is asked", () => {
    it("should not load the source", () => {
      // Arrange
      const source = createSource();

      // Act
      renderHook(() => useSourceSketch(source));

      // Assert
      expect(source.load).not.toHaveBeenCalled();
    });
  });

  describe("when it is asked", () => {
    it("should give the sketch of the source", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useSourceSketch(new SketchSource(SOURCE_SKETCH))
      );

      // Act
      const sketch = await result.current();

      // Assert
      expect(sketch).toBe(SOURCE_SKETCH);
    });

    it("should load the source once however many times it is asked", async () => {
      // Arrange
      const source = createSource();
      const { result } = renderHook(() => useSourceSketch(source));

      // Act
      const first = await result.current();
      const second = await result.current();

      // Assert
      expect(source.load).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
    });

    it("should load the source once when it is asked again before the first load ends", async () => {
      // Arrange
      const source = createSource();
      const { result } = renderHook(() => useSourceSketch(source));

      // Act
      const sketches = await Promise.all([result.current(), result.current()]);

      // Assert
      expect(source.load).toHaveBeenCalledTimes(1);
      expect(sketches).toEqual([SOURCE_SKETCH, SOURCE_SKETCH]);
    });

    it("should keep the sketch when the component renders again with the same source", async () => {
      // Arrange
      const source = createSource();
      const { result, rerender } = renderHook(() => useSourceSketch(source));

      await result.current();

      // Act
      rerender();
      await result.current();

      // Assert
      expect(source.load).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the source changes", () => {
    it("should give the sketch of the new source", async () => {
      // Arrange
      const { result, rerender } = renderHook(
        (props: { source: ProjectSource }) => useSourceSketch(props.source),
        { initialProps: { source: new SketchSource(SOURCE_SKETCH) } }
      );

      await result.current();

      // Act
      rerender({ source: new SketchSource(OTHER_SKETCH) });
      const sketch = await result.current();

      // Assert
      expect(sketch).toBe(OTHER_SKETCH);
    });
  });

  describe("when the source cannot load", () => {
    it("should give nothing instead of failing", async () => {
      // Arrange
      const source = createSource(() => Promise.reject(new Error("offline")));
      const { result } = renderHook(() => useSourceSketch(source));

      // Act
      const sketch = await result.current();

      // Assert
      expect(sketch).toBeUndefined();
    });

    it("should load the source again the next time it is asked", async () => {
      // Arrange
      const loads = [
        () => Promise.reject(new Error("offline")),
        () => Promise.resolve(SOURCE_SKETCH),
      ];
      const source = createSource(() =>
        (loads.shift() as () => Promise<Sketch>)()
      );
      const { result } = renderHook(() => useSourceSketch(source));

      await result.current();

      // Act
      const sketch = await result.current();

      // Assert
      expect(source.load).toHaveBeenCalledTimes(2);
      expect(sketch).toBe(SOURCE_SKETCH);
    });

    it("should not forget the sketch of a newer source when an earlier one fails afterwards", async () => {
      // Arrange
      let rejectFirst: (error: Error) => void = () => undefined;
      const first = createSource(
        () =>
          new Promise<Sketch>((_resolve, reject) => {
            rejectFirst = reject;
          })
      );
      const second = createSource(() => Promise.resolve(OTHER_SKETCH));
      const { result, rerender } = renderHook(
        (props: { source: ProjectSource }) => useSourceSketch(props.source),
        { initialProps: { source: first as ProjectSource } }
      );
      const pending = result.current();

      rerender({ source: second });
      await result.current();

      // Act
      rejectFirst(new Error("offline"));
      await pending;
      await result.current();

      // Assert
      expect(second.load).toHaveBeenCalledTimes(1);
    });
  });
});
