import { ThemeProvider, createTheme } from "@mui/material/styles";
import { act, render, waitFor } from "@testing-library/react";

import type {
  ProjectCapabilities,
  ProjectSource,
  Sketch,
  StateStore,
} from "@/contract";
import { MemoryStore, SketchSource } from "@/contract";
import {
  EXAMPLES,
  QUICK_START_EXAMPLE,
} from "@/domains/examples/data/examples";
import { HashStore } from "@/domains/share/data/hashStore";
import { HASH_STORE_WRITE_DELAY } from "@/domains/share/data/hashStore/HashStore.constants";
import { decodeHash, encodeSketch } from "@/domains/share/helpers/sketchHash";
import { stubResizeObserver } from "@/shared/testing/resizeObserver";

import { Playground } from "./Playground";
import { PlaygroundPom } from "./Playground.pom";

const SOURCE_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src", kind: "folder" },
    { path: "src/index.ts", kind: "file" },
    { path: "src/components/Price/index.ts", kind: "file" },
  ],
  dependencies: [
    {
      from: "src/components/Price/index.ts",
      target: { kind: "external", name: "react" },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "default", name: "default", alias: "React" }],
    },
  ],
};

// The sketch of the source as a link can hold it: the default name of its dependency has no alias, which no edit makes
const LINKABLE_SKETCH: Sketch = {
  ...SOURCE_SKETCH,
  dependencies: SOURCE_SKETCH.dependencies.map((dependency) => ({
    ...dependency,
    specifiers: [{ kind: "default", name: "React" }],
  })),
};

const SAVED_SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.ts", kind: "file" }],
  dependencies: [],
};

/** A host whose project can only be read, as a local app that opens a real project would pass */
class ReadOnlySource implements ProjectSource {
  public readonly capabilities: ProjectCapabilities = {
    editTree: false,
    editDependencies: false,
    editConfig: false,
  };

  public load(): Promise<Sketch> {
    return Promise.resolve(SOURCE_SKETCH);
  }
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

/** A store that can make a link, with the state of its own that the link needs: it only works when it is called as a method of the store. */
class SharingStore extends MemoryStore {
  /** The sketches that it made a link for. */
  public readonly shared: Sketch[] = [];

  public share(sketch: Sketch): Promise<string> {
    this.shared.push(sketch);
    return Promise.resolve("https://example.com/playground/#v=1&s=abc");
  }
}

/** What {@link renderPlayground} returns: the page object of the playground, and the ways to render it again with another source and store, or to remove it. */
type PlaygroundRender = {
  readonly playground: PlaygroundPom;
  readonly rerender: (source: ProjectSource, store: StateStore) => void;
  readonly unmount: () => void;
};

/**
 * Renders the playground.
 * @param source Where the project comes from.
 * @param store Where the state is kept.
 * @param quickStartUrl The URL of the Quick start guide, if the host has one.
 * @returns The page object of the playground, and the ways to render it again or to remove it.
 */
function renderPlayground(
  source: ProjectSource,
  store: StateStore,
  quickStartUrl?: string
): PlaygroundRender {
  const { rerender, unmount } = render(
    <Playground source={source} store={store} quickStartUrl={quickStartUrl} />
  );

  return {
    playground: new PlaygroundPom(),
    rerender: (nextSource, nextStore) =>
      rerender(
        <Playground
          source={nextSource}
          store={nextStore}
          quickStartUrl={quickStartUrl}
        />
      ),
    unmount,
  };
}

/**
 * Replaces the clipboard of the browser, which jsdom does not have.
 * @returns The spy of `writeText`.
 */
function stubClipboard(): jest.Mock<Promise<void>, [string]> {
  const spy = jest.fn((_text: string) => Promise.resolve());

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: spy },
  });

  return spy;
}

/**
 * Waits for the node pane to show that nothing is open, which is how a spec tells that a new shell replaced one in which a file was open.
 * @param playground The page object of the playground.
 * @returns A promise that settles when nothing is open.
 */
async function waitForNothingOpen(playground: PlaygroundPom): Promise<void> {
  await waitFor(() => {
    if (
      !playground.shell.isRendered ||
      playground.shell.node.shown !== "empty"
    ) {
      throw new Error("Something is still open");
    }
  });
}

/**
 * Waits for the picker of examples to say a text, which is how a spec tells which example the sketch on screen is.
 * @param playground The page object of the playground.
 * @param text What the picker says, such as `Example Policies`.
 * @returns A promise that settles when the picker says it.
 */
async function waitForPickerText(
  playground: PlaygroundPom,
  text: string
): Promise<void> {
  await waitFor(() => {
    if (
      !playground.shell.isRendered ||
      playground.topBar.picker.text !== text
    ) {
      throw new Error(`The picker does not say "${text}" yet`);
    }
  });
}

/**
 * Gives the playground time to do what a replacement that was not dropped would do after the dialog left: it loads the sketch again from the store and puts it on screen. A spec that asserts that nothing was replaced waits for it, because the assertion would pass before the replacement started.
 * @returns A promise that settles after the time has passed.
 */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
}

/**
 * Reads the sketch that the hash of the page holds.
 * @returns The paths of its tree, or what the hash holds instead of a sketch, written as JSON.
 */
function readPagePaths(): string[] {
  const reading = decodeHash(window.location.hash);

  return reading.status === "sketch"
    ? reading.sketch.tree.map(({ path }) => path)
    : [JSON.stringify(reading)];
}

/**
 * Creates a source whose `load` is a spy, which a spec can make slow or make fail.
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

describe("Playground", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.clear();
    stubClipboard();
    // jsdom has no layout, and the panels of the shell observe their size
    stubResizeObserver();
    // jsdom has no matchMedia; with it, MUI resolves a light color scheme from the system preference, as in a browser
    window.matchMedia = jest.fn((media: string) => ({
      matches: false,
      media,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  describe("sketch", () => {
    it("should accept any host that implements the contract", async () => {
      // Arrange
      const source = new ReadOnlySource();

      // Act
      const { playground } = renderPlayground(source, new MemoryStore());

      // Assert
      await expect(
        playground.waitForStatus("2 files ·")
      ).resolves.toBeUndefined();
    });

    it("should show that the sketch is loading until it loads", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      const { loadState } = playground;

      // Act
      const loadingText = loadState.text;
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(loadingText).toBe("Loading the sketch…");
      expect(loadState.isRendered).toBe(false);
    });

    it("should show that the sketch is loading when the store changes, until the new store loads", async () => {
      // Arrange
      let resolveNext: (sketch: Sketch | undefined) => void = () => undefined;
      const nextStore: jest.Mocked<StateStore> = {
        load: jest.fn(
          () =>
            new Promise<Sketch | undefined>((resolve) => {
              resolveNext = resolve;
            })
        ),
        save: jest.fn(),
        clear: jest.fn(),
      };
      const source = new SketchSource(SOURCE_SKETCH);
      const { playground, rerender } = renderPlayground(
        source,
        new MemoryStore(SAVED_SKETCH)
      );
      await playground.waitForStatus("1 file ·");

      // Act
      rerender(source, nextStore);
      const loadingText = playground.loadState.text;
      const previousSketchShown = playground.holds("1 file ·");
      await act(async () => {
        resolveNext(undefined);
      });

      // Assert
      expect(loadingText).toBe("Loading the sketch…");
      expect(previousSketchShown).toBe(false);
      await expect(
        playground.waitForStatus("2 files ·")
      ).resolves.toBeUndefined();
    });

    it("should stop showing why the sketch could not be loaded when the source changes, while the new source loads", async () => {
      // Arrange
      const failingSource: jest.Mocked<ProjectSource> = {
        capabilities: {
          editTree: true,
          editDependencies: true,
          editConfig: true,
        },
        load: jest.fn(() => Promise.reject(new Error("offline"))),
      };
      const nextSource: jest.Mocked<ProjectSource> = {
        capabilities: failingSource.capabilities,
        load: jest.fn(() => new Promise<Sketch>(() => undefined)),
      };
      const store = new MemoryStore();
      const { playground, rerender } = renderPlayground(failingSource, store);
      await playground.waitUntilFailed();
      const failureBefore = playground.loadState.text;

      // Act
      rerender(nextSource, store);
      const loadingText = playground.loadState.text;

      // Assert
      expect(failureBefore).toBe("The sketch could not be loaded: offline");
      expect(playground.holds(/could not be loaded/)).toBe(false);
      expect(loadingText).toBe("Loading the sketch…");
    });

    it("should show why the sketch could not be loaded when the store fails", async () => {
      // Arrange
      const store: jest.Mocked<StateStore> = {
        load: jest.fn(() => Promise.reject(new Error("disk read failed"))),
        save: jest.fn(),
        clear: jest.fn(),
      };

      // Act
      const { playground } = renderPlayground(new SketchSource(), store);
      await playground.waitUntilFailed();

      // Assert
      expect(playground.loadState.text).toBe(
        "The sketch could not be loaded: disk read failed"
      );
    });

    it("should show why the sketch could not be loaded when the source fails with a value that is not an error", async () => {
      // Arrange
      const source: jest.Mocked<ProjectSource> = {
        capabilities: {
          editTree: true,
          editDependencies: true,
          editConfig: true,
        },
        load: jest.fn(() => Promise.reject("offline")),
      };

      // Act
      const { playground } = renderPlayground(source, new MemoryStore());
      await playground.waitUntilFailed();

      // Assert
      expect(playground.loadState.text).toBe(
        "The sketch could not be loaded: offline"
      );
    });
  });

  describe("shell", () => {
    it("should show the project of the sketch in the tree", async () => {
      // Act
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.project.tree.itemPaths).toContain(
        "src/components/Price/index.ts"
      );
    });

    it("should not offer to add a file when the source cannot edit the tree", async () => {
      // Act
      const { playground } = renderPlayground(
        new ReadOnlySource(),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.project.foot.buttonNames).not.toContain("Add file");
    });

    it("should offer to add a file when the source can edit the tree", async () => {
      // Act
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.project.foot.buttonNames).toContain("Add file");
    });

    it("should fill its container", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.theme.height).toBe("100%");
    });
  });

  describe("saving", () => {
    it("should not save the sketch it loads", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");

      // Act
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(save).not.toHaveBeenCalled();
    });

    it("should save the sketch that an edit makes, and never the one it loaded", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      // Act
      playground.project.item("src/index.ts").deleteAction.press();

      // Assert
      expect(save).toHaveBeenCalledTimes(1);

      const saved = save.mock.calls[0][0];

      expect(saved).not.toBe(SOURCE_SKETCH);
      expect(saved.tree.map(({ path }) => path)).not.toContain("src/index.ts");
      await expect(store.load()).resolves.toBe(saved);
    });

    it("should save once the sketch of an edit, and not again when it renders again", async () => {
      // Arrange
      const store = new MemoryStore();
      const source = new SketchSource(SOURCE_SKETCH);
      const save = jest.spyOn(store, "save");
      const { playground, rerender } = renderPlayground(source, store);
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();

      // Act
      rerender(source, store);
      rerender(source, store);

      // Assert
      expect(save).toHaveBeenCalledTimes(1);
    });

    it("should save once for each edit, in order", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      // Act
      playground.project.item("src/index.ts").deleteAction.press();
      playground.project
        .item("src/components/Price/index.ts")
        .deleteAction.press();

      // Assert
      expect(save).toHaveBeenCalledTimes(2);
      expect(save.mock.calls.map(([saved]) => saved.tree.length)).toEqual([
        1, 0,
      ]);
    });

    it("should save nothing when the user only opens things", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      // Act
      playground.project.click("src/index.ts");
      playground.project.click("eslint.config.js");
      playground.project.foot.pressView("Text");

      // Assert
      expect(save).not.toHaveBeenCalled();
    });

    it("should show the saved sketch the next time it is loaded", async () => {
      // Arrange
      const store = new MemoryStore();
      const source = new SketchSource(SOURCE_SKETCH);
      const first = renderPlayground(source, store);
      await first.playground.waitForStatus("2 files ·");
      first.playground.project.item("src/index.ts").deleteAction.press();
      first.unmount();

      // Act
      const { playground } = renderPlayground(source, store);

      // Assert
      await expect(
        playground.waitForStatus("1 file ·")
      ).resolves.toBeUndefined();
    });

    it("should edit the sketch of the new store when the store changes, and save it there only", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);
      const previousStore = new MemoryStore();
      const nextStore = new MemoryStore(SAVED_SKETCH);
      const savePrevious = jest.spyOn(previousStore, "save");
      const saveNext = jest.spyOn(nextStore, "save");
      const { playground, rerender } = renderPlayground(source, previousStore);
      await playground.waitForStatus("2 files ·");
      rerender(source, nextStore);
      await playground.waitForStatus("1 file ·");

      // Act
      playground.project.item("src/index.ts").deleteAction.press();

      // Assert
      expect(savePrevious).not.toHaveBeenCalled();
      expect(saveNext).toHaveBeenCalledTimes(1);
      expect(saveNext.mock.calls[0][0].tree).toEqual([]);
    });

    it("should show the sketch saved in a store when the store changes back to it before the other one loads", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);
      const store = new MemoryStore();
      const pendingStore: jest.Mocked<StateStore> = {
        load: jest.fn(() => new Promise<Sketch | undefined>(() => undefined)),
        save: jest.fn(),
        clear: jest.fn(),
      };
      const { playground, rerender } = renderPlayground(source, store);
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      rerender(source, pendingStore);

      // Act
      rerender(source, store);
      const loadingText = playground.loadState.text;

      // Assert
      expect(loadingText).toBe("Loading the sketch…");
      await expect(
        playground.waitForStatus("1 file ·")
      ).resolves.toBeUndefined();
      expect(playground.project.tree.itemPaths).not.toContain("src/index.ts");
    });

    it("should keep working when the store cannot save", async () => {
      // Arrange
      const store: jest.Mocked<StateStore> = {
        load: jest.fn(() => Promise.resolve(undefined)),
        save: jest.fn((_sketch: Sketch) =>
          Promise.reject(new Error("quota exceeded"))
        ),
        clear: jest.fn(),
      };
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      // Act
      playground.project.item("src/index.ts").deleteAction.press();
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(store.save).toHaveBeenCalledTimes(1);
      expect(playground.project.tree.itemPaths).not.toContain("src/index.ts");
      await expect(
        playground.waitForStatus("1 file ·")
      ).resolves.toBeUndefined();
    });
  });

  describe("scope", () => {
    it("should render the dialog inside the root element and close it from its button", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitForStatus("2 files ·");

      // Act
      playground.project.item("src").deleteAction.press();
      const dialog = playground.dialog("Delete src/ and its 2 files?");
      dialog.button("Cancel").press();

      // Assert
      await expect(dialog.waitUntilGone()).resolves.toBeUndefined();
    });

    it("should close the dialog with the Escape key", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src").deleteAction.press();
      const dialog = playground.dialog();

      // Act
      dialog.pressEscape();

      // Assert
      await expect(dialog.waitUntilGone()).resolves.toBeUndefined();
    });

    it("should leave the theme and the storage of the host as they are", async () => {
      // Arrange
      const html = document.documentElement;
      const getItem = jest.spyOn(Storage.prototype, "getItem");

      // Act
      const { playground } = renderPlayground(
        new SketchSource(),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(html.getAttribute("data-theme")).toBe("dark");
      expect(html.getAttributeNames()).toEqual(["data-theme"]);
      expect(getItem).not.toHaveBeenCalled();
      expect(localStorage).toHaveLength(0);
    });

    it("should scope the MUI variables to the root element and each color scheme to the host's theme", async () => {
      // Act
      const { playground } = renderPlayground(
        new SketchSource(),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.theme.isScoped).toBe(true);
      expect(playground.insertedRules).toContainEqual(
        expect.stringMatching(/^\.jsb-play-root \{--jsb-play-spacing: 8px;/)
      );
      expect(playground.insertedRules).toContainEqual(
        expect.stringMatching(
          /^\[data-theme="dark"\] \.jsb-play-root \{.*--jsb-play-palette-primary-main: var\(--jsb-accent\);/
        )
      );
      expect(playground.insertedRules).toContainEqual(
        expect.stringMatching(/^\.jsb-play-root \{--__l-threshold: 0.7;/)
      );
      expect(playground.insertedRules).not.toContainEqual(
        expect.stringMatching(/^:root/)
      );
    });

    it("should keep its MUI variables inside a MUI provider of the host", async () => {
      // Act
      render(
        <ThemeProvider theme={createTheme({ cssVariables: true })}>
          <Playground source={new SketchSource()} store={new MemoryStore()} />
        </ThemeProvider>
      );
      const playground = new PlaygroundPom();
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.insertedRules).toContainEqual(
        expect.stringMatching(/^\.jsb-play-root \{--jsb-play-spacing: 8px;/)
      );
    });

    it("should insert its styles once when it is mounted again", async () => {
      // Arrange
      const mount = async () => {
        const { playground, unmount } = renderPlayground(
          new SketchSource(),
          new MemoryStore()
        );
        await playground.waitUntilLoaded();
        unmount();
        return playground.insertedRules.length;
      };
      const rulesAfterFirstMount = await mount();

      // Act
      const rulesAfterSecondMount = await mount();

      // Assert
      expect(rulesAfterSecondMount).toBe(rulesAfterFirstMount);
    });
  });

  describe("loading again", () => {
    it("should subscribe while it is mounted and stop when it is unmounted", async () => {
      // Arrange
      const store = new NotifyingStore();

      // Act
      const { playground, unmount } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      const whileMounted = store.listenerCount;

      unmount();

      // Assert
      expect(whileMounted).toBe(1);
      expect(store.listenerCount).toBe(0);
    });

    it("should load the store again when it calls back, and show the sketch it has in a new shell with nothing in focus", async () => {
      // Arrange
      const store = new NotifyingStore();
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.click("src/index.ts");

      const shownBefore = playground.shell.node.shown;

      await store.save(SAVED_SKETCH);

      // Act
      act(() => store.notify());
      await playground.waitForStatus("1 file ·");

      // Assert
      expect(shownBefore).toBe("file");
      expect(playground.shell.node.shown).toBe("empty");
      expect(playground.shell.problems.tabs).toHaveLength(1);
      expect(playground.shell.problems.tabs[0].text).toMatch(/^Sketch/);
      expect(playground.shell.problems.tabs[0].isSelected).toBe(true);
    });

    it("should show the sketch of the source when the store has none any more", async () => {
      // Arrange
      const store = new NotifyingStore(SAVED_SKETCH);
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("1 file ·");
      await store.clear();

      // Act
      act(() => store.notify());

      // Assert
      await expect(
        playground.waitForStatus("2 files ·")
      ).resolves.toBeUndefined();
    });

    it("should show why the sketch could not be loaded when the store fails, and the sketch again once it can", async () => {
      // Arrange
      const store = new NotifyingStore();
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      jest
        .spyOn(store, "load")
        .mockRejectedValueOnce(new Error("The link is damaged"));

      // Act
      act(() => store.notify());
      await playground.waitUntilFailed();

      const failure = playground.loadState.text;

      act(() => store.notify());
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(failure).toBe(
        "The sketch could not be loaded: The link is damaged"
      );
    });

    it("should subscribe to the new store when the store changes", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);
      const previousStore = new NotifyingStore();
      const nextStore = new NotifyingStore();
      const { playground, rerender } = renderPlayground(source, previousStore);
      await playground.waitForStatus("2 files ·");

      // Act
      rerender(source, nextStore);
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(previousStore.listenerCount).toBe(0);
      expect(nextStore.listenerCount).toBe(1);
    });

    it("should work with a store that has no way to tell", async () => {
      // Act
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );

      // Assert
      await expect(
        playground.waitForStatus("2 files ·")
      ).resolves.toBeUndefined();
    });
  });

  describe("reset", () => {
    it("should forget what the store saved and show the sketch of the source, in a new shell with nothing in focus, when the sketch is the source's", async () => {
      // Arrange
      const store = new MemoryStore();
      const clear = jest.spyOn(store, "clear");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.click("src/index.ts");

      // Act
      playground.topBar.actions.pressReset();
      await waitForNothingOpen(playground);

      // Assert
      expect(clear).toHaveBeenCalledTimes(1);
      await expect(
        playground.waitForStatus("2 files ·")
      ).resolves.toBeUndefined();
      expect(playground.dialog().isRendered).toBe(false);
    });

    it("should ask first when the sketch is neither an example nor the sketch of the source", async () => {
      // Arrange
      const store = new MemoryStore();
      const clear = jest.spyOn(store, "clear");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();

      // Act
      playground.topBar.actions.pressReset();
      const dialog = await playground.waitForDialog("Reset the sketch?");

      // Assert
      expect(dialog.title).toBe("Reset the sketch?");
      expect(dialog.text).toBe("Your changes to the sketch are lost.");
      expect(dialog.buttonTexts).toEqual(["Cancel", "Reset"]);
      expect(clear).not.toHaveBeenCalled();
      expect(playground.statusText).toMatch(/^1 file ·/);
    });

    it("should keep the sketch as it is when the user gives up", async () => {
      // Arrange
      const store = new MemoryStore();
      const clear = jest.spyOn(store, "clear");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.actions.pressReset();

      const dialog = await playground.waitForDialog("Reset the sketch?");

      // Act
      dialog.button("Cancel").press();
      await dialog.waitUntilGone();

      // Assert
      expect(clear).not.toHaveBeenCalled();
      expect(playground.statusText).toMatch(/^1 file ·/);
    });

    it("should reset the sketch when the user confirms, in a new shell with nothing in focus", async () => {
      // Arrange
      const store = new MemoryStore();
      const clear = jest.spyOn(store, "clear");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.project.click("src/components/Price/index.ts");
      playground.topBar.actions.pressReset();

      const dialog = await playground.waitForDialog("Reset the sketch?");

      // Act
      dialog.button("Reset").press();
      await waitForNothingOpen(playground);

      // Assert
      await playground.waitForStatus("2 files ·");

      expect(clear).toHaveBeenCalledTimes(1);
      expect(playground.project.tree.itemPaths).toContain("src/index.ts");
      await expect(store.load()).resolves.toBeUndefined();
    });

    it("should leave the sketch on screen while the dialog fades out, and reset it once the dialog is gone", async () => {
      // Arrange
      const store = new MemoryStore();
      const clear = jest.spyOn(store, "clear");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.actions.pressReset();

      const dialog = await playground.waitForDialog("Reset the sketch?");

      // Act
      dialog.button("Reset").press();

      const isDialogLeaving = dialog.isRendered;
      const statusWhileLeaving = playground.statusText;
      const clearsWhileLeaving = clear.mock.calls.length;

      await playground.waitForStatus("2 files ·");

      // Assert
      expect(isDialogLeaving).toBe(true);
      expect(statusWhileLeaving).toMatch(/^1 file ·/);
      expect(clearsWhileLeaving).toBe(0);
      expect(dialog.isRendered).toBe(false);
      expect(clear).toHaveBeenCalledTimes(1);
    });

    it("should drop a confirmed reset when the store loads another sketch while the dialog fades out, and keep that sketch", async () => {
      // Arrange
      const store = new NotifyingStore();
      const clear = jest.spyOn(store, "clear");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.actions.pressReset();

      const dialog = await playground.waitForDialog("Reset the sketch?");

      await store.save(SAVED_SKETCH);

      // Act
      dialog.button("Reset").press();
      act(() => store.notify());
      await dialog.waitUntilGone();
      await settle();

      // Assert
      expect(clear).not.toHaveBeenCalled();
      expect(playground.statusText).toMatch(/^1 file ·/);
      expect(playground.project.tree.itemPaths).toContain("src/index.ts");
      expect(playground.project.tree.itemPaths).not.toContain(
        "src/components/Price/index.ts"
      );
    });

    it("should not ask when the sketch is an example, whatever the source is", async () => {
      // Arrange
      const store = new MemoryStore(QUICK_START_EXAMPLE.sketch);
      const source = createSource();
      const { playground } = renderPlayground(source, store);
      await playground.waitForStatus("6 files ·");

      // Act
      playground.topBar.actions.pressReset();
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(playground.dialog().isRendered).toBe(false);
      expect(source.load).toHaveBeenCalledTimes(1);
    });

    it("should show that the sketch is loading while the source loads, and then the sketch", async () => {
      // Arrange
      let resolveSource: (sketch: Sketch) => void = () => undefined;
      const source = createSource();
      const { playground } = renderPlayground(source, new MemoryStore());
      await playground.waitForStatus("2 files ·");
      // The first ask of the source is for the comparison, and the next one is the reset
      source.load.mockResolvedValueOnce(SOURCE_SKETCH).mockImplementation(
        () =>
          new Promise<Sketch>((resolve) => {
            resolveSource = resolve;
          })
      );

      // Act
      playground.topBar.actions.pressReset();
      await playground.waitUntilLoading();

      const loadingText = playground.loadState.text;

      await act(async () => {
        resolveSource(SAVED_SKETCH);
      });

      // Assert
      expect(loadingText).toBe("Loading the sketch…");
      await expect(
        playground.waitForStatus("1 file ·")
      ).resolves.toBeUndefined();
    });

    it("should show why the sketch could not be loaded when the source fails, and offer to reset again", async () => {
      // Arrange
      const source = createSource();
      const { playground } = renderPlayground(source, new MemoryStore());
      await playground.waitForStatus("2 files ·");
      // The first ask of the source is for the comparison, and the next one is the reset
      source.load
        .mockResolvedValueOnce(SOURCE_SKETCH)
        .mockRejectedValue(new Error("offline"));

      // Act
      playground.topBar.actions.pressReset();
      await playground.waitUntilFailed();

      // Assert
      expect(playground.loadState.text).toBe(
        "The sketch could not be loaded: offline"
      );
      expect(playground.loadState.hasResetButton).toBe(true);
    });

    it("should get out of a failed load with the button of the message: it forgets what the store saved and shows the sketch of the source", async () => {
      // Arrange
      const store = new MemoryStore();
      const clear = jest.spyOn(store, "clear");

      jest
        .spyOn(store, "load")
        .mockRejectedValueOnce(new Error("The link is damaged"));

      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitUntilFailed();

      // Act
      playground.loadState.pressReset();

      // Assert
      await playground.waitForStatus("2 files ·");

      expect(clear).toHaveBeenCalledTimes(1);
      expect(playground.loadState.isRendered).toBe(false);
    });

    it("should not ask when it resets a sketch that could not be loaded", async () => {
      // Arrange
      const store = new MemoryStore();

      jest
        .spyOn(store, "load")
        .mockRejectedValueOnce(new Error("The link is damaged"));

      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitUntilFailed();

      // Act
      playground.loadState.pressReset();

      // Assert
      await playground.waitForStatus("2 files ·");

      expect(playground.dialog().isRendered).toBe(false);
    });
  });

  describe("choosing an example", () => {
    it("should save the example and show it in a new shell with nothing in focus, without asking, when the sketch is the one of the source", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.click("src/index.ts");
      playground.topBar.picker.open();

      // Act
      playground.topBar.picker.pick("Quick start");

      // Assert
      await playground.waitForStatus("6 files ·");

      expect(save).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledWith(QUICK_START_EXAMPLE.sketch);
      expect(playground.shell.node.shown).toBe("empty");
      expect(playground.dialog().isRendered).toBe(false);
    });

    it("should name the example it shows in the picker", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitForStatus("2 files ·");

      const before = playground.topBar.picker.text;

      playground.topBar.picker.open();

      // Act
      playground.topBar.picker.pick(EXAMPLES[1].title);
      await playground.waitUntilLoaded();

      // Assert
      expect(before).toBe("Example");
      await expect(
        waitForPickerText(playground, `Example ${EXAMPLES[1].title}`)
      ).resolves.toBeUndefined();
    });

    it("should not ask when the sketch is an example, and ask nothing of the source", async () => {
      // Arrange
      const source = createSource();
      const { playground } = renderPlayground(
        source,
        new MemoryStore(QUICK_START_EXAMPLE.sketch)
      );
      await playground.waitForStatus("6 files ·");
      playground.topBar.picker.open();

      // Act
      playground.topBar.picker.pick(EXAMPLES[1].title);

      // Assert
      await waitForPickerText(playground, `Example ${EXAMPLES[1].title}`);

      expect(playground.dialog().isRendered).toBe(false);
      expect(source.load).not.toHaveBeenCalled();
    });

    it("should ask first when the sketch is neither an example nor the sketch of the source, and name the example", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      save.mockClear();
      playground.topBar.picker.open();

      // Act
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      // Assert
      expect(dialog.title).toBe("Open the Policies example?");
      expect(dialog.text).toBe("Your changes to the sketch are lost.");
      expect(dialog.buttonTexts).toEqual(["Cancel", "Open example"]);
      expect(save).not.toHaveBeenCalled();
      expect(playground.statusText).toMatch(/^1 file ·/);
    });

    it("should keep the sketch as it is when the user gives up", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      save.mockClear();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      // Act
      dialog.button("Cancel").press();
      await dialog.waitUntilGone();

      // Assert
      expect(save).not.toHaveBeenCalled();
      expect(playground.statusText).toMatch(/^1 file ·/);
    });

    it("should keep the sketch as it is when the user gives up after an earlier confirmation, and not replace it again", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const confirmation = await playground.waitForDialog(
        "Open the Policies example?"
      );

      confirmation.button("Open example").press();
      await confirmation.waitUntilGone();
      await waitForPickerText(playground, "Example Policies");
      playground.project
        .item("src/helpers/data/sort.spec.js")
        .deleteAction.press();
      save.mockClear();

      const statusBefore = playground.statusText;

      playground.topBar.picker.open();
      playground.topBar.picker.pick("Quick start");

      const question = await playground.waitForDialog(
        "Open the Quick start example?"
      );

      // Act
      question.button("Cancel").press();
      await question.waitUntilGone();

      // Assert
      expect(playground.statusText).toBe(statusBefore);
      expect(save).not.toHaveBeenCalled();
    });

    it("should save the example and show it when the user confirms", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      save.mockClear();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      // Act
      dialog.button("Open example").press();

      // Assert
      await waitForPickerText(playground, "Example Policies");

      expect(save).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledWith(
        EXAMPLES.find(({ title }) => title === "Policies")?.sketch
      );
      expect(playground.shell.node.shown).toBe("empty");
    });

    it("should leave the sketch on screen while the dialog fades out, and show the example once the dialog is gone", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      save.mockClear();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      // Act
      dialog.button("Open example").press();

      const isDialogLeaving = dialog.isRendered;
      const statusWhileLeaving = playground.statusText;
      const savesWhileLeaving = save.mock.calls.length;

      await waitForPickerText(playground, "Example Policies");

      // Assert
      expect(isDialogLeaving).toBe(true);
      expect(statusWhileLeaving).toMatch(/^1 file ·/);
      expect(savesWhileLeaving).toBe(0);
      expect(dialog.isRendered).toBe(false);
      expect(save).toHaveBeenCalledTimes(1);
    });

    it("should drop a confirmed example when the store loads another sketch while the dialog fades out, and keep that sketch", async () => {
      // Arrange
      const store = new NotifyingStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      await store.save(SAVED_SKETCH);
      save.mockClear();

      // Act
      dialog.button("Open example").press();
      act(() => store.notify());
      await dialog.waitUntilGone();
      await settle();

      // Assert
      expect(save).not.toHaveBeenCalled();
      await expect(store.load()).resolves.toEqual(SAVED_SKETCH);
      expect(playground.statusText).toMatch(/^1 file ·/);
      expect(playground.project.tree.itemPaths).toContain("src/index.ts");
      expect(playground.topBar.picker.text).toBe("Example");
    });

    it("should drop a confirmed example when the store has not finished loading another sketch as the dialog is gone", async () => {
      // Arrange
      let resolveLoad: (sketch: Sketch) => void = () => undefined;
      const store = new NotifyingStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      save.mockClear();
      jest.spyOn(store, "load").mockImplementation(
        () =>
          new Promise<Sketch>((resolve) => {
            resolveLoad = resolve;
          })
      );

      // Act
      dialog.button("Open example").press();
      act(() => store.notify());
      await dialog.waitUntilGone();
      await settle();

      const isStillLoading = playground.loadState.isRendered;

      await act(async () => {
        resolveLoad(SAVED_SKETCH);
      });

      // Assert
      expect(isStillLoading).toBe(true);

      await playground.waitForStatus("1 file ·");

      expect(save).not.toHaveBeenCalled();
      expect(playground.topBar.picker.text).toBe("Example");
    });

    it("should drop a confirmed example when the host gives the playground another store while the dialog fades out, and save it to neither", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);
      const previousStore = new MemoryStore();
      const nextStore = new MemoryStore(SAVED_SKETCH);
      const previousSave = jest.spyOn(previousStore, "save");
      const nextSave = jest.spyOn(nextStore, "save");
      const { playground, rerender } = renderPlayground(source, previousStore);
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      previousSave.mockClear();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      // Act
      dialog.button("Open example").press();
      rerender(source, nextStore);
      await dialog.waitUntilGone();
      await settle();

      // Assert
      expect(previousSave).not.toHaveBeenCalled();
      expect(nextSave).not.toHaveBeenCalled();
      expect(playground.statusText).toMatch(/^1 file ·/);
      expect(playground.project.tree.itemPaths).toContain("src/index.ts");
      expect(playground.topBar.picker.text).toBe("Example");
    });

    it("should not replace the sketch when the user gives up and then presses the button that goes on while the dialog fades out", async () => {
      // Arrange
      const store = new MemoryStore();
      const save = jest.spyOn(store, "save");
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      save.mockClear();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      // Act
      dialog.button("Cancel").press();
      dialog.button("Open example").press();
      await dialog.waitUntilGone();
      await settle();

      // Assert
      expect(save).not.toHaveBeenCalled();
      expect(playground.statusText).toMatch(/^1 file ·/);
      expect(playground.topBar.picker.text).toBe("Example");
    });

    it("should show the example even when the store cannot save it", async () => {
      // Arrange
      const store = new MemoryStore();

      jest.spyOn(store, "save").mockRejectedValue(new Error("quota exceeded"));

      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.topBar.picker.open();

      // Act
      playground.topBar.picker.pick("Quick start");

      // Assert
      await expect(
        playground.waitForStatus("6 files ·")
      ).resolves.toBeUndefined();
    });

    it("should start the example again when it is picked again after an edit", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(QUICK_START_EXAMPLE.sketch),
        new MemoryStore()
      );
      await playground.waitForStatus("6 files ·");
      playground.project
        .item("src/components/atoms/Button/Button.css")
        .deleteAction.press();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Quick start");

      const dialog = await playground.waitForDialog(
        "Open the Quick start example?"
      );

      // Act
      dialog.button("Open example").press();

      // Assert
      await playground.waitForStatus("6 files ·");

      expect(playground.project.tree.itemPaths).toContain(
        "src/components/atoms/Button/Button.css"
      );
    });

    it("should not offer the examples when the source cannot edit the tree, the dependencies and the config", async () => {
      // Act
      const { playground } = renderPlayground(
        new ReadOnlySource(),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.topBar.picker.isRendered).toBe(false);
    });
  });

  describe("the keyboard focus after a replacement", () => {
    it("should start on nothing when the sketch first loads", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );

      // Act
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(playground.topBar.actions.isResetFocused).toBe(false);
      expect(playground.topBar.picker.isFocused).toBe(false);
    });

    it("should be on Reset of the new shell after Reset, when it asks nothing", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitForStatus("2 files ·");
      playground.project.click("src/index.ts");
      playground.topBar.actions.focusReset();

      // Act
      playground.topBar.actions.pressReset();
      await waitForNothingOpen(playground);

      // Assert
      expect(playground.topBar.actions.isResetFocused).toBe(true);
      expect(document.activeElement).not.toBe(document.body);
    });

    it("should be on Reset of the new shell after Reset, when the user confirms", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.actions.focusReset();
      playground.topBar.actions.pressReset();

      const dialog = await playground.waitForDialog("Reset the sketch?");

      // Act
      dialog.button("Reset").press();
      await dialog.waitUntilGone();
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(playground.topBar.actions.isResetFocused).toBe(true);
    });

    it("should be on the picker of the new shell after an example is chosen, when it asks nothing", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitForStatus("2 files ·");
      playground.topBar.picker.open();

      // Act
      playground.topBar.picker.pick("Quick start");
      await playground.waitForStatus("6 files ·");
      await playground.topBar.picker.waitUntilClosed();

      // Assert
      expect(playground.topBar.picker.isFocused).toBe(true);
      expect(playground.topBar.actions.isResetFocused).toBe(false);
    });

    it("should be on the picker of the new shell after an example is chosen, when the user confirms", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.picker.open();
      playground.topBar.picker.pick("Policies");

      const dialog = await playground.waitForDialog(
        "Open the Policies example?"
      );

      // Act
      dialog.button("Open example").press();
      await dialog.waitUntilGone();
      await waitForPickerText(playground, "Example Policies");

      // Assert
      expect(playground.topBar.picker.isFocused).toBe(true);
    });

    it("should be on Reset of the new shell after the button of a failed load", async () => {
      // Arrange
      const store = new MemoryStore();

      jest
        .spyOn(store, "load")
        .mockRejectedValueOnce(new Error("The link is damaged"));

      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitUntilFailed();

      // Act
      playground.loadState.pressReset();
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(playground.topBar.actions.isResetFocused).toBe(true);
    });

    it("should be on nothing when a sketch comes from outside after the replacement", async () => {
      // Arrange
      const store = new NotifyingStore();
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.click("src/index.ts");
      playground.topBar.actions.pressReset();
      await waitForNothingOpen(playground);
      await store.save(SAVED_SKETCH);

      const focusedByReset = playground.topBar.actions.isResetFocused;

      // Act
      act(() => store.notify());
      await playground.waitForStatus("1 file ·");

      // Assert
      expect(focusedByReset).toBe(true);
      expect(playground.topBar.actions.isResetFocused).toBe(false);
      expect(playground.topBar.picker.isFocused).toBe(false);
    });

    it("should be on nothing when the reset fails and a sketch comes from outside afterwards", async () => {
      // Arrange
      const store = new NotifyingStore(QUICK_START_EXAMPLE.sketch);
      const source = createSource();
      const { playground } = renderPlayground(source, store);
      await playground.waitForStatus("6 files ·");
      source.load.mockRejectedValueOnce(
        new Error("The project cannot be read")
      );
      playground.topBar.actions.pressReset();
      await playground.waitUntilFailed();
      await store.save(SAVED_SKETCH);

      // Act
      act(() => store.notify());
      await playground.waitForStatus("1 file ·");

      // Assert
      expect(playground.topBar.actions.isResetFocused).toBe(false);
    });
  });

  describe("the sketch of the source, for the confirmation", () => {
    it("should load the source once however many times it is asked, and only when it is needed", async () => {
      // Arrange
      const source = createSource();
      const { playground } = renderPlayground(source, new MemoryStore());
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();

      const loadsBefore = source.load.mock.calls.length;

      playground.topBar.actions.pressReset();

      const first = await playground.waitForDialog("Reset the sketch?");

      first.button("Cancel").press();
      await first.waitUntilGone();
      playground.topBar.actions.pressReset();
      await playground.waitForDialog("Reset the sketch?");

      // Assert
      expect(loadsBefore).toBe(1);
      expect(source.load).toHaveBeenCalledTimes(2);
    });

    it("should ask when the source cannot be read, because there is no way to tell what the user would lose", async () => {
      // Arrange
      const source = createSource();
      const { playground } = renderPlayground(source, new MemoryStore());
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      source.load.mockRejectedValue(new Error("offline"));

      // Act
      playground.topBar.actions.pressReset();

      // Assert
      await expect(
        playground.waitForDialog("Reset the sketch?")
      ).resolves.toBeDefined();
    });

    it("should close the question when a sketch comes from outside, which makes it moot", async () => {
      // Arrange
      const store = new NotifyingStore();
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();
      playground.topBar.actions.pressReset();

      const dialog = await playground.waitForDialog("Reset the sketch?");

      await store.save(SAVED_SKETCH);

      // Act
      act(() => store.notify());
      await playground.waitForStatus("1 file ·");

      // Assert
      await expect(dialog.waitUntilGone()).resolves.toBeUndefined();
    });
  });

  describe("help", () => {
    it("should link to the Quick start that the host gives", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore(),
        "/docs/quick-start"
      );
      await playground.waitUntilLoaded();

      // Act
      playground.topBar.actions.pressHelp();

      // Assert
      expect(playground.topBar.help.guideLinkHref).toBe("/docs/quick-start");
    });

    it("should draw no link when the host gives none", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Act
      playground.topBar.actions.pressHelp();

      // Assert
      expect(playground.topBar.help.hasGuideLink).toBe(false);
    });
  });

  describe("share", () => {
    it("should not offer to share when the store has no way to make a link", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );

      // Act
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.topBar.actions.hasShare).toBe(false);
    });

    it("should make the link of the sketch on screen with the store, copy it and say so", async () => {
      // Arrange
      const writeText = stubClipboard();
      const store = new SharingStore();
      const { playground } = renderPlayground(
        new SketchSource(LINKABLE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");
      playground.project.item("src/index.ts").deleteAction.press();

      // Act
      await act(async () => {
        playground.topBar.actions.pressShare();
      });

      // Assert
      expect(store.shared).toHaveLength(1);
      expect(store.shared[0].tree.map(({ path }) => path)).not.toContain(
        "src/index.ts"
      );
      expect(writeText).toHaveBeenCalledWith(
        "https://example.com/playground/#v=1&s=abc"
      );
      expect(playground.topBar.actions.message.text).toBe("Link copied");
    });

    it("should share nothing and say why when no link could open the sketch on screen", async () => {
      // Arrange
      const writeText = stubClipboard();
      const store = new SharingStore();
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      // Act
      await act(async () => {
        playground.topBar.actions.pressShare();
      });

      // Assert
      expect(store.shared).toEqual([]);
      expect(writeText).not.toHaveBeenCalled();
      expect(playground.topBar.actions.message.text).toBe(
        'The sketch cannot be shared: Dependency 1 cannot be in the sketch. The default name "default" cannot have an alias.'
      );
    });
  });

  describe("with the store of the website, which keeps the sketch in the hash of the URL", () => {
    const PAGE = "/playground/";

    let store: HashStore;

    beforeEach(() => {
      window.history.replaceState(null, "", PAGE);
      store = new HashStore();
    });

    afterEach(async () => {
      // Drops the write that a test left pending
      await store.clear();
      window.history.replaceState(null, "", "/");
    });

    /**
     * Puts a hash in the URL, as a link that was opened does.
     * @param hash The hash, without the leading `#`.
     */
    function openLink(hash: string): void {
      window.history.replaceState(null, "", `${PAGE}#${hash}`);
    }

    it("should show the sketch of a link in the hash, over the one of the source", async () => {
      // Arrange
      openLink(encodeSketch(SAVED_SKETCH));

      // Act
      const { playground } = renderPlayground(
        new SketchSource(LINKABLE_SKETCH),
        store
      );
      await playground.waitForStatus("1 file ·");

      // Assert
      expect(playground.project.tree.itemPaths).toEqual([
        "eslint.config.js",
        "src",
        "src/index.ts",
      ]);
    });

    it("should name the example that a link to an example opens, and not ask before it resets", async () => {
      // Arrange
      openLink(encodeSketch(QUICK_START_EXAMPLE.sketch));

      const { playground } = renderPlayground(
        new SketchSource(LINKABLE_SKETCH),
        store
      );
      await playground.waitForStatus("6 files ·");

      // Act
      playground.topBar.actions.pressReset();

      // Assert
      await playground.waitForStatus("2 files ·");

      expect(playground.dialog().isRendered).toBe(false);
    });

    it("should write the hash with the edit, once the delay of the store has passed", async () => {
      // Arrange
      const { playground } = renderPlayground(
        new SketchSource(LINKABLE_SKETCH),
        store
      );
      await playground.waitForStatus("2 files ·");

      // Act
      playground.project.item("src/index.ts").deleteAction.press();

      // Assert
      expect(window.location.hash).toBe("");

      await waitFor(() => expect(window.location.hash).not.toBe(""), {
        timeout: HASH_STORE_WRITE_DELAY + 2000,
      });

      expect(readPagePaths()).toEqual(["src/components/Price/index.ts"]);
      expect(window.location.pathname).toBe(PAGE);
    });

    it("should show why a damaged link could not be loaded, and recover and clear the hash with Reset", async () => {
      // Arrange
      openLink("v=2&s=abc");

      const { playground } = renderPlayground(
        new SketchSource(LINKABLE_SKETCH),
        store
      );

      // Act
      await playground.waitUntilFailed();

      const failure = playground.loadState.text;

      playground.loadState.pressReset();
      await playground.waitForStatus("2 files ·");

      // Assert
      expect(failure).toContain(
        'The sketch could not be loaded: The link has the format version "2", which this playground does not know.'
      );
      expect(window.location.hash).toBe("");
      expect(window.location.pathname).toBe(PAGE);
      expect(playground.topBar.actions.isResetFocused).toBe(true);
    });

    it("should show why a link to a path of 40,000 folders could not be loaded, and not crash", async () => {
      // Arrange
      const deep = {
        ...SAVED_SKETCH,
        tree: [{ path: `${"a/".repeat(40000)}f.js`, kind: "file" }],
      };

      openLink(encodeSketch(deep as Sketch));

      const { playground } = renderPlayground(
        new SketchSource(LINKABLE_SKETCH),
        store
      );

      // Act
      await playground.waitUntilFailed();

      // Assert
      expect(window.location.hash.length).toBeLessThan(300);
      expect(playground.loadState.text).toBe(
        `The sketch could not be loaded: "${"a/".repeat(40)}…" cannot be in the tree. The path cannot have more than 1024 characters.`
      );

      playground.loadState.pressReset();
      await playground.waitForStatus("2 files ·");

      expect(window.location.hash).toBe("");
    });
  });
});
