import { act, renderHook } from "@testing-library/react";

import type { Sketch, SketchDependency } from "@/contract";
import {
  MAX_SKETCH_DEPENDENCIES,
  MAX_SKETCH_NODES,
} from "@/domains/project/helpers/sketch/sketch.constants";
import type { SessionStore } from "@/domains/session/data/store";
import {
  HOOK_SKETCH,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import type { ShareNotice } from "@/domains/share/helpers/shareOutcome";
import {
  LONG_LINK_LENGTH,
  MAX_SKETCH_JSON_BYTES,
} from "@/domains/share/helpers/sketchHash";

import { useShareLink } from "./useShareLink";
import { SHARE_COPIED_DURATION } from "./useShareLink.constants";
import type { MakeLink, ShareLink } from "./useShareLink.types";

const SHORT_LINK = "https://example.com/playground/#v=1&s=abc";

const OTHER_LINK = "https://example.com/playground/#v=1&s=other";

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

/**
 * Makes a sketch with one file and the number of dependencies given, each on an external module of its own.
 * @param dependencyCount How many dependencies.
 * @returns The sketch.
 */
function createSketchOfDependencies(dependencyCount: number): Sketch {
  const dependencies: SketchDependency[] = Array.from(
    { length: dependencyCount },
    (_, index) => ({
      from: "src/f0.js",
      target: { kind: "external", name: `m${index}` },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "named", name: `n${index}` }],
    })
  );

  return {
    config: HOOK_SKETCH.config,
    tree: [{ path: "src/f0.js", kind: "file" }],
    dependencies,
  };
}

/**
 * Makes a sketch whose JSON as a link writes it has exactly the bytes given, all of them ASCII.
 * @param bytes The size of the JSON.
 * @returns The sketch, which has no files and a config as long as the size needs.
 */
function createSketchOfBytes(bytes: number): Sketch {
  const empty: Sketch = { config: "", tree: [], dependencies: [] };
  const overhead = JSON.stringify(empty).length;

  return { ...empty, config: "a".repeat(bytes - overhead) };
}

/** A sketch with one file more than a link can hold, which no link would open */
const TOO_MANY_FILES_SKETCH = createSketchOfFiles(MAX_SKETCH_NODES + 1);

/** A sketch that the reader of links refuses for another cause: a path that ends with a space */
const INVALID_SKETCH: Sketch = {
  config: HOOK_SKETCH.config,
  tree: [{ path: "src/a.js ", kind: "file" }],
  dependencies: [],
};

/**
 * A sketch that cannot be written as a link, because a dependency has no target: it is not a sketch that the editors make, and writing it throws.
 */
const UNCHECKABLE_SKETCH = {
  config: HOOK_SKETCH.config,
  tree: [{ path: "src/a.js", kind: "file" }],
  dependencies: [
    {
      from: "src/a.js",
      target: undefined,
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
  ],
} as unknown as Sketch;

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

/** A promise that the spec settles when it decides. */
type Deferred<Value> = {
  /** The promise that waits. */
  readonly promise: Promise<Value>;
  /** Settles the promise with a value. */
  readonly resolve: (value: Value) => void;
  /** Settles the promise with an error. */
  readonly reject: (reason: Error) => void;
};

/**
 * Makes a promise that waits until the spec settles it, so that a spec decides in which order the asynchronous steps end.
 * @returns The promise and the functions that settle it.
 */
function createDeferred<Value>(): Deferred<Value> {
  let resolve: (value: Value) => void = () => undefined;
  let reject: (reason: Error) => void = () => undefined;
  const promise = new Promise<Value>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
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
 * Copies a link again and lets the copy end.
 * @param copyAgain The action that copies a link again.
 * @param link The link to copy.
 * @returns What the action resolved with.
 */
async function pressCopyAgain(
  copyAgain: ShareLink["copyAgain"],
  link: string
): Promise<boolean> {
  let copied = false;

  await act(async () => {
    copied = await copyAgain(link);
  });
  return copied;
}

/**
 * Starts copying a link again and leaves the copy waiting for the clipboard.
 * @param copyAgain The action that copies a link again.
 * @param link The link to copy.
 * @returns The promise of the copy, which resolves with what the action resolves with.
 */
function startCopyAgain(
  copyAgain: ShareLink["copyAgain"],
  link: string
): Promise<boolean> {
  let pending: Promise<boolean> = Promise.resolve(false);

  act(() => {
    pending = copyAgain(link);
  });
  return pending;
}

/** What the hook shows, which is everything it returns but its actions. */
type ShareState = Pick<
  ShareLink,
  "isCopied" | "notice" | "isNoticeOpen" | "isCopiedAgain"
>;

/** What the hook shows before anything happened. */
const IDLE_STATE: ShareState = {
  isCopied: false,
  notice: undefined,
  isNoticeOpen: false,
  isCopiedAgain: false,
};

/**
 * Reads what the hook shows, so that a spec asserts all of it at once and sees that nothing else changed.
 * @param share What the hook returned.
 * @param share.isCopied
 * @param share.notice
 * @param share.isNoticeOpen
 * @param share.isCopiedAgain
 * @returns The confirmations and the notice with its dialog.
 */
function readState({
  isCopied,
  notice,
  isNoticeOpen,
  isCopiedAgain,
}: ShareLink): ShareState {
  return { isCopied, notice, isNoticeOpen, isCopiedAgain };
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

/**
 * Finds the timers that keep a confirmation, among the ones the window was asked to start.
 * @param setTimeoutSpy The spy of `window.setTimeout`.
 * @returns The ids of the timers that last as long as a confirmation, in the order they started.
 */
function findConfirmationTimers(
  setTimeoutSpy: jest.SpyInstance<number, Parameters<typeof setTimeout>>
): number[] {
  return setTimeoutSpy.mock.calls.flatMap(([, delay], index) =>
    delay === SHARE_COPIED_DURATION
      ? [setTimeoutSpy.mock.results[index].value as number]
      : []
  );
}

describe("useShareLink", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    stubClipboard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    it("should offer nothing to share with and have nothing to say", () => {
      // Act
      const { result } = renderShare(undefined);

      // Assert
      expect(result.current.share).toBeUndefined();
      expect(readState(result.current)).toStrictEqual(IDLE_STATE);
    });

    it("should still copy a link again", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(undefined);

      // Act
      const copied = await pressCopyAgain(result.current.copyAgain, OTHER_LINK);

      // Assert
      expect(copied).toBe(true);
      expect(writeText).toHaveBeenCalledWith(OTHER_LINK);
      expect(result.current.isCopiedAgain).toBe(true);
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

    it("should copy the link it gets and confirm it, with no notice and no dialog", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(readState(result.current)).toStrictEqual({
        ...IDLE_STATE,
        isCopied: true,
      });
    });

    it("should say nothing and copy nothing before the host makes the link", async () => {
      // Arrange
      const writeText = stubClipboard();
      const link = createDeferred<string>();
      const { result } = renderShare(() => link.promise);

      // Act
      await pressShare(result.current.share);

      const whileWaiting = {
        isCopied: result.current.isCopied,
        notice: result.current.notice,
        isNoticeOpen: result.current.isNoticeOpen,
        copied: writeText.mock.calls.length,
      };

      await act(async () => {
        link.resolve(SHORT_LINK);
      });

      // Assert
      expect(whileWaiting).toStrictEqual({
        isCopied: false,
        notice: undefined,
        isNoticeOpen: false,
        copied: 0,
      });
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(result.current.isCopied).toBe(true);
    });
  });

  describe("the confirmation of a link that was copied", () => {
    it("should last for its time and not a moment less", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      await pressShare(result.current.share);
      pass(SHARE_COPIED_DURATION - 1);
      const justBefore = result.current.isCopied;
      pass(1);

      // Assert
      expect(justBefore).toBe(true);
      expect(result.current.isCopied).toBe(false);
    });

    it("should last two seconds", () => {
      // Assert
      expect(SHARE_COPIED_DURATION).toBe(2000);
    });

    it("should open no dialog when it ends", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      await pressShare(result.current.share);
      pass(SHARE_COPIED_DURATION);

      // Assert
      expect(result.current.notice).toBeUndefined();
      expect(result.current.isNoticeOpen).toBe(false);
    });
  });

  describe("when the link is long", () => {
    it("should copy the link and tell its length and the one above which a link is long, in a notice that opens the dialog", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(() => Promise.resolve(LONG_LINK));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(writeText).toHaveBeenCalledWith(LONG_LINK);
      expect(result.current.notice).toStrictEqual({
        kind: "long",
        length: LONG_LINK.length,
        maxLength: 8192,
      });
      expect(result.current.isNoticeOpen).toBe(true);
      expect(result.current.isCopied).toBe(false);
    });

    it("should confirm the link with no notice when it has 8192 characters", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve("a".repeat(8192)));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.isCopied).toBe(true);
      expect(result.current.notice).toBeUndefined();
      expect(result.current.isNoticeOpen).toBe(false);
    });

    it("should give a notice and no confirmation when it has 8193 characters", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve("a".repeat(8193)));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.notice).toStrictEqual({
        kind: "long",
        length: 8193,
        maxLength: 8192,
      });
      expect(result.current.isNoticeOpen).toBe(true);
      expect(result.current.isCopied).toBe(false);
    });
  });

  describe("when no link could open the sketch", () => {
    it.each<[string, Sketch, string, number]>([
      ["files", TOO_MANY_FILES_SKETCH, "nodes", 1000],
      [
        "dependencies",
        createSketchOfDependencies(MAX_SKETCH_DEPENDENCIES + 1),
        "dependencies",
        3000,
      ],
      [
        "bytes",
        createSketchOfBytes(MAX_SKETCH_JSON_BYTES + 1),
        "bytes",
        4194304,
      ],
    ])(
      "should ask the host for no link, copy nothing and say that the sketch has too many %s, with the most a link holds",
      async (_name, sketch, limit, max) => {
        // Arrange
        const writeText = stubClipboard();
        const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
          Promise.resolve(SHORT_LINK)
        );
        const { result } = renderShare(makeLink, sketch);

        // Act
        await pressShare(result.current.share);

        // Assert
        expect(makeLink).not.toHaveBeenCalled();
        expect(writeText).not.toHaveBeenCalled();
        expect(result.current.notice).toStrictEqual({
          kind: "too-large",
          limit,
          max,
        });
        expect(result.current.isNoticeOpen).toBe(true);
        expect(result.current.isCopied).toBe(false);
      }
    );

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
      expect(result.current.notice).toStrictEqual({
        kind: "invalid",
        reason:
          '"src/a.js " cannot be in the tree. A path cannot end with a space.',
      });
      expect(result.current.isNoticeOpen).toBe(true);
      expect(result.current.isCopied).toBe(false);
    });

    it("should share the sketch once an edit brings it within what a link can hold", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
        Promise.resolve(SHORT_LINK)
      );
      const { result, store } = renderShare(makeLink, TOO_MANY_FILES_SKETCH);

      await pressShare(result.current.share);

      const refused = result.current.notice;

      act(() => result.current.closeNotice());
      act(() => store.removeNode("src/f0.js"));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(refused).toMatchObject({ kind: "too-large" });
      expect(makeLink).toHaveBeenCalledTimes(1);
      expect(makeLink).toHaveBeenCalledWith(store.getState().sketch);
      expect(writeText).toHaveBeenCalledWith(SHORT_LINK);
      expect(readState(result.current)).toMatchObject({
        isCopied: true,
        isNoticeOpen: false,
      });
    });
  });

  describe("when the link cannot be made", () => {
    it("should say that no link was made, and never touch the clipboard, when the host rejects", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(() =>
        Promise.reject(new Error("no link"))
      );

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.notice).toStrictEqual({ kind: "not-made" });
      expect(result.current.isNoticeOpen).toBe(true);
      expect(result.current.isCopied).toBe(false);
      expect(writeText).not.toHaveBeenCalled();
    });

    it("should say that no link was made, and never touch the clipboard, when the host throws", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(() => {
        throw new Error("no link");
      });

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.notice).toStrictEqual({ kind: "not-made" });
      expect(result.current.isNoticeOpen).toBe(true);
      expect(writeText).not.toHaveBeenCalled();
    });

    it("should say that no link was made, ask the host for none and copy nothing, when the sketch cannot be checked", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
        Promise.resolve(SHORT_LINK)
      );
      const { result } = renderShare(makeLink, UNCHECKABLE_SKETCH);

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.notice).toStrictEqual({ kind: "not-made" });
      expect(result.current.isNoticeOpen).toBe(true);
      expect(makeLink).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
    });
  });

  describe("when the link cannot be copied", () => {
    it.each<[string, () => void]>([
      [
        "the clipboard rejects the link",
        () => stubClipboard(() => Promise.reject(new Error("denied"))),
      ],
      [
        "the clipboard throws",
        () =>
          stubClipboard(() => {
            throw new Error("denied");
          }),
      ],
      [
        "the browser has no clipboard",
        () => Reflect.deleteProperty(navigator, "clipboard"),
      ],
    ])(
      "should give the link in a notice when %s",
      async (_name, breakClipboard) => {
        // Arrange
        breakClipboard();

        const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
          Promise.resolve(SHORT_LINK)
        );
        const { result } = renderShare(makeLink);

        // Act
        await pressShare(result.current.share);

        // Assert
        expect(makeLink).toHaveBeenCalledTimes(1);
        expect(result.current.notice).toStrictEqual({
          kind: "not-copied",
          link: SHORT_LINK,
        });
        expect(result.current.isNoticeOpen).toBe(true);
        expect(result.current.isCopied).toBe(false);
      }
    );

    it("should give the link, and not tell that it is long, when the clipboard rejects a long link", async () => {
      // Arrange
      stubClipboard(() => Promise.reject(new Error("denied")));

      const { result } = renderShare(() => Promise.resolve(LONG_LINK));

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.notice).toStrictEqual({
        kind: "not-copied",
        link: LONG_LINK,
      });
    });

    it("should copy the link of the notice once the clipboard works", async () => {
      // Arrange
      const writeText = stubClipboard();

      writeText.mockRejectedValueOnce(new Error("denied"));

      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressShare(result.current.share);

      const { link } = result.current.notice as Extract<
        ShareNotice,
        { kind: "not-copied" }
      >;

      // Act
      const copied = await pressCopyAgain(result.current.copyAgain, link);

      // Assert
      expect(link).toBe(SHORT_LINK);
      expect(copied).toBe(true);
      expect(writeText).toHaveBeenLastCalledWith(SHORT_LINK);
      expect(result.current.isCopiedAgain).toBe(true);
    });
  });

  describe("the notice", () => {
    const NOTICE_SETUPS: ReadonlyArray<[string, () => ShareRender]> = [
      ["long", () => renderShare(() => Promise.resolve(LONG_LINK))],
      [
        "not-copied",
        () => {
          stubClipboard(() => Promise.reject(new Error("denied")));
          return renderShare(() => Promise.resolve(SHORT_LINK));
        },
      ],
      [
        "not-made",
        () => renderShare(() => Promise.reject(new Error("no link"))),
      ],
      [
        "too-large",
        () =>
          renderShare(() => Promise.resolve(SHORT_LINK), TOO_MANY_FILES_SKETCH),
      ],
      [
        "invalid",
        () => renderShare(() => Promise.resolve(SHORT_LINK), INVALID_SKETCH),
      ],
    ];

    it.each(NOTICE_SETUPS)(
      "should stay open, however much time passes, when it is of kind %s",
      async (kind, setup) => {
        // Arrange
        const { result } = setup();

        // Act
        await pressShare(result.current.share);

        const opened = result.current.notice;

        pass(60 * 60 * 1000);

        // Assert
        expect(opened?.kind).toBe(kind);
        expect(result.current.notice).toBe(opened);
        expect(result.current.isNoticeOpen).toBe(true);
      }
    );

    it.each(NOTICE_SETUPS)(
      "should close the dialog and keep the notice, so that the dialog does not change while it fades out, when it is of kind %s",
      async (kind, setup) => {
        // Arrange
        const { result } = setup();

        await pressShare(result.current.share);

        const opened = result.current.notice;

        // Act
        act(() => result.current.closeNotice());

        // Assert
        expect(opened?.kind).toBe(kind);
        expect(result.current.isNoticeOpen).toBe(false);
        expect(result.current.notice).toBe(opened);
      }
    );

    it("should do nothing when it is closed and there is no notice", () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      act(() => result.current.closeNotice());

      // Assert
      expect(result.current.isNoticeOpen).toBe(false);
      expect(result.current.notice).toBeUndefined();
    });

    it("should open the dialog again, with the new notice, when the next share needs one", async () => {
      // Arrange
      stubClipboard(() => Promise.reject(new Error("denied")));

      const makeLink = jest
        .fn<Promise<string>, [Sketch]>()
        .mockResolvedValueOnce(SHORT_LINK)
        .mockRejectedValueOnce(new Error("no link"));
      const { result } = renderShare(makeLink);

      await pressShare(result.current.share);
      act(() => result.current.closeNotice());

      const afterClosing = {
        isNoticeOpen: result.current.isNoticeOpen,
        notice: result.current.notice,
      };

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(afterClosing).toStrictEqual({
        isNoticeOpen: false,
        notice: { kind: "not-copied", link: SHORT_LINK },
      });
      expect(result.current.notice).toStrictEqual({ kind: "not-made" });
      expect(result.current.isNoticeOpen).toBe(true);
    });

    it("should leave the dialog closed when the next share is a copy with nothing to say", async () => {
      // Arrange
      const writeText = stubClipboard();

      writeText.mockRejectedValueOnce(new Error("denied"));

      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressShare(result.current.share);
      act(() => result.current.closeNotice());

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(result.current.isCopied).toBe(true);
      expect(result.current.isNoticeOpen).toBe(false);
    });
  });

  describe("when it is pressed again", () => {
    it("should keep the new confirmation for its whole time, and not end it with the timer of the first", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressShare(result.current.share);
      pass(SHARE_COPIED_DURATION - 500);

      // Act
      await pressShare(result.current.share);
      pass(1000);

      // Assert
      expect(result.current.isCopied).toBe(true);

      pass(SHARE_COPIED_DURATION - 1000 - 1);

      expect(result.current.isCopied).toBe(true);

      pass(1);

      expect(result.current.isCopied).toBe(false);
    });

    it("should clear the confirmation of the first press while the second makes the link", async () => {
      // Arrange
      const links = [
        Promise.resolve(SHORT_LINK),
        new Promise<string>(() => undefined),
      ];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      const first = result.current.isCopied;

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(first).toBe(true);
      expect(result.current.isCopied).toBe(false);
    });

    it("should clear the confirmation of a copy again while it makes the link", async () => {
      // Arrange
      const links = [
        Promise.resolve(SHORT_LINK),
        new Promise<string>(() => undefined),
      ];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);

      const before = result.current.isCopiedAgain;

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(before).toBe(true);
      expect(result.current.isCopiedAgain).toBe(false);
    });

    it("should stop the timers of the confirmation and of the copy again", async () => {
      // Arrange
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressShare(result.current.share);
      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);

      const [confirmation, copyAgain] = findConfirmationTimers(setTimeoutSpy);

      clearTimeoutSpy.mockClear();

      // Act
      await pressShare(result.current.share);

      // Assert
      expect(confirmation).not.toBe(copyAgain);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(confirmation);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(copyAgain);
    });

    it("should show nothing of an earlier share that ends after the latest, which is a long link", async () => {
      // Arrange
      const first = createDeferred<string>();
      const links = [first.promise, Promise.resolve(SHORT_LINK)];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      await pressShare(result.current.share);

      // Act
      await act(async () => {
        first.resolve(LONG_LINK);
      });

      // Assert
      expect(result.current.isCopied).toBe(true);
      expect(result.current.notice).toBeUndefined();
      expect(result.current.isNoticeOpen).toBe(false);

      pass(SHARE_COPIED_DURATION);

      expect(result.current.isCopied).toBe(false);
    });

    it("should never write to the clipboard the link of a share whose link comes after a newer share started, so that the clipboard holds only the newer link", async () => {
      // Arrange
      const writeText = stubClipboard();
      const first = createDeferred<string>();
      const links = [first.promise, Promise.resolve(SHORT_LINK)];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      await pressShare(result.current.share);

      // Act
      await act(async () => {
        first.resolve(OTHER_LINK);
      });

      // Assert
      expect(writeText.mock.calls).toStrictEqual([[SHORT_LINK]]);
      expect(readState(result.current)).toStrictEqual({
        ...IDLE_STATE,
        isCopied: true,
      });

      pass(SHARE_COPIED_DURATION - 1);

      expect(result.current.isCopied).toBe(true);
    });

    it("should confirm nothing for a share whose copy ends after a newer share started", async () => {
      // Arrange
      const writeText = stubClipboard();
      const clipboard = createDeferred<void>();

      writeText.mockReturnValueOnce(clipboard.promise);

      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const links = [
        Promise.resolve(OTHER_LINK),
        new Promise<string>(() => undefined),
      ];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      await pressShare(result.current.share);

      // Act
      await act(async () => {
        clipboard.resolve();
      });

      // Assert
      expect(writeText.mock.calls).toStrictEqual([[OTHER_LINK]]);
      expect(readState(result.current)).toStrictEqual(IDLE_STATE);
      expect(findConfirmationTimers(setTimeoutSpy)).toEqual([]);
    });

    it("should show nothing of an earlier share that ends after the latest, which could not make the link", async () => {
      // Arrange
      const first = createDeferred<string>();
      const links = [first.promise, Promise.resolve(SHORT_LINK)];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      await pressShare(result.current.share);

      // Act
      await act(async () => {
        first.reject(new Error("no link"));
      });

      // Assert
      expect(result.current.isCopied).toBe(true);
      expect(result.current.notice).toBeUndefined();
      expect(result.current.isNoticeOpen).toBe(false);
    });

    it("should keep the notice of the latest share when an earlier one ends after it with a copy", async () => {
      // Arrange
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const first = createDeferred<string>();
      const links = [
        first.promise,
        Promise.reject<string>(new Error("no link")),
      ];
      const { result } = renderShare(() => links.shift() as Promise<string>);

      await pressShare(result.current.share);
      await pressShare(result.current.share);

      // Act
      await act(async () => {
        first.resolve(SHORT_LINK);
      });

      // Assert
      expect(result.current.notice).toStrictEqual({ kind: "not-made" });
      expect(result.current.isNoticeOpen).toBe(true);
      expect(result.current.isCopied).toBe(false);
      expect(findConfirmationTimers(setTimeoutSpy)).toEqual([]);
    });
  });

  describe("copying a link again", () => {
    it("should copy the link it is given, say that it worked and confirm it, and nothing else", async () => {
      // Arrange
      const writeText = stubClipboard();
      const makeLink = jest.fn<Promise<string>, [Sketch]>(() =>
        Promise.resolve(SHORT_LINK)
      );
      const { result } = renderShare(makeLink);

      // Act
      const copied = await pressCopyAgain(result.current.copyAgain, OTHER_LINK);

      // Assert
      expect(copied).toBe(true);
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(OTHER_LINK);
      expect(makeLink).not.toHaveBeenCalled();
      expect(readState(result.current)).toStrictEqual({
        ...IDLE_STATE,
        isCopiedAgain: true,
      });
    });

    it("should keep the confirmation for its time and not a moment less", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      // Act
      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);
      pass(SHARE_COPIED_DURATION - 1);
      const justBefore = result.current.isCopiedAgain;
      pass(1);

      // Assert
      expect(justBefore).toBe(true);
      expect(result.current.isCopiedAgain).toBe(false);
    });

    it("should leave the confirmation of a share alone", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressShare(result.current.share);
      pass(SHARE_COPIED_DURATION - 1000);
      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);

      // Act
      pass(1000);

      // Assert
      expect(result.current.isCopied).toBe(false);
      expect(result.current.isCopiedAgain).toBe(true);
    });

    it.each<[string, () => void]>([
      [
        "the clipboard rejects the link",
        () => stubClipboard(() => Promise.reject(new Error("denied"))),
      ],
      [
        "the clipboard throws",
        () =>
          stubClipboard(() => {
            throw new Error("denied");
          }),
      ],
      [
        "the browser has no clipboard",
        () => Reflect.deleteProperty(navigator, "clipboard"),
      ],
    ])(
      "should say that it did not work, and confirm nothing, when %s",
      async (_name, breakClipboard) => {
        // Arrange
        breakClipboard();

        const setTimeoutSpy = jest.spyOn(window, "setTimeout");
        const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

        // Act
        const copied = await pressCopyAgain(
          result.current.copyAgain,
          OTHER_LINK
        );

        // Assert
        expect(copied).toBe(false);
        expect(result.current.isCopiedAgain).toBe(false);
        expect(findConfirmationTimers(setTimeoutSpy)).toEqual([]);
      }
    );

    it("should clear the confirmation of the earlier copy while a new one waits for the clipboard, and keep it clear when the clipboard rejects it", async () => {
      // Arrange
      const writeText = stubClipboard();
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);

      const confirmed = result.current.isCopiedAgain;
      const clipboard = createDeferred<void>();

      writeText.mockReturnValueOnce(clipboard.promise);

      // Act
      const pending = startCopyAgain(result.current.copyAgain, OTHER_LINK);
      const whileWaiting = result.current.isCopiedAgain;

      await act(async () => {
        clipboard.reject(new Error("denied"));
        await pending;
      });

      // Assert
      expect(confirmed).toBe(true);
      expect(whileWaiting).toBe(false);
      await expect(pending).resolves.toBe(false);
      expect(result.current.isCopiedAgain).toBe(false);
    });

    it("should restart the confirmation when a link is copied again after another", async () => {
      // Arrange
      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));

      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);
      pass(1500);

      // Act
      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);
      pass(SHARE_COPIED_DURATION - 1);

      // Assert
      expect(result.current.isCopiedAgain).toBe(true);

      pass(1);

      expect(result.current.isCopiedAgain).toBe(false);
    });

    it("should keep the confirmation of the second of two quick copies for its whole time, and not end it with the timer of the first", async () => {
      // Arrange
      const writeText = stubClipboard();
      const first = createDeferred<void>();
      const second = createDeferred<void>();

      writeText
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);

      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));
      const firstCopy = startCopyAgain(result.current.copyAgain, OTHER_LINK);
      const secondCopy = startCopyAgain(result.current.copyAgain, SHORT_LINK);

      await act(async () => {
        first.resolve();
        await firstCopy;
      });
      pass(1000);

      // Act
      await act(async () => {
        second.resolve();
        await secondCopy;
      });
      pass(SHARE_COPIED_DURATION - 1);

      // Assert
      expect(result.current.isCopiedAgain).toBe(true);

      pass(1);

      expect(result.current.isCopiedAgain).toBe(false);
    });

    it("should say that it worked but confirm nothing when a share started meanwhile", async () => {
      // Arrange
      const writeText = stubClipboard();
      const clipboard = createDeferred<void>();

      writeText.mockReturnValueOnce(clipboard.promise);

      const { result } = renderShare(() => Promise.resolve(SHORT_LINK));
      const pending = startCopyAgain(result.current.copyAgain, OTHER_LINK);

      await pressShare(result.current.share);

      const setTimeoutSpy = jest.spyOn(window, "setTimeout");

      // Act
      await act(async () => {
        clipboard.resolve();
        await pending;
      });

      // Assert
      await expect(pending).resolves.toBe(true);
      expect(result.current.isCopiedAgain).toBe(false);
      expect(result.current.isCopied).toBe(true);
      expect(findConfirmationTimers(setTimeoutSpy)).toEqual([]);
    });
  });

  describe("when the instance is gone", () => {
    it("should stop the timer of the confirmation", async () => {
      // Arrange
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
      const { result, unmount } = renderShare(() =>
        Promise.resolve(SHORT_LINK)
      );

      await pressShare(result.current.share);

      const timers = findConfirmationTimers(setTimeoutSpy);

      clearTimeoutSpy.mockClear();

      // Act
      unmount();

      // Assert
      expect(timers).toHaveLength(1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timers[0]);
    });

    it("should stop the timer of the confirmation of a copy again", async () => {
      // Arrange
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(window, "clearTimeout");
      const { result, unmount } = renderShare(() =>
        Promise.resolve(SHORT_LINK)
      );

      await pressCopyAgain(result.current.copyAgain, OTHER_LINK);

      const timers = findConfirmationTimers(setTimeoutSpy);

      clearTimeoutSpy.mockClear();

      // Act
      unmount();

      // Assert
      expect(timers).toHaveLength(1);
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timers[0]);
    });

    it("should start no timer for a share that ends after it", async () => {
      // Arrange
      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const link = createDeferred<string>();
      const { result, unmount } = renderShare(() => link.promise);

      await pressShare(result.current.share);
      unmount();

      // Act
      await act(async () => {
        link.resolve(SHORT_LINK);
      });

      // Assert
      expect(findConfirmationTimers(setTimeoutSpy)).toEqual([]);
    });

    it("should never write to the clipboard the link of a share whose link comes after it", async () => {
      // Arrange
      const writeText = stubClipboard();
      const link = createDeferred<string>();
      const { result, unmount } = renderShare(() => link.promise);

      await pressShare(result.current.share);
      unmount();

      // Act
      await act(async () => {
        link.resolve(SHORT_LINK);
      });

      // Assert
      expect(writeText).not.toHaveBeenCalled();
    });

    it("should say that a copy again worked, and start no timer, when it ends after it", async () => {
      // Arrange
      const writeText = stubClipboard();
      const clipboard = createDeferred<void>();

      writeText.mockReturnValueOnce(clipboard.promise);

      const setTimeoutSpy = jest.spyOn(window, "setTimeout");
      const { result, unmount } = renderShare(() =>
        Promise.resolve(SHORT_LINK)
      );
      const pending = startCopyAgain(result.current.copyAgain, OTHER_LINK);

      unmount();

      // Act
      clipboard.resolve();
      const copied = await pending;

      // Assert
      expect(copied).toBe(true);
      expect(findConfirmationTimers(setTimeoutSpy)).toEqual([]);
    });
  });
});
