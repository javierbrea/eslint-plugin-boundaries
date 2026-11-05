import { act, renderHook, waitFor } from "@testing-library/react";

import type { ProjectSource, Sketch, StateStore } from "@/contract";
import { MemoryStore, SketchSource } from "@/contract";

import { useSketchLoad } from "./sketchLoad.hooks";

const SOURCE_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src", kind: "folder" },
    { path: "src/index.ts", kind: "file" },
    { path: "src/components/Price/index.ts", kind: "file" },
  ],
  dependencies: [],
};

const SAVED_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.ts", kind: "file" }],
  dependencies: [],
};

/** The source and the store that the hook loads from. */
type LoadProps = {
  readonly source: ProjectSource;
  readonly store: StateStore;
};

/**
 * Renders the hook, so that the source and the store can change as they do when a host renders the playground again.
 * @param source Where the project comes from.
 * @param store Where the state is kept.
 * @returns The render of the hook, whose `rerender` takes the new source and store.
 */
function renderLoad(source: ProjectSource, store: StateStore) {
  return renderHook(
    (props: LoadProps) => useSketchLoad(props.source, props.store),
    { initialProps: { source, store } }
  );
}

describe("useSketchLoad", () => {
  describe("when the store has no sketch", () => {
    it("should load the sketch of the source", async () => {
      // Arrange
      const { result } = renderLoad(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );

      // Act
      await waitFor(() => expect(result.current.status).toBe("loaded"));

      // Assert
      expect(result.current).toEqual({
        status: "loaded",
        sketch: SOURCE_SKETCH,
      });
    });
  });

  describe("when the store has a sketch", () => {
    it("should load the sketch of the store over the one of the source", async () => {
      // Arrange
      const { result } = renderLoad(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore(SAVED_SKETCH)
      );

      // Act
      await waitFor(() => expect(result.current.status).toBe("loaded"));

      // Assert
      expect(result.current).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
    });
  });

  describe("when the store changes before the previous one loads", () => {
    it("should keep the sketch of the new store when the previous one loads afterwards", async () => {
      // Arrange
      let resolvePrevious: (sketch: Sketch | undefined) => void = () =>
        undefined;
      const previousStore: jest.Mocked<StateStore> = {
        load: jest.fn(
          () =>
            new Promise<Sketch | undefined>((resolve) => {
              resolvePrevious = resolve;
            })
        ),
        save: jest.fn(),
      };
      const source = new SketchSource(SOURCE_SKETCH);
      const { result, rerender } = renderLoad(source, previousStore);

      expect(previousStore.load).toHaveBeenCalledTimes(1);

      rerender({ source, store: new MemoryStore(SAVED_SKETCH) });
      await waitFor(() => expect(result.current.status).toBe("loaded"));

      // Act
      await act(async () => {
        resolvePrevious(undefined);
      });

      // Assert
      expect(result.current).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
    });

    it("should keep the sketch of the new store when the previous one fails afterwards", async () => {
      // Arrange
      let rejectPrevious: (error: Error) => void = () => undefined;
      const previousStore: jest.Mocked<StateStore> = {
        load: jest.fn(
          () =>
            new Promise<Sketch | undefined>((_resolve, reject) => {
              rejectPrevious = reject;
            })
        ),
        save: jest.fn(),
      };
      const source = new SketchSource(SOURCE_SKETCH);
      const { result, rerender } = renderLoad(source, previousStore);

      expect(previousStore.load).toHaveBeenCalledTimes(1);

      rerender({ source, store: new MemoryStore(SAVED_SKETCH) });
      await waitFor(() => expect(result.current.status).toBe("loaded"));

      // Act
      await act(async () => {
        rejectPrevious(new Error("disk read failed"));
      });

      // Assert
      expect(result.current).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
    });
  });
});
