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

/** A store that tells the playground when its sketch changes outside of it, as the hash of the URL does, and that a spec can ask to do so. */
class NotifyingStore extends MemoryStore {
  private readonly _listeners = new Set<() => void>();

  /** How many listeners are subscribed. */
  public get listenerCount(): number {
    return this._listeners.size;
  }

  public subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /** Tells every listener that the saved sketch changed. */
  public notify(): void {
    this._listeners.forEach((listener) => listener());
  }
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
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Assert
      expect(result.current.load).toEqual({
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
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Assert
      expect(result.current.load).toEqual({
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
        clear: jest.fn(),
      };
      const source = new SketchSource(SOURCE_SKETCH);
      const { result, rerender } = renderLoad(source, previousStore);

      expect(previousStore.load).toHaveBeenCalledTimes(1);

      rerender({ source, store: new MemoryStore(SAVED_SKETCH) });
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Act
      await act(async () => {
        resolvePrevious(undefined);
      });

      // Assert
      expect(result.current.load).toEqual({
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
        clear: jest.fn(),
      };
      const source = new SketchSource(SOURCE_SKETCH);
      const { result, rerender } = renderLoad(source, previousStore);

      expect(previousStore.load).toHaveBeenCalledTimes(1);

      rerender({ source, store: new MemoryStore(SAVED_SKETCH) });
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Act
      await act(async () => {
        rejectPrevious(new Error("disk read failed"));
      });

      // Assert
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
    });
  });

  describe("when the store tells that its sketch changed", () => {
    it("should subscribe while it is mounted and stop when it is unmounted", () => {
      // Arrange
      const store = new NotifyingStore();

      // Act
      const { unmount } = renderLoad(new SketchSource(SOURCE_SKETCH), store);
      const whileMounted = store.listenerCount;

      unmount();

      // Assert
      expect(whileMounted).toBe(1);
      expect(store.listenerCount).toBe(0);
    });

    it("should load the store again and show the sketch it has now, as a new sketch", async () => {
      // Arrange
      const store = new NotifyingStore();
      const { result } = renderLoad(new SketchSource(SOURCE_SKETCH), store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const generationBefore = result.current.generation;

      await store.save(SAVED_SKETCH);

      // Act
      act(() => store.notify());
      await waitFor(() =>
        expect(result.current.load).toEqual({
          status: "loaded",
          sketch: SAVED_SKETCH,
        })
      );

      // Assert
      expect(result.current.generation).toBeGreaterThan(generationBefore);
    });

    it("should show that the sketch is loading, as for the first load, until the store answers", async () => {
      // Arrange
      let resolveNext: (sketch: Sketch | undefined) => void = () => undefined;
      const store = new NotifyingStore();
      const { result } = renderLoad(new SketchSource(SOURCE_SKETCH), store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      jest.spyOn(store, "load").mockImplementation(
        () =>
          new Promise<Sketch | undefined>((resolve) => {
            resolveNext = resolve;
          })
      );

      // Act
      act(() => store.notify());
      const whileLoading = result.current.load;
      await act(async () => {
        resolveNext(SAVED_SKETCH);
      });

      // Assert
      expect(whileLoading).toEqual({ status: "loading" });
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
    });

    it("should load the sketch of the source when the store has none any more", async () => {
      // Arrange
      const store = new NotifyingStore(SAVED_SKETCH);
      const { result } = renderLoad(new SketchSource(SOURCE_SKETCH), store);

      await waitFor(() =>
        expect(result.current.load).toEqual({
          status: "loaded",
          sketch: SAVED_SKETCH,
        })
      );
      await store.clear();

      // Act
      act(() => store.notify());
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Assert
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SOURCE_SKETCH,
      });
    });

    it("should show why the sketch could not be loaded when the store fails, and recover when it can", async () => {
      // Arrange
      const store = new NotifyingStore();
      const { result } = renderLoad(new SketchSource(SOURCE_SKETCH), store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      jest.spyOn(store, "load").mockRejectedValue(new Error("unreadable link"));

      // Act
      act(() => store.notify());
      await waitFor(() => expect(result.current.load.status).toBe("failed"));

      const failure = result.current.load;

      jest.spyOn(store, "load").mockResolvedValue(SAVED_SKETCH);
      act(() => store.notify());
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Assert
      expect(failure).toEqual({
        status: "failed",
        error: new Error("unreadable link"),
      });
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
    });

    it("should load once for each call", async () => {
      // Arrange
      const store = new NotifyingStore();
      const { result } = renderLoad(new SketchSource(SOURCE_SKETCH), store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const load = jest.spyOn(store, "load");

      // Act
      act(() => store.notify());
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      act(() => store.notify());
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Assert
      expect(load).toHaveBeenCalledTimes(2);
    });

    it("should subscribe to the new store, and not to the previous one, when the store changes", async () => {
      // Arrange
      const previousStore = new NotifyingStore();
      const nextStore = new NotifyingStore();
      const source = new SketchSource(SOURCE_SKETCH);
      const { result, rerender } = renderLoad(source, previousStore);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Act
      rerender({ source, store: nextStore });
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Assert
      expect(previousStore.listenerCount).toBe(0);
      expect(nextStore.listenerCount).toBe(1);
    });

    it("should ignore a call of the store it was unsubscribed from", async () => {
      // Arrange
      const previousStore = new NotifyingStore();
      const source = new SketchSource(SOURCE_SKETCH);
      const { result, rerender } = renderLoad(source, previousStore);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      rerender({ source, store: new MemoryStore(SAVED_SKETCH) });
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const load = jest.spyOn(previousStore, "load");

      // Act
      act(() => previousStore.notify());

      // Assert
      expect(load).not.toHaveBeenCalled();
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
    });
  });

  describe("reset", () => {
    it("should forget the saved sketch, load the source and show its sketch, in that order", async () => {
      // Arrange
      const calls: string[] = [];
      const store = new MemoryStore(SAVED_SKETCH);
      const source = new SketchSource(SOURCE_SKETCH);

      jest.spyOn(store, "clear").mockImplementation(() => {
        calls.push("clear");
        return Promise.resolve();
      });
      jest.spyOn(source, "load").mockImplementation(() => {
        calls.push("source");
        return Promise.resolve(SOURCE_SKETCH);
      });

      const { result } = renderLoad(source, store);

      await waitFor(() =>
        expect(result.current.load).toEqual({
          status: "loaded",
          sketch: SAVED_SKETCH,
        })
      );
      calls.length = 0;

      // Act
      act(() => result.current.reset());
      await waitFor(() =>
        expect(result.current.load).toEqual({
          status: "loaded",
          sketch: SOURCE_SKETCH,
        })
      );

      // Assert
      expect(calls).toEqual(["clear", "source"]);
    });

    it("should leave nothing saved in the store", async () => {
      // Arrange
      const store = new MemoryStore(SAVED_SKETCH);
      const { result } = renderLoad(new SketchSource(SOURCE_SKETCH), store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Act
      act(() => result.current.reset());
      await waitFor(() =>
        expect(result.current.load).toEqual({
          status: "loaded",
          sketch: SOURCE_SKETCH,
        })
      );

      // Assert
      await expect(store.load()).resolves.toBeUndefined();
    });

    it("should show that the sketch is loading until the source answers, as a new sketch", async () => {
      // Arrange
      let resolveSource: (sketch: Sketch) => void = () => undefined;
      const source: jest.Mocked<ProjectSource> = {
        capabilities: {
          editTree: true,
          editDependencies: true,
          editConfig: true,
        },
        load: jest.fn(() => Promise.resolve(SOURCE_SKETCH)),
      };
      const { result } = renderLoad(source, new MemoryStore());

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const generationBefore = result.current.generation;

      source.load.mockImplementation(
        () =>
          new Promise<Sketch>((resolve) => {
            resolveSource = resolve;
          })
      );

      // Act
      act(() => result.current.reset());
      const whileLoading = result.current.load;
      await waitFor(() => expect(source.load).toHaveBeenCalledTimes(2));
      await act(async () => {
        resolveSource(SAVED_SKETCH);
      });

      // Assert
      expect(whileLoading).toEqual({ status: "loading" });
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
      expect(result.current.generation).toBeGreaterThan(generationBefore);
    });

    it("should show why the sketch could not be loaded when the source fails, and load it again on the next reset", async () => {
      // Arrange
      const source: jest.Mocked<ProjectSource> = {
        capabilities: {
          editTree: true,
          editDependencies: true,
          editConfig: true,
        },
        load: jest.fn(() => Promise.resolve(SOURCE_SKETCH)),
      };
      const { result } = renderLoad(source, new MemoryStore());

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      source.load.mockRejectedValue(new Error("offline"));

      // Act
      act(() => result.current.reset());
      await waitFor(() => expect(result.current.load.status).toBe("failed"));

      const failure = result.current.load;

      source.load.mockResolvedValue(SOURCE_SKETCH);
      act(() => result.current.reset());
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      // Assert
      expect(failure).toEqual({
        status: "failed",
        error: new Error("offline"),
      });
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SOURCE_SKETCH,
      });
    });

    it("should show why the sketch could not be loaded, and not load the source, when the store cannot forget", async () => {
      // Arrange
      const store = new MemoryStore(SAVED_SKETCH);
      const source = new SketchSource(SOURCE_SKETCH);
      const { result } = renderLoad(source, store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      jest.spyOn(store, "clear").mockRejectedValue(new Error("read-only"));

      const load = jest.spyOn(source, "load");

      // Act
      act(() => result.current.reset());
      await waitFor(() => expect(result.current.load.status).toBe("failed"));

      // Assert
      expect(result.current.load).toEqual({
        status: "failed",
        error: new Error("read-only"),
      });
      expect(load).not.toHaveBeenCalled();
    });

    it("should load the sketch of the store, and not reset, when the source and the store change afterwards", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);
      const { result, rerender } = renderLoad(source, new MemoryStore());

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      act(() => result.current.reset());
      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const nextStore = new MemoryStore(SAVED_SKETCH);
      const clear = jest.spyOn(nextStore, "clear");

      // Act
      rerender({ source, store: nextStore });

      // Assert
      await waitFor(() =>
        expect(result.current.load).toEqual({
          status: "loaded",
          sketch: SAVED_SKETCH,
        })
      );

      expect(clear).not.toHaveBeenCalled();
    });
  });

  describe("show", () => {
    it("should put the sketch on screen at once, with no loading in between, as a new sketch", async () => {
      // Arrange
      const { result } = renderLoad(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const generationBefore = result.current.generation;

      // Act
      act(() => result.current.show(SAVED_SKETCH));

      // Assert
      expect(result.current.load).toEqual({
        status: "loaded",
        sketch: SAVED_SKETCH,
      });
      expect(result.current.generation).toBeGreaterThan(generationBefore);
    });

    it("should make a new sketch each time, even for the sketch that is already on screen", async () => {
      // Arrange
      const { result } = renderLoad(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));
      act(() => result.current.show(SAVED_SKETCH));

      const generationBefore = result.current.generation;

      // Act
      act(() => result.current.show(SAVED_SKETCH));

      // Assert
      expect(result.current.generation).toBeGreaterThan(generationBefore);
    });

    it("should not load the source or the store", async () => {
      // Arrange
      const store = new MemoryStore();
      const source = new SketchSource(SOURCE_SKETCH);
      const { result } = renderLoad(source, store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const sourceLoad = jest.spyOn(source, "load");
      const storeLoad = jest.spyOn(store, "load");

      // Act
      act(() => result.current.show(SAVED_SKETCH));

      // Assert
      expect(sourceLoad).not.toHaveBeenCalled();
      expect(storeLoad).not.toHaveBeenCalled();
    });
  });

  describe("generation", () => {
    it("should be the same while the sketch on screen is the same", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);
      const store = new MemoryStore();
      const { result, rerender } = renderLoad(source, store);

      await waitFor(() => expect(result.current.load.status).toBe("loaded"));

      const generation = result.current.generation;

      // Act
      rerender({ source, store });

      // Assert
      expect(generation).toBeGreaterThan(0);
      expect(result.current.generation).toBe(generation);
    });
  });
});
