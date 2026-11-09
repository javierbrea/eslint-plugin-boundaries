import { act, renderHook } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { MAX_SKETCH_NODES } from "@/domains/project/helpers/sketch/sketch.constants";
import type { SessionStore } from "@/domains/session/data/store";
import {
  HOOK_SKETCH,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import { LONG_LINK_LENGTH } from "@/domains/share/helpers/sketchHash";

import { useShareLink } from "./useShareLink";
import {
  SHARE_COPIED_DURATION,
  SHARE_FAILED_DURATION,
  SHARE_LONG_DURATION,
  SHARE_REFUSED_DURATION,
} from "./useShareLink.constants";
import type { MakeLink, ShareLink } from "./useShareLink.types";

const SHORT_LINK = "https://example.com/playground/#v=1&s=abc";

const LONG_LINK = `https://example.com/playground/#v=1&s=${"a".repeat(
  LONG_LINK_LENGTH
)}`;

/**
 * Makes a sketch with the number of files given and nothing else.
 * @param fileCount How many files.
 * @returns The sketch.
 */
function createSketchOfFiles(fileCount: number): Sketch {
  return {
    config: HOOK_SKETCH.config,
    tree: Array.from({ length: fileCount }, (_, index) => ({
      path: `src/f${index}.js`,
      kind: "file",
    })),
    dependencies: [],
  };
}

/** A sketch with one file more than a link can hold, which no link would open */
const TOO_LARGE_SKETCH = createSketchOfFiles(MAX_SKETCH_NODES + 1);

/** A sketch that the reader of links refuses for another cause: a path that ends with a space */
const INVALID_SKETCH: Sketch = {
  config: HOOK_SKETCH.config,
  tree: [{ path: "src/a.js ", kind: "file" }],
  dependencies: [],
};

/**
 * Replaces the clipboard of the browser, which jsdom does not have.
 * @param writeText What the clipboard does when it is given the link.
 * @returns The spy of `writeText`.
 */
function stubClipboard(
  writeText: (text: string) => Promise<void> = () => Promise.resolve()
): jest.Mock<Promise<void>, [string]> {
  const spy = jest.fn(writeText);

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: spy },
  });

  return spy;
}

/** What {@link renderShare} returns. */
type ShareRender = {
  /** What the hook returned in the last render. */
  readonly result: { readonly current: ShareLink };
  /** The store of the instance the hook is in. */
  readonly store: SessionStore;
  /** Removes the instance, as the playground does when it goes away. */
  readonly unmount: () => void;
};

/**
 * Renders the hook inside an instance of the playground, which has the sketch it shares.
 * @param makeLink Makes the link that opens a sketch, or `undefined` for a host that cannot.
 * @param sketch The sketch of the instance; {@link HOOK_SKETCH} when it is unset.
 * @returns What the hook returned, the store and the way to remove the instance.
 */
function renderShare(
  makeLink: MakeLink | undefined,
  sketch: Sketch = HOOK_SKETCH
): ShareRender {
  const results: ShareLink[] = [];

  /**
   * Calls the hook in a component and remembers what it returned.
   * @returns Nothing to render.
   */
  function Probe(): null {
    results.push(useShareLink(makeLink));
    return null;
  }

  const { store, unmount } = renderInSession(<Probe />, { sketch });

  return {
    result: {
      get current(): ShareLink {
        return results[results.length - 1];
      },
    },
    store,
    unmount,
  };
}

/**
 * Presses share and lets the copy end.
 * @param share The action that shares.
 */
async function pressShare(share: ShareLink["share"]): Promise<void> {
  await act(async () => {
    share?.();
  });
}

/**
 * Lets time pass inside `act`, so that the timers of the hook run.
 * @param milliseconds How much time passes.
 */
function pass(milliseconds: number): void {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

describe("useShareLink", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    stubClipboard();
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  describe("outside the provider", () => {
    beforeEach(() => {
      // React logs the error that a component throws
      jest.spyOn(console, "error").mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.mocked(console.error).mockRestore();
    });

    it("should throw when it is used outside SessionProvider", () => {
      // Act
      const render = (): unknown => renderHook(() => useShareLink(undefined));

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  describe("when the host cannot make a link", () => {
    it("should offer nothing to share with and have no message", () => {
      // Act
      const { result } = renderShare(undefined);

      // Assert
      expect(result.current.share).toBeUndefined();
      expect(result.current.outcome).toBeUndefined();
    });
  });

  describe("sharing", () => {
    it("should make the link of the sketch on screen, which is the one that was edited and not the first", async () => {
      // Arrange
      const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
        Promise.resolve(SHORT_LINK)
      );
      const { result, store } = renderShare(makeLink);

      act(() => store.removeNode("src/index.js"));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(makeLink).toHaveBeenCalledTimes(1);
      expect(makeLink).toHaveBeenCalledWith(store.getState().sketch);
      expect(makeLink.mock.calls[0][0].tree.map(({ path }) => path)).toEqual([
        "src/helpers/format.js",
      ]);
    });

    it("should copy the link it gets and say that it was copied", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(result.current.outcome).toBe("copied");
    });

    it("should say nothing before the copy ends", async () => {
      // Arrange
      let resolveLink: (link: string) => void = () => undefined;
      const { result } = renderShare(
        () =>
          new Promise<string>((resolve) => {
            resolveLink = resolve;
          })
      );

      // Act
      await pressShare(result.current.share);
      const whileWaiting = result.current.outcome;
      await act(async () => {
        resolveLink(SHORT_LINK);
      });

      // Assert
      expect(whileWaiting).toBeUndefined();
      expect(result.current.outcome).toBe("copied");
    });
  });

  describe("when no link could open the sketch", () => {
    it("should ask the host for no link, copy nothing and say that the sketch is too large when it has more files than a link can hold", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
        Promise.resolve(SHORT_LINK)
      );
      const { result } = renderShare(makeLink, TOO_LARGE_SKETCH);

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(makeLink).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
      expect(result.current.outcome).toEqual({
        kind: "too-large",
        reason: "The sketch has more than 1000 files and folders.",
      });
    });

    it("should ask the host for no link, copy nothing and give the reason when the sketch is refused for another cause", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
        Promise.resolve(SHORT_LINK)
      );
      const { result } = renderShare(makeLink, INVALID_SKETCH);

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(makeLink).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
      expect(result.current.outcome).toEqual({
        kind: "invalid",
        reason:
          '"src/a.js " cannot be in the tree. A path cannot end with a space.',
      });
    });

    it("should keep the message for its time and not a moment less", async () => {
      // Arrange
      const { result } = renderShare(
        () => Promise.resolve(SHORT_LINK),
        TOO_LARGE_SKETCH
      );

      // Act
      await pressShare(result.current.share);
      pass(SHARE_REFUSED_DURATION - 1);
      const justBefore = result.current.outcome;
      pass(1);

      // Assert
      expect(justBefore).toMatchObject({ kind: "too-large" });
      expect(result.current.outcome).toBeUndefined();
    });

    it("should share the sketch once an edit brings it within what a link can hold", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
        Promise.resolve(SHORT_LINK)
      );
      const { result, store } = renderShare(makeLink, TOO_LARGE_SKETCH);

      await pressShare(result.current.share);

      const refused = result.current.outcome;

      act(() => store.removeNode("src/f0.js"));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(refused).toMatchObject({ kind: "too-large" });
      expect(makeLink).toHaveBeenCalledTimes(1);
      expect(makeLink).toHaveBeenCalledWith(store.getState().sketch);
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(result.current.outcome).toBe("copied");
    });
  });

  describe("how long the message stays", () => {
    it.each<[string, string, number, string]>([
      ["copied", SHORT_LINK, SHARE_COPIED_DURATION, "copied"],
      ["long", LONG_LINK, SHARE_LONG_DURATION, "long"],
    ])(
      "should keep the message of a %s link for its time and not a moment less",
      async (_name, link, duration, outcome) => {
        // Arrange
        const { result } = renderShare(() => Promise.resolve(link));

        // Act
        await pressShare(result.current.share);
        pass(duration - 1);
        const justBefore = result.current.outcome;
        pass(1);

        // Assert
        expect(justBefore).toBe(outcome);
        expect(result.current.outcome).toBeUndefined();
      }
    );

    it("should keep the message of a link that could not be made for its time and not a moment less", async () => {
      // Arrange
      const { result } = renderShare(() =>
        Promise.reject(new Error("no link"))
      );

      // Act
      await pressShare(result.current.share);
      pass(SHARE_FAILED_DURATION - 1);
      const justBefore = result.current.outcome;
      pass(1);

      // Assert
      expect(justBefore).toBe("failed");
      expect(result.current.outcome).toBeUndefined();
    });

    it("should keep a long link longer than a short one", () => {
      // Assert
      expect(SHARE_COPIED_DURATION).toBe(2000);
      expect(SHARE_LONG_DURATION).toBe(6000);
    });

    it("should keep the message of a sketch that is not shared as long as the one of a failure", () => {
      // Assert
      expect(SHARE_REFUSED_DURATION).toBe(6000);
      expect(SHARE_REFUSED_DURATION).toBe(SHARE_FAILED_DURATION);
    });
  });

  describe("when the link cannot be copied", () => {
    it("should say that it failed when the host cannot make the link", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(() =>
        Promise.reject(new Error("no link"))
      );

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.outcome).toBe("failed");
      expect(writeText).not.toHaveBeenCalled();
    });

    it("should say that it failed when the clipboard refuses the link", async () => {
      // Arrange
      stubClipboard(() => Promise.reject(new Error("denied")));
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.outcome).toBe("failed");
    });

    it("should say that it failed when the browser has no clipboard", async () => {
      // Arrange
      Reflect.deleteProperty(navigator, "clipboard");
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.outcome).toBe("failed");
    });
  });

  describe("when it is pressed again", () => {
    it("should keep the new message for its whole time, and not end it with the timer of the first", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressShare(result.current.share);
      pass(SHARE_COPIED_DURATION - 500);

      // Act
      await pressShare(result.current.share);
      pass(1000);

      // Assert
      expect(result.current.outcome).toBe("copied");

      pass(SHARE_COPIED_DURATION - 1000);

      expect(result.current.outcome).toBeUndefined();
    });

    it("should clear the message of the first press while the second copies", async () => {
      // Arrange
      const links = [
        Promise.resolve(SHORT_LINK),
        new Promise<string>(() => undefined),
      ];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      const first = result.current.outcome;

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(first).toBe("copied");
      expect(result.current.outcome).toBeUndefined();
    });

    it("should show the message of the latest press when an earlier copy ends after it", async () => {
      // Arrange
      let resolveFirst: (link: string) => void = () => undefined;
      const links = [
        new Promise<string>((resolve) => {
          resolveFirst = resolve;
        }),
        Promise.resolve(SHORT_LINK),
      ];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      await pressShare(result.current.share);

      // Act
      await act(async () => {
        resolveFirst(LONG_LINK);
      });

      // Assert
      expect(result.current.outcome).toBe("copied");
    });
  });

  describe("when the instance is gone", () => {
    /**
     * Finds the timers that keep the message of a link that was copied, among the ones the window was asked to start.
     * @param setTimeoutSpy The spy of `window.setTimeout`.
     * @returns The ids of the timers that last as long as that message.
     */
    function findMessageTimers(
      setTimeoutSpy: jest.SpyInstance<number, Parameters<typeof setTimeout>>
    ): number[] {
      return setTimeoutSpy.mock.calls.flatMap(([, delay], index) =>
        delay === SHARE_COPIED_DURATION
          ? [setTimeoutSpy.mock.results[index].value as number]
          : []
      );
    }

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should stop the timer of the message", async () => {
      // Arrange
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
      const { result, unmount } = renderShare(() =>
        Promise.resolve(SHORT_LINK)
      );

      await pressShare(result.current.share);

      const timers = findMessageTimers(setTimeoutSpy);

      // Act
      unmount();

      // Assert
      expect(timers).toHaveLength(1);
      expect(clearTimeoutSpy).toHaveBeenLastCalledWith(timers[0]);
    });

    it("should start no timer for a copy that ends after it", async () => {
      // Arrange
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      let resolveLink: (link: string) => void = () => undefined;
      const { result, unmount } = renderShare(
        () =>
          new Promise<string>((resolve) => {
            resolveLink = resolve;
          })
      );

      await pressShare(result.current.share);
      unmount();

      // Act
      await act(async () => {
        resolveLink(SHORT_LINK);
      });

      // Assert
      expect(findMessageTimers(setTimeoutSpy)).toEqual([]);
    });
  });
});
