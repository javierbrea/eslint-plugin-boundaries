// cspell:ignore dissallow patern -- deliberate typos, the mistakes of the config that the tests report
import { act } from "@testing-library/react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import type { SessionStore } from "@/domains/session/data/store";
import {
  NO_CAPABILITIES,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";
import type {
  Focus,
  ProjectView,
  Target,
} from "@/domains/session/helpers/focus";

import { ProjectPane } from "./ProjectPane";
import { ProjectPanePom } from "./ProjectPane.pom";

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

/** What {@link renderPane} returns: the render of the session, and the page object of the pane. */
type PaneRender = SessionRender & {
  /** The page object of the project pane. */
  readonly pane: ProjectPanePom;
};

/**
 * Renders the pane in a session and puts the store in the state a test starts from, as the user would: with a file opened, or the project shown as text.
 * @param options What the pane starts with.
 * @param options.sketch The sketch to start from.
 * @param options.capabilities What the user can change.
 * @param options.focus What is in focus.
 * @param options.view How the pane shows the project.
 * @returns The render, the store, the spy of the sketches and the page object of the pane.
 */
function renderPane({
  sketch = SKETCH,
  capabilities,
  focus: target,
  view: projectView = "tree",
}: PaneOptions = {}): PaneRender {
  const rendered = {
    ...renderInSession(<ProjectPane />, {
      sketch,
      capabilities,
    }),
    pane: new ProjectPanePom(),
  };

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
function getFocus(store: SessionStore): Focus {
  return store.getState().focus;
}

/**
 * Types the whole text of the project in the textarea, and leaves it, as the user does when the text is done.
 * @param pane The page object of the pane, which shows the project as text.
 * @param text The text.
 */
function typeProjectText(pane: ProjectPanePom, text: string): void {
  pane.text.type(text);
  pane.text.blur();
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
function getLastSketch(spy: SessionRender["onSketchChange"]): Sketch {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}

describe("ProjectPane", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("tree", () => {
    it("should name the pane Project", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { layout } = pane;
      const isNamedRegion = layout.isRegionNamed("Project");

      // Assert
      expect(isNamedRegion).toBe(true);
      expect(layout.childTexts[0]).toBe("Project");
    });

    it("should pin eslint.config.js first and put folders before files, each by name", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const names = pane.tree.itemNames;

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
      const { pane } = renderPane();

      // Act
      const paths = pane.tree.itemPaths;

      // Assert
      expect(paths).toEqual([
        "eslint.config.js",
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
      const { pane } = renderPane();

      // Act
      const folders = pane.tree.expandedStates;

      // Assert
      expect(folders).toEqual(["true", "true"]);
    });

    it("should close a folder when it is clicked, and open it when it is clicked again", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.click("src/components");
      const pathsClosed = pane.tree.itemPaths;
      pane.click("src/components");
      const pathsOpen = pane.tree.itemPaths;

      // Assert
      expect(pathsClosed).not.toContain("src/components/Button.js");
      expect(pathsOpen).toContain("src/components/Button.js");
    });

    it("should remember in the store the folders that were closed", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      pane.click("src/components");

      // Assert
      expect(Array.from(store.getState().closedFolders)).toEqual([
        "src/components",
      ]);
    });

    it("should not open anything when a folder is clicked", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      pane.click("src");

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should open a file when it is clicked", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      pane.click("src/index.js");

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "src/index.js",
      });
    });

    it("should open the config when it is clicked", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      pane.click("eslint.config.js");

      // Assert
      expect(getFocus(store)).toEqual({ kind: "config" });
    });

    it("should select the file that is in focus", () => {
      // Arrange
      const { pane } = renderPane({
        focus: { kind: "file", path: "src/index.js" },
      });

      // Act
      const selected = pane.tree.selectedPaths;

      // Assert
      expect(selected).toEqual(["src/index.js"]);
    });

    it("should select the config when it is in focus", () => {
      // Arrange
      const { pane } = renderPane({ focus: { kind: "config" } });

      // Act
      const config = pane.item("eslint.config.js");

      // Assert
      expect(config.ariaSelected).toBe("true");
    });

    it("should select nothing when nothing is in focus", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const selected = pane.tree.selectedPaths;

      // Assert
      expect(selected).toEqual([]);
    });

    it("should select a folder the user clicked, and keep what is in focus", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      pane.click("src");

      // Assert
      expect(pane.item("src").ariaSelected).toBe("true");
      expect(pane.item("index.js").ariaSelected).toBe("false");
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should select the file again when it is clicked after a folder", () => {
      // Arrange
      const { pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });
      pane.click("src");

      // Act
      pane.click("index.js");

      // Assert
      expect(pane.item("index.js").ariaSelected).toBe("true");
      expect(pane.item("src").ariaSelected).toBe("false");
    });

    it("should drop the selected folder when something else takes the focus", () => {
      // Arrange
      const { store, pane } = renderPane();
      pane.click("src");

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(pane.item("src").ariaSelected).toBe("false");
      expect(pane.item("eslint.config.js").ariaSelected).toBe("true");
    });

    it("should keep what is in focus when the keyboard clears the selection", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      pane.item("index.js").pressKey(" ");

      // Assert
      expect(listener).not.toHaveBeenCalled();
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
      expect(pane.item("index.js").ariaSelected).toBe("true");
    });

    it("should open the folders above a file that takes the focus", () => {
      // Arrange
      const { store, pane } = renderPane();
      pane.click("src/components");
      pane.click("src");

      // Act
      act(() => store.open({ kind: "file", path: "src/components/Button.js" }));

      // Assert
      expect(pane.tree.itemPaths).toContain("src/components/Button.js");
    });

    it("should select nothing when the file in focus is removed", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      act(() => store.removeNode("index.js"));

      // Assert
      expect(pane.tree.selectedPaths).toEqual([]);
    });

    it("should show a node that another pane adds to the store", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(pane.item("new-file.js").field.value).toBe("new-file.js");
      expect(getTreePaths(store.getState().sketch)).toContain("new-file.js");
    });
  });

  describe("badges", () => {
    it("should show the problems of the config in red when it has errors", () => {
      // Arrange
      const { pane } = renderPane({
        sketch: { ...SKETCH, config: CONFIG_WITH_BOTH },
      });

      // Act
      const badge = pane.item("eslint.config.js").row.badge("2 problems");

      // Assert
      expect(badge.count).toBe("2");
      expect(badge.color).toBe("var(--jsb-bad)");
    });

    it("should show the problems of the config in the warning color when it has no errors", () => {
      // Arrange
      const { pane } = renderPane({
        sketch: { ...SKETCH, config: CONFIG_WITH_WARNING },
      });

      // Act
      const badge = pane.item("eslint.config.js").row.badge("1 problem");

      // Assert
      expect(badge.color).toBe("var(--jsb-warn)");
    });

    it("should draw no badge when the config has no problems", () => {
      // Arrange
      const { pane } = renderPane({
        sketch: { ...SKETCH, config: QUICK_START_CONFIG },
      });

      // Act
      const badges = pane.item("eslint.config.js").row.badgeNames;

      // Assert
      expect(badges).toEqual([]);
    });

    it("should draw no badge on a folder or a file until dependencies are evaluated", () => {
      // Arrange
      const { pane } = renderPane({
        sketch: { ...SKETCH, config: CONFIG_WITH_BOTH },
      });

      // Act
      const badges = pane.tree.badgeNames;

      // Assert
      expect(badges).toEqual(["2 problems"]);
    });

    it("should turn the config red when it has errors, and not otherwise", () => {
      // Arrange
      jest.useFakeTimers();
      const { store, pane } = renderPane({
        sketch: { ...SKETCH, config: CONFIG_WITH_ERROR },
      });
      const withErrorsBad = pane.item("eslint.config.js").row.isBad;

      // Act
      act(() => store.changeConfig(CONFIG_WITH_WARNING));
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY);
      });
      const withoutErrorsBad = pane.item("eslint.config.js").row.isBad;

      // Assert
      expect(withErrorsBad).toBe(true);
      expect(withoutErrorsBad).toBe(false);
    });

    it("should keep the badge of the config while an edit of the config waits to be evaluated", () => {
      // Arrange
      jest.useFakeTimers();
      const { store, pane } = renderPane({
        sketch: { ...SKETCH, config: CONFIG_WITH_ERROR },
      });

      // Act
      act(() => store.changeConfig(QUICK_START_CONFIG));
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY - 1);
      });
      const whileWaiting = pane.item("eslint.config.js").row.badgeNames;
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Assert
      expect(whileWaiting).toHaveLength(1);
      expect(pane.item("eslint.config.js").row.badgeNames).toEqual([]);
    });
  });

  describe("rename", () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it("should rename a file in place from its row action", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.item("src/index.js").renameAction.press();
      const { field } = pane.item("src/index.js");
      field.type("main.js");
      field.pressKey("Enter");

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/main.js"
      );
      expect(pane.tree.itemPaths).toContain("src/main.js");
      expect(pane.tree.renameFieldCount).toBe(0);
    });

    it("should start the rename on double click", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.item("src/index.js").row.doubleClickName();

      // Assert
      expect(pane.item("src/index.js").field.value).toBe("index.js");
    });

    it("should start the rename with F2", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.item("src/index.js").pressKey("F2");

      // Assert
      expect(pane.item("src/index.js").field.value).toBe("index.js");
    });

    it("should start with the current name, selected, without the slash of a folder", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.item("src/components").row.doubleClickName();
      const { field } = pane.item("src/components");

      // Assert
      expect(field.value).toBe("components");
      expect(field.selection).toEqual({ start: 0, end: 10 });
    });

    it("should not open or select the row when the field is clicked", () => {
      // Arrange
      const { store, pane } = renderPane();
      pane.item("src/components").row.doubleClickName();

      // Act
      pane.item("src/components").field.click();

      // Assert
      expect(pane.tree.itemPaths).toContain("src/components/Button.js");
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should not pass the keys of the field to the tree", () => {
      // Arrange
      const { store, pane } = renderPane();
      pane.item("src/index.js").row.doubleClickName();
      const { field } = pane.item("src/index.js");

      // Act
      field.pressKey(" ");

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should follow the rename with the focus", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "src/index.js" },
      });

      // Act
      pane.rename("src/index.js", "main.js");

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "src/main.js",
      });
      expect(pane.item("src/main.js").ariaSelected).toBe("true");
    });

    it("should follow the rename of a folder with the file in focus inside it", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "src/components/Button.js" },
      });

      // Act
      pane.rename("src", "lib");

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "lib/components/Button.js",
      });
    });

    it("should leave the focus alone when the renamed node is not the file in focus", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      pane.rename("src", "lib");

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should keep a renamed folder closed, and keep its children's dependencies", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.click("src/components");

      // Act
      pane.rename("src", "lib");

      // Assert
      expect(pane.tree.itemPaths).toEqual([
        "eslint.config.js",
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
      const { pane } = renderPane();
      pane.click("src");

      // Act
      pane.rename("src", "lib");

      // Assert
      expect(pane.item("lib").ariaSelected).toBe("true");
    });

    it("should rename a file inside a folder, keeping the folder", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.rename("src/components/Price.js", "Cost.js");

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/components/Cost.js"
      );
    });

    it("should move a node into a folder when the name has a path", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.rename("src/index.js", "./app/main.js");

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/app/main.js"
      );
    });

    it("should open the closed folder that a node moves into, and give the keyboard to the node", async () => {
      // Arrange
      const { pane } = renderPane();
      pane.click("src/components");
      pane.item("src/index.js").pressKey("F2");
      const { field } = pane.item("src/index.js");

      // Act
      field.type("components/moved.js");
      field.pressKey("Enter");
      await pane.waitForFocus();

      // Assert
      expect(pane.item("src/components").ariaExpanded).toBe("true");
      expect(pane.tree.itemPaths).toContain("src/components/moved.js");
      expect(pane.item("src/components/moved.js").isFocused).toBe(true);
    });

    it("should rename when the field loses the focus, and leave the focus where the user put it", async () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");
      pane.item("src/index.js").field.type("main.js");

      // Act
      pane.foot.focusView("Tree");
      await settleFocus();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/main.js"
      );
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(pane.tree.itemPaths).toContain("src/main.js");
      expect(pane.foot.isViewFocused("Tree")).toBe(true);
    });

    it("should give up when Escape is pressed", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");
      const { field } = pane.item("src/index.js");
      field.type("main.js");

      // Act
      field.pressKey("Escape");

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(pane.tree.renameFieldCount).toBe(0);
      expect(pane.tree.itemPaths).toContain("src/index.js");
    });

    it("should ignore the other keys", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");
      const { field } = pane.item("src/index.js");
      field.type("main.js");

      // Act
      field.pressKey("a");

      // Assert
      expect(pane.item("src/index.js").field.value).toBe("main.js");
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should close the field without an edit when the name did not change", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.rename("src/index.js", "  index.js ");

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(pane.tree.renameFieldCount).toBe(0);
    });

    it("should refuse a name that is taken, say why next to the field and keep the field open", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src/components/Price.js").pressKey("F2");
      const { field } = pane.item("src/components/Price.js");
      field.type("Button.js");

      // Act
      field.pressKey("Enter");

      // Assert
      expect(field.refusal.text).toBe("That path already exists.");
      expect(field.ariaInvalid).toBe("true");
      expect(field.describedBy).toBe(field.refusal.id);
      expect(onSketchChange).not.toHaveBeenCalled();
      // The field is still there, and it is the only one
      expect([field.isRendered, pane.tree.renameFieldCount]).toEqual([true, 1]);
    });

    it("should clear the reason when the user types again, and rename with the fixed name", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src/components/Price.js").pressKey("F2");
      const { field } = pane.item("src/components/Price.js");
      field.type("Button.js");
      field.pressKey("Enter");

      // Act
      field.type("Cost.js");
      const invalidAfterTyping = field.ariaInvalid;
      const describedAfterTyping = field.describedBy;
      const titleAfterTyping = field.nativeTitle;
      field.pressKey("Enter");

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
      const { pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");
      const folderField = pane.item("src/index.js").field;
      folderField.type(" ");
      folderField.pressKey("Enter");
      const reasonInFolder = folderField.refusal.text;
      folderField.type("index.js");
      folderField.pressKey("Escape");
      pane.item("index.js").pressKey("F2");
      const rootField = pane.item("index.js").field;

      // Act
      rootField.type("");
      rootField.pressKey("Enter");

      // Assert
      expect(reasonInFolder).toBe("The path is empty.");
      expect(rootField.refusal.text).toBe("The path is empty.");
    });

    it("should refuse a folder that would move into itself", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src").pressKey("F2");
      const { field } = pane.item("src");
      field.type("src/inner");

      // Act
      field.pressKey("Enter");

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(field.refusal.text).not.toBe("");
    });

    it("should give up when the field loses the focus with a refused name, and leave the focus where the user put it", async () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src/components/Price.js").pressKey("F2");
      pane.item("src/components/Price.js").field.type("Button.js");

      // Act
      pane.foot.focusView("Tree");
      await settleFocus();

      // Assert
      expect(pane.tree.renameFieldCount).toBe(0);
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(pane.tree.itemPaths).toContain("src/components/Price.js");
      expect(pane.foot.isViewFocused("Tree")).toBe(true);
    });

    it("should close the field and leave the focus where the user put it when the name did not change", async () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");

      // Act
      pane.foot.focusView("Tree");
      await settleFocus();

      // Assert
      expect(pane.tree.renameFieldCount).toBe(0);
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(pane.foot.isViewFocused("Tree")).toBe(true);
    });

    it("should not touch the item while the focus is on its way to where the user clicked", async () => {
      // Arrange
      const focusSpy = jest.spyOn(HTMLElement.prototype, "focus");
      const { pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");
      const { field } = pane.item("src/index.js");
      field.type("main.js");
      focusSpy.mockClear();

      // Act
      // A browser runs the handlers of the blur while the focus is on the body, and puts it on its target when they return
      act(() => {
        field.blur();
      });
      pane.foot.focusView("Tree");
      await settleFocus();

      // Assert
      const itemsTouched = focusSpy.mock.contexts.some((element) =>
        ProjectTreeItemPom.isItem(element)
      );

      expect(itemsTouched).toBe(false);
      expect(pane.foot.isViewFocused("Tree")).toBe(true);
    });

    it("should give the keyboard back to the renamed item", async () => {
      // Arrange
      const { pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");
      const { field } = pane.item("src/index.js");
      field.type("main.js");

      // Act
      field.pressKey("Enter");
      await pane.waitForFocus();

      // Assert
      expect(pane.item("src/main.js").isFocused).toBe(true);
    });

    it("should give the keyboard back to the item when the user gives up", async () => {
      // Arrange
      const { pane } = renderPane();
      pane.item("src/index.js").pressKey("F2");
      const { field } = pane.item("src/index.js");
      field.type("main.js");

      // Act
      field.pressKey("Escape");
      await pane.waitForFocus();

      // Assert
      expect(pane.item("src/index.js").isFocused).toBe(true);
    });

    it("should announce the F2 and Delete shortcuts on the rows that can be edited, and not on the config", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const shortcuts = ["src", "src/index.js", "eslint.config.js"].map(
        (path) => pane.item(path).keyShortcuts
      );

      // Assert
      expect(shortcuts).toEqual(["F2 Delete", "F2 Delete", null]);
    });

    it("should have no row actions, rename or delete for the config", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      const config = pane.item("eslint.config.js");
      config.pressKey("F2");
      config.pressKey("Delete");
      config.row.doubleClickName();

      // Assert
      expect(config.row.buttonNames).toEqual([]);
      expect(pane.tree.renameFieldCount).toBe(0);
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not open the row when its action is clicked", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      pane.item("src/index.js").renameAction.press();

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should ignore the keys that come from inside the item", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.item("src/index.js").renameAction.pressKey("F2");
      pane.item("src/components/Button.js").pressKey("F2");

      // Assert: the field is the one of the child, not of src/ that holds it
      expect(pane.tree.renameFieldCount).toBe(1);
      expect(pane.item("src/components/Button.js").field.value).toBe(
        "Button.js"
      );
    });
  });

  describe("delete", () => {
    it("should remove a file right away from its row action", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.item("src/index.js").deleteAction.press();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).not.toContain(
        "src/index.js"
      );
      expect(pane.tree.itemPaths).not.toContain("src/index.js");
    });

    it("should remove the dependencies of the file with it", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.item("src/index.js").deleteAction.press();

      // Assert
      expect(getLastSketch(onSketchChange).dependencies).toHaveLength(1);
    });

    it("should remove a file with the Delete key", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.item("index.js").pressKey("Delete");

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).not.toContain(
        "index.js"
      );
    });

    it("should leave the other keys alone", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.item("index.js").pressKey("Backspace");

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should put nothing in focus when the file in focus is removed", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      pane.item("index.js").pressKey("Delete");

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should leave the focus when another file is removed", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      pane.item("src/index.js").pressKey("Delete");

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should ask before it removes a folder with files", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.item("src").deleteAction.press();

      // Assert
      expect(pane.deleteDialog.dialog.title).toBe(
        "Delete src/ and its 3 files?"
      );
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should say file, not files, for a folder with one", () => {
      // Arrange
      const sketch: Sketch = {
        ...SKETCH,
        tree: [...SKETCH.tree, { path: "docs/readme.md", kind: "file" }],
      };
      const { pane } = renderPane({ sketch });

      // Act
      pane.item("docs").deleteAction.press();

      // Assert
      expect(pane.deleteDialog.dialog.title).toBe(
        "Delete docs/ and its 1 file?"
      );
    });

    it("should count the files of the folder at any depth, and not the folders", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.item("src/components").deleteAction.press();

      // Assert
      expect(pane.deleteDialog.dialog.title).toBe(
        "Delete src/components/ and its 2 files?"
      );
    });

    it("should name the dialog by its title", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.item("src").deleteAction.press();

      // Assert
      const { dialog } = pane.deleteDialog;

      expect(dialog.title).toBe("Delete src/ and its 3 files?");
      expect(dialog.isDialogNamed("Delete src/ and its 3 files?")).toBe(true);
    });

    it("should remove the folder and its files when the user confirms", async () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src").deleteAction.press();

      // Act
      pane.deleteDialog.confirm();
      await pane.waitUntilDeleteDialogGone();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toEqual(["index.js"]);
      expect(pane.tree.itemPaths).toEqual(["eslint.config.js", "index.js"]);
    });

    it("should give the keyboard to the parent of the folder once the dialog is gone", async () => {
      // Arrange
      const { pane } = renderPane();
      pane.askToDelete("src/components");

      // Act
      pane.deleteDialog.confirm();
      await pane.waitUntilDeleteDialogGone();
      await pane.waitForFocus();

      // Assert
      expect(pane.tree.itemPaths).not.toContain("src/components");
      expect(pane.item("src").isFocused).toBe(true);
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
      const { pane } = renderPane({ sketch });
      pane.askToDelete("a/b/c");

      // Act
      pane.deleteDialog.confirm();
      await pane.waitUntilDeleteDialogGone();
      await pane.waitForFocus();

      // Assert
      expect(pane.tree.itemPaths).toEqual(["eslint.config.js", "a", "a/y.js"]);
      expect(pane.item("a").isFocused).toBe(true);
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
      const { pane } = renderPane({ sketch });
      pane.askToDelete("docs/guide");

      // Act
      pane.deleteDialog.confirm();
      await pane.waitUntilDeleteDialogGone();
      await pane.waitForFocus();

      // Assert
      expect(pane.tree.itemPaths).toEqual(["eslint.config.js", "index.js"]);
      expect(pane.item("eslint.config.js").isFocused).toBe(true);
    });

    it("should leave the keyboard on the folder when the user cancels", async () => {
      // Arrange
      const { pane } = renderPane();
      pane.askToDelete("src/components");

      // Act
      pane.deleteDialog.cancel();
      await pane.waitUntilDeleteDialogGone();
      await pane.waitForFocus();

      // Assert
      expect(pane.item("src/components").isFocused).toBe(true);
    });

    it("should keep the folder when the user cancels", async () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.item("src").deleteAction.press();

      // Act
      pane.deleteDialog.cancel();
      await pane.waitUntilDeleteDialogGone();

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
      expect(pane.tree.itemPaths).toContain("src");
    });

    it("should put nothing in focus when the file in focus was inside the removed folder", () => {
      // Arrange
      const { store, pane } = renderPane({
        focus: { kind: "file", path: "src/components/Button.js" },
      });
      pane.item("src").pressKey("Delete");

      // Act
      pane.deleteDialog.confirm();

      // Assert
      expect(getFocus(store)).toEqual({ kind: "none" });
    });

    it("should drop the selection of a folder that is removed", async () => {
      // Arrange
      const { pane } = renderPane();
      pane.click("src/components");
      pane.item("src/components").pressKey("Delete");

      // Act
      pane.deleteDialog.confirm();
      await pane.waitUntilDeleteDialogGone();

      // Assert
      expect(pane.tree.selectedPaths).toEqual([]);
    });

    it("should keep the selection of a folder when another is removed", () => {
      // Arrange
      const { pane } = renderPane();
      pane.click("src");

      // Act
      pane.item("index.js").deleteAction.press();

      // Assert
      expect(pane.item("src").ariaSelected).toBe("true");
    });

    it("should remove a folder with no files without asking", () => {
      // Arrange
      const sketch: Sketch = {
        ...SKETCH,
        tree: [...SKETCH.tree, { path: "docs", kind: "folder" }],
      };
      const { onSketchChange, pane } = renderPane({ sketch });

      // Act
      pane.item("docs").deleteAction.press();

      // Assert
      expect(pane.deleteDialog.isRendered).toBe(false);
      expect(getTreePaths(getLastSketch(onSketchChange))).not.toContain("docs");
    });

    it("should ignore a confirmation for a folder that is gone", () => {
      // Arrange
      const { onSketchChange, store, pane } = renderPane();
      pane.item("src").deleteAction.press();
      act(() => store.removeNode("src"));

      // Act
      pane.deleteDialog.confirm();

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getTreePaths(store.getState().sketch)).toEqual(["index.js"]);
    });
  });

  describe("add", () => {
    it("should add a file at the root and start renaming it", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();

      // Act
      pane.foot.addFile();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-file.js"
      );
      expect(pane.item("new-file.js").field.value).toBe("new-file.js");
    });

    it("should select the new file, open it and focus its field", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      pane.foot.addFile();

      // Assert
      expect(getFocus(store)).toEqual({
        kind: "file",
        path: "new-file.js",
      });
      expect(pane.item("new-file.js").ariaSelected).toBe("true");
      expect(pane.item("new-file.js").field.isFocused).toBe(true);
    });

    it("should add the file in the folder of the file in focus", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane({
        focus: { kind: "file", path: "src/components/Button.js" },
      });

      // Act
      pane.foot.addFile();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/components/new-file.js"
      );
    });

    it("should add the file at the root when the config is in focus", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane({
        focus: { kind: "config" },
      });

      // Act
      pane.foot.addFile();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-file.js"
      );
    });

    it("should add the file inside the folder that is selected", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });
      pane.click("src/components");

      // Act
      pane.foot.addFile();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "src/components/new-file.js"
      );
    });

    it("should add the file at the root when the selected folder is gone", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.click("src/components");
      pane.foot.pressView("Text");
      typeProjectText(pane, "index.js\n");

      // Act
      pane.foot.addFile();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toEqual([
        "index.js",
        "new-file.js",
      ]);
    });

    it("should add the file at the root when the selected folder became a file", () => {
      // Arrange
      const { onSketchChange, store, pane } = renderPane();
      pane.click("src/components");
      pane.foot.pressView("Text");
      typeProjectText(pane, "src/components\nindex.js\n");

      // Act
      pane.foot.addFile();

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
      const { pane } = renderPane();
      pane.foot.addFile();
      pane.item("new-file.js").field.pressKey("Escape");

      // Act
      pane.foot.addFile();

      // Assert
      expect(pane.item("new-file-2.js").field.value).toBe("new-file-2.js");
    });

    it("should add a folder, select it and start renaming it", () => {
      // Arrange
      const { onSketchChange, store, pane } = renderPane({
        focus: { kind: "file", path: "index.js" },
      });

      // Act
      pane.foot.addFolder();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-folder"
      );
      expect(pane.item("new-folder").ariaSelected).toBe("true");
      expect(pane.item("new-folder").field.value).toBe("new-folder");
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should add the next node inside the folder it just added", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane();
      pane.foot.addFolder();
      pane.item("new-folder").field.pressKey("Enter");

      // Act
      pane.foot.addFile();

      // Assert
      expect(getTreePaths(getLastSketch(onSketchChange))).toContain(
        "new-folder/new-file.js"
      );
    });

    it("should open the folders above the new node", () => {
      // Arrange
      const { pane } = renderPane();
      pane.click("src/components");
      pane.click("src");

      // Act
      pane.foot.addFile();

      // Assert
      expect(pane.item("src/new-file.js").field.value).toBe("new-file.js");
      expect(pane.item("src").ariaExpanded).toBe("true");
    });

    it("should show the tree, where the node is renamed, when it adds from the text", () => {
      // Arrange
      const { store, pane } = renderPane({ view: "text" });

      // Act
      pane.foot.addFile();

      // Assert
      expect(store.getState().view).toBe("tree");
      expect(pane.item("new-file.js").field.value).toBe("new-file.js");
    });

    it("should not change the view when it adds from the tree", () => {
      // Arrange
      const { store, pane } = renderPane();
      const changes = jest.fn();

      store.subscribe(() => changes(store.getState().view));

      // Act
      pane.foot.addFolder();

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
      const { pane } = renderPane({ view: "text" });

      // Act
      const { viewName, views } = pane.foot;

      // Assert
      expect(viewName).toBe("Project view");
      expect(views).toEqual([
        { text: "Tree", pressed: "false" },
        { text: "Text", pressed: "true" },
      ]);
    });

    it("should show the other view when its button is pressed", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      pane.foot.pressView("Text");

      // Assert
      expect(store.getState().view).toBe("text");
      expect(pane.text.isRendered).toBe(true);
      expect(pane.text.area.isTextboxNamed("Project as text")).toBe(true);
    });

    it("should change nothing when the current view is pressed again", () => {
      // Arrange
      const { store, pane } = renderPane();
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      pane.foot.pressView("Tree");

      // Assert
      expect(listener).not.toHaveBeenCalled();
      expect(store.getState().view).toBe("tree");
    });

    it("should show the text, with the hint, instead of the tree", () => {
      // Arrange
      const { pane } = renderPane({ view: "text" });

      // Act
      const { value } = pane.text;

      // Assert
      expect(value).toBe(
        [
          "eslint.config.js",
          "src/components/Button.js",
          "src/components/Price.js",
          "src/index.js",
          "index.js",
          "",
        ].join("\n")
      );
      expect(pane.layout.head.hint).toBe("One path per line");
      expect(pane.tree.isRendered).toBe(false);
    });

    it("should show no hint with the tree", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { hint } = pane.layout.head;

      // Assert
      expect(hint).toBeNull();
    });

    it("should keep the closed folders when the text is shown and the tree comes back", () => {
      // Arrange
      const { pane } = renderPane();
      pane.click("src/components");

      // Act
      pane.foot.pressView("Text");
      pane.foot.pressView("Tree");

      // Assert
      expect(pane.tree.itemPaths).not.toContain("src/components/Button.js");
    });

    it("should read the text into the sketch of the store, and keep the lines that cannot be read as a draft", () => {
      // Arrange
      const { onSketchChange, store, pane } = renderPane({ view: "text" });

      // Act
      typeProjectText(pane, "a.js\n  indented\n");

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(getTreePaths(getLastSketch(onSketchChange))).toEqual(["a.js"]);
      expect(store.getState().textDraft).toBe("a.js\n  indented\n");
    });

    it("should drop the lines that were not read when the view goes back to the tree", () => {
      // Arrange
      const { store, pane } = renderPane({ view: "text" });
      typeProjectText(pane, "  indented\n");

      // Act
      pane.foot.pressView("Tree");

      // Assert
      expect(store.getState().textDraft).toBeUndefined();
    });
  });

  describe("without edit capabilities", () => {
    it("should draw no add buttons", () => {
      // Arrange
      const { pane } = renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      const { buttonTexts } = pane.foot;

      // Assert
      expect(buttonTexts).toEqual(["Tree", "Text"]);
      expect(pane.tree.buttonNames).toEqual([]);
    });

    it("should draw no row actions", () => {
      // Arrange
      const { pane } = renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      const actions = pane.item("src/index.js").renameAction;

      // Assert
      expect(actions.isRendered).toBe(false);
    });

    it("should announce no shortcuts on the rows", () => {
      // Arrange
      const { pane } = renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      const shortcuts = pane.tree.itemPaths.map(
        (path) => pane.item(path).keyShortcuts
      );

      // Assert
      expect(shortcuts).toEqual(Array(7).fill(null));
    });

    it("should neither rename nor remove with the keyboard or the mouse", () => {
      // Arrange
      const { onSketchChange, pane } = renderPane({
        capabilities: NO_CAPABILITIES,
      });

      // Act
      pane.item("index.js").pressKey("F2");
      pane.item("index.js").pressKey("Delete");
      pane.item("index.js").row.doubleClickName();

      // Assert
      expect(pane.tree.renameFieldCount).toBe(0);
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should still open files and the config", () => {
      // Arrange
      const { store, pane } = renderPane({ capabilities: NO_CAPABILITIES });

      // Act
      pane.click("index.js");

      // Assert
      expect(getFocus(store)).toEqual({ kind: "file", path: "index.js" });
    });

    it("should show the text read only", () => {
      // Arrange
      const { pane } = renderPane({
        capabilities: NO_CAPABILITIES,
        view: "text",
      });

      // Act
      const { isReadOnly } = pane.text;

      // Assert
      expect(isReadOnly).toBe(true);
    });

    it("should leave the text editable with edit capabilities", () => {
      // Arrange
      const { pane } = renderPane({ view: "text" });

      // Act
      const { isReadOnly } = pane.text;

      // Assert
      expect(isReadOnly).toBe(false);
    });
  });
});
