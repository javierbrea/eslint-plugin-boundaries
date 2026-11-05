// cspell:ignore dissallow patern -- deliberate typos, the mistakes of the config that the tests report
import {
  act,
  fireEvent,
  screen as view,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/examples";
import { EVALUATION_DELAY } from "@/ui/state";
import type { Focus, ProjectView, Target, WorkbenchStore } from "@/ui/state";
import {
  NO_CAPABILITIES,
  renderInWorkbench,
} from "@/ui/state/__fixtures__/RenderInWorkbench";
import type { WorkbenchRender } from "@/ui/state/__fixtures__/RenderInWorkbench";

import { ProjectPane } from "./ProjectPane";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src/components/Button.js", kind: "file" },
    { path: "src/components/Price.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
    { path: "index.js", kind: "file" },
  ],
  dependencies: [
    {
      from: "src/index.js",
      target: { kind: "node", path: "src/components/Button.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
    {
      from: "index.js",
      target: { kind: "external", name: "react" },
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
  ],
};

const QUICK_START_CONFIG = QUICK_START_EXAMPLE.sketch.config;

/** The quick-start config with a `default` that is not an option: one error, which turns the config node red. */
const CONFIG_WITH_ERROR = QUICK_START_CONFIG.replace(
  'default: "disallow"',
  'default: "dissallow"'
);

/** The quick-start config with a descriptor that is not valid: one warning. */
const CONFIG_WITH_WARNING = QUICK_START_CONFIG.replace(
  'pattern: "components/*/*"',
  'patern: "components/*/*"'
);

/** The quick-start config with both mistakes: an error and a warning. */
const CONFIG_WITH_BOTH = CONFIG_WITH_WARNING.replace(
  'default: "disallow"',
  'default: "dissallow"'
);

/** What the pane starts with */
type PaneOptions = {
  /** The sketch to start from. */
  sketch?: Sketch;
  /** What the user can change; everything when it is unset. */
  capabilities?: ProjectCapabilities;
  /** What is in focus when the pane starts. */
  focus?: Target;
  /** How the pane shows the project when it starts. */
  view?: ProjectView;
};

/**
 * Renders the pane in a workbench and puts the store in the state a test starts from, as the user would: with a file opened, or the project shown as text.
 * @param options What the pane starts with.
 * @param options.sketch The sketch to start from.
 * @param options.capabilities What the user can change.
 * @param options.focus What is in focus.
 * @param options.view How the pane shows the project.
 * @returns The render, the store and the spy of the sketches.
 */
function renderPane({
  sketch = SKETCH,
  capabilities,
  focus: target,
  view: projectView = "tree",
}: PaneOptions = {}): WorkbenchRender {
  const rendered = renderInWorkbench(<ProjectPane />, {
    sketch,
    capabilities,
  });

  if (target !== undefined) {
    act(() => rendered.store.open(target));
  }
  if (projectView !== "tree") {
    act(() => rendered.store.setView(projectView));
  }
  return rendered;
}

/**
 * Reads what is in focus.
 * @param store The store of the pane.
 * @returns Its focus.
 */
function getFocus(store: WorkbenchStore): Focus {
  return store.getState().focus;
}

/**
 * Types the whole text of the project in the textarea, and leaves it, as the user does when the text is done.
 * @param text The text.
 */
function typeProjectText(text: string): void {
  const area = view.getByRole("textbox", { name: "Project as text" });

  fireEvent.change(area, { target: { value: text } });
  fireEvent.blur(area);
}

/**
 * Reads the paths of the files and folders of the tree the pane shows, in order.
 * @returns The `title` of each row but the config's: the path of its node.
 */
function getPaths(): (string | null)[] {
  return view
    .getAllByRole("treeitem")
    .slice(1)
    .map(
      (item) => item.querySelector("[title]")?.getAttribute("title") ?? null
    );
}

/**
 * Gets the row of a node.
 * @param path The path of the node.
 * @returns The element of the row that shows the node: its name.
 */
function getRow(path: string): HTMLElement {
  return view.getByTitle(path);
}

/**
 * Gets the item of the tree that has a node's name.
 * @param path The path of the node.
 * @returns The element of the item.
 */
function getItem(path: string): HTMLElement {
  return getRow(path).closest("[role='treeitem']") as HTMLElement;
}

/**
 * Gets the field that renames a node.
 * @param path The path of the node being renamed.
 * @returns The field.
 */
function getField(path: string): HTMLInputElement {
  return view.getByRole("textbox", {
    name: `New name of ${path}`,
  }) as HTMLInputElement;
}

/**
 * Gets the item whose name is being edited.
 * @param path The path of the node being renamed.
 * @returns The element of the item, which holds the field in place of the name.
 */
function getRenamingItem(path: string): HTMLElement {
  return view
    .getByRole("textbox", { name: `New name of ${path}` })
    .closest("[role='treeitem']") as HTMLElement;
}

/**
 * Types a name in the field that renames a node.
 * @param path The path of the node being renamed.
 * @param typed What to type.
 * @returns The field.
 */
function typeName(path: string, typed: string): HTMLElement {
  const field = getField(path);

  fireEvent.change(field, { target: { value: typed } });
  return field;
}

/**
 * Moves the keyboard focus out of the tree, to the button of the Tree view, as a click or the Tab key outside the tree does. `fireEvent.blur` only dispatches the event and never moves the focus, so it cannot tell where the focus ends.
 * @returns The element that has the focus now.
 */
function moveFocusAway(): HTMLElement {
  const other = view.getByRole("button", { name: "Tree" });

  act(() => other.focus());
  return other;
}

/**
 * Waits until the focus is on an element, which is when the tree took it back after the rename or the dialog went. The focus is on the body until then.
 */
async function waitForFocus(): Promise<void> {
  await waitFor(() => expect(document.activeElement).not.toBe(document.body));
}

/**
 * Lets the timers that are already set run. An item takes the keyboard back one task after a rename, to see where the focus went, so a test that expects it to stay where the user put it waits for that task.
 */
async function settleFocus(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/**
 * Opens the confirmation dialog of a folder the way a keyboard user does: the item of the folder has the focus, and Delete is pressed.
 * @param path The path of the folder.
 */
function askToDelete(path: string): void {
  act(() => getItem(path).focus());
  fireEvent.keyDown(getItem(path), { key: "Delete" });
}

/**
 * Gets the paths of the nodes of a sketch.
 * @param sketch The sketch.
 * @returns The path of each node of its tree.
 */
function getTreePaths(sketch: Sketch): string[] {
  return sketch.tree.map((node) => node.path);
}

/**
 * Gets the latest sketch a spy received.
 * @param spy The spy of `onSketchChange`.
 * @returns The sketch.
 */
function getLastSketch(spy: WorkbenchRender["onSketchChange"]): Sketch {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}

describe("ProjectPane", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("tree", () => {
    it("should name the pane Project", () => {
      // Arrange
      renderPane();

      // Act
      const pane = view.getByRole("region", { name: "Project" });

      // Assert
      expect(within(pane).getByText("Project").textContent).toBe("Project");
    });

    it("should pin eslint.config.js first and put folders before files, each by name", () => {
      // Arrange
      renderPane();

      // Act
      const names = view
        .getAllByRole("treeitem")
        .map((item) => item.getAttribute("aria-labelledby"))
        .map((id) => document.getElementById(id as string)?.textContent);

      // Assert
      expect(names).toEqual([
        "eslint.config.js",
        "src/",
        "components/",
        "Button.js",
        "Price.js",
        "index.js",
        "index.js",
      ]);
    });

    it("should show the full path of a node as the title of its name", () => {
      // Arrange
      renderPane();

      // Act
      const paths = getPaths();

      // Assert
      expect(paths).toEqual([
        "src",
        "src/components",
        "src/components/Button.js",
        "src/components/Price.js",
        "src/index.js",
        "index.js",
      ]);
    });

    it("should start with every folder open", () => {
      // Arrange
      renderPane();

      // Act
      const folders = view
        .getAllByRole("treeitem")
        .filter((item) => item.hasAttribute("aria-expanded"));

      // Assert
      expect(
        folders.map((folder) => folder.getAttribute("aria-expanded"))
      ).toEqual(["true", "true"]);
    });

    it("should close a folder when it is clicked, and open it when it is clicked again", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.click(getRow("src/components"));
      const pathsClosed = getPaths();
      fireEvent.click(getRow("src/components"));
      const pathsOpen = getPaths();

      // Assert
      expect(pathsClosed).not.toContain("src/components/Button.js");
      expect(pathsOpen).toContain("src/components/Button.js");
    });

    it("should remember in the store the folders that were closed", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(getRow("src/components"));

      // Assert
      expect(Array.from(store.getState().closedFolders)).toEqual([
        "src/components",
      ]);
    });

    it("should not open anything when a folder is clicked", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      fireEvent.click(getRow("src"));

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should open a file when it is clicked", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(getRow("src/index.js"));

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "src/index.js",
      });
    });

    it("should open the config when it is clicked", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(getRow("eslint.config.js"));

      // Assert
      expect(getFocus(store)).toEqual({ kind: "config" });
    });

    it("should select the file that is in focus", () => {
      // Arrange
      renderPane({ focus: { kind: "file", path: "src/index.js" } });

      // Act
      const selected = view
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-selected") === "true");

      // Assert
      expect(selected).toEqual([getItem("src/index.js")]);
    });

    it("should select the config when it is in focus", () => {
      // Arrange
      renderPane({ focus: { kind: "config" } });

      // Act
      const config = getItem("eslint.config.js");

      // Assert
      expect(config.getAttribute("aria-selected")).toBe("true");
    });

    it("should select nothing when nothing is in focus", () => {
      // Arrange
      renderPane();

      // Act
      const selected = view
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-selected") === "true");

      // Assert
      expect(selected).toEqual([]);
    });

    it("should select a folder the user clicked, and keep what is in focus", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      fireEvent.click(getRow("src"));

      // Assert
      expect(getItem("src").getAttribute("aria-selected")).toBe("true");
      expect(getItem("index.js").getAttribute("aria-selected")).toBe("false");
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should select the file again when it is clicked after a folder", () => {
      // Arrange
      renderPane({ focus: { kind: "file", path: "index.js" } });
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.click(getRow("index.js"));

      // Assert
      expect(getItem("index.js").getAttribute("aria-selected")).toBe("true");
      expect(getItem("src").getAttribute("aria-selected")).toBe("false");
    });

    it("should drop the selected folder when something else takes the focus", () => {
      // Arrange
      const { store } = renderPane();
      fireEvent.click(getRow("src"));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getItem("src").getAttribute("aria-selected")).toBe("false");
      expect(getItem("eslint.config.js").getAttribute("aria-selected")).toBe(
        "true"
      );
    });

    it("should keep what is in focus when the keyboard clears the selection", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: " " });

      // Assert
      expect(listener).not.toHaveBeenCalled();
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
      expect(getItem("index.js").getAttribute("aria-selected")).toBe("true");
    });

    it("should open the folders above a file that takes the focus", () => {
      // Arrange
      const { store } = renderPane();
      fireEvent.click(getRow("src/components"));
      fireEvent.click(getRow("src"));

      // Act
      act(() => store.open({ kind: "file", path: "src/components/Button.js" }));

      // Assert
      expect(getPaths()).toContain("src/components/Button.js");
    });

    it("should select nothing when the file in focus is removed", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      act(() => store.removeNode("index.js"));

      // Assert
      expect(
        view
          .getAllByRole("treeitem")
          .filter((item) => item.getAttribute("aria-selected") === "true")
      ).toEqual([]);
    });

    it("should show a node that another pane adds to the store", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(getField("new-file.js").value).toBe("new-file.js");
      expect(getTreePaths(store.getState().sketch)).toContain("new-file.js");
    });
  });

  describe("badges", () => {
    it("should show the problems of the config in red when it has errors", () => {
      // Arrange
      renderPane({ sketch: { ...SKETCH, config: CONFIG_WITH_BOTH } });

      // Act
      const badge = within(getItem("eslint.config.js")).getByRole("img", {
        name: "2 problems",
      });

      // Assert
      expect(badge.textContent).toBe("2");
      expect(getComputedStyle(badge).color).toBe("var(--jsb-bad)");
    });

    it("should show the problems of the config in the warning color when it has no errors", () => {
      // Arrange
      renderPane({ sketch: { ...SKETCH, config: CONFIG_WITH_WARNING } });

      // Act
      const badge = within(getItem("eslint.config.js")).getByRole("img", {
        name: "1 problem",
      });

      // Assert
      expect(getComputedStyle(badge).color).toBe("var(--jsb-warn)");
    });

    it("should draw no badge when the config has no problems", () => {
      // Arrange
      renderPane({ sketch: { ...SKETCH, config: QUICK_START_CONFIG } });

      // Act
      const badges = within(getItem("eslint.config.js")).queryAllByRole("img");

      // Assert
      expect(badges).toEqual([]);
    });

    it("should draw no badge on a folder or a file until dependencies are evaluated", () => {
      // Arrange
      renderPane({ sketch: { ...SKETCH, config: CONFIG_WITH_BOTH } });

      // Act
      const badges = [getItem("src"), getItem("src/index.js")].flatMap((item) =>
        within(item).queryAllByRole("img")
      );

      // Assert
      expect(badges).toEqual([]);
    });

    it("should turn the config red when it has errors, and not otherwise", () => {
      // Arrange
      jest.useFakeTimers();
      const { store } = renderPane({
        sketch: { ...SKETCH, config: CONFIG_WITH_ERROR },
      });
      const withErrors = getItem("eslint.config.js").firstElementChild;
      const withErrorsBad = withErrors?.hasAttribute("data-bad");

      // Act
      act(() => store.changeConfig(CONFIG_WITH_WARNING));
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY);
      });
      const withoutErrors = getItem("eslint.config.js").firstElementChild;

      // Assert
      expect(withErrorsBad).toBe(true);
      expect(withoutErrors?.hasAttribute("data-bad")).toBe(false);
    });

    it("should keep the badge of the config while an edit of the config waits to be evaluated", () => {
      // Arrange
      jest.useFakeTimers();
      const { store } = renderPane({
        sketch: { ...SKETCH, config: CONFIG_WITH_ERROR },
      });

      // Act
      act(() => store.changeConfig(QUICK_START_CONFIG));
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY - 1);
      });
      const whileWaiting = within(getItem("eslint.config.js")).queryAllByRole(
        "img"
      );
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Assert
      expect(whileWaiting).toHaveLength(1);
      expect(within(getItem("eslint.config.js")).queryAllByRole("img")).toEqual(
        []
      );
    });
  });

  describe("rename", () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it("should rename a file in place from its row action", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.click(view.getByLabelText("Rename src/index.js"));
      const field = typeName("src/index.js", "main.js");
      fireEvent.keyDown(field, { key: "Enter" });

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/main.js"
      );
      expect(getPaths()).toContain("src/main.js");
      expect(view.queryByRole("textbox")).toBeNull();
    });

    it("should start the rename on double click", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.doubleClick(getRow("src/index.js"));

      // Assert
      expect(getField("src/index.js").value).toBe("index.js");
    });

    it("should start the rename with F2", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Assert
      expect(getField("src/index.js").value).toBe("index.js");
    });

    it("should start with the current name, selected, without the slash of a folder", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.doubleClick(getRow("src/components"));
      const field = view.getByRole("textbox", {
        name: "New name of src/components",
      }) as HTMLInputElement;

      // Assert
      expect(field.value).toBe("components");
      expect([field.selectionStart, field.selectionEnd]).toEqual([0, 10]);
    });

    it("should not open or select the row when the field is clicked", () => {
      // Arrange
      const { store } = renderPane();
      fireEvent.doubleClick(getRow("src/components"));

      // Act
      fireEvent.click(
        view.getByRole("textbox", { name: "New name of src/components" })
      );

      // Assert
      expect(getPaths()).toContain("src/components/Button.js");
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should not pass the keys of the field to the tree", () => {
      // Arrange
      const { store } = renderPane();
      fireEvent.doubleClick(getRow("src/index.js"));
      const field = view.getByRole("textbox", {
        name: "New name of src/index.js",
      });

      // Act
      fireEvent.keyDown(field, { key: " " });

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should follow the rename with the focus", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "src/index.js" },
      });

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "Enter" });

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "src/main.js",
      });
      expect(getItem("src/main.js").getAttribute("aria-selected")).toBe("true");
    });

    it("should follow the rename of a folder with the file in focus inside it", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "src/components/Button.js" },
      });

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "lib/components/Button.js",
      });
    });

    it("should leave the focus alone when the renamed node is not the file in focus", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should keep a renamed folder closed, and keep its children's dependencies", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.click(getRow("src/components"));

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(getPaths()).toEqual([
        "lib",
        "lib/components",
        "lib/index.js",
        "index.js",
      ]);
      expect(getLastSketch(onSketchChange).dependencies[0]).toMatchObject({
        from: "lib/index.js",
        target: { kind: "node", path: "lib/components/Button.js" },
      });
    });

    it("should keep the selected folder selected when it is renamed", () => {
      // Arrange
      renderPane();
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(getItem("lib").getAttribute("aria-selected")).toBe("true");
    });

    it("should rename a file inside a folder, keeping the folder", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/components/Price.js", "Cost.js"), {
        key: "Enter",
      });

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/components/Cost.js"
      );
    });

    it("should move a node into a folder when the name has a path", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/index.js", "./app/main.js"), {
        key: "Enter",
      });

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/app/main.js"
      );
    });

    it("should open the closed folder that a node moves into, and give the keyboard to the node", async () => {
      // Arrange
      renderPane();
      fireEvent.click(getRow("src/components"));
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "components/moved.js"), {
        key: "Enter",
      });
      await waitForFocus();

      // Assert
      expect(getItem("src/components").getAttribute("aria-expanded")).toBe(
        "true"
      );
      expect(getPaths()).toContain("src/components/moved.js");
      expect(document.activeElement).toBe(getItem("src/components/moved.js"));
    });

    it("should rename when the field loses the focus, and leave the focus where the user put it", async () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      typeName("src/index.js", "main.js");

      // Act
      const other = moveFocusAway();
      await settleFocus();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/main.js"
      );
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getPaths()).toContain("src/main.js");
      expect(document.activeElement).toBe(other);
    });

    it("should give up when Escape is pressed", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      const field = typeName("src/index.js", "main.js");

      // Act
      fireEvent.keyDown(field, { key: "Escape" });
      fireEvent.blur(field);

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(view.queryByRole("textbox")).toBeNull();
      expect(getPaths()).toContain("src/index.js");
    });

    it("should ignore the other keys", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "a" });

      // Assert
      expect(getField("src/index.js").value).toBe("main.js");
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should close the field without an edit when the name did not change", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "  index.js "), {
        key: "Enter",
      });

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(view.queryByRole("textbox")).toBeNull();
    });

    it("should refuse a name that is taken, say why next to the field and keep the field open", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });

      // Act
      const field = typeName("src/components/Price.js", "Button.js");
      fireEvent.keyDown(field, { key: "Enter" });

      // Assert
      expect(view.getByRole("tooltip").textContent).toBe(
        "That path already exists."
      );
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(field.getAttribute("aria-describedby")).toBe(
        view.getByRole("tooltip").id
      );
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(view.getByRole("textbox")).toBe(field);
    });

    it("should clear the reason when the user types again, and rename with the fixed name", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });
      const field = typeName("src/components/Price.js", "Button.js");
      fireEvent.keyDown(field, { key: "Enter" });

      // Act
      fireEvent.change(field, { target: { value: "Cost.js" } });
      const invalidAfterTyping = field.getAttribute("aria-invalid");
      const describedAfterTyping = field.getAttribute("aria-describedby");
      const titleAfterTyping = field
        .closest(".MuiInputBase-root")
        ?.getAttribute("title");
      fireEvent.keyDown(field, { key: "Enter" });

      // Assert
      expect(invalidAfterTyping).toBe("false");
      expect(describedAfterTyping).toBeNull();
      expect(titleAfterTyping).toBeNull();
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/components/Cost.js"
      );
    });

    it("should refuse an empty name, in a folder and at the root", () => {
      // Arrange
      renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/index.js", " "), { key: "Enter" });
      const reasonInFolder = view.getByRole("tooltip").textContent;
      fireEvent.keyDown(typeName("src/index.js", "index.js"), {
        key: "Escape",
      });
      fireEvent.keyDown(getItem("index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("index.js", ""), { key: "Enter" });

      // Assert
      expect(reasonInFolder).toBe("The path is empty.");
      expect(view.getByRole("tooltip").textContent).toBe("The path is empty.");
    });

    it("should refuse a folder that would move into itself", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src", "src/inner"), { key: "Enter" });

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(view.getByRole("tooltip").textContent).not.toBe("");
    });

    it("should give up when the field loses the focus with a refused name, and leave the focus where the user put it", async () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });
      typeName("src/components/Price.js", "Button.js");

      // Act
      const other = moveFocusAway();
      await settleFocus();

      // Assert
      expect(view.queryByRole("textbox")).toBeNull();
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(getPaths()).toContain("src/components/Price.js");
      expect(document.activeElement).toBe(other);
    });

    it("should close the field and leave the focus where the user put it when the name did not change", async () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      const other = moveFocusAway();
      await settleFocus();

      // Assert
      expect(view.queryByRole("textbox")).toBeNull();
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(other);
    });

    it("should not touch the item while the focus is on its way to where the user clicked", async () => {
      // Arrange
      const focusSpy = jest.spyOn(HTMLElement.prototype, "focus");
      renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      const field = typeName("src/index.js", "main.js");
      const other = view.getByRole("button", { name: "Tree" });
      focusSpy.mockClear();

      // Act
      // A browser runs the handlers of the blur while the focus is on the body, and puts it on its target when they return
      act(() => {
        fireEvent.blur(field);
      });
      act(() => other.focus());
      await settleFocus();

      // Assert
      const roles = focusSpy.mock.contexts.map((element) =>
        element.getAttribute("role")
      );

      expect(roles).not.toContain("treeitem");
      expect(document.activeElement).toBe(other);
    });

    it("should give the keyboard back to the renamed item", async () => {
      // Arrange
      renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "Enter" });
      await waitForFocus();

      // Assert
      expect(document.activeElement).toBe(getItem("src/main.js"));
    });

    it("should give the keyboard back to the item when the user gives up", async () => {
      // Arrange
      renderPane();
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "Escape" });
      await waitForFocus();

      // Assert
      expect(document.activeElement).toBe(getItem("src/index.js"));
    });

    it("should announce the F2 and Delete shortcuts on the rows that can be edited, and not on the config", () => {
      // Arrange
      renderPane();

      // Act
      const shortcuts = ["src", "src/index.js", "eslint.config.js"].map(
        (path) => getItem(path).getAttribute("aria-keyshortcuts")
      );

      // Assert
      expect(shortcuts).toEqual(["F2 Delete", "F2 Delete", null]);
    });

    it("should have no row actions, rename or delete for the config", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      const config = getItem("eslint.config.js");
      fireEvent.keyDown(config, { key: "F2" });
      fireEvent.keyDown(config, { key: "Delete" });
      fireEvent.doubleClick(getRow("eslint.config.js"));

      // Assert
      expect(within(config).queryAllByRole("button")).toEqual([]);
      expect(view.queryByRole("textbox")).toBeNull();
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not open the row when its action is clicked", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(view.getByLabelText("Rename src/index.js"));

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should ignore the keys that come from inside the item", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.keyDown(view.getByLabelText("Rename src/index.js"), {
        key: "F2",
      });
      fireEvent.keyDown(getItem("src/components/Button.js"), { key: "F2" });

      // Assert: the field is the one of the child, not of src/ that holds it
      expect(view.getAllByRole("textbox")).toHaveLength(1);
      expect(getField("src/components/Button.js").value).toBe("Button.js");
    });
  });

  describe("delete", () => {
    it("should remove a file right away from its row action", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).not.toContain(
        "src/index.js"
      );
      expect(getPaths()).not.toContain("src/index.js");
    });

    it("should remove the dependencies of the file with it", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(getLastSketch(onSketchChange).dependencies).toHaveLength(1);
    });

    it("should remove a file with the Delete key", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "Delete" });

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).not.toContain(
        "index.js"
      );
    });

    it("should leave the other keys alone", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "Backspace" });

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should put nothing in focus when the file in focus is removed", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "Delete" });

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should leave the focus when another file is removed", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "Delete" });

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should ask before it removes a folder with files", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.click(view.getByLabelText("Delete src"));

      // Assert
      const dialog = view.getByRole("dialog");

      expect(dialog.textContent).toContain("Delete src/ and its 3 files?");
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should say file, not files, for a folder with one", () => {
      // Arrange
      const sketch: Sketch = {
        ...SKETCH,
        tree: [...SKETCH.tree, { path: "docs/readme.md", kind: "file" }],
      };
      renderPane({ sketch });

      // Act
      fireEvent.click(view.getByLabelText("Delete docs"));

      // Assert
      expect(view.getByRole("dialog").textContent).toContain(
        "Delete docs/ and its 1 file?"
      );
    });

    it("should count the files of the folder at any depth, and not the folders", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.click(view.getByLabelText("Delete src/components"));

      // Assert
      expect(view.getByRole("dialog").textContent).toContain(
        "Delete src/components/ and its 2 files?"
      );
    });

    it("should name the dialog by its title", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.click(view.getByLabelText("Delete src"));

      // Assert
      const title = view.getByText("Delete src/ and its 3 files?");

      expect(view.getByRole("dialog").getAttribute("aria-labelledby")).toBe(
        title.id
      );
    });

    it("should remove the folder and its files when the user confirms", async () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.click(view.getByLabelText("Delete src"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toEqual(["index.js"]);
      expect(getPaths()).toEqual(["index.js"]);
    });

    it("should give the keyboard to the parent of the folder once the dialog is gone", async () => {
      // Arrange
      renderPane();
      askToDelete("src/components");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(getPaths()).not.toContain("src/components");
      expect(document.activeElement).toBe(getItem("src"));
    });

    it("should give the keyboard to the nearest folder that is left when the parent goes with it", async () => {
      // Arrange
      const sketch: Sketch = {
        ...SKETCH,
        tree: [
          { path: "a/b/c/x.js", kind: "file" },
          { path: "a/y.js", kind: "file" },
        ],
      };
      renderPane({ sketch });
      askToDelete("a/b/c");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(getPaths()).toEqual(["a", "a/y.js"]);
      expect(document.activeElement).toBe(getItem("a"));
    });

    it("should give the keyboard to the config when no folder is left above the removed one", async () => {
      // Arrange
      const sketch: Sketch = {
        ...SKETCH,
        tree: [
          { path: "docs/guide/a.md", kind: "file" },
          { path: "index.js", kind: "file" },
        ],
      };
      renderPane({ sketch });
      askToDelete("docs/guide");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(getPaths()).toEqual(["index.js"]);
      expect(document.activeElement).toBe(getItem("eslint.config.js"));
    });

    it("should leave the keyboard on the folder when the user cancels", async () => {
      // Arrange
      renderPane();
      askToDelete("src/components");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Cancel" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(document.activeElement).toBe(getItem("src/components"));
    });

    it("should keep the folder when the user cancels", async () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.click(view.getByLabelText("Delete src"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Cancel" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(getPaths()).toContain("src");
    });

    it("should put nothing in focus when the file in focus was inside the removed folder", () => {
      // Arrange
      const { store } = renderPane({
        focus: { kind: "file", path: "src/components/Button.js" },
      });
      fireEvent.keyDown(getItem("src"), { key: "Delete" });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should drop the selection of a folder that is removed", async () => {
      // Arrange
      renderPane();
      fireEvent.click(getRow("src/components"));
      fireEvent.keyDown(getItem("src/components"), { key: "Delete" });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));

      // Assert
      const selected = view
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-selected") === "true");

      expect(selected).toEqual([]);
    });

    it("should keep the selection of a folder when another is removed", () => {
      // Arrange
      renderPane();
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.click(view.getByLabelText("Delete index.js"));

      // Assert
      expect(getItem("src").getAttribute("aria-selected")).toBe("true");
    });

    it("should remove a folder with no files without asking", () => {
      // Arrange
      const sketch: Sketch = {
        ...SKETCH,
        tree: [...SKETCH.tree, { path: "docs", kind: "folder" }],
      };
      const { onSketchChange } = renderPane({ sketch });

      // Act
      fireEvent.click(view.getByLabelText("Delete docs"));

      // Assert
      expect(view.queryByRole("dialog")).toBeNull();
      expect(getTreePaths(getLastSketch(onSketchChange))).not.toContain("docs");
    });

    it("should ignore a confirmation for a folder that is gone", () => {
      // Arrange
      const { onSketchChange, store } = renderPane();
      fireEvent.click(view.getByLabelText("Delete src"));
      act(() => store.removeNode("src"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getTreePaths(store.getState().sketch)).toEqual(["index.js"]);
    });
  });

  describe("add", () => {
    it("should add a file at the root and start renaming it", () => {
      // Arrange
      const { onSketchChange } = renderPane();

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-file.js"
      );
      expect(getField("new-file.js").value).toBe("new-file.js");
    });

    it("should select the new file, open it and focus its field", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "new-file.js",
      });
      expect(getRenamingItem("new-file.js").getAttribute("aria-selected")).toBe(
        "true"
      );
      expect(document.activeElement).toBe(
        view.getByRole("textbox", { name: "New name of new-file.js" })
      );
    });

    it("should add the file in the folder of the file in focus", () => {
      // Arrange
      const { onSketchChange } = renderPane({
        focus: { kind: "file", path: "src/components/Button.js" },
      });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/components/new-file.js"
      );
    });

    it("should add the file at the root when the config is in focus", () => {
      // Arrange
      const { onSketchChange } = renderPane({ focus: { kind: "config" } });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-file.js"
      );
    });

    it("should add the file inside the folder that is selected", () => {
      // Arrange
      const { onSketchChange } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });
      fireEvent.click(getRow("src/components"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/components/new-file.js"
      );
    });

    it("should add the file at the root when the selected folder is gone", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.click(getRow("src/components"));
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      typeProjectText("index.js\n");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toEqual([
        "index.js",
        "new-file.js",
      ]);
    });

    it("should add the file at the root when the selected folder became a file", () => {
      // Arrange
      const { onSketchChange, store } = renderPane();
      fireEvent.click(getRow("src/components"));
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      typeProjectText("src/components\nindex.js\n");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toEqual([
        "src/components",
        "index.js",
        "new-file.js",
      ]);
      expect(getFocus(store)).toEqual({ kind: "file", path: "new-file.js" });
    });

    it("should pick a free name when the first one is taken", () => {
      // Arrange
      renderPane();
      fireEvent.click(view.getByRole("button", { name: "Add file" }));
      fireEvent.keyDown(
        view.getByRole("textbox", { name: "New name of new-file.js" }),
        { key: "Escape" }
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getField("new-file-2.js").value).toBe("new-file-2.js");
    });

    it("should add a folder, select it and start renaming it", () => {
      // Arrange
      const { onSketchChange, store } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add folder" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-folder"
      );
      expect(getRenamingItem("new-folder").getAttribute("aria-selected")).toBe(
        "true"
      );
      expect(getField("new-folder").value).toBe("new-folder");
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should add the next node inside the folder it just added", () => {
      // Arrange
      const { onSketchChange } = renderPane();
      fireEvent.click(view.getByRole("button", { name: "Add folder" }));
      fireEvent.keyDown(
        view.getByRole("textbox", { name: "New name of new-folder" }),
        { key: "Enter" }
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-folder/new-file.js"
      );
    });

    it("should open the folders above the new node", () => {
      // Arrange
      renderPane();
      fireEvent.click(getRow("src/components"));
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getField("src/new-file.js").value).toBe("new-file.js");
      expect(getItem("src").getAttribute("aria-expanded")).toBe("true");
    });

    it("should show the tree, where the node is renamed, when it adds from the text", () => {
      // Arrange
      const { store } = renderPane({ view: "text" });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(store.getState().view).toBe("tree");
      expect(getField("new-file.js").value).toBe("new-file.js");
    });

    it("should not change the view when it adds from the tree", () => {
      // Arrange
      const { store } = renderPane();
      const changes = jest.fn();

      store.subscribe(() => changes(store.getState().view));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add folder" }));

      // Assert
      expect(changes).toHaveBeenCalled();
      expect(
        changes.mock.calls.every(([viewAfter]) => viewAfter === "tree")
      ).toBe(true);
    });
  });

  describe("view", () => {
    it("should offer the tree and the text, with the current view pressed", () => {
      // Arrange
      renderPane({ view: "text" });

      // Act
      const group = view.getByRole("group", { name: "Project view" });
      const buttons = within(group).getAllByRole("button");

      // Assert
      expect(
        buttons.map((button) => [
          button.textContent,
          button.getAttribute("aria-pressed"),
        ])
      ).toEqual([
        ["Tree", "false"],
        ["Text", "true"],
      ]);
    });

    it("should show the other view when its button is pressed", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Assert
      expect(store.getState().view).toBe("text");
      expect(
        view.getByRole("textbox", { name: "Project as text" })
      ).toBeTruthy();
    });

    it("should change nothing when the current view is pressed again", () => {
      // Arrange
      const { store } = renderPane();
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Tree" }));

      // Assert
      expect(listener).not.toHaveBeenCalled();
      expect(store.getState().view).toBe("tree");
    });

    it("should show the text, with the hint, instead of the tree", () => {
      // Arrange
      renderPane({ view: "text" });

      // Act
      const text = view.getByRole("textbox", { name: "Project as text" });

      // Assert
      expect((text as HTMLTextAreaElement).value).toBe(
        [
          "eslint.config.js",
          "src/components/Button.js",
          "src/components/Price.js",
          "src/index.js",
          "index.js",
          "",
        ].join("\n")
      );
      expect(view.getByText("One path per line").textContent).toBe(
        "One path per line"
      );
      expect(view.queryByRole("tree")).toBeNull();
    });

    it("should show no hint with the tree", () => {
      // Arrange
      renderPane();

      // Act
      const hint = view.queryByText("One path per line");

      // Assert
      expect(hint).toBeNull();
    });

    it("should keep the closed folders when the text is shown and the tree comes back", () => {
      // Arrange
      renderPane();
      fireEvent.click(getRow("src/components"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      fireEvent.click(view.getByRole("button", { name: "Tree" }));

      // Assert
      expect(getPaths()).not.toContain("src/components/Button.js");
    });

    it("should read the text into the sketch of the store, and keep the lines that cannot be read as a draft", () => {
      // Arrange
      const { onSketchChange, store } = renderPane({ view: "text" });

      // Act
      typeProjectText("a.js\n  indented\n");

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getTreePaths(getLastSketch(onSketchChange))).toEqual(["a.js"]);
      expect(store.getState().textDraft).toBe("a.js\n  indented\n");
    });

    it("should drop the lines that were not read when the view goes back to the tree", () => {
      // Arrange
      const { store } = renderPane({ view: "text" });
      typeProjectText("  indented\n");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Tree" }));

      // Assert
      expect(store.getState().textDraft).toBeUndefined();
    });
  });

  describe("without edit capabilities", () => {
    it("should draw no add buttons", () => {
      // Arrange
      renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      const buttons = view
        .getAllByRole("button")
        .map((button) => button.textContent);

      // Assert
      expect(buttons).toEqual(["Tree", "Text"]);
    });

    it("should draw no row actions", () => {
      // Arrange
      renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      const actions = view.queryByLabelText("Rename src/index.js");

      // Assert
      expect(actions).toBeNull();
    });

    it("should announce no shortcuts on the rows", () => {
      // Arrange
      renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      const shortcuts = view
        .getAllByRole("treeitem")
        .map((item) => item.getAttribute("aria-keyshortcuts"));

      // Assert
      expect(shortcuts.every((keys) => keys === null)).toBe(true);
    });

    it("should neither rename nor remove with the keyboard or the mouse", () => {
      // Arrange
      const { onSketchChange } = renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "F2" });
      fireEvent.keyDown(getItem("index.js"), { key: "Delete" });
      fireEvent.doubleClick(getRow("index.js"));

      // Assert
      expect(view.queryByRole("textbox")).toBeNull();
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should still open files and the config", () => {
      // Arrange
      const { store } = renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      fireEvent.click(getRow("index.js"));

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should show the text read only", () => {
      // Arrange
      renderPane({ capabilities: NO_CAPABILITIES, view: "text" });

      // Act
      const text = view.getByRole("textbox", { name: "Project as text" });

      // Assert
      expect((text as HTMLTextAreaElement).readOnly).toBe(true);
    });

    it("should leave the text editable with edit capabilities", () => {
      // Arrange
      renderPane({ view: "text" });

      // Act
      const text = view.getByRole("textbox", { name: "Project as text" });

      // Assert
      expect((text as HTMLTextAreaElement).readOnly).toBe(false);
    });
  });
});
