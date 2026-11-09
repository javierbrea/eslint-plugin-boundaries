import type { Sketch } from "@/contract";
import { decodeHash, encodeSketch } from "@/domains/share/helpers/sketchHash";

import { HashStore } from "./HashStore";

const FIRST: Sketch = {
  config: "{ settings: {}, rules: {} }\n",
  tree: [
    { path: "src/a.js", kind: "file" },
    { path: "src/b.js", kind: "file" },
  ],
  dependencies: [
    {
      from: "src/a.js",
      target: { kind: "node", path: "src/b.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "named", name: "b" }],
    },
  ],
};

const SECOND: Sketch = {
  config: "{}",
  tree: [{ path: "index.js", kind: "file" }],
  dependencies: [],
};

const PAGE = "/playground/";

/** The stores that a test created, so that the next test starts without their timers or their listeners */
const stores: HashStore[] = [];

/**
 * Creates a store that the next test will clean up.
 */
function createStore(): HashStore {
  const store = new HashStore();

  stores.push(store);
  return store;
}

/**
 * Replaces the URL of the page, as another script or the address bar would.
 * @param url The new URL, with its path, its query and its hash.
 * @param state The state of the history entry, which a router stores there.
 */
function setUrl(url: string, state: unknown = null): void {
  window.history.replaceState(state, "", url);
}

/**
 * Gets the hash of a sketch as the page has it in its URL.
 * @param sketch The sketch.
 */
function hashOf(sketch: Sketch): string {
  return `#${encodeSketch(sketch)}`;
}

/**
 * Gets the sketch that the hash of the page holds.
 */
function readPageSketch(): Sketch | undefined {
  const reading = decodeHash(window.location.hash);

  return reading.status === "sketch" ? reading.sketch : undefined;
}

describe("HashStore", () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.restoreAllMocks();
    await Promise.all(stores.map((store) => store.clear()));
    stores.length = 0;
    setUrl(PAGE);
  });

  describe("when it is created", () => {
    it("should not touch the window", () => {
      // Arrange
      const addListener = jest.spyOn(window, "addEventListener");
      const replaceState = jest.spyOn(window.history, "replaceState");

      // Act
      createStore();

      // Assert
      expect(addListener).not.toHaveBeenCalled();
      expect(replaceState).not.toHaveBeenCalled();
    });
  });

  describe("load", () => {
    it("should return undefined and leave the URL alone when there is no hash and nothing was saved", async () => {
      // Arrange
      const store = createStore();
      const replaceState = jest.spyOn(window.history, "replaceState");

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toBeUndefined();
      expect(replaceState).not.toHaveBeenCalled();
    });

    it("should return the sketch that the hash holds", async () => {
      // Arrange
      setUrl(`${PAGE}${hashOf(FIRST)}`);
      const store = createStore();

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toStrictEqual(FIRST);
    });

    it("should not write the URL when the hash holds the sketch", async () => {
      // Arrange
      setUrl(`${PAGE}${hashOf(FIRST)}`);
      const replaceState = jest.spyOn(window.history, "replaceState");
      const store = createStore();

      // Act
      await store.load();
      jest.advanceTimersByTime(1000);

      // Assert
      expect(replaceState).not.toHaveBeenCalled();
    });

    it("should return nothing when the hash is the anchor of a heading", async () => {
      // Arrange
      setUrl(`${PAGE}#installation`);
      const store = createStore();

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toBeUndefined();
      expect(window.location.hash).toBe("#installation");
    });

    it("should reject with an error that holds the reason when the hash cannot be read", async () => {
      // Arrange
      setUrl(`${PAGE}#v=2&s=abc`);
      const store = createStore();

      // Act
      const loading = store.load();

      // Assert
      await expect(loading).rejects.toThrow(
        new Error(
          'The link has the format version "2", which this playground does not know.'
        )
      );
    });

    it("should reject with the reason that the reader gives when the sketch fails its checks", async () => {
      // Arrange
      const sketch: Sketch = {
        config: "{}",
        tree: [{ path: "src/a.js", kind: "file" }],
        dependencies: [],
      };
      const unchecked = {
        ...sketch,
        tree: [{ path: "../a.js", kind: "file" }],
      };

      setUrl(`${PAGE}${hashOf(unchecked as Sketch)}`);
      const store = createStore();

      // Act
      const loading = store.load();

      // Assert
      await expect(loading).rejects.toThrow(
        '"../a.js" cannot be in the tree. The path cannot have `.` or `..` segments.'
      );
    });

    it("should reject with the reason, and not throw, when the hash holds a path too deep to read", async () => {
      // Arrange
      const deep = {
        ...FIRST,
        tree: [{ path: `${"a/".repeat(40000)}f.js`, kind: "file" }],
      };

      setUrl(`${PAGE}${hashOf(deep as Sketch)}`);

      const store = createStore();

      // Act
      const load = () => store.load();

      // Assert
      expect(() => load().catch(() => undefined)).not.toThrow();
      await expect(load()).rejects.toThrow(
        `"${"a/".repeat(40)}…" cannot be in the tree. The path cannot have more than 1024 characters.`
      );
    });

    it("should reject, and not throw, whatever goes wrong while it loads", async () => {
      // Arrange
      // A sketch that cannot be written as JSON, which the load of a page without a hash writes back to the URL
      const notJson = {
        ...FIRST,
        tree: [{ path: 1n, kind: "file" }],
      } as unknown as Sketch;
      const store = createStore();

      await store.save(notJson);

      // Act
      const load = () => store.load();

      // Assert
      expect(() => load().catch(() => undefined)).not.toThrow();
      await expect(load()).rejects.toThrow(TypeError);
    });

    it("should keep the sketch it saved when the hash cannot be read, for the load after the hash is cleared", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      setUrl(`${PAGE}#v=2&s=abc`);
      await store.load().catch(() => undefined);
      setUrl(PAGE);

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toStrictEqual(FIRST);
    });

    it("should remember the sketch of the hash, so that a later load without a hash returns it", async () => {
      // Arrange
      setUrl(`${PAGE}${hashOf(FIRST)}`);
      const store = createStore();

      await store.load();
      setUrl(PAGE);

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toStrictEqual(FIRST);
    });

    it("should return the last sketch it saved when the hash is gone, and write it back at once", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      jest.advanceTimersByTime(500);
      setUrl(PAGE);

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toStrictEqual(FIRST);
      expect(window.location.hash).toBe(hashOf(FIRST));
    });

    it("should return the sketch saved last, even when its write is still pending", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      await store.save(SECOND);

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toStrictEqual(SECOND);
      expect(window.location.hash).toBe(hashOf(SECOND));
    });

    it("should drop the write that is pending, so that it never overwrites the hash that was loaded", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      setUrl(`${PAGE}${hashOf(SECOND)}`);

      // Act
      const sketch = await store.load();
      jest.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("pagehide"));

      // Assert
      expect(sketch).toStrictEqual(SECOND);
      expect(readPageSketch()).toStrictEqual(SECOND);
    });

    it("should drop the pending write when it rejects too", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      setUrl(`${PAGE}#v=2&s=abc`);
      await store.load().catch(() => undefined);

      // Act
      jest.advanceTimersByTime(1000);

      // Assert
      expect(window.location.hash).toBe("#v=2&s=abc");
    });
  });

  describe("save", () => {
    it("should resolve at once and write nothing before the delay", async () => {
      // Arrange
      const store = createStore();
      const replaceState = jest.spyOn(window.history, "replaceState");

      // Act
      await store.save(FIRST);
      jest.advanceTimersByTime(499);

      // Assert
      expect(replaceState).not.toHaveBeenCalled();
      expect(window.location.hash).toBe("");
    });

    it("should write the hash 500 milliseconds after the save", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);

      // Act
      jest.advanceTimersByTime(500);

      // Assert
      expect(window.location.hash).toBe(hashOf(FIRST));
    });

    it("should write once, 500 milliseconds after the last of several saves", async () => {
      // Arrange
      const store = createStore();
      const replaceState = jest.spyOn(window.history, "replaceState");

      await store.save(FIRST);
      jest.advanceTimersByTime(300);
      await store.save(SECOND);
      jest.advanceTimersByTime(499);

      expect(replaceState).not.toHaveBeenCalled();

      // Act
      jest.advanceTimersByTime(1);

      // Assert
      expect(replaceState).toHaveBeenCalledTimes(1);
      expect(window.location.hash).toBe(hashOf(SECOND));
    });

    it("should write again for a save that comes after a write", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      jest.advanceTimersByTime(500);

      // Act
      await store.save(SECOND);
      jest.advanceTimersByTime(500);

      // Assert
      expect(window.location.hash).toBe(hashOf(SECOND));
    });

    it("should write the pending hash at once when the page is hidden", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);

      // Act
      window.dispatchEvent(new Event("pagehide"));

      // Assert
      expect(window.location.hash).toBe(hashOf(FIRST));
    });

    it("should not write again at the end of the delay after the page was hidden", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      window.dispatchEvent(new Event("pagehide"));

      const replaceState = jest.spyOn(window.history, "replaceState");

      // Act
      jest.advanceTimersByTime(1000);

      // Assert
      expect(replaceState).not.toHaveBeenCalled();
    });

    it("should write nothing when the page is hidden and nothing is pending", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      jest.advanceTimersByTime(500);

      const replaceState = jest.spyOn(window.history, "replaceState");

      // Act
      window.dispatchEvent(new Event("pagehide"));

      // Assert
      expect(replaceState).not.toHaveBeenCalled();
    });

    it("should listen to pagehide only while a write is pending", async () => {
      // Arrange
      const store = createStore();
      const addListener = jest.spyOn(window, "addEventListener");
      const removeListener = jest.spyOn(window, "removeEventListener");

      // Act
      await store.save(FIRST);
      await store.save(SECOND);
      jest.advanceTimersByTime(500);

      // Assert
      const added = addListener.mock.calls.filter(
        ([type]) => type === "pagehide"
      );
      const removed = removeListener.mock.calls.filter(
        ([type]) => type === "pagehide"
      );

      expect(added).toHaveLength(2);
      expect(removed).toHaveLength(2);
      expect(removed[1][1]).toBe(added[1][1]);
    });

    describe("when the host moves to another page before the write", () => {
      const DOCS = "/docs/quick-start/";

      it("should write nothing to the other page when the delay ends", async () => {
        // Arrange
        const store = createStore();

        await store.save(FIRST);
        window.history.pushState({}, "", DOCS);

        const replaceState = jest.spyOn(window.history, "replaceState");

        // Act
        jest.advanceTimersByTime(1000);

        // Assert
        expect(replaceState).not.toHaveBeenCalled();
        expect(window.location.pathname).toBe(DOCS);
        expect(window.location.hash).toBe("");
      });

      it("should write nothing to the other page when the page is hidden", async () => {
        // Arrange
        const store = createStore();

        await store.save(FIRST);
        window.history.pushState({}, "", DOCS);

        const replaceState = jest.spyOn(window.history, "replaceState");

        // Act
        window.dispatchEvent(new Event("pagehide"));

        // Assert
        expect(replaceState).not.toHaveBeenCalled();
        expect(window.location.hash).toBe("");
      });

      it("should not write at the end of the delay after the page was hidden, and not listen to pagehide any more", async () => {
        // Arrange
        const store = createStore();

        await store.save(FIRST);
        window.history.pushState({}, "", DOCS);
        window.dispatchEvent(new Event("pagehide"));
        window.history.pushState({}, "", PAGE);

        // Act
        jest.advanceTimersByTime(1000);
        window.dispatchEvent(new Event("pagehide"));

        // Assert
        expect(window.location.hash).toBe("");
      });

      it("should keep the sketch, so that the next load of the page writes it back", async () => {
        // Arrange
        const store = createStore();

        await store.save(FIRST);
        window.history.pushState({}, "", DOCS);
        jest.advanceTimersByTime(1000);
        window.history.pushState({}, "", PAGE);

        // Act
        const sketch = await store.load();

        // Assert
        expect(sketch).toStrictEqual(FIRST);
        expect(window.location.pathname).toBe(PAGE);
        expect(window.location.hash).toBe(hashOf(FIRST));
      });

      it("should take another query as another page", async () => {
        // Arrange
        setUrl(`${PAGE}?tab=1`);

        const store = createStore();

        await store.save(FIRST);
        setUrl(`${PAGE}?tab=2`);

        // Act
        jest.advanceTimersByTime(1000);

        // Assert
        expect(window.location.search).toBe("?tab=2");
        expect(window.location.hash).toBe("");
      });

      it("should still write when only the hash of the page changed", async () => {
        // Arrange
        const store = createStore();

        await store.save(FIRST);
        setUrl(`${PAGE}#installation`);

        // Act
        jest.advanceTimersByTime(500);

        // Assert
        expect(window.location.hash).toBe(hashOf(FIRST));
      });

      it("should write to the page where the last save was made", async () => {
        // Arrange
        const store = createStore();

        await store.save(FIRST);
        window.history.pushState({}, "", DOCS);
        await store.save(SECOND);

        // Act
        jest.advanceTimersByTime(500);

        // Assert
        expect(window.location.pathname).toBe(DOCS);
        expect(window.location.hash).toBe(hashOf(SECOND));
      });
    });

    it("should keep the path and the query of the page, and the state of the history entry", async () => {
      // Arrange
      const routerState = { key: "abc123", usr: { from: "docs" } };

      setUrl("/docs/playground/?tab=2", routerState);

      const entries = window.history.length;
      const store = createStore();

      await store.save(FIRST);

      // Act
      jest.advanceTimersByTime(500);

      // Assert
      expect(window.location.pathname).toBe("/docs/playground/");
      expect(window.location.search).toBe("?tab=2");
      expect(window.location.hash).toBe(hashOf(FIRST));
      expect(window.history.state).toBe(routerState);
      expect(window.history).toHaveLength(entries);
    });

    it("should call replaceState with the state of the history and an empty title", async () => {
      // Arrange
      const routerState = { key: "abc123" };

      setUrl(PAGE, routerState);

      const replaceState = jest.spyOn(window.history, "replaceState");
      const store = createStore();

      await store.save(FIRST);

      // Act
      jest.advanceTimersByTime(500);

      // Assert
      expect(replaceState).toHaveBeenCalledWith(
        routerState,
        "",
        `${PAGE}${hashOf(FIRST)}`
      );
    });

    it("should swallow a write that the browser refuses, and write with the next one", async () => {
      // Arrange
      // Safari throws a SecurityError when replaceState is called too many times in a short time: 100 times in 10 seconds
      const replaceState = jest
        .spyOn(window.history, "replaceState")
        .mockImplementationOnce(() => {
          throw new DOMException(
            "Attempt to use history.replaceState() more than 100 times per 10 seconds",
            "SecurityError"
          );
        });
      const store = createStore();

      await store.save(FIRST);

      // Act
      const refused = () => jest.advanceTimersByTime(500);

      // Assert
      expect(refused).not.toThrow();
      expect(window.location.hash).toBe("");

      await store.save(SECOND);
      jest.advanceTimersByTime(500);

      expect(replaceState).toHaveBeenCalledTimes(2);
      expect(window.location.hash).toBe(hashOf(SECOND));
    });

    it("should swallow a write that the browser refuses when the page is hidden", async () => {
      // Arrange
      jest.spyOn(window.history, "replaceState").mockImplementationOnce(() => {
        throw new DOMException("refused", "SecurityError");
      });

      const store = createStore();

      await store.save(FIRST);

      // Act
      const hide = () => window.dispatchEvent(new Event("pagehide"));

      // Assert
      expect(hide).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should forget the saved sketch, so that the next load returns undefined", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);
      jest.advanceTimersByTime(500);

      // Act
      await store.clear();

      // Assert
      await expect(store.load()).resolves.toBeUndefined();
    });

    it("should remove the hash and keep the path and the query", async () => {
      // Arrange
      setUrl(`/docs/playground/?tab=2${hashOf(FIRST)}`);

      const store = createStore();

      // Act
      await store.clear();

      // Assert
      expect(window.location.pathname).toBe("/docs/playground/");
      expect(window.location.search).toBe("?tab=2");
      expect(window.location.hash).toBe("");
      expect(window.location.href).not.toContain("#");
    });

    it("should keep the state of the history entry", async () => {
      // Arrange
      const routerState = { key: "abc123" };

      setUrl(`${PAGE}${hashOf(FIRST)}`, routerState);

      const entries = window.history.length;
      const store = createStore();

      // Act
      await store.clear();

      // Assert
      expect(window.history.state).toBe(routerState);
      expect(window.history).toHaveLength(entries);
    });

    it("should drop the write that is pending", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);

      // Act
      await store.clear();
      jest.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("pagehide"));

      // Assert
      expect(window.location.hash).toBe("");
    });

    it("should resolve when the browser refuses to replace the URL", async () => {
      // Arrange
      jest.spyOn(window.history, "replaceState").mockImplementation(() => {
        throw new DOMException("refused", "SecurityError");
      });

      const store = createStore();

      // Act
      const cleared = store.clear();

      // Assert
      await expect(cleared).resolves.toBeUndefined();
    });
  });

  describe("share", () => {
    it("should return the origin, the path, the query and the hash of the sketch", async () => {
      // Arrange
      setUrl("/docs/playground/?tab=2");

      const store = createStore();

      // Act
      const link = await store.share(FIRST);

      // Assert
      expect(link).toBe(
        `${window.location.origin}/docs/playground/?tab=2${hashOf(FIRST)}`
      );
      expect(link.startsWith("http://localhost/")).toBe(true);
    });

    it("should return a link that opens the sketch", async () => {
      // Arrange
      const store = createStore();

      // Act
      const link = await store.share(FIRST);

      // Assert
      expect(decodeHash(new URL(link).hash)).toStrictEqual({
        status: "sketch",
        sketch: FIRST,
      });
    });

    it("should write the hash at once", async () => {
      // Arrange
      const store = createStore();

      // Act
      await store.share(FIRST);

      // Assert
      expect(window.location.hash).toBe(hashOf(FIRST));
    });

    it("should drop the write that is pending, which is older", async () => {
      // Arrange
      const store = createStore();

      await store.save(FIRST);

      // Act
      await store.share(SECOND);

      const replaceState = jest.spyOn(window.history, "replaceState");

      jest.advanceTimersByTime(1000);
      window.dispatchEvent(new Event("pagehide"));

      // Assert
      expect(replaceState).not.toHaveBeenCalled();
      expect(window.location.hash).toBe(hashOf(SECOND));
    });

    it("should remember the sketch, so that a load without a hash returns it", async () => {
      // Arrange
      const store = createStore();

      await store.share(FIRST);
      setUrl(PAGE);

      // Act
      const sketch = await store.load();

      // Assert
      expect(sketch).toStrictEqual(FIRST);
    });

    it("should return the link even when the browser refuses to write the URL", async () => {
      // Arrange
      jest.spyOn(window.history, "replaceState").mockImplementation(() => {
        throw new DOMException("refused", "SecurityError");
      });

      const store = createStore();

      // Act
      const link = await store.share(FIRST);

      // Assert
      expect(link).toBe(`${window.location.origin}${PAGE}${hashOf(FIRST)}`);
    });
  });

  describe("subscribe", () => {
    it("should call the listener, with no arguments, when the hash changes", () => {
      // Arrange
      const store = createStore();
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith();
    });

    it("should call the listener when the user changes the hash of the address bar", async () => {
      // Arrange
      jest.useRealTimers();

      const store = createStore();
      const listener = jest.fn();
      const changed = new Promise<void>((resolve) => {
        window.addEventListener("hashchange", () => resolve(), { once: true });
      });

      store.subscribe(listener);

      // Act
      window.location.hash = "#v=1&s=abc";
      await changed;

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should stop calling the listener once it is unsubscribed", () => {
      // Arrange
      const store = createStore();
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      // Act
      unsubscribe();
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });

    it("should keep calling the other listeners when one is unsubscribed", () => {
      // Arrange
      const store = createStore();
      const first = jest.fn();
      const second = jest.fn();
      const unsubscribeFirst = store.subscribe(first);

      store.subscribe(second);
      unsubscribeFirst();

      // Act
      window.dispatchEvent(new HashChangeEvent("hashchange"));

      // Assert
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should not call the listener for its own writes", async () => {
      // Arrange
      jest.useRealTimers();

      const store = createStore();
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      await store.save(FIRST);
      window.dispatchEvent(new Event("pagehide"));
      await store.share(SECOND);
      await store.clear();
      // A hashchange that jsdom queued would arrive within a task
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
