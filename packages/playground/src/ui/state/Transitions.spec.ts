import type { Sketch } from "../../contract";
import { createEngine } from "../../engine";
import type { Evaluation, TextRange } from "../../engine";
import { toText } from "../../sketch";

import type { Focus } from "./Focus.types";
import {
  addNode,
  cancelRename,
  changeConfig,
  createWorkbenchState,
  openTarget,
  readText,
  removeNode,
  renameNode,
  selectItem,
  selectTab,
  setEvaluation,
  setProblemsCollapsed,
  setTextDraft,
  setView,
  settleText,
  startRename,
  toggleFolder,
} from "./Transitions";
import type { RenameTransition } from "./Transitions.types";
import type { WorkbenchState } from "./WorkbenchState.types";

// In the order of the tree: what an edit returns
const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "docs", kind: "folder" },
    { path: "src/helpers/format.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
    { path: "main.js", kind: "file" },
  ],
  dependencies: [],
};

const EVALUATION: Evaluation = createEngine().evaluate(SKETCH);

const RANGE: TextRange = { from: 10, to: 20, line: 2, column: 3 };

const OTHER_RANGE: TextRange = { from: 30, to: 40, line: 4, column: 5 };

const INDEX_FOCUS: Focus = { kind: "file", path: "src/index.js" };

const FORMAT_FOCUS: Focus = { kind: "file", path: "src/helpers/format.js" };

/**
 * Creates a state of the workbench for the sketch of the spec.
 * @param overrides What differs from the first state.
 * @returns The state.
 */
function createState(overrides: Partial<WorkbenchState> = {}): WorkbenchState {
  return { ...createWorkbenchState(SKETCH, EVALUATION), ...overrides };
}

/**
 * Gets the state and the path of a rename that is not refused.
 * @param result The result of a rename.
 * @returns The state after the rename and the new path of the node.
 */
function getRenamed(result: RenameTransition): {
  state: WorkbenchState;
  path: string;
} {
  if ("error" in result) {
    throw new Error(`The rename was refused: ${result.error}`);
  }
  return result;
}

/**
 * Gets the paths of the nodes of a state.
 * @param state The state.
 * @returns The paths of the nodes of its sketch, in order.
 */
function getPaths(state: WorkbenchState): string[] {
  return state.sketch.tree.map((node) => node.path);
}

describe("Transitions", () => {
  describe("createWorkbenchState", () => {
    it("should start with nothing in focus, the tree with every folder open and the sketch tab", () => {
      // Act
      const state = createWorkbenchState(SKETCH, EVALUATION);

      // Assert
      expect(state).toEqual({
        sketch: SKETCH,
        evaluation: EVALUATION,
        focus: { kind: "none" },
        tab: "sketch",
        problemsCollapsed: false,
        reveal: undefined,
        revealCount: 0,
        view: "tree",
        textDraft: undefined,
        pickedFolder: undefined,
        closedFolders: new Set(),
        renaming: undefined,
      });
    });

    it("should keep the sketch and the evaluation it is given", () => {
      // Act
      const state = createWorkbenchState(SKETCH, EVALUATION);

      // Assert
      expect(state.sketch).toBe(SKETCH);
      expect(state.evaluation).toBe(EVALUATION);
    });
  });

  describe("openTarget", () => {
    it("should put the config in focus and select the tab of the node", () => {
      // Act
      const state = openTarget(createState(), { kind: "config" });

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
    });

    it("should put a file in focus and select the tab of the node", () => {
      // Act
      const state = openTarget(createState(), {
        kind: "file",
        path: "src/index.js",
      });

      // Assert
      expect(state.focus).toEqual(INDEX_FOCUS);
      expect(state.tab).toBe("node");
    });

    it("should select the tab of the node even when the user had selected the sketch's", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "sketch" });

      // Act
      const state = openTarget(before, {
        kind: "file",
        path: "src/helpers/format.js",
      });

      // Assert
      expect(state.focus).toEqual(FORMAT_FOCUS);
      expect(state.tab).toBe("node");
    });

    it("should replace the focus of another file", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const state = openTarget(before, { kind: "file", path: "main.js" });

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "main.js" });
    });

    it("should put a file in focus when the config was", () => {
      // Arrange
      const before = createState({ focus: { kind: "config" }, tab: "node" });

      // Act
      const state = openTarget(before, { kind: "file", path: "main.js" });

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "main.js" });
    });

    it("should keep the same focus object when the file already is in focus", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const state = openTarget(before, { kind: "file", path: "src/index.js" });

      // Assert
      expect(state.focus).toBe(INDEX_FOCUS);
    });

    it("should leave the problems panel as it is", () => {
      // Arrange
      const before = createState({ problemsCollapsed: true });

      // Act
      const state = openTarget(before, { kind: "config" });

      // Assert
      expect(state.problemsCollapsed).toBe(true);
    });

    it("should leave the sketch, the view and the rename as they are", () => {
      // Arrange
      const before = createState({ view: "text", renaming: "main.js" });

      // Act
      const state = openTarget(before, { kind: "config" });

      // Assert
      expect(state.sketch).toBe(SKETCH);
      expect(state.view).toBe("text");
      expect(state.renaming).toBe("main.js");
    });

    it("should ask to show the range of a config target with the first key", () => {
      // Act
      const state = openTarget(createState(), {
        kind: "config",
        range: RANGE,
      });

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.reveal).toEqual({ range: RANGE, key: 1 });
      expect(state.revealCount).toBe(1);
    });

    it("should use a new key for each request, even for the same range", () => {
      // Arrange
      const first = openTarget(createState(), { kind: "config", range: RANGE });

      // Act
      const second = openTarget(first, { kind: "config", range: RANGE });
      const third = openTarget(second, { kind: "config", range: OTHER_RANGE });

      // Assert
      expect(second.reveal).toEqual({ range: RANGE, key: 2 });
      expect(third.reveal).toEqual({ range: OTHER_RANGE, key: 3 });
      expect(third.revealCount).toBe(3);
    });

    it("should not use a key again after the request was dropped", () => {
      // Arrange
      const first = openTarget(createState(), { kind: "config", range: RANGE });
      const left = openTarget(first, { kind: "file", path: "main.js" });

      // Act
      const again = openTarget(left, { kind: "config", range: RANGE });

      // Assert
      expect(left.reveal).toBeUndefined();
      expect(again.reveal?.key).toBe(2);
    });

    it("should keep the previous request when the config is opened without a range", () => {
      // Arrange
      const revealed = openTarget(createState(), {
        kind: "config",
        range: RANGE,
      });

      // Act
      const state = openTarget(revealed, { kind: "config" });

      // Assert
      expect(state.reveal).toBe(revealed.reveal);
      expect(state.revealCount).toBe(1);
    });

    it("should have no request when the config is opened without a range and nothing was asked", () => {
      // Act
      const state = openTarget(createState(), { kind: "config" });

      // Assert
      expect(state.reveal).toBeUndefined();
      expect(state.revealCount).toBe(0);
    });

    it("should drop the request when a file is opened, because it belongs to the config", () => {
      // Arrange
      const revealed = openTarget(createState(), {
        kind: "config",
        range: RANGE,
      });

      // Act
      const state = openTarget(revealed, { kind: "file", path: "main.js" });

      // Assert
      expect(state.reveal).toBeUndefined();
      expect(state.revealCount).toBe(1);
    });

    it("should drop the folder the user selected, whatever the target", () => {
      // Arrange
      const before = createState({ pickedFolder: "docs" });

      // Act
      const config = openTarget(before, { kind: "config" });
      const file = openTarget(before, { kind: "file", path: "main.js" });

      // Assert
      expect(config.pickedFolder).toBeUndefined();
      expect(file.pickedFolder).toBeUndefined();
    });

    it("should open the closed folders above a file and no others", () => {
      // Arrange
      const before = createState({
        closedFolders: new Set(["src", "src/helpers", "docs"]),
      });

      // Act
      const state = openTarget(before, {
        kind: "file",
        path: "src/helpers/format.js",
      });

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
      expect(Array.from(before.closedFolders)).toEqual([
        "src",
        "src/helpers",
        "docs",
      ]);
    });

    it("should keep the same set of closed folders when none is above the file", () => {
      // Arrange
      const before = createState({ closedFolders: new Set(["docs"]) });

      // Act
      const state = openTarget(before, { kind: "file", path: "src/index.js" });

      // Assert
      expect(state.closedFolders).toBe(before.closedFolders);
    });

    it("should keep the same set of closed folders when the file is at the root", () => {
      // Arrange
      const before = createState({ closedFolders: new Set(["src"]) });

      // Act
      const state = openTarget(before, { kind: "file", path: "main.js" });

      // Assert
      expect(state.closedFolders).toBe(before.closedFolders);
    });

    it("should leave the closed folders alone when the config is opened", () => {
      // Arrange
      const before = createState({ closedFolders: new Set(["src"]) });

      // Act
      const state = openTarget(before, { kind: "config" });

      // Assert
      expect(state.closedFolders).toBe(before.closedFolders);
    });
  });

  describe("selectItem", () => {
    it("should open the config when the item is the config node", () => {
      // Act
      const state = selectItem(createState(), "eslint.config.js");

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
    });

    it("should open a file when the item is a file", () => {
      // Arrange
      const before = createState({ pickedFolder: "docs" });

      // Act
      const state = selectItem(before, "src/helpers/format.js");

      // Assert
      expect(state.focus).toEqual(FORMAT_FOCUS);
      expect(state.tab).toBe("node");
      expect(state.pickedFolder).toBeUndefined();
    });

    it("should only select a folder, and leave the focus and the tab as they are", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "sketch" });

      // Act
      const state = selectItem(before, "docs");

      // Assert
      expect(state.pickedFolder).toBe("docs");
      expect(state.focus).toBe(INDEX_FOCUS);
      expect(state.tab).toBe("sketch");
    });

    it("should select a folder that the files under it imply", () => {
      // Act
      const state = selectItem(createState(), "src");

      // Assert
      expect(state.pickedFolder).toBe("src");
    });

    it("should replace the folder that was selected", () => {
      // Arrange
      const before = createState({ pickedFolder: "docs" });

      // Act
      const state = selectItem(before, "src");

      // Assert
      expect(state.pickedFolder).toBe("src");
    });

    it("should return the same state when the folder already is selected", () => {
      // Arrange
      const before = createState({ pickedFolder: "docs" });

      // Act
      const state = selectItem(before, "docs");

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("toggleFolder", () => {
    it("should remember that an open folder was closed", () => {
      // Act
      const state = toggleFolder(createState(), "src", false);

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["src"]);
    });

    it("should forget that a closed folder was closed when it opens", () => {
      // Arrange
      const before = createState({ closedFolders: new Set(["src", "docs"]) });

      // Act
      const state = toggleFolder(before, "src", true);

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
      expect(Array.from(before.closedFolders)).toEqual(["src", "docs"]);
    });

    it("should return the same state when an open folder is opened", () => {
      // Arrange
      const before = createState();

      // Act
      const state = toggleFolder(before, "src", true);

      // Assert
      expect(state).toBe(before);
    });

    it("should return the same state when a closed folder is closed", () => {
      // Arrange
      const before = createState({ closedFolders: new Set(["src"]) });

      // Act
      const state = toggleFolder(before, "src", false);

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("setView", () => {
    it("should change how the project is shown", () => {
      // Act
      const state = setView(createState(), "text");

      // Assert
      expect(state.view).toBe("text");
    });

    it("should drop the lines that were not read when text mode is left", () => {
      // Arrange
      const before = createState({ view: "text", textDraft: "main.js\n" });

      // Act
      const state = setView(before, "tree");

      // Assert
      expect(state.view).toBe("tree");
      expect(state.textDraft).toBeUndefined();
    });

    it("should return the same state when the view already is the one asked", () => {
      // Arrange
      const before = createState({ view: "text", textDraft: "main.js\n" });

      // Act
      const state = setView(before, "text");

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("addNode", () => {
    it("should add a file at the root when nothing is in focus or selected", () => {
      // Act
      const state = addNode(createState(), "file");

      // Assert
      expect(getPaths(state)).toContain("new-file.js");
    });

    it("should add a folder at the root when nothing is in focus or selected", () => {
      // Act
      const state = addNode(createState(), "folder");

      // Assert
      expect(state.sketch.tree).toContainEqual({
        path: "new-folder",
        kind: "folder",
      });
    });

    it("should add the node in the folder the user selected", () => {
      // Arrange
      const before = createState({ pickedFolder: "src/helpers" });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(getPaths(state)).toContain("src/helpers/new-file.js");
    });

    it("should prefer the selected folder to the folder of the open file", () => {
      // Arrange
      const before = createState({
        focus: INDEX_FOCUS,
        tab: "node",
        pickedFolder: "docs",
      });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(getPaths(state)).toContain("docs/new-file.js");
    });

    it("should add the node in the folder of the open file", () => {
      // Arrange
      const before = createState({ focus: FORMAT_FOCUS, tab: "node" });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(getPaths(state)).toContain("src/helpers/new-file.js");
    });

    it("should add the node at the root when the open file is at the root", () => {
      // Arrange
      const before = createState({
        focus: { kind: "file", path: "main.js" },
        tab: "node",
      });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(getPaths(state)).toContain("new-file.js");
    });

    it("should add the node at the root when the config is in focus", () => {
      // Arrange
      const before = createState({ focus: { kind: "config" }, tab: "node" });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(getPaths(state)).toContain("new-file.js");
    });

    it.each([
      ["gone", "a folder that is gone"],
      ["main.js", "a file"],
    ])(
      "should ignore the selected folder %s, which is %s, and use the folder of the open file",
      (pickedFolder) => {
        // Arrange
        const before = createState({
          focus: INDEX_FOCUS,
          tab: "node",
          pickedFolder,
        });

        // Act
        const state = addNode(before, "file");

        // Assert
        expect(getPaths(state)).toContain("src/new-file.js");
      }
    );

    it("should ignore a selected folder that is gone when nothing is open", () => {
      // Arrange
      const before = createState({ pickedFolder: "gone" });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(getPaths(state)).toContain("new-file.js");
    });

    it("should give a free name to a node added where another was added", () => {
      // Arrange
      const first = addNode(createState(), "file");

      // Act
      const state = addNode(first, "file");

      // Assert
      expect(getPaths(state)).toEqual(
        expect.arrayContaining(["new-file.js", "new-file-2.js"])
      );
    });

    it("should start renaming the new node", () => {
      // Arrange
      const before = createState({ pickedFolder: "src" });

      // Act
      const file = addNode(before, "file");
      const folder = addNode(before, "folder");

      // Assert
      expect(file.renaming).toBe("src/new-file.js");
      expect(folder.renaming).toBe("src/new-folder");
    });

    it("should switch to the tree and drop the text draft, because text mode has no row to rename in", () => {
      // Arrange
      const before = createState({ view: "text", textDraft: "main.js\n" });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(state.view).toBe("tree");
      expect(state.textDraft).toBeUndefined();
      expect(state.renaming).toBe("new-file.js");
    });

    it("should open a new file", () => {
      // Arrange
      const before = createState({ pickedFolder: "src" });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "src/new-file.js" });
      expect(state.tab).toBe("node");
      expect(state.pickedFolder).toBeUndefined();
    });

    it("should select a new folder and leave the focus and the tab as they are", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "sketch" });

      // Act
      const state = addNode(before, "folder");

      // Assert
      expect(state.pickedFolder).toBe("src/new-folder");
      expect(state.focus).toBe(INDEX_FOCUS);
      expect(state.tab).toBe("sketch");
    });

    it("should open the closed folders above a new file", () => {
      // Arrange
      const before = createState({
        pickedFolder: "src/helpers",
        closedFolders: new Set(["src", "src/helpers", "docs"]),
      });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
    });

    it("should open the closed folders above a new folder", () => {
      // Arrange
      const before = createState({
        pickedFolder: "src/helpers",
        closedFolders: new Set(["src", "src/helpers", "docs"]),
      });

      // Act
      const state = addNode(before, "folder");

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
    });

    it("should keep the same set of closed folders when none is above a new folder", () => {
      // Arrange
      const before = createState({ closedFolders: new Set(["docs"]) });

      // Act
      const state = addNode(before, "folder");

      // Assert
      expect(state.closedFolders).toBe(before.closedFolders);
    });

    it("should replace a rename that was going on", () => {
      // Arrange
      const before = createState({ renaming: "main.js" });

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(state.renaming).toBe("new-file.js");
    });
  });

  describe("startRename", () => {
    it("should start renaming a node", () => {
      // Act
      const state = startRename(createState(), "main.js");

      // Assert
      expect(state.renaming).toBe("main.js");
    });

    it("should replace the node that was being renamed", () => {
      // Arrange
      const before = createState({ renaming: "main.js" });

      // Act
      const state = startRename(before, "src");

      // Assert
      expect(state.renaming).toBe("src");
    });

    it("should return the same state when the node already is being renamed", () => {
      // Arrange
      const before = createState({ renaming: "main.js" });

      // Act
      const state = startRename(before, "main.js");

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("cancelRename", () => {
    it("should give up renaming", () => {
      // Arrange
      const before = createState({ renaming: "main.js" });

      // Act
      const state = cancelRename(before);

      // Assert
      expect(state.renaming).toBeUndefined();
    });

    it("should return the same state when nothing is being renamed", () => {
      // Arrange
      const before = createState();

      // Act
      const state = cancelRename(before);

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("renameNode", () => {
    it("should rename the node in its folder and give its new path", () => {
      // Arrange
      const before = createState({ renaming: "src/index.js" });

      // Act
      const { state, path } = getRenamed(
        renameNode(before, "src/index.js", "app.js")
      );

      // Assert
      expect(path).toBe("src/app.js");
      expect(getPaths(state)).toContain("src/app.js");
      expect(getPaths(state)).not.toContain("src/index.js");
    });

    it("should end the rename", () => {
      // Arrange
      const before = createState({ renaming: "src/index.js" });

      // Act
      const { state } = getRenamed(
        renameNode(before, "src/index.js", "app.js")
      );

      // Assert
      expect(state.renaming).toBeUndefined();
    });

    it("should refuse a name that is not a valid path and say why", () => {
      // Arrange
      const before = createState({ renaming: "src/index.js" });

      // Act
      const result = renameNode(before, "src/index.js", "../main.js");

      // Assert
      expect(result).toEqual({
        error: "The path cannot have `.` or `..` segments.",
      });
    });

    it("should refuse an empty name", () => {
      // Arrange
      const before = createState({ renaming: "main.js" });

      // Act
      const result = renameNode(before, "main.js", "  ");

      // Assert
      expect(result).toEqual({ error: "The path is empty." });
    });

    it("should refuse a name that another file has", () => {
      // Arrange
      const before = createState({ renaming: "src/index.js" });

      // Act
      const result = renameNode(before, "src/index.js", "helpers/format.js");

      // Assert
      expect(result).toEqual({ error: "That path already exists." });
    });

    it("should refuse a name that a folder has", () => {
      // Arrange
      const before = createState({ renaming: "src/index.js" });

      // Act
      const result = renameNode(before, "src/index.js", "helpers");

      // Assert
      expect(result).toEqual({
        error: "A folder already exists at that path.",
      });
    });

    it("should refuse to rename a node that is not there", () => {
      // Act
      const result = renameNode(createState(), "gone.js", "other.js");

      // Assert
      expect(result).toEqual({
        error: "There is no file or folder at that path.",
      });
    });

    it("should move the file in focus with the node", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const { state } = getRenamed(
        renameNode(before, "src/index.js", "app.js")
      );

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "src/app.js" });
    });

    it("should move the file in focus when the folder above it is renamed", () => {
      // Arrange
      const before = createState({ focus: FORMAT_FOCUS, tab: "node" });

      // Act
      const { state } = getRenamed(renameNode(before, "src", "lib"));

      // Assert
      expect(state.focus).toEqual({
        kind: "file",
        path: "lib/helpers/format.js",
      });
    });

    it.each<[string, Focus]>([
      ["a file outside the node", { kind: "file", path: "main.js" }],
      ["the config", { kind: "config" }],
      ["nothing", { kind: "none" }],
    ])("should keep the same focus when %s is in focus", (_case, openNode) => {
      // Arrange
      const before = createState({ focus: openNode, tab: "node" });

      // Act
      const { state } = getRenamed(renameNode(before, "src", "lib"));

      // Assert
      expect(state.focus).toBe(openNode);
    });

    it("should keep the tab as it was when the open file is renamed while the sketch tab is selected", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "sketch" });

      // Act
      const { state } = getRenamed(
        renameNode(before, "src/index.js", "app.js")
      );

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "src/app.js" });
      expect(state.tab).toBe("sketch");
    });

    it("should keep the tab of the node as it was", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const { state } = getRenamed(
        renameNode(before, "src/index.js", "app.js")
      );

      // Assert
      expect(state.tab).toBe("node");
    });

    it("should leave the panel and the view as they are", () => {
      // Arrange
      const before = createState({ problemsCollapsed: true, view: "text" });

      // Act
      const { state } = getRenamed(renameNode(before, "main.js", "app.js"));

      // Assert
      expect(state.problemsCollapsed).toBe(true);
      expect(state.view).toBe("text");
    });

    it("should move the folder the user selected with the folder above it", () => {
      // Arrange
      const before = createState({ pickedFolder: "src/helpers" });

      // Act
      const { state } = getRenamed(renameNode(before, "src", "lib"));

      // Assert
      expect(state.pickedFolder).toBe("lib/helpers");
    });

    it("should move the folder the user selected when it is the one renamed", () => {
      // Arrange
      const before = createState({ pickedFolder: "docs" });

      // Act
      const { state } = getRenamed(renameNode(before, "docs", "guides"));

      // Assert
      expect(state.pickedFolder).toBe("guides");
    });

    it("should keep the folder the user selected when it is outside the node", () => {
      // Arrange
      const before = createState({ pickedFolder: "docs" });

      // Act
      const { state } = getRenamed(renameNode(before, "src", "lib"));

      // Assert
      expect(state.pickedFolder).toBe("docs");
    });

    it("should keep no folder selected when none was", () => {
      // Act
      const { state } = getRenamed(renameNode(createState(), "src", "lib"));

      // Assert
      expect(state.pickedFolder).toBeUndefined();
    });

    it("should move the closed folders inside the renamed folder and keep the others", () => {
      // Arrange
      const before = createState({
        closedFolders: new Set(["src/helpers", "docs"]),
      });

      // Act
      const { state } = getRenamed(renameNode(before, "src", "lib"));

      // Assert
      expect(
        Array.from(state.closedFolders).sort((a, b) => a.localeCompare(b))
      ).toEqual(["docs", "lib/helpers"]);
    });

    it("should keep a renamed folder closed", () => {
      // Arrange
      const before = createState({ closedFolders: new Set(["src"]) });

      // Act
      const { state } = getRenamed(renameNode(before, "src", "lib"));

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["lib"]);
    });

    it("should open the closed folder that the node moves into", () => {
      // Arrange
      const before = createState({
        closedFolders: new Set(["docs", "src"]),
      });

      // Act
      const { state, path } = getRenamed(
        renameNode(before, "main.js", "docs/main.js")
      );

      // Assert
      expect(path).toBe("docs/main.js");
      expect(Array.from(state.closedFolders)).toEqual(["src"]);
    });

    it("should open every closed folder above the new path", () => {
      // Arrange
      const before = createState({
        closedFolders: new Set(["src", "src/helpers"]),
      });

      // Act
      const { state } = getRenamed(
        renameNode(before, "main.js", "src/helpers/main.js")
      );

      // Assert
      expect(state.closedFolders.size).toBe(0);
    });

    it("should end the rename with the same sketch when the name does not change", () => {
      // Arrange
      const before = createState({ renaming: "src/index.js" });

      // Act
      const { state, path } = getRenamed(
        renameNode(before, "src/index.js", "index.js")
      );

      // Assert
      expect(path).toBe("src/index.js");
      expect(state.sketch).toBe(before.sketch);
      expect(state.renaming).toBeUndefined();
    });
  });

  describe("removeNode", () => {
    it("should remove the node and everything under it", () => {
      // Act
      const state = removeNode(createState(), "src");

      // Assert
      expect(getPaths(state)).toEqual(["docs", "main.js"]);
    });

    it("should leave nothing in focus and the sketch tab when the file in focus is removed", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const state = removeNode(before, "src/index.js");

      // Assert
      expect(state.focus).toEqual({ kind: "none" });
      expect(state.tab).toBe("sketch");
    });

    it("should leave nothing in focus when the file in focus is inside the folder removed", () => {
      // Arrange
      const before = createState({ focus: FORMAT_FOCUS, tab: "node" });

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.focus).toEqual({ kind: "none" });
      expect(state.tab).toBe("sketch");
    });

    it("should keep the focus and the tab when the file in focus is outside the node", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const state = removeNode(before, "src/helpers");

      // Assert
      expect(state.focus).toBe(INDEX_FOCUS);
      expect(state.tab).toBe("node");
    });

    it("should keep the config in focus, with its range to reveal", () => {
      // Arrange
      const before = createState({
        focus: { kind: "config" },
        tab: "node",
        reveal: { range: RANGE, key: 1 },
        revealCount: 1,
      });

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.reveal).toBe(before.reveal);
    });

    it("should keep nothing in focus as it was", () => {
      // Arrange
      const before = createState();

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.focus).toBe(before.focus);
      expect(state.tab).toBe("sketch");
    });

    it.each([
      ["the folder removed", "src"],
      ["a folder inside it", "src/helpers"],
    ])("should drop the selection of %s", (_case, pickedFolder) => {
      // Arrange
      const before = createState({ pickedFolder });

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.pickedFolder).toBeUndefined();
    });

    it("should keep the selection of a folder outside the node", () => {
      // Arrange
      const before = createState({ pickedFolder: "docs" });

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.pickedFolder).toBe("docs");
    });

    it("should drop the rename of a node inside the one removed", () => {
      // Arrange
      const before = createState({ renaming: "src/index.js" });

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.renaming).toBeUndefined();
    });

    it("should keep the rename of a node outside the one removed", () => {
      // Arrange
      const before = createState({ renaming: "main.js" });

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.renaming).toBe("main.js");
    });

    it("should drop the closed folders inside the node and keep the others", () => {
      // Arrange
      const before = createState({
        closedFolders: new Set(["src", "src/helpers", "docs"]),
      });

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
    });

    it("should return the same state when there is no node at the path", () => {
      // Arrange
      const before = createState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const state = removeNode(before, "gone.js");

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("changeConfig", () => {
    it("should replace the config and keep the tree of the sketch", () => {
      // Arrange
      const before = createState();

      // Act
      const state = changeConfig(before, "{ settings: { a: 1 }, rules: {} }");

      // Assert
      expect(state.sketch).toEqual({
        ...SKETCH,
        config: "{ settings: { a: 1 }, rules: {} }",
      });
      expect(state.sketch.tree).toBe(before.sketch.tree);
    });

    it("should keep the evaluation, which the store replaces", () => {
      // Act
      const state = changeConfig(createState(), "{}");

      // Assert
      expect(state.evaluation).toBe(EVALUATION);
    });

    it("should return the same state when the text does not change", () => {
      // Arrange
      const before = createState();

      // Act
      const state = changeConfig(before, SKETCH.config);

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("setTextDraft", () => {
    it("should keep what the user typed", () => {
      // Act
      const state = setTextDraft(createState(), "main.js\nsrc/new.js\n");

      // Assert
      expect(state.textDraft).toBe("main.js\nsrc/new.js\n");
    });

    it("should replace the draft", () => {
      // Arrange
      const before = createState({ textDraft: "main.js\n" });

      // Act
      const state = setTextDraft(before, "other.js\n");

      // Assert
      expect(state.textDraft).toBe("other.js\n");
    });

    it("should return the same state when the draft does not change", () => {
      // Arrange
      const before = createState({ textDraft: "main.js\n" });

      // Act
      const state = setTextDraft(before, "main.js\n");

      // Assert
      expect(state).toBe(before);
    });
  });

  describe.each([
    ["readText", readText],
    ["settleText", settleText],
  ])("%s as a reader of the draft", (_name, read) => {
    it("should return the same state when there is no draft", () => {
      // Arrange
      const before = createState({ view: "text" });

      // Act
      const state = read(before);

      // Assert
      expect(state).toBe(before);
    });

    it("should read the lines into the sketch, in the order of the tree", () => {
      // Arrange
      const before = createState({
        view: "text",
        textDraft: "src/index.js\nmain.js\nsrc/new.js\n",
      });

      // Act
      const state = read(before);

      // Assert
      expect(getPaths(state)).toEqual([
        "src/index.js",
        "src/new.js",
        "main.js",
      ]);
      expect(state.sketch.config).toBe(SKETCH.config);
    });

    it("should leave out the lines that cannot be read", () => {
      // Arrange
      const before = createState({
        view: "text",
        textDraft: "main.js\n  import bad\nsrc/new.js\n",
      });

      // Act
      const state = read(before);

      // Assert
      expect(getPaths(state)).toEqual(["src/new.js", "main.js"]);
    });

    it("should keep the same sketch when the lines are the same project in another order", () => {
      // Arrange
      const before = createState({
        view: "text",
        textDraft: "main.js\nsrc/index.js\nsrc/helpers/format.js\ndocs/\n",
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.sketch).toBe(SKETCH);
    });

    it("should keep the focus on a file that the lines still have", () => {
      // Arrange
      const before = createState({
        focus: INDEX_FOCUS,
        tab: "node",
        view: "text",
        textDraft: "src/index.js\nmain.js\n",
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toBe(INDEX_FOCUS);
      expect(state.tab).toBe("node");
    });

    it("should leave nothing in focus when the line of the file in focus is gone", () => {
      // Arrange
      const before = createState({
        focus: INDEX_FOCUS,
        tab: "node",
        view: "text",
        textDraft: "main.js\n",
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toEqual({ kind: "none" });
      expect(state.tab).toBe("sketch");
      expect(state.reveal).toBeUndefined();
    });

    it("should not take a folder with the path of the file in focus for the file", () => {
      // Arrange
      const before = createState({
        focus: INDEX_FOCUS,
        tab: "node",
        view: "text",
        textDraft: "src/index.js/inner.js\n",
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toEqual({ kind: "none" });
    });

    it("should keep the config in focus whatever the lines are", () => {
      // Arrange
      const before = createState({
        focus: { kind: "config" },
        tab: "node",
        view: "text",
        textDraft: "main.js\n",
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
    });

    it("should return the same state for the draft of the same project that has a line to fix", () => {
      // Arrange
      const before = createState({
        view: "text",
        textDraft: `${toText(SKETCH)}  import bad\n`,
      });

      // Act
      const state = read(before);

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("readText", () => {
    it("should keep the draft when every line was read", () => {
      // Arrange
      const before = createState({
        view: "text",
        textDraft: "main.js\nsrc/new.js\n",
      });

      // Act
      const state = readText(before);

      // Assert
      expect(state.textDraft).toBe("main.js\nsrc/new.js\n");
    });

    it("should return the same state for the draft of the same project", () => {
      // Arrange
      const before = createState({ view: "text", textDraft: toText(SKETCH) });

      // Act
      const state = readText(before);

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("settleText", () => {
    it("should drop the draft when every line was read", () => {
      // Arrange
      const before = createState({
        view: "text",
        textDraft: "main.js\nsrc/new.js\n",
      });

      // Act
      const state = settleText(before);

      // Assert
      expect(state.textDraft).toBeUndefined();
      expect(getPaths(state)).toEqual(["src/new.js", "main.js"]);
    });

    it("should drop the draft of the same project and keep its sketch", () => {
      // Arrange
      const before = createState({ view: "text", textDraft: toText(SKETCH) });

      // Act
      const state = settleText(before);

      // Assert
      expect(state.textDraft).toBeUndefined();
      expect(state.sketch).toBe(SKETCH);
    });

    it("should keep the draft of a line that cannot be read, so that the user can fix it", () => {
      // Arrange
      const draft = "main.js\n  import bad\n";
      const before = createState({ view: "text", textDraft: draft });

      // Act
      const state = settleText(before);

      // Assert
      expect(state.textDraft).toBe(draft);
      expect(getPaths(state)).toEqual(["main.js"]);
    });
  });

  describe("selectTab", () => {
    it("should select the tab", () => {
      // Arrange
      const before = createState({ focus: { kind: "config" }, tab: "node" });

      // Act
      const state = selectTab(before, "sketch");

      // Assert
      expect(state.tab).toBe("sketch");
    });

    it("should expand the panel, because a tab is pressed to be read", () => {
      // Arrange
      const before = createState({ problemsCollapsed: true });

      // Act
      const state = selectTab(before, "node");

      // Assert
      expect(state.tab).toBe("node");
      expect(state.problemsCollapsed).toBe(false);
    });

    it("should expand the panel when the tab already is the selected one", () => {
      // Arrange
      const before = createState({ problemsCollapsed: true, tab: "sketch" });

      // Act
      const state = selectTab(before, "sketch");

      // Assert
      expect(state.problemsCollapsed).toBe(false);
    });

    it("should return the same state when the tab already is the selected one and the panel is open", () => {
      // Arrange
      const before = createState({ tab: "sketch" });

      // Act
      const state = selectTab(before, "sketch");

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("setProblemsCollapsed", () => {
    it("should collapse the panel", () => {
      // Act
      const state = setProblemsCollapsed(createState(), true);

      // Assert
      expect(state.problemsCollapsed).toBe(true);
    });

    it("should expand the panel", () => {
      // Arrange
      const before = createState({ problemsCollapsed: true });

      // Act
      const state = setProblemsCollapsed(before, false);

      // Assert
      expect(state.problemsCollapsed).toBe(false);
    });

    it("should return the same state when the panel already is as asked", () => {
      // Arrange
      const before = createState({ problemsCollapsed: true });

      // Act
      const state = setProblemsCollapsed(before, true);

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("setEvaluation", () => {
    it("should keep a new evaluation", () => {
      // Arrange
      const evaluation = createEngine().evaluate({ ...SKETCH, config: "{}" });

      // Act
      const state = setEvaluation(createState(), evaluation);

      // Assert
      expect(state.evaluation).toBe(evaluation);
    });

    it("should return the same state when the evaluation is the one it has", () => {
      // Arrange
      const before = createState();

      // Act
      const state = setEvaluation(before, EVALUATION);

      // Assert
      expect(state).toBe(before);
    });
  });
});
