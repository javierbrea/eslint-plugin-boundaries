import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  act,
  fireEvent,
  render,
  screen as view,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";

import type {
  ProjectCapabilities,
  ProjectSource,
  Sketch,
  StateStore,
} from "./contract";
import { MemoryStore, SketchSource } from "./contract";
import { Playground } from "./Playground";
import { CACHE_KEY, ROOT_CLASS } from "./theme";

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

/**
 * Returns the CSS rules that the playground inserted in the document.
 * @returns The text of each rule.
 */
function getPlaygroundRules(): string[] {
  return Array.from(
    document.head.querySelectorAll<HTMLStyleElement>(
      `style[data-emotion^="${CACHE_KEY}"]`
    )
  )
    .flatMap((style) => Array.from(style.sheet?.cssRules ?? []))
    .map((rule) => rule.cssText);
}

describe("Playground", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.clear();
    // jsdom has no matchMedia; with it, MUI resolves a light color scheme from the system preference, as in a browser
    window.matchMedia = jest.fn((media: string) => ({
      matches: false,
      media,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  describe("sketch", () => {
    it("should show the sketch of the source when the store has none", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);

      // Act
      render(<Playground source={source} store={new MemoryStore()} />);

      // Assert
      await expect(
        view.findByText("2 files in the sketch.")
      ).resolves.toBeDefined();
    });

    it("should show the sketch of the store over the one of the source", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);

      // Act
      render(
        <Playground source={source} store={new MemoryStore(SAVED_SKETCH)} />
      );

      // Assert
      await expect(
        view.findByText("1 files in the sketch.")
      ).resolves.toBeDefined();
    });

    it("should accept any host that implements the contract", async () => {
      // Arrange
      const source = new ReadOnlySource();

      // Act
      render(<Playground source={source} store={new MemoryStore()} />);

      // Assert
      await expect(
        view.findByText("2 files in the sketch.")
      ).resolves.toBeDefined();
    });

    it("should show that the sketch is loading until it loads", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);

      // Act
      render(<Playground source={source} store={new MemoryStore()} />);
      const loading = view.queryByText("Loading the sketch…");
      await view.findByText("2 files in the sketch.");

      // Assert
      expect(loading).not.toBeNull();
      expect(view.queryByText("Loading the sketch…")).toBeNull();
    });

    it("should show the sketch of the new store when the store changes before the previous one loads", async () => {
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
      const { rerender } = render(
        <Playground source={source} store={previousStore} />
      );
      rerender(
        <Playground source={source} store={new MemoryStore(SAVED_SKETCH)} />
      );
      await view.findByText("1 files in the sketch.");

      // Act
      await act(async () => {
        resolvePrevious(undefined);
      });

      // Assert
      expect(view.queryAllByText("1 files in the sketch.")).toHaveLength(1);
      expect(view.queryByText("2 files in the sketch.")).toBeNull();
    });

    it("should show the sketch of the new store when the previous one fails after the store changes", async () => {
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
      const { rerender } = render(
        <Playground source={source} store={previousStore} />
      );
      rerender(
        <Playground source={source} store={new MemoryStore(SAVED_SKETCH)} />
      );
      await view.findByText("1 files in the sketch.");

      // Act
      await act(async () => {
        rejectPrevious(new Error("disk read failed"));
      });

      // Assert
      expect(view.queryAllByText("1 files in the sketch.")).toHaveLength(1);
      expect(view.queryByText(/could not be loaded/)).toBeNull();
    });

    it("should show why the sketch could not be loaded when the store fails", async () => {
      // Arrange
      const store: jest.Mocked<StateStore> = {
        load: jest.fn(() => Promise.reject(new Error("disk read failed"))),
        save: jest.fn(),
      };

      // Act
      render(<Playground source={new SketchSource()} store={store} />);

      // Assert
      await expect(
        view.findByText("The sketch could not be loaded: disk read failed")
      ).resolves.toBeDefined();
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
      render(<Playground source={source} store={new MemoryStore()} />);

      // Assert
      await expect(
        view.findByText("The sketch could not be loaded: offline")
      ).resolves.toBeDefined();
    });
  });

  describe("scope", () => {
    it("should render the dialog inside the root element and close it from its button", async () => {
      // Arrange
      const { container } = render(
        <Playground source={new SketchSource()} store={new MemoryStore()} />
      );
      const root = container.querySelector(`.${ROOT_CLASS}`) as HTMLElement;

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "About the playground" })
      );
      const dialog = await within(root).findByRole("dialog", {
        name: "About the playground",
      });
      fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

      // Assert
      await expect(
        waitForElementToBeRemoved(() => view.queryByRole("dialog"))
      ).resolves.toBeUndefined();
    });

    it("should close the dialog with the Escape key", async () => {
      // Arrange
      render(
        <Playground source={new SketchSource()} store={new MemoryStore()} />
      );
      fireEvent.click(
        view.getByRole("button", { name: "About the playground" })
      );
      const dialog = await view.findByRole("dialog");

      // Act
      fireEvent.keyDown(dialog, { key: "Escape" });

      // Assert
      await expect(
        waitForElementToBeRemoved(() => view.queryByRole("dialog"))
      ).resolves.toBeUndefined();
    });

    it("should leave the theme and the storage of the host as they are", async () => {
      // Arrange
      const html = document.documentElement;
      const getItem = jest.spyOn(Storage.prototype, "getItem");

      // Act
      render(
        <Playground source={new SketchSource()} store={new MemoryStore()} />
      );
      await view.findByText("0 files in the sketch.");

      // Assert
      expect(html.getAttribute("data-theme")).toBe("dark");
      expect(html.getAttributeNames()).toEqual(["data-theme"]);
      expect(getItem).not.toHaveBeenCalled();
      expect(localStorage).toHaveLength(0);
    });

    it("should scope the MUI variables to the root element and each color scheme to the host's theme", async () => {
      // Act
      render(
        <Playground source={new SketchSource()} store={new MemoryStore()} />
      );
      await view.findByText("0 files in the sketch.");

      // Assert
      expect(getPlaygroundRules()).toContainEqual(
        expect.stringMatching(/^\.jsb-play-root \{--jsb-play-spacing: 8px;/)
      );
      expect(getPlaygroundRules()).toContainEqual(
        expect.stringMatching(
          /^\[data-theme="dark"\] \.jsb-play-root \{.*--jsb-play-palette-primary-main: var\(--jsb-accent\);/
        )
      );
      expect(getPlaygroundRules()).toContainEqual(
        expect.stringMatching(/^\.jsb-play-root \{--__l-threshold: 0.7;/)
      );
      expect(getPlaygroundRules()).not.toContainEqual(
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
      await view.findByText("0 files in the sketch.");

      // Assert
      expect(getPlaygroundRules()).toContainEqual(
        expect.stringMatching(/^\.jsb-play-root \{--jsb-play-spacing: 8px;/)
      );
    });

    it("should insert its styles once when it is mounted again", async () => {
      // Arrange
      const mount = async () => {
        const { unmount } = render(
          <Playground source={new SketchSource()} store={new MemoryStore()} />
        );
        await view.findByText("0 files in the sketch.");
        unmount();
        return getPlaygroundRules().length;
      };
      const rulesAfterFirstMount = await mount();

      // Act
      const rulesAfterSecondMount = await mount();

      // Assert
      expect(rulesAfterSecondMount).toBe(rulesAfterFirstMount);
    });
  });
});
