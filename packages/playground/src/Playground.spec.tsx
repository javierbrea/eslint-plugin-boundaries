import {
  act,
  fireEvent,
  render,
  screen as view,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";

import type { ProjectCapabilities, ProjectSource, Sketch } from "./contract";
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
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.clear();
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

    it("should show that the sketch is loading, and drop it when unmounted before it loads", async () => {
      // Arrange
      const source = new SketchSource(SOURCE_SKETCH);

      // Act
      const { unmount } = render(
        <Playground source={source} store={new MemoryStore()} />
      );
      const loading = view.queryByText("Loading the sketch…");
      unmount();
      await act(() => Promise.resolve());

      // Assert
      expect(loading).not.toBeNull();
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

      // Act
      render(
        <Playground source={new SketchSource()} store={new MemoryStore()} />
      );
      await view.findByText("0 files in the sketch.");

      // Assert
      expect(html.getAttribute("data-theme")).toBe("dark");
      expect(html.getAttributeNames()).toEqual(["data-theme"]);
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
        expect.stringMatching(/^\.jsb-play-root \{--mui-spacing: 8px;/)
      );
      expect(getPlaygroundRules()).toContainEqual(
        expect.stringMatching(
          /^\[data-theme="dark"\] \.jsb-play-root \{.*--mui-palette-primary-main: var\(--jsb-accent\);/
        )
      );
    });
  });
});
