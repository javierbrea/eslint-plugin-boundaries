import { ThemeProvider, createTheme } from "@mui/material/styles";
import { act, render } from "@testing-library/react";

import type {
  ProjectCapabilities,
  ProjectSource,
  Sketch,
  StateStore,
} from "@/contract";
import { MemoryStore, SketchSource } from "@/contract";
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
 * @returns The page object of the playground, and the ways to render it again or to remove it.
 */
function renderPlayground(
  source: ProjectSource,
  store: StateStore
): PlaygroundRender {
  const { rerender, unmount } = render(
    <Playground source={source} store={store} />
  );

  return {
    playground: new PlaygroundPom(),
    rerender: (nextSource, nextStore) =>
      rerender(<Playground source={nextSource} store={nextStore} />),
    unmount,
  };
}

describe("Playground", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.clear();
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
      expect(playground.project.foot.buttonLabels).not.toContain("Add file");
    });

    it("should offer to add a file when the source can edit the tree", async () => {
      // Act
      const { playground } = renderPlayground(
        new SketchSource(SOURCE_SKETCH),
        new MemoryStore()
      );
      await playground.waitUntilLoaded();

      // Assert
      expect(playground.project.foot.buttonLabels).toContain("Add file");
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
});
