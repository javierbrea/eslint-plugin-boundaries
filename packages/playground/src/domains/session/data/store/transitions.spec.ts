import type { ProjectCapabilities, Sketch, SketchDependency } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type {
  Evaluation,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import { toText } from "@/domains/project/helpers/sketch";
import type { Focus } from "@/domains/session/helpers/focus";

import type { SessionState } from "./sessionState.types";
import { ALL_CAPABILITIES } from "./store.mock";
import {
  addDependency,
  addNode,
  cancelRename,
  changeConfig,
  closeNode,
  createSessionState,
  openTarget,
  readText,
  removeDependency,
  removeNode,
  renameNode,
  replaceDependency,
  selectItem,
  selectTab,
  setEvaluation,
  setProblemsCollapsed,
  setTextDraft,
  setView,
  settleText,
  startRename,
  toggleFolder,
} from "./transitions";
import type { RenameTransition } from "./transitions.types";

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

/** What the user has after the file that was open is removed: nothing in focus, and the tab of the sketch, as the removal leaves them. */
const NOTHING_OPEN: Pick<SessionState, "focus" | "tab"> = {
  focus: { kind: "none" },
  tab: "sketch",
};

/** The tree cannot be edited, and the rest can. */
const TREE_LOCKED = { ...ALL_CAPABILITIES, editTree: false };

/** The config cannot be edited, and the rest can. */
const CONFIG_LOCKED = { ...ALL_CAPABILITIES, editConfig: false };

/**
 * Creates the state of an instance whose first evaluation has arrived, as the store keeps it.
 * @param sketch The sketch.
 * @param evaluation Its evaluation.
 * @param capabilities What the user can change.
 * @returns The state.
 */
function createEvaluatedState(
  sketch: Sketch,
  evaluation: Evaluation,
  capabilities: ProjectCapabilities
): SessionState {
  return setEvaluation(
    createSessionState(sketch, capabilities),
    evaluation,
    "current"
  );
}

/**
 * Creates a session state for the sketch of the spec.
 * @param overrides What differs from the first state.
 * @returns The state.
 */
function createState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    ...createEvaluatedState(SKETCH, EVALUATION, ALL_CAPABILITIES),
    ...overrides,
  };
}

/**
 * Gets the state and the path of a rename that is not refused.
 * @param result The result of a rename.
 * @returns The state after the rename and the new path of the node.
 */
function getRenamed(result: RenameTransition): {
  state: SessionState;
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
function getPaths(state: SessionState): string[] {
  return state.sketch.tree.map((node) => node.path);
}

/**
 * Builds a value import of a file of the sketch from another one.
 * @param from The file that has the dependency.
 * @param to The file it points to.
 * @returns The dependency, a new object each time.
 */
function importOf(from: string, to: string): SketchDependency {
  return {
    from,
    target: { kind: "node", path: to },
    syntax: "import",
    importKind: "value",
    specifiers: [],
  };
}

/**
 * Builds a value import of an external module.
 * @param from The file that has the dependency.
 * @param moduleName The name of the module.
 * @param localName The default name it imports, which another import of the same file does not repeat.
 * @returns The dependency, a new object each time.
 */
function importModule(
  from: string,
  moduleName: string,
  localName = "x"
): SketchDependency {
  return {
    from,
    target: { kind: "external", name: moduleName },
    syntax: "import",
    importKind: "value",
    specifiers: [{ kind: "default", name: localName }],
  };
}

/** The dependencies of `src/index.js` are, in order, to the format helper, to `react` and to `main.js`; `main.js` has one to `src/index.js` */
const DEPENDENCIES: readonly SketchDependency[] = [
  importOf("src/index.js", "src/helpers/format.js"),
  importModule("src/index.js", "react"),
  importOf("src/index.js", "main.js"),
  importOf("main.js", "src/index.js"),
];

const DEPENDENCY_SKETCH: Sketch = { ...SKETCH, dependencies: DEPENDENCIES };

const DEPENDENCY_EVALUATION: Evaluation =
  createEngine().evaluate(DEPENDENCY_SKETCH);

/**
 * Creates a session state for the sketch with dependencies.
 * @param overrides What differs from the first state.
 * @returns The state.
 */
function createDependencyState(
  overrides: Partial<SessionState> = {}
): SessionState {
  return {
    ...createEvaluatedState(
      DEPENDENCY_SKETCH,
      DEPENDENCY_EVALUATION,
      ALL_CAPABILITIES
    ),
    ...overrides,
  };
}

/**
 * Builds the focus on a dependency of the sketch with dependencies.
 * @param path The file of the dependency.
 * @param index Its position among the dependencies of the file.
 * @returns The focus.
 */
function onDependency(path: string, index: number): Focus {
  return { kind: "dependency", path, index };
}

/**
 * Gets what the dependencies of a state point to, to tell which one is which after an edit.
 * @param state The state.
 * @returns For each dependency of the sketch, its file and where it points to, as `from -> to`.
 */
function getEdges(state: SessionState): string[] {
  return state.sketch.dependencies.map(
    ({ from, target }) =>
      `${from} -> ${target.kind === "node" ? target.path : target.name}`
  );
}

describe("Transitions", () => {
  describe("createSessionState", () => {
    it("should start with the config in focus, the tree with every folder open and the sketch tab, and the evaluation on its way", () => {
      // Act
      const state = createSessionState(SKETCH, ALL_CAPABILITIES);

      // Assert
      expect(state).toEqual({
        sketch: SKETCH,
        evaluation: undefined,
        evaluationStatus: "pending",
        capabilities: ALL_CAPABILITIES,
        focus: { kind: "config" },
        tab: "sketch",
        problemsCollapsed: false,
        reveal: undefined,
        highlight: undefined,
        revealCount: 0,
        view: "tree",
        textDraft: undefined,
        pickedFolder: undefined,
        closedFolders: new Set(),
        renaming: undefined,
      });
    });

    it("should keep the sketch and the capabilities it is given", () => {
      // Act
      const state = createSessionState(SKETCH, TREE_LOCKED);

      // Assert
      expect(state.sketch).toBe(SKETCH);
      expect(state.capabilities).toBe(TREE_LOCKED);
    });
  });

  describe("openTarget", () => {
    it("should put the config in focus and select the tab of the node", () => {
      // Arrange
      const before = createState(NOTHING_OPEN);

      // Act
      const state = openTarget(before, { kind: "config" });

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
      // Arrange
      const before = createState(NOTHING_OPEN);

      // Act
      const state = openTarget(before, {
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

  describe("closeNode", () => {
    it("should leave nothing in focus and select the tab of the sketch, and drop the range to reveal and the highlight of the config", () => {
      // Arrange
      const before = openTarget(createState(), {
        kind: "config",
        range: RANGE,
        policy: 0,
        dependency: { path: "src/index.js", index: 0 },
      });

      // Act
      const state = closeNode(before);

      // Assert
      expect(before.reveal).toEqual({ range: RANGE, key: 1 });
      expect(before.highlight).toBeDefined();
      expect(state).toMatchObject(NOTHING_OPEN);
      expect(state.reveal).toBeUndefined();
      expect(state.highlight).toBeUndefined();
    });

    it.each<[string, Pick<SessionState, "focus" | "tab">]>([
      ["a file", { focus: INDEX_FOCUS, tab: "node" }],
      [
        "a dependency",
        {
          focus: { kind: "dependency", path: "src/index.js", index: 0 },
          tab: "dependency",
        },
      ],
    ])("should leave nothing in focus when %s is open", (_name, opened) => {
      // Arrange
      const before = createState(opened);

      // Act
      const state = closeNode(before);

      // Assert
      expect(state).toMatchObject(NOTHING_OPEN);
    });

    it("should keep the folder the user selected and the count of the ranges revealed, so that the next one is revealed again", () => {
      // Arrange
      const before = createState({
        focus: INDEX_FOCUS,
        tab: "node",
        pickedFolder: "docs",
        revealCount: 3,
      });

      // Act
      const state = closeNode(before);

      // Assert
      expect(state.pickedFolder).toBe("docs");
      expect(state.revealCount).toBe(3);
    });

    it("should return the same state when nothing is in focus", () => {
      // Arrange
      const before = createState(NOTHING_OPEN);

      // Act
      const state = closeNode(before);

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("selectItem", () => {
    it("should open the config when the item is the config node", () => {
      // Arrange
      const before = createState(NOTHING_OPEN);

      // Act
      const state = selectItem(before, "eslint.config.js");

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
    it.each(["file", "folder"] as const)(
      "should return the same state for a %s without editTree",
      (kind) => {
        // Arrange
        const before = createState({ capabilities: TREE_LOCKED });

        // Act
        const state = addNode(before, kind);

        // Assert
        expect(state).toBe(before);
      }
    );

    it("should add the node without editConfig", () => {
      // Act
      const state = addNode(
        createState({ capabilities: CONFIG_LOCKED }),
        "file"
      );

      // Assert
      expect(getPaths(state)).toContain("new-file.js");
    });

    it("should add a file at the root when nothing is in focus or selected", () => {
      // Arrange
      const before = createState(NOTHING_OPEN);

      // Act
      const state = addNode(before, "file");

      // Assert
      expect(getPaths(state)).toContain("new-file.js");
    });

    it("should add a folder at the root when nothing is in focus or selected", () => {
      // Arrange
      const before = createState(NOTHING_OPEN);

      // Act
      const state = addNode(before, "folder");

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

    it("should add the node in the folder of the file whose dependency is in focus", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 0),
        tab: "dependency",
      });

      // Act
      const file = addNode(before, "file");
      const folder = addNode(before, "folder");

      // Assert
      expect(getPaths(file)).toContain("src/new-file.js");
      expect(getPaths(folder)).toContain("src/new-folder");
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
      const before = createState({ ...NOTHING_OPEN, pickedFolder: "gone" });

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

    describe("in a folder asked for", () => {
      it("should add the node in that folder, before the selected one and the one of the open file", () => {
        // Arrange
        const before = createState({
          focus: INDEX_FOCUS,
          tab: "node",
          pickedFolder: "docs",
        });

        // Act
        const file = addNode(before, "file", "src/helpers");
        const folder = addNode(before, "folder", "src/helpers");

        // Assert
        expect(getPaths(file)).toContain("src/helpers/new-file.js");
        expect(getPaths(folder)).toContain("src/helpers/new-folder");
      });

      it("should add the node at the root for an empty folder path", () => {
        // Arrange
        const before = createState({ focus: INDEX_FOCUS, tab: "node" });

        // Act
        const state = addNode(before, "file", "");

        // Assert
        expect(getPaths(state)).toContain("new-file.js");
      });

      it("should add the node in an empty folder", () => {
        // Act
        const state = addNode(createState(), "file", "docs");

        // Assert
        expect(getPaths(state)).toContain("docs/new-file.js");
      });

      it("should start renaming the new node, open a new file and open the folders above it", () => {
        // Arrange
        const before = createState({
          closedFolders: new Set(["src", "src/helpers", "docs"]),
        });

        // Act
        const state = addNode(before, "file", "src/helpers");

        // Assert
        expect(state.renaming).toBe("src/helpers/new-file.js");
        expect(state.focus).toEqual({
          kind: "file",
          path: "src/helpers/new-file.js",
        });
        expect(Array.from(state.closedFolders)).toEqual(["docs"]);
      });

      it.each([
        ["gone", "a folder that is gone"],
        ["main.js", "a file"],
      ])("should return the same state for %s, which is %s", (folder) => {
        // Arrange
        const before = createState();

        // Act
        const state = addNode(before, "file", folder);

        // Assert
        expect(state).toBe(before);
      });

      it("should return the same state without editTree", () => {
        // Arrange
        const before = createState({ capabilities: TREE_LOCKED });

        // Act
        const state = addNode(before, "folder", "src");

        // Assert
        expect(state).toBe(before);
      });
    });
  });

  describe("startRename", () => {
    it("should return the same state without editTree", () => {
      // Arrange
      const before = createState({ capabilities: TREE_LOCKED });

      // Act
      const state = startRename(before, "src/index.js");

      // Assert
      expect(state).toBe(before);
    });

    it("should start renaming without editConfig", () => {
      // Act
      const state = startRename(
        createState({ capabilities: CONFIG_LOCKED }),
        "src/index.js"
      );

      // Assert
      expect(state.renaming).toBe("src/index.js");
    });

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
    it("should rename nothing without editTree, and give the path of the node, which keeps its name", () => {
      // Arrange
      const before = createState({
        capabilities: TREE_LOCKED,
        renaming: "src/index.js",
      });

      // Act
      const { state, path } = getRenamed(
        renameNode(before, "src/index.js", "main2.js")
      );

      // Assert
      expect(state).toBe(before);
      expect(path).toBe("src/index.js");
    });

    it("should rename the node without editConfig", () => {
      // Act
      const { path } = getRenamed(
        renameNode(
          createState({ capabilities: CONFIG_LOCKED }),
          "src/index.js",
          "main2.js"
        )
      );

      // Assert
      expect(path).toBe("src/main2.js");
    });

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
    it("should return the same state without editTree", () => {
      // Arrange
      const before = createState({ capabilities: TREE_LOCKED });

      // Act
      const state = removeNode(before, "src/index.js");

      // Assert
      expect(state).toBe(before);
    });

    it("should remove the node without editConfig", () => {
      // Act
      const state = removeNode(
        createState({ capabilities: CONFIG_LOCKED }),
        "src/index.js"
      );

      // Assert
      expect(getPaths(state)).not.toContain("src/index.js");
    });

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
      const before = createState(NOTHING_OPEN);

      // Act
      const state = removeNode(before, "src");

      // Assert
      expect(state.focus).toBe(before.focus);
      expect(state.focus).toEqual({ kind: "none" });
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
    it("should return the same state without editConfig", () => {
      // Arrange
      const before = createState({ capabilities: CONFIG_LOCKED });

      // Act
      const state = changeConfig(before, "{}");

      // Assert
      expect(state).toBe(before);
    });

    it("should replace the config without editTree", () => {
      // Act
      const state = changeConfig(
        createState({ capabilities: TREE_LOCKED }),
        "{}"
      );

      // Assert
      expect(state.sketch.config).toBe("{}");
    });

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
    it("should return the same state without editTree", () => {
      // Arrange
      const before = createState({ capabilities: TREE_LOCKED });

      // Act
      const state = setTextDraft(before, "main.js\n");

      // Assert
      expect(state).toBe(before);
    });

    it("should keep the draft without editConfig", () => {
      // Act
      const state = setTextDraft(
        createState({ capabilities: CONFIG_LOCKED }),
        "main.js\n"
      );

      // Assert
      expect(state.textDraft).toBe("main.js\n");
    });

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
      const before = createState({
        view: "text",
        textDraft: toText(SKETCH),
      });

      // Act
      const state = readText(before);

      // Assert
      expect(state).toBe(before);
    });

    describe("when the draft writes a source that names no file exactly", () => {
      /**
       * Creates a state for a sketch of TypeScript files with no dependencies, with a draft that reads one.
       * @param draft The text of the draft.
       * @returns The state, in text mode.
       */
      function createTypedState(draft: string): SessionState {
        const sketch: Sketch = {
          config: "{ settings: {}, rules: {} }",
          tree: [
            { path: "src/a.ts", kind: "file" },
            { path: "src/b.js", kind: "file" },
            { path: "src/b.ts", kind: "file" },
          ],
          dependencies: [],
        };

        return {
          ...createEvaluatedState(
            sketch,
            createEngine().evaluate(sketch),
            ALL_CAPABILITIES
          ),
          view: "text",
          textDraft: draft,
        };
      }

      it("should read the source with the rule of the playground, and write it in full once the draft settles", () => {
        // Arrange
        const before = createTypedState(
          'src/a.ts\n  import "./b";\nsrc/b.ts\n'
        );

        // Act
        const state = settleText(before);

        // Assert
        expect(getEdges(state)).toEqual(["src/a.ts -> src/b.ts"]);
        expect(state.textDraft).toBeUndefined();
        expect(toText(state.sketch)).toBe(
          'eslint.config.js\nsrc/a.ts\n  import "./b.ts";\nsrc/b.ts\n'
        );
      });

      it("should leave the line out, and keep the draft, when the source can be several files", () => {
        // Arrange
        const typed = 'src/a.ts\n  import "./b";\nsrc/b.js\nsrc/b.ts\n';
        const before = createTypedState(typed);

        // Act
        const state = settleText(before);

        // Assert
        expect(getEdges(state)).toEqual([]);
        expect(state.textDraft).toBe(typed);
      });
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
      const before = createState({
        view: "text",
        textDraft: toText(SKETCH),
      });

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

    describe("without editDependencies", () => {
      const NO_DEPENDENCY_EDITS = {
        ...ALL_CAPABILITIES,
        editDependencies: false,
      };

      it("should drop the draft although a dependency line cannot be read, because the dependency lines are ignored", () => {
        // Arrange
        const before = createState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: "main.js\n  import bad\n  import { a } from './missing'\n",
        });

        // Act
        const state = settleText(before);

        // Assert
        expect(state.textDraft).toBeUndefined();
        expect(getPaths(state)).toEqual(["main.js"]);
      });

      it("should keep the draft of a line of a node that cannot be read", () => {
        // Arrange
        const draft = "main.js\nmain.js\n  import bad\n";
        const before = createState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: draft,
        });

        // Act
        const state = settleText(before);

        // Assert
        expect(state.textDraft).toBe(draft);
        expect(getPaths(state)).toEqual(["main.js"]);
      });

      it("should keep the dependencies of the sketch when the draft settles", () => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: `${toText({ tree: SKETCH.tree, dependencies: [] })}  import bad\n`,
        });

        // Act
        const state = settleText(before);

        // Assert
        expect(state.textDraft).toBeUndefined();
        expect(getEdges(state)).toEqual(getEdges(before));
      });
    });
  });

  describe("openTarget with a dependency", () => {
    it("should put the dependency in focus and select the tab of the dependency", () => {
      // Act
      const state = openTarget(createDependencyState(), {
        kind: "dependency",
        path: "src/index.js",
        index: 1,
      });

      // Assert
      expect(state.focus).toEqual({
        kind: "dependency",
        path: "src/index.js",
        index: 1,
      });
      expect(state.tab).toBe("dependency");
    });

    it("should replace the focus of a file, even when the user had selected the sketch's tab", () => {
      // Arrange
      const before = createDependencyState({
        focus: INDEX_FOCUS,
        tab: "sketch",
      });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "main.js",
        index: 0,
      });

      // Assert
      expect(state.focus).toEqual(onDependency("main.js", 0));
      expect(state.tab).toBe("dependency");
    });

    it("should replace the focus of another dependency of the same file", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 0),
        tab: "dependency",
      });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "src/index.js",
        index: 2,
      });

      // Assert
      expect(state.focus).toEqual(onDependency("src/index.js", 2));
    });

    it("should keep the same focus object when the dependency already is in focus", () => {
      // Arrange
      const openNode = onDependency("src/index.js", 1);
      const before = createDependencyState({
        focus: openNode,
        tab: "dependency",
      });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "src/index.js",
        index: 1,
      });

      // Assert
      expect(state.focus).toBe(openNode);
    });

    it("should open the closed folders above the file of the dependency and no others", () => {
      // Arrange
      const before = createDependencyState({
        closedFolders: new Set(["src", "docs"]),
      });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "src/index.js",
        index: 0,
      });

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
    });

    it("should open the closed folders above the target of the dependency too, so that the outline shows", () => {
      // Arrange
      const before = createDependencyState({
        closedFolders: new Set(["src/helpers", "docs"]),
      });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "src/index.js",
        index: 0,
      });

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
    });

    it("should open the folders above the target of a dependency whose file is at the root", () => {
      // Arrange
      const before = createDependencyState({
        closedFolders: new Set(["src"]),
      });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "main.js",
        index: 0,
      });

      // Assert
      expect(Array.from(state.closedFolders)).toEqual([]);
    });

    it("should leave the closed folders as they are when the dependency is on an external module", () => {
      // Arrange
      const closedFolders = new Set(["src/helpers", "docs"]);
      const before = createDependencyState({ closedFolders });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "src/index.js",
        index: 1,
      });

      // Assert
      expect(state.closedFolders).toBe(closedFolders);
    });

    it("should drop the folder the user selected, the request to reveal and the highlight", () => {
      // Arrange
      const before = createDependencyState({
        focus: { kind: "config" },
        tab: "node",
        pickedFolder: "docs",
        reveal: { range: RANGE, key: 1 },
        revealCount: 1,
        highlight: {
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 0 },
        },
      });

      // Act
      const state = openTarget(before, {
        kind: "dependency",
        path: "main.js",
        index: 0,
      });

      // Assert
      expect(state.pickedFolder).toBeUndefined();
      expect(state.reveal).toBeUndefined();
      expect(state.highlight).toBeUndefined();
    });

    it("should put the file in focus and select the tab of the node when it opens while one of its dependencies is in focus", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
      });

      // Act
      const state = openTarget(before, { kind: "file", path: "src/index.js" });

      // Assert
      expect(state.focus).toEqual(INDEX_FOCUS);
      expect(state.tab).toBe("node");
    });

    it("should put another file in focus and select the tab of the node when a dependency was in focus", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
      });

      // Act
      const state = openTarget(before, { kind: "file", path: "main.js" });

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "main.js" });
      expect(state.tab).toBe("node");
    });

    it("should put the config in focus and select the tab of the node when a dependency was in focus", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
      });

      // Act
      const state = openTarget(before, { kind: "config" });

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
    });
  });

  describe("the highlight of a policy", () => {
    const FROM = { path: "src/index.js", index: 2 };

    it("should be set by a config target that has a range and the dependency it came from, which also asks to reveal the range", () => {
      // Arrange
      const before = createDependencyState(NOTHING_OPEN);

      // Act
      const state = openTarget(before, {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });

      // Assert
      expect(state.highlight).toEqual({
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });
      expect(state.reveal).toEqual({ range: RANGE, key: 1 });
      expect(state.focus).toEqual({ kind: "config" });
    });

    it("should be set when the target comes from the dependency in focus", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 2),
        tab: "dependency",
      });

      // Act
      const state = openTarget(before, {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });

      // Assert
      expect(state.highlight).toEqual({
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });
      expect(state.tab).toBe("node");
    });

    it("should be kept while the config stays in focus, whatever the user does in the panel or in the text", () => {
      // Arrange
      const opened = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });

      // Act
      const selected = selectTab(opened, "sketch");
      const typed = changeConfig(selected, "{ settings: {}, rules: {}, }");
      const evaluated = setEvaluation(typed, EVALUATION, "current");

      // Assert
      expect(evaluated.highlight).toBe(opened.highlight);
    });

    it("should be replaced when another policy is opened from a dependency", () => {
      // Arrange
      const opened = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });
      const other = { path: "main.js", index: 0 };

      // Act
      const state = openTarget(opened, {
        kind: "config",
        range: OTHER_RANGE,
        policy: 0,
        dependency: other,
      });

      // Assert
      expect(state.highlight).toEqual({
        range: OTHER_RANGE,
        policy: 0,
        dependency: other,
      });
    });

    it("should be dropped when the config opens with a range and no dependency, which still asks to reveal the range", () => {
      // Arrange
      const opened = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });

      // Act
      const state = openTarget(opened, { kind: "config", range: OTHER_RANGE });

      // Assert
      expect(state.highlight).toBeUndefined();
      expect(state.reveal).toEqual({ range: OTHER_RANGE, key: 2 });
    });

    it("should be dropped when the config opens with nothing else", () => {
      // Arrange
      const opened = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });

      // Act
      const state = openTarget(opened, { kind: "config" });

      // Assert
      expect(state.highlight).toBeUndefined();
    });

    it("should keep the index of the policy, and null for the default", () => {
      // Act
      const policy = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        policy: 1,
        dependency: FROM,
      });
      const byDefault = openTarget(createDependencyState(), {
        kind: "config",
        range: OTHER_RANGE,
        policy: null,
        dependency: FROM,
      });

      // Assert
      expect(policy.highlight?.policy).toBe(1);
      expect(byDefault.highlight?.policy).toBeNull();
    });

    it("should not be set by a target that has a range and a dependency and does not say which policy it is", () => {
      // Act
      const state = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        dependency: FROM,
      });

      // Assert
      expect(state.highlight).toBeUndefined();
      expect(state.reveal).toEqual({ range: RANGE, key: 1 });
    });

    it("should not be set by a target that has a dependency and no range", () => {
      // Act
      const state = openTarget(createDependencyState(), {
        kind: "config",
        dependency: FROM,
      });

      // Assert
      expect(state.highlight).toBeUndefined();
    });

    it("should be dropped when a file opens", () => {
      // Arrange
      const opened = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });

      // Act
      const state = openTarget(opened, { kind: "file", path: "main.js" });

      // Assert
      expect(state.highlight).toBeUndefined();
    });

    it("should be dropped when a dependency opens", () => {
      // Arrange
      const opened = openTarget(createDependencyState(), {
        kind: "config",
        range: RANGE,
        policy: 2,
        dependency: FROM,
      });

      // Act
      const state = openTarget(opened, {
        kind: "dependency",
        path: "main.js",
        index: 0,
      });

      // Assert
      expect(state.highlight).toBeUndefined();
    });
  });

  describe("the highlight of a policy, after the config was edited", () => {
    const FROM = { path: "src/index.js", index: 2 };

    /** A config with two policies and a default, one policy per line, so that an edit can put a policy before the second one */
    const POLICY_CONFIG = [
      "{",
      '  settings: { "boundaries/elements": [{ type: "helper", pattern: "src/helpers/*" }] },',
      "  rules: {",
      '    "boundaries/dependencies": [2, {',
      '      default: "disallow",',
      "      policies: [",
      '        { allow: { to: { element: { type: "helper" } } } },',
      '        { disallow: { to: { file: { categories: "test" } } } },',
      "      ],",
      "    }],",
      "  },",
      "}",
    ].join("\n");

    /** The policy that the edit puts before the second one */
    const INSERTED =
      '        { allow: { to: { element: { type: "main" } } } },\n';

    const SECOND_AT = POLICY_CONFIG.indexOf("        { disallow");

    const EDITED_CONFIG =
      POLICY_CONFIG.slice(0, SECOND_AT) +
      INSERTED +
      POLICY_CONFIG.slice(SECOND_AT);

    const POLICY_SKETCH: Sketch = { ...SKETCH, config: POLICY_CONFIG };

    const POLICY_EVALUATION = createEngine().evaluate(POLICY_SKETCH);

    const EDITED_EVALUATION = createEngine().evaluate({
      ...SKETCH,
      config: EDITED_CONFIG,
    });

    /** The second policy, as the evaluation of the config before the edit places it, and the default */
    const [, SECOND, DEFAULT] = POLICY_EVALUATION.policies;

    /** Where the editor says the second policy is after the edit: the lines of the policy that was put before it are above */
    const MOVED: TextRange = {
      ...SECOND.range,
      from: SECOND.range.from + INSERTED.length,
      to: SECOND.range.to + INSERTED.length,
      line: SECOND.range.line + 1,
    };

    /**
     * Creates the state after the config was opened at the second policy.
     * @param overrides What differs from it.
     * @returns The state, whose evaluation is the one of the config before the edit.
     */
    function createOpened(overrides: Partial<SessionState> = {}): SessionState {
      return createState({
        sketch: POLICY_SKETCH,
        evaluation: POLICY_EVALUATION,
        focus: { kind: "config" },
        tab: "node",
        highlight: { range: SECOND.range, policy: 1, dependency: FROM },
        ...overrides,
      });
    }

    it("should have an evaluation whose policies are the two of the rule and its default, which the cases below tell apart", () => {
      // Act
      const indexes = EDITED_EVALUATION.policies.map(({ index }) => index);

      // Assert
      expect(POLICY_EVALUATION.policies.map(({ index }) => index)).toEqual([
        0,
        1,
        null,
      ]);
      expect(indexes).toEqual([0, 1, 2, null]);
      expect(EDITED_EVALUATION.policies[2].range.from).toBe(MOVED.from);
    });

    describe("the edit", () => {
      it("should move the range with the text, in one state", () => {
        // Act
        const state = changeConfig(createOpened(), EDITED_CONFIG, MOVED);

        // Assert
        expect(state.sketch.config).toBe(EDITED_CONFIG);
        expect(state.highlight).toEqual({
          range: MOVED,
          policy: 1,
          dependency: FROM,
        });
      });

      it("should keep the index of the policy, which the evaluation finds again", () => {
        // Act
        const state = changeConfig(createOpened(), EDITED_CONFIG, MOVED);

        // Assert
        expect(state.highlight?.policy).toBe(1);
        expect(state.evaluation).toBe(POLICY_EVALUATION);
      });

      it("should drop the highlight when the editor says it has none, with the text", () => {
        // Act
        const state = changeConfig(createOpened(), EDITED_CONFIG, null);

        // Assert
        expect(state.sketch.config).toBe(EDITED_CONFIG);
        expect(state.highlight).toBeUndefined();
      });

      it("should keep the highlight when the text changes without the editor, which says nothing of it", () => {
        // Arrange
        const before = createOpened();

        // Act
        const state = changeConfig(before, EDITED_CONFIG);

        // Assert
        expect(state.sketch.config).toBe(EDITED_CONFIG);
        expect(state.highlight).toBe(before.highlight);
      });

      it("should take the range though the text is the same", () => {
        // Act
        const state = changeConfig(createOpened(), POLICY_CONFIG, MOVED);

        // Assert
        expect(state.sketch).toBe(POLICY_SKETCH);
        expect(state.highlight?.range).toEqual(MOVED);
      });

      it("should return the same state when neither the text nor the range changes", () => {
        // Arrange
        const before = createOpened();

        // Act
        const state = changeConfig(before, POLICY_CONFIG, SECOND.range);

        // Assert
        expect(state).toBe(before);
      });

      it("should not move the range without editConfig", () => {
        // Arrange
        const before = createOpened({ capabilities: CONFIG_LOCKED });

        // Act
        const state = changeConfig(before, EDITED_CONFIG, MOVED);

        // Assert
        expect(state).toBe(before);
      });

      it("should leave no highlight when there was none", () => {
        // Act
        const state = changeConfig(
          createOpened({ highlight: undefined }),
          EDITED_CONFIG,
          MOVED
        );

        // Assert
        expect(state.highlight).toBeUndefined();
      });
    });

    describe("the evaluation", () => {
      it("should find the policy again by where the range starts, when the policies moved", () => {
        // Arrange
        const edited = changeConfig(createOpened(), EDITED_CONFIG, MOVED);

        // Act
        const state = setEvaluation(edited, EDITED_EVALUATION, "current");

        // Assert
        expect(state.highlight).toEqual({
          range: MOVED,
          policy: 2,
          dependency: FROM,
        });
        expect(state.evaluation).toBe(EDITED_EVALUATION);
      });

      it("should find the default again", () => {
        // Arrange
        const before = createOpened({
          highlight: { range: DEFAULT.range, policy: 1, dependency: FROM },
        });

        // Act
        const state = setEvaluation(
          changeConfig(before, POLICY_CONFIG, DEFAULT.range),
          createEngine().evaluate({ ...POLICY_SKETCH }),
          "current"
        );

        // Assert
        expect(state.highlight?.policy).toBeNull();
      });

      it("should leave the index unknown when no policy starts where the range starts", () => {
        // Arrange
        const edited = changeConfig(createOpened(), EDITED_CONFIG, {
          ...MOVED,
          from: MOVED.from + 1,
        });

        // Act
        const state = setEvaluation(edited, EDITED_EVALUATION, "current");

        // Assert
        expect(state.highlight).toEqual({
          range: { ...MOVED, from: MOVED.from + 1 },
          policy: undefined,
          dependency: FROM,
        });
      });

      it("should find the policy again after the index was unknown", () => {
        // Arrange
        const lost = setEvaluation(
          changeConfig(createOpened(), EDITED_CONFIG, {
            ...MOVED,
            from: MOVED.from + 1,
          }),
          EDITED_EVALUATION,
          "current"
        );
        const restored = changeConfig(lost, EDITED_CONFIG, MOVED);

        // Act
        const state = setEvaluation(
          restored,
          createEngine().evaluate({ ...SKETCH, config: EDITED_CONFIG }),
          "current"
        );

        // Assert
        expect(state.highlight?.policy).toBe(2);
      });

      it("should leave the index unknown when the evaluation has no policies", () => {
        // Arrange
        const edited = changeConfig(createOpened(), "{}", MOVED);

        // Act
        const state = setEvaluation(
          edited,
          createEngine().evaluate({ ...SKETCH, config: "{}" }),
          "current"
        );

        // Assert
        expect(state.highlight?.policy).toBeUndefined();
      });

      it("should keep the index it had while the evaluation is behind the text, though a policy of it starts at the range", () => {
        // Arrange
        // The index is not the one of the policy that starts at the range, so that finding it again would show
        const edited = changeConfig(
          createOpened({
            highlight: { range: SECOND.range, policy: 5, dependency: FROM },
          }),
          EDITED_CONFIG,
          SECOND.range
        );
        const behind = createEngine().evaluate({
          ...POLICY_SKETCH,
          config: `${POLICY_CONFIG}\n`,
        });

        // Act
        const state = setEvaluation(edited, behind, "current");

        // Assert
        expect(state.evaluation).toBe(behind);
        expect(state.highlight).toBe(edited.highlight);
        expect(state.highlight?.policy).toBe(5);
      });

      it("should keep the same highlight when the index is the one it had", () => {
        // Arrange
        const before = createOpened();

        // Act
        const state = setEvaluation(
          before,
          createEngine().evaluate({ ...POLICY_SKETCH }),
          "current"
        );

        // Assert
        expect(state.highlight).toBe(before.highlight);
      });

      it("should leave no highlight when there was none", () => {
        // Act
        const state = setEvaluation(
          createOpened({ highlight: undefined }),
          createEngine().evaluate({ ...POLICY_SKETCH }),
          "current"
        );

        // Assert
        expect(state.highlight).toBeUndefined();
      });
    });
  });

  describe("addDependency", () => {
    it("should return the same state without editDependencies", () => {
      // Arrange
      const before = createDependencyState({
        capabilities: { ...ALL_CAPABILITIES, editDependencies: false },
      });

      // Act
      const state = addDependency(
        before,
        importOf("main.js", "src/helpers/format.js")
      );

      // Assert
      expect(state).toBe(before);
    });

    it("should add the dependency after the ones of its file, and put it in focus", () => {
      // Act
      const state = addDependency(
        createDependencyState(),
        importOf("main.js", "src/helpers/format.js")
      );

      // Assert
      expect(getEdges(state)).toEqual([
        "src/index.js -> src/helpers/format.js",
        "src/index.js -> react",
        "src/index.js -> main.js",
        "main.js -> src/index.js",
        "main.js -> src/helpers/format.js",
      ]);
      expect(state.focus).toEqual(onDependency("main.js", 1));
      expect(state.tab).toBe("dependency");
    });

    it("should give the first index to the dependency of a file that had none", () => {
      // Act
      const state = addDependency(
        createDependencyState(),
        importOf("src/helpers/format.js", "main.js")
      );

      // Assert
      expect(state.focus).toEqual(onDependency("src/helpers/format.js", 0));
    });

    it("should replace the focus that was on a file or on the config", () => {
      // Arrange
      const before = createDependencyState({
        focus: { kind: "config" },
        tab: "node",
      });

      // Act
      const state = addDependency(
        before,
        importOf("main.js", "src/helpers/format.js")
      );

      // Assert
      expect(state.focus).toEqual(onDependency("main.js", 1));
    });

    it("should open the folders above the file of the dependency", () => {
      // Arrange
      const before = createDependencyState({
        closedFolders: new Set(["src", "docs"]),
      });

      // Act
      const state = addDependency(before, importOf("src/index.js", "main.js"));

      // Assert
      expect(Array.from(state.closedFolders)).toEqual(["docs"]);
    });

    it("should drop the highlight, which belongs to the config", () => {
      // Arrange
      const before = createDependencyState({
        focus: { kind: "config" },
        tab: "node",
        highlight: {
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 0 },
        },
      });

      // Act
      const state = addDependency(
        before,
        importOf("main.js", "src/helpers/format.js")
      );

      // Assert
      expect(state.highlight).toBeUndefined();
    });

    it("should add it without editTree and without editConfig", () => {
      // Arrange
      const before = createDependencyState({
        capabilities: {
          editTree: false,
          editDependencies: true,
          editConfig: false,
        },
      });

      // Act
      const state = addDependency(
        before,
        importOf("main.js", "src/helpers/format.js")
      );

      // Assert
      expect(state.sketch.dependencies).toHaveLength(5);
    });

    it("should return the same state when the dependency points to its own file", () => {
      // Arrange
      const before = createDependencyState();

      // Act
      const state = addDependency(before, importOf("main.js", "main.js"));

      // Assert
      expect(state).toBe(before);
    });

    it("should return the same state when the target is not a file of the sketch", () => {
      // Arrange
      const before = createDependencyState();

      // Act
      const state = addDependency(before, importOf("main.js", "missing.js"));

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("replaceDependency", () => {
    const REF = { path: "src/index.js", index: 1 };

    it("should return the same state without editDependencies", () => {
      // Arrange
      const before = createDependencyState({
        capabilities: { ...ALL_CAPABILITIES, editDependencies: false },
      });

      // Act
      const state = replaceDependency(
        before,
        REF,
        importModule("src/index.js", "lodash")
      );

      // Assert
      expect(state).toBe(before);
    });

    it("should replace the dependency in its position", () => {
      // Act
      const state = replaceDependency(
        createDependencyState(),
        REF,
        importModule("src/index.js", "lodash")
      );

      // Assert
      expect(getEdges(state)).toEqual([
        "src/index.js -> src/helpers/format.js",
        "src/index.js -> lodash",
        "src/index.js -> main.js",
        "main.js -> src/index.js",
      ]);
    });

    it("should keep it in focus, with the tab the user had selected, when it was", () => {
      // Arrange
      const openNode = onDependency("src/index.js", 1);
      const before = createDependencyState({ focus: openNode, tab: "sketch" });

      // Act
      const state = replaceDependency(
        before,
        REF,
        importModule("src/index.js", "lodash")
      );

      // Assert
      expect(state.focus).toBe(openNode);
      expect(state.tab).toBe("sketch");
    });

    it("should keep another dependency in focus", () => {
      // Arrange
      const openNode = onDependency("src/index.js", 2);
      const before = createDependencyState({
        focus: openNode,
        tab: "dependency",
      });

      // Act
      const state = replaceDependency(
        before,
        REF,
        importModule("src/index.js", "lodash")
      );

      // Assert
      expect(state.focus).toBe(openNode);
    });

    it("should keep the file in focus, and not put the dependency in focus, when it was not", () => {
      // Arrange
      // The file of the dependency is the focus where the dependency would be put in focus, as the file pane edits it
      const before = createDependencyState({ focus: INDEX_FOCUS, tab: "node" });

      // Act
      const state = replaceDependency(
        before,
        REF,
        importModule("src/index.js", "lodash")
      );

      // Assert
      expect(state.focus).toBe(INDEX_FOCUS);
    });

    it("should return the same state when there is no dependency at the position", () => {
      // Arrange
      const before = createDependencyState();

      // Act
      const state = replaceDependency(
        before,
        { path: "src/index.js", index: 7 },
        importModule("src/index.js", "lodash")
      );

      // Assert
      expect(state).toBe(before);
    });

    it("should return the same state when the new dependency is of another file", () => {
      // Arrange
      const before = createDependencyState();

      // Act
      const state = replaceDependency(
        before,
        REF,
        importModule("main.js", "lodash")
      );

      // Assert
      expect(state).toBe(before);
    });

    it("should return the same state when the sketch cannot hold the new dependency", () => {
      // Arrange
      const before = createDependencyState();

      // Act
      const state = replaceDependency(
        before,
        REF,
        importOf("src/index.js", "src/index.js")
      );

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("removeDependency", () => {
    it("should return the same state without editDependencies", () => {
      // Arrange
      const before = createDependencyState({
        capabilities: { ...ALL_CAPABILITIES, editDependencies: false },
      });

      // Act
      const state = removeDependency(before, {
        path: "src/index.js",
        index: 0,
      });

      // Assert
      expect(state).toBe(before);
    });

    it("should remove the dependency, and the ones after it in its file move up", () => {
      // Act
      const state = removeDependency(createDependencyState(), {
        path: "src/index.js",
        index: 1,
      });

      // Assert
      expect(getEdges(state)).toEqual([
        "src/index.js -> src/helpers/format.js",
        "src/index.js -> main.js",
        "main.js -> src/index.js",
      ]);
    });

    it("should put the file in focus, and select the tab of the node, when the dependency in focus is removed", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
      });

      // Act
      const state = removeDependency(before, {
        path: "src/index.js",
        index: 1,
      });

      // Assert
      expect(state.focus).toEqual(INDEX_FOCUS);
      expect(state.tab).toBe("node");
    });

    it("should leave the tab the user selected when the dependency in focus is removed", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 1),
        tab: "sketch",
      });

      // Act
      const state = removeDependency(before, {
        path: "src/index.js",
        index: 1,
      });

      // Assert
      expect(state.focus).toEqual(INDEX_FOCUS);
      expect(state.tab).toBe("sketch");
    });

    it("should shift the index of the dependency in focus when one before it in its file is removed", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 2),
        tab: "dependency",
      });

      // Act
      const state = removeDependency(before, {
        path: "src/index.js",
        index: 0,
      });

      // Assert
      expect(state.focus).toEqual(onDependency("src/index.js", 1));
      expect(state.tab).toBe("dependency");
      expect(getEdges(state)[1]).toBe("src/index.js -> main.js");
    });

    it("should keep the focus when the dependency removed is after it, or of another file", () => {
      // Arrange
      const openNode = onDependency("src/index.js", 1);
      const before = createDependencyState({
        focus: openNode,
        tab: "dependency",
      });

      // Act
      const after = removeDependency(before, {
        path: "src/index.js",
        index: 2,
      });
      const other = removeDependency(before, { path: "main.js", index: 0 });

      // Assert
      expect(after.focus).toBe(openNode);
      expect(other.focus).toBe(openNode);
    });

    it("should keep the file in focus, with its tab, when the dependency removed was not in focus", () => {
      // Arrange
      // The focus is the file of the dependency removed, as the file pane edits it
      const openNode: Focus = { kind: "file", path: "main.js" };
      const before = createDependencyState({ focus: openNode, tab: "node" });

      // Act
      const state = removeDependency(before, {
        path: "main.js",
        index: 0,
      });

      // Assert
      expect(state.focus).toBe(openNode);
      expect(state.tab).toBe("node");
    });

    it("should return the same state when there is no dependency at the position", () => {
      // Arrange
      const before = createDependencyState();

      // Act
      const state = removeDependency(before, { path: "main.js", index: 1 });

      // Assert
      expect(state).toBe(before);
    });

    it("should move the dependency a highlight came from with the ones before it, and drop the highlight when it is removed", () => {
      // Arrange
      const before = createDependencyState({
        focus: { kind: "config" },
        tab: "node",
        highlight: {
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 2 },
        },
      });

      // Act
      const moved = removeDependency(before, {
        path: "src/index.js",
        index: 0,
      });
      const removed = removeDependency(before, {
        path: "src/index.js",
        index: 2,
      });

      // Assert
      expect(moved.highlight).toEqual({
        range: RANGE,
        policy: 2,
        dependency: { path: "src/index.js", index: 1 },
      });
      expect(removed.highlight).toBeUndefined();
      expect(removed.focus).toEqual({ kind: "config" });
    });
  });

  describe("the text draft when a dependency is edited", () => {
    // The text of the sketch, as text mode shows it, with a line below it that could not be read
    const STALE_DRAFT = `${toText(DEPENDENCY_SKETCH)}  import bad\n`;

    const MISSING = { path: "src/index.js", index: 9 };

    const EDITS: [
      string,
      (state: SessionState) => SessionState,
      (state: SessionState) => SessionState,
    ][] = [
      [
        "addDependency",
        (state) =>
          addDependency(state, importOf("main.js", "src/helpers/format.js")),
        (state) => addDependency(state, importOf("main.js", "main.js")),
      ],
      [
        "replaceDependency",
        (state) =>
          replaceDependency(
            state,
            { path: "src/index.js", index: 1 },
            importModule("src/index.js", "lodash")
          ),
        (state) =>
          replaceDependency(
            state,
            MISSING,
            importModule("src/index.js", "lodash")
          ),
      ],
      [
        "removeDependency",
        (state) => removeDependency(state, { path: "src/index.js", index: 1 }),
        (state) => removeDependency(state, MISSING),
      ],
    ];

    it.each(EDITS)(
      "should drop the draft when %s changes the sketch, and stay in text mode",
      (_name, edit) => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          textDraft: STALE_DRAFT,
        });

        // Act
        const state = edit(before);

        // Assert
        expect(state.textDraft).toBeUndefined();
        expect(state.view).toBe("text");
      }
    );

    it.each(EDITS)(
      "should not let a later read of the text undo the edit of %s",
      (_name, edit) => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          textDraft: STALE_DRAFT,
        });
        const edited = edit(before);

        // Act
        const read = readText(edited);
        const settled = settleText(edited);

        // Assert
        expect(getEdges(edited)).not.toEqual(getEdges(before));
        expect(getEdges(read)).toEqual(getEdges(edited));
        expect(getEdges(settled)).toEqual(getEdges(edited));
      }
    );

    it.each(EDITS)(
      "should keep the draft when %s is refused, because the sketch did not change",
      (_name, _edit, refused) => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          textDraft: STALE_DRAFT,
        });

        // Act
        const state = refused(before);

        // Assert
        expect(state).toBe(before);
        expect(state.textDraft).toBe(STALE_DRAFT);
      }
    );

    it("should keep the focus on the dependency that was edited while the text shows", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        textDraft: STALE_DRAFT,
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
      });

      // Act
      const state = replaceDependency(
        before,
        { path: "src/index.js", index: 1 },
        importModule("src/index.js", "lodash")
      );

      // Assert
      expect(state.focus).toEqual(onDependency("src/index.js", 1));
      expect(state.tab).toBe("dependency");
    });
  });

  describe("a dependency in focus when the tree is edited", () => {
    describe("renameNode", () => {
      it("should follow the file when it is renamed, and keep its index and the tab", () => {
        // Arrange
        const before = createDependencyState({
          focus: onDependency("src/index.js", 2),
          tab: "dependency",
        });

        // Act
        const { state, path } = getRenamed(
          renameNode(before, "src/index.js", "app.js")
        );

        // Assert
        expect(path).toBe("src/app.js");
        expect(state.focus).toEqual(onDependency("src/app.js", 2));
        expect(state.tab).toBe("dependency");
        expect(getEdges(state)[2]).toBe("src/app.js -> main.js");
      });

      it("should follow the file when the folder above it is renamed", () => {
        // Arrange
        const before = createDependencyState({
          focus: onDependency("src/index.js", 0),
          tab: "dependency",
        });

        // Act
        const { state } = getRenamed(renameNode(before, "src", "lib"));

        // Assert
        expect(state.focus).toEqual(onDependency("lib/index.js", 0));
      });

      it("should keep the same focus object when the file is not moved, even if the target of the dependency is", () => {
        // Arrange
        const openNode = onDependency("src/index.js", 2);
        const before = createDependencyState({
          focus: openNode,
          tab: "dependency",
        });

        // Act
        const { state } = getRenamed(renameNode(before, "main.js", "root.js"));

        // Assert
        expect(state.focus).toBe(openNode);
        expect(getEdges(state)[2]).toBe("src/index.js -> root.js");
      });

      it("should move the dependency a highlight came from with its file, and keep the highlight when the file is elsewhere", () => {
        // Arrange
        const highlight = {
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 2 },
        };
        const before = createDependencyState({
          focus: { kind: "config" },
          tab: "node",
          highlight,
        });

        // Act
        const moved = getRenamed(
          renameNode(before, "src/index.js", "app.js")
        ).state;
        const kept = getRenamed(renameNode(before, "main.js", "root.js")).state;

        // Assert
        expect(moved.highlight).toEqual({
          range: RANGE,
          policy: 2,
          dependency: { path: "src/app.js", index: 2 },
        });
        expect(kept.highlight).toBe(highlight);
      });
    });

    describe("removeNode", () => {
      it("should leave nothing in focus, and select the tab of the sketch, when the file of the dependency is removed", () => {
        // Arrange
        const before = createDependencyState({
          focus: onDependency("src/index.js", 1),
          tab: "dependency",
        });

        // Act
        const state = removeNode(before, "src/index.js");

        // Assert
        expect(state.focus).toEqual({ kind: "none" });
        expect(state.tab).toBe("sketch");
      });

      it("should leave nothing in focus when the folder above the file of the dependency is removed", () => {
        // Arrange
        const before = createDependencyState({
          focus: onDependency("src/index.js", 1),
          tab: "dependency",
        });

        // Act
        const state = removeNode(before, "src");

        // Assert
        expect(state.focus).toEqual({ kind: "none" });
      });

      it("should put the file in focus, and select the tab of the node, when only the target of the dependency is removed", () => {
        // Arrange
        const before = createDependencyState({
          focus: onDependency("src/index.js", 2),
          tab: "dependency",
        });

        // Act
        const state = removeNode(before, "main.js");

        // Assert
        expect(state.focus).toEqual(INDEX_FOCUS);
        expect(state.tab).toBe("node");
      });

      it("should shift the index when the target of a dependency before it in its file is removed", () => {
        // Arrange
        const before = createDependencyState({
          focus: onDependency("src/index.js", 2),
          tab: "dependency",
        });

        // Act
        const state = removeNode(before, "src/helpers/format.js");

        // Assert
        expect(state.focus).toEqual(onDependency("src/index.js", 1));
        expect(state.tab).toBe("dependency");
        expect(getEdges(state)[1]).toBe("src/index.js -> main.js");
      });

      it("should keep the same focus object when the removal leaves the dependency where it is", () => {
        // Arrange
        const openNode = onDependency("src/index.js", 1);
        const before = createDependencyState({
          focus: openNode,
          tab: "dependency",
        });

        // Act
        const state = removeNode(before, "main.js");

        // Assert
        expect(state.focus).toBe(openNode);
      });

      it("should move the dependency a highlight came from with the ones before it, and drop the highlight when it goes", () => {
        // Arrange
        const before = createDependencyState({
          focus: { kind: "config" },
          tab: "node",
          highlight: {
            range: RANGE,
            policy: 2,
            dependency: { path: "src/index.js", index: 2 },
          },
        });

        // Act
        const moved = removeNode(before, "src/helpers/format.js");
        const gone = removeNode(before, "main.js");

        // Assert
        expect(moved.highlight).toEqual({
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 1 },
        });
        expect(gone.highlight).toBeUndefined();
        expect(gone.focus).toEqual({ kind: "config" });
      });
    });
  });

  describe.each([
    ["readText", readText],
    ["settleText", settleText],
  ])("%s with dependencies", (_name, read) => {
    /**
     * Writes the text of the sketch with dependencies, with the dependencies and the files that a spec changes.
     * @param dependencies The dependencies of the text.
     * @param paths The files of the text, which are all the nodes of the sketch when it is unset.
     * @returns The text, as text mode shows it.
     */
    function writeText(
      dependencies: readonly SketchDependency[],
      paths?: readonly string[]
    ): string {
      return toText({
        tree:
          paths === undefined
            ? SKETCH.tree
            : paths.map((path) => ({ path, kind: "file" })),
        dependencies,
      });
    }

    it("should read the dependency lines into the sketch", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        textDraft: writeText([
          ...DEPENDENCIES,
          importOf("main.js", "src/helpers/format.js"),
        ]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(getEdges(state)).toEqual([
        "src/index.js -> src/helpers/format.js",
        "src/index.js -> react",
        "src/index.js -> main.js",
        "main.js -> src/index.js",
        "main.js -> src/helpers/format.js",
      ]);
    });

    it("should drop the dependencies that the text no longer has", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        textDraft: writeText([DEPENDENCIES[3]]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(getEdges(state)).toEqual(["main.js -> src/index.js"]);
    });

    it("should keep the dependency in focus when its line was edited in the text", () => {
      // Arrange
      const openNode = onDependency("src/index.js", 1);
      const before = createDependencyState({
        view: "text",
        focus: openNode,
        tab: "dependency",
        textDraft: writeText([
          importOf("src/index.js", "src/helpers/format.js"),
          importModule("src/index.js", "lodash"),
          importOf("src/index.js", "main.js"),
        ]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toBe(openNode);
      expect(state.tab).toBe("dependency");
    });

    it("should keep the dependency in focus on its own line when a line before it was deleted in the text", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
        textDraft: writeText([
          DEPENDENCIES[1],
          DEPENDENCIES[2],
          DEPENDENCIES[3],
        ]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toEqual(onDependency("src/index.js", 0));
      expect(state.tab).toBe("dependency");
    });

    it("should keep the dependency in focus on its own line when a line before it was added in the text", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
        textDraft: writeText([
          importOf("src/index.js", "src/helpers/format.js"),
          importModule("src/index.js", "lodash", "y"),
          ...DEPENDENCIES,
        ]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toEqual(onDependency("src/index.js", 3));
    });

    it("should put the file in focus, and select the tab of the node, when the text deleted the line of the dependency", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        focus: onDependency("src/index.js", 2),
        tab: "dependency",
        textDraft: writeText([DEPENDENCIES[0]]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toEqual(INDEX_FOCUS);
      expect(state.tab).toBe("node");
    });

    it("should leave nothing in focus when the text no longer has the file of the dependency", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
        textDraft: writeText([], ["main.js", "src/helpers/format.js"]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.focus).toEqual({ kind: "none" });
      expect(state.tab).toBe("sketch");
    });

    it("should move the dependency a highlight came from to the same index of the same file, and drop it when the file has no dependency there", () => {
      // Arrange
      const config = createDependencyState({
        view: "text",
        focus: { kind: "config" },
        tab: "node",
        highlight: {
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 2 },
        },
      });

      // Act
      const same = read({
        ...config,
        textDraft: writeText([
          ...DEPENDENCIES.slice(0, 2),
          importOf("src/index.js", "src/helpers/format.js"),
        ]),
      });
      const gone = read({
        ...config,
        textDraft: writeText([DEPENDENCIES[0]]),
      });

      // Assert
      expect(same.highlight).toEqual(config.highlight);
      expect(gone.highlight).toBeUndefined();
    });

    it("should move the dependency a highlight came from to its own line when a line before it was deleted in the text", () => {
      // Arrange
      const before = createDependencyState({
        view: "text",
        focus: { kind: "config" },
        tab: "node",
        highlight: {
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 2 },
        },
        textDraft: writeText([DEPENDENCIES[1], DEPENDENCIES[2]]),
      });

      // Act
      const state = read(before);

      // Assert
      expect(state.highlight).toEqual({
        range: RANGE,
        policy: 2,
        dependency: { path: "src/index.js", index: 1 },
      });
    });

    describe("without editDependencies", () => {
      const NO_DEPENDENCY_EDITS = {
        ...ALL_CAPABILITIES,
        editDependencies: false,
      };

      it("should keep the dependencies of the sketch when the text has none", () => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: writeText([]),
        });

        // Act
        const state = read(before);

        // Assert
        expect(state.sketch).toBe(DEPENDENCY_SKETCH);
      });

      it("should ignore the dependency lines of the text", () => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: writeText([
            importOf("main.js", "src/helpers/format.js"),
            importModule("main.js", "lodash"),
          ]),
        });

        // Act
        const state = read(before);

        // Assert
        expect(getEdges(state)).toEqual(getEdges(before));
      });

      it("should keep the order of the dependencies of the sketch when the files are written in another order", () => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: writeText(
            [],
            ["main.js", "src/index.js", "src/helpers/format.js"]
          ),
        });

        // Act
        const state = read(before);

        // Assert
        expect(getEdges(state)).toEqual(getEdges(before));
      });

      it("should drop the dependencies whose file is no longer in the text", () => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: writeText([], ["src/index.js", "src/helpers/format.js"]),
        });

        // Act
        const state = read(before);

        // Assert
        expect(getEdges(state)).toEqual([
          "src/index.js -> src/helpers/format.js",
          "src/index.js -> react",
        ]);
      });

      it("should drop the dependencies whose node target is no longer in the text, and keep the external ones", () => {
        // Arrange
        const before = createDependencyState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          textDraft: writeText([], ["src/index.js", "main.js"]),
        });

        // Act
        const state = read(before);

        // Assert
        expect(getEdges(state)).toEqual([
          "src/index.js -> react",
          "src/index.js -> main.js",
          "main.js -> src/index.js",
        ]);
      });

      it("should keep the dependency in focus where it is, and put its file in focus when its target went", () => {
        // Arrange
        const text = writeText([], ["src/index.js", "main.js"]);
        const withExternal = createDependencyState({
          view: "text",
          capabilities: NO_DEPENDENCY_EDITS,
          focus: onDependency("src/index.js", 1),
          tab: "dependency",
          textDraft: text,
        });

        // Act
        const shifted = read(withExternal);
        const lost = read({
          ...withExternal,
          focus: onDependency("src/index.js", 0),
        });

        // Assert
        expect(shifted.focus).toEqual(onDependency("src/index.js", 0));
        expect(lost.focus).toEqual(INDEX_FOCUS);
        expect(lost.tab).toBe("node");
      });
    });
  });

  describe("the line of the focus and of the highlight while the text is edited", () => {
    // The text of the sketch with dependencies: line 5 is dependency 0 of `src/index.js` (the format helper), line 6 is dependency 1 (`react`), line 7 is dependency 2 (`main.js`) and line 9 is dependency 0 of `main.js`
    const TEXT = toText(DEPENDENCY_SKETCH);

    const LINE_OF_REACT = 6;

    const UNREADABLE = "  import x from";

    const REACT = '  import x from "react";';

    const FORMAT = '  import "./helpers/format.js";';

    const LODASH = '  import y from "lodash";';

    const PREACT = '  import z from "preact";';

    /**
     * Replaces a line of a text.
     * @param text The text.
     * @param line Number of the line, from 1.
     * @param content What the line says now.
     * @returns The new text.
     */
    function replaceLine(text: string, line: number, content: string): string {
      return text
        .split("\n")
        .map((current, index) => (index === line - 1 ? content : current))
        .join("\n");
    }

    /**
     * Inserts a line in a text, above a line.
     * @param text The text.
     * @param line Number of the line, from 1, that the new line goes above.
     * @param content What the new line says.
     * @returns The new text.
     */
    function insertLine(text: string, line: number, content: string): string {
      const lines = text.split("\n");

      return [
        ...lines.slice(0, line - 1),
        content,
        ...lines.slice(line - 1),
      ].join("\n");
    }

    /**
     * Deletes a line of a text.
     * @param text The text.
     * @param line Number of the line, from 1.
     * @returns The new text.
     */
    function deleteLine(text: string, line: number): string {
      return text
        .split("\n")
        .filter((_current, index) => index !== line - 1)
        .join("\n");
    }

    /**
     * Types texts one after the other, as keystrokes do: nothing is read in between.
     * @param state The state before.
     * @param texts The whole text after each keystroke.
     * @returns The state after the last one.
     */
    function typeTexts(state: SessionState, ...texts: string[]): SessionState {
      return texts.reduce(
        (current, text) => setTextDraft(current, text),
        state
      );
    }

    /**
     * Creates a text mode state with the dependency in focus.
     * @param index Its position among the dependencies of `src/index.js`.
     * @param overrides What differs from it.
     * @returns The state, with no draft.
     */
    function createFocusedState(
      index: number,
      overrides: Partial<SessionState> = {}
    ): SessionState {
      return createDependencyState({
        view: "text",
        focus: onDependency("src/index.js", index),
        tab: "dependency",
        ...overrides,
      });
    }

    /**
     * Creates a text mode state for a file with the dependencies given, with the dependency in focus.
     * @param dependencies The dependencies of `src/index.js`.
     * @param index The position of the one in focus.
     * @returns The state, with no draft.
     */
    function createLinesState(
      dependencies: readonly SketchDependency[],
      index: number
    ): SessionState {
      const sketch: Sketch = { ...SKETCH, dependencies };

      return {
        ...createEvaluatedState(
          sketch,
          createEngine().evaluate(sketch),
          ALL_CAPABILITIES
        ),
        view: "text",
        focus: onDependency("src/index.js", index),
        tab: "dependency",
      };
    }

    /**
     * Creates a text mode state with a highlight that came from a dependency, with the config in focus.
     * @param index The position of the dependency among the ones of `src/index.js`.
     * @returns The state, with no draft.
     */
    function createHighlightedState(index: number): SessionState {
      return createDependencyState({
        view: "text",
        focus: { kind: "config" },
        tab: "node",
        highlight: {
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index },
        },
      });
    }

    describe.each([
      ["readText", readText],
      ["settleText", settleText],
    ])("%s", (_name, read) => {
      describe("when the line of the dependency in focus cannot be read for a while", () => {
        it("should put the file in focus while the source is empty and the dependency back once it reads again", () => {
          // Arrange
          const before = createFocusedState(1);
          const emptied = read(
            typeTexts(
              before,
              replaceLine(TEXT, LINE_OF_REACT, '  import x from "";')
            )
          );

          // Act
          const fixed = read(
            typeTexts(
              emptied,
              replaceLine(TEXT, LINE_OF_REACT, '  import x from "lodash";')
            )
          );

          // Assert
          expect(emptied.focus).toEqual(INDEX_FOCUS);
          expect(emptied.tab).toBe("node");
          expect(fixed.focus).toEqual(onDependency("src/index.js", 1));
          expect(fixed.tab).toBe("dependency");
          expect(getEdges(fixed)).toContain("src/index.js -> lodash");
        });

        it("should follow a relative source that is typed in steps, which names no file until it is complete", () => {
          // Arrange
          const before = createFocusedState(2);
          const partial = read(
            typeTexts(
              before,
              replaceLine(TEXT, 7, '  import "../m";'),
              replaceLine(TEXT, 7, '  import "../ma";')
            )
          );

          // Act
          const typed = read(
            typeTexts(
              partial,
              replaceLine(TEXT, 7, '  import "../mai";'),
              replaceLine(TEXT, 7, '  import "../main.js";')
            )
          );

          // Assert
          expect(partial.focus).toEqual(INDEX_FOCUS);
          expect(partial.tab).toBe("node");
          expect(typed.focus).toEqual(onDependency("src/index.js", 2));
          expect(typed.tab).toBe("dependency");
        });

        it("should keep the tab the user selected through the cycle, because only the node's tab goes back", () => {
          // Arrange
          const before = createFocusedState(1, { tab: "sketch" });
          const emptied = read(
            typeTexts(before, replaceLine(TEXT, LINE_OF_REACT, UNREADABLE))
          );

          // Act
          const fixed = read(typeTexts(emptied, TEXT));

          // Assert
          expect(emptied.focus).toEqual(INDEX_FOCUS);
          expect(emptied.tab).toBe("sketch");
          expect(fixed.focus).toEqual(onDependency("src/index.js", 1));
          expect(fixed.tab).toBe("sketch");
        });

        it("should find the line again after a line was inserted above it", () => {
          // Arrange
          const before = createFocusedState(1);
          const emptied = read(
            typeTexts(before, replaceLine(TEXT, LINE_OF_REACT, UNREADABLE))
          );
          const inserted = insertLine(
            replaceLine(TEXT, LINE_OF_REACT, UNREADABLE),
            5,
            LODASH
          );
          const above = read(typeTexts(emptied, inserted));

          // Act
          const fixed = read(
            typeTexts(above, replaceLine(inserted, LINE_OF_REACT + 1, REACT))
          );

          // Assert
          expect(above.focus).toEqual(INDEX_FOCUS);
          expect(fixed.focus).toEqual(onDependency("src/index.js", 2));
          expect(fixed.tab).toBe("dependency");
        });

        it("should find the line again after a line was inserted above it before the read that put the file in focus", () => {
          // Arrange
          const before = createFocusedState(1);
          const broken = replaceLine(TEXT, LINE_OF_REACT, UNREADABLE);
          const inserted = insertLine(broken, 5, LODASH);
          const typed = typeTexts(before, broken, inserted);

          // Act
          const fixed = read(
            typeTexts(
              read(typed),
              replaceLine(inserted, LINE_OF_REACT + 1, REACT)
            )
          );

          // Assert
          expect(fixed.focus).toEqual(onDependency("src/index.js", 2));
        });

        it("should keep reading the line after the dependency came back, as the next keystroke moves it", () => {
          // Arrange
          const before = createFocusedState(1);
          const emptied = read(
            typeTexts(before, replaceLine(TEXT, LINE_OF_REACT, UNREADABLE))
          );
          const back = read(typeTexts(emptied, TEXT));

          // Act
          const inserted = read(typeTexts(back, insertLine(TEXT, 5, LODASH)));

          // Assert
          expect(back.focus).toEqual(onDependency("src/index.js", 1));
          expect(inserted.focus).toEqual(onDependency("src/index.js", 2));
        });
      });

      describe("when the user types a line above or below the dependency in focus", () => {
        it("should keep the dependency in focus on its line when a line is inserted above it", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const state = read(typeTexts(before, insertLine(TEXT, 5, LODASH)));

          // Assert
          expect(state.focus).toEqual(onDependency("src/index.js", 2));
          expect(state.tab).toBe("dependency");
        });

        it("should keep the dependency in focus on its line when a line is inserted below it", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const state = read(typeTexts(before, insertLine(TEXT, 7, LODASH)));

          // Assert
          expect(state.focus).toEqual(onDependency("src/index.js", 1));
        });

        it("should keep the dependency in focus on its line when Enter is pressed at its start and at its end", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const atStart = read(typeTexts(before, insertLine(TEXT, 6, "")));
          const atEnd = read(typeTexts(before, insertLine(TEXT, 7, "")));

          // Assert
          expect(atStart.focus).toEqual(onDependency("src/index.js", 1));
          expect(atEnd.focus).toEqual(onDependency("src/index.js", 1));
        });

        it("should keep the dependency in focus on its line when the line is edited into another statement", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const state = read(
            typeTexts(
              before,
              replaceLine(TEXT, LINE_OF_REACT, '  import y from "lodash";')
            )
          );

          // Assert
          expect(state.focus).toEqual(onDependency("src/index.js", 1));
          expect(getEdges(state)).toContain("src/index.js -> lodash");
        });

        it("should follow the line to the file that it is under now", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act: the line of `src/index.js` is deleted, so that its dependencies are the ones of the file above
          const state = read(typeTexts(before, deleteLine(TEXT, 4)));

          // Assert
          expect(state.focus).toEqual(onDependency("src/helpers/format.js", 0));
        });
      });

      describe("when lines of the file say the same", () => {
        const C = importModule("src/index.js", "react");
        const B = importOf("src/index.js", "src/helpers/format.js");

        it("should keep the dependency in focus on its own line when the line that says the same is typed above it", () => {
          // Arrange
          const before = createLinesState([C, B], 1);

          // Act
          const state = read(
            typeTexts(before, insertLine(toText(before.sketch), 5, FORMAT))
          );

          // Assert
          expect(getEdges(state)).toHaveLength(3);
          expect(state.focus).toEqual(onDependency("src/index.js", 2));
        });

        it("should move the dependency in focus to the line before it when a line above it is deleted", () => {
          // Arrange
          const before = createLinesState([B, C, B], 2);

          // Act
          const state = read(
            typeTexts(before, deleteLine(toText(before.sketch), 5))
          );

          // Assert
          expect(state.focus).toEqual(onDependency("src/index.js", 1));
          expect(state.tab).toBe("dependency");
        });

        it("should put the file in focus when the first of the lines that say the same is deleted and it is the one in focus", () => {
          // Arrange
          const before = createLinesState([B, C, B], 0);

          // Act
          const state = read(
            typeTexts(before, deleteLine(toText(before.sketch), 5))
          );

          // Assert
          expect(state.focus).toEqual(INDEX_FOCUS);
          expect(state.tab).toBe("node");
        });

        it("should keep the dependency in focus when the first of the lines that say the same is deleted and the one in focus is another", () => {
          // Arrange
          const before = createLinesState([B, C, B], 1);

          // Act
          const state = read(
            typeTexts(before, deleteLine(toText(before.sketch), 5))
          );

          // Assert
          expect(state.focus).toEqual(onDependency("src/index.js", 0));
        });
      });

      describe("when the line of the dependency in focus is gone", () => {
        it("should put its file in focus when the line is deleted", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const state = read(
            typeTexts(before, deleteLine(TEXT, LINE_OF_REACT))
          );

          // Assert
          expect(state.focus).toEqual(INDEX_FOCUS);
          expect(state.tab).toBe("node");
          expect(state.textAnchors).toBeUndefined();
        });

        it("should put its file in focus when the line was deleted and written again, although the text is the project it was", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const state = read(
            typeTexts(before, deleteLine(TEXT, LINE_OF_REACT), TEXT)
          );

          // Assert
          expect(state.sketch).toBe(before.sketch);
          expect(state.focus).toEqual(INDEX_FOCUS);
          expect(state.tab).toBe("node");
        });

        it("should put its file in focus when the line is no dependency line any more", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const state = read(
            typeTexts(before, replaceLine(TEXT, LINE_OF_REACT, "src/other.js"))
          );

          // Assert
          expect(state.focus).toEqual(INDEX_FOCUS);
          expect(state.tab).toBe("node");
          expect(state.textAnchors).toBeUndefined();
        });

        it("should put its file in focus when the line is blank", () => {
          // Arrange
          const before = createFocusedState(1);

          // Act
          const state = read(
            typeTexts(before, replaceLine(TEXT, LINE_OF_REACT, "   "))
          );

          // Assert
          expect(state.focus).toEqual(INDEX_FOCUS);
        });

        it("should leave nothing in focus when the file is gone too", () => {
          // Arrange
          const before = createFocusedState(1);
          const withoutFile = TEXT.replace(
            /^src\/index\.js\n(?: {2}.*\n)*/mu,
            ""
          );

          // Act
          const state = read(typeTexts(before, withoutFile));

          // Assert
          expect(state.focus).toEqual({ kind: "none" });
          expect(state.tab).toBe("sketch");
        });

        it("should leave the focus on the file when it was already there and its line was deleted", () => {
          // Arrange
          const before = createFocusedState(1);
          const emptied = read(
            typeTexts(before, replaceLine(TEXT, LINE_OF_REACT, UNREADABLE))
          );

          // Act
          const state = read(
            typeTexts(emptied, deleteLine(TEXT, LINE_OF_REACT))
          );

          // Assert
          expect(state.focus).toBe(emptied.focus);
          expect(state.textAnchors).toBeUndefined();
        });
      });
    });

    describe("a line that is cut and pasted somewhere else", () => {
      // A known limit: the pasted line is a new line, which nothing links to the one that was cut
      it("should leave the focus on the file when the keystrokes are read together", () => {
        // Arrange
        const before = createFocusedState(1);
        const cut = deleteLine(TEXT, LINE_OF_REACT);

        // Act
        const state = readText(
          typeTexts(before, cut, insertLine(cut, 8, REACT))
        );

        // Assert
        expect(state.focus).toEqual(INDEX_FOCUS);
        expect(state.tab).toBe("node");
      });

      it("should leave the focus on the file when the cut was read before the paste", () => {
        // Arrange
        const before = createFocusedState(1);
        const cut = deleteLine(TEXT, LINE_OF_REACT);
        const read = readText(typeTexts(before, cut));

        // Act
        const state = readText(typeTexts(read, insertLine(cut, 8, REACT)));

        // Assert
        expect(state.focus).toEqual(INDEX_FOCUS);
        expect(state.tab).toBe("node");
      });
    });

    describe("the focus changed after the last keystroke", () => {
      const OPEN_MAIN = {
        kind: "dependency",
        path: "src/index.js",
        index: 2,
      } as const;

      it("should anchor the dependency opened, and not the line of the one that was in focus, with the next keystroke", () => {
        // Arrange
        const typed = typeTexts(createFocusedState(1), `${TEXT}\n`);
        const opened = openTarget(typed, OPEN_MAIN);

        // Act
        const state = readText(
          typeTexts(opened, insertLine(`${TEXT}\n`, 5, LODASH))
        );

        // Assert
        expect(state.focus).toEqual(onDependency("src/index.js", 3));
      });

      it("should follow the sketch by the data of the dependencies when it is read without a keystroke since", () => {
        // Arrange
        const typed = typeTexts(
          createFocusedState(1),
          insertLine(TEXT, 5, LODASH)
        );
        const opened = openTarget(typed, OPEN_MAIN);

        // Act
        const state = readText(opened);

        // Assert
        expect(state.focus).toEqual(onDependency("src/index.js", 3));
        expect(state.textAnchors).toBeUndefined();
      });

      it("should anchor nothing for a file opened, because no line of it cannot be read", () => {
        // Arrange
        const typed = typeTexts(createFocusedState(1), `${TEXT}\n`);
        const opened = openTarget(typed, {
          kind: "file",
          path: "src/index.js",
        });

        // Act
        const state = typeTexts(opened, insertLine(`${TEXT}\n`, 5, LODASH));

        // Assert
        expect(state.textAnchors).toBeUndefined();
      });
    });

    describe("a new draft", () => {
      it("should be anchored from the text of the sketch after a draft was dropped by an edit of the picker", () => {
        // Arrange
        const typed = typeTexts(
          createFocusedState(1),
          insertLine(TEXT, 5, LODASH)
        );
        const edited = replaceDependency(
          typed,
          { path: "src/index.js", index: 1 },
          importModule("src/index.js", "preact")
        );

        // Act
        const state = readText(
          typeTexts(edited, insertLine(toText(edited.sketch), 5, LODASH))
        );

        // Assert
        expect(edited.textDraft).toBeUndefined();
        expect(state.focus).toEqual(onDependency("src/index.js", 2));
        expect(getEdges(state)).toContain("src/index.js -> preact");
      });

      it("should be anchored from the text of the sketch after a draft was dropped by leaving text mode", () => {
        // Arrange
        const typed = typeTexts(
          createFocusedState(1),
          insertLine(TEXT, 5, LODASH)
        );
        const tree = setView(typed, "tree");
        const text = setView(tree, "text");

        // Act
        const state = readText(typeTexts(text, deleteLine(TEXT, 5)));

        // Assert
        expect(text.textDraft).toBeUndefined();
        expect(state.focus).toEqual(onDependency("src/index.js", 0));
      });

      it("should not be anchored by the lines of another draft", () => {
        // Arrange
        const openNode = {
          kind: "dependency",
          path: "src/index.js",
          index: 1,
        } as const;
        const stale = createFocusedState(1, {
          focus: openNode,
          textDraft: TEXT,
          textAnchors: {
            draft: "another text",
            focus: { focus: openNode, line: 7 },
          },
        });

        // Act
        const state = readText(typeTexts(stale, insertLine(TEXT, 5, LODASH)));

        // Assert
        expect(state.focus).toEqual(onDependency("src/index.js", 2));
      });
    });

    describe("the anchors", () => {
      it("should be none while the focus is nothing, the config or a file", () => {
        // Arrange
        const focuses: Focus[] = [
          { kind: "none" },
          { kind: "config" },
          INDEX_FOCUS,
        ];

        // Act
        const states = focuses.map((openNode) =>
          setTextDraft(
            createDependencyState({ view: "text", focus: openNode }),
            TEXT
          )
        );

        // Assert
        expect(states.map(({ textAnchors }) => textAnchors)).toEqual([
          undefined,
          undefined,
          undefined,
        ]);
      });

      it("should say where the dependency in focus is written in the draft", () => {
        // Arrange
        const before = createFocusedState(1);
        const inserted = insertLine(TEXT, 5, LODASH);

        // Act
        const state = setTextDraft(before, inserted);

        // Assert
        expect(state.textAnchors).toEqual({
          draft: inserted,
          focus: { focus: before.focus, line: 7 },
          highlight: undefined,
        });
      });

      it("should say that the line is gone when the keystroke deleted it, and keep saying so", () => {
        // Arrange
        const before = createFocusedState(1);
        const deleted = deleteLine(TEXT, LINE_OF_REACT);

        // Act
        const state = typeTexts(before, deleted, `${deleted}\n`);

        // Assert
        expect(state.textAnchors?.focus).toEqual({
          focus: before.focus,
          line: undefined,
        });
      });

      it("should go with the draft when it settles", () => {
        // Arrange
        const before = createFocusedState(1);
        const typed = typeTexts(before, insertLine(TEXT, 5, `${LODASH}`));

        // Act
        const state = settleText(typed);

        // Assert
        expect(typed.textAnchors).toBeDefined();
        expect(state.textDraft).toBeUndefined();
        expect(state.textAnchors).toBeUndefined();
      });

      it("should stay while the draft has a line to fix after it settles", () => {
        // Arrange
        const before = createFocusedState(1);
        const typed = typeTexts(
          before,
          replaceLine(TEXT, LINE_OF_REACT, UNREADABLE)
        );

        // Act
        const state = settleText(typed);

        // Assert
        expect(state.textDraft).toBe(typed.textDraft);
        expect(state.textAnchors).toEqual({
          draft: typed.textDraft,
          focus: { focus: state.focus, line: LINE_OF_REACT },
          highlight: undefined,
        });
      });

      it("should keep the same state when a read changes nothing", () => {
        // Arrange
        const typed = typeTexts(createFocusedState(1), TEXT);

        // Act
        const state = readText(typed);

        // Assert
        expect(state).toBe(typed);
      });

      it("should not exist without editDependencies, whose dependency lines are not read", () => {
        // Arrange
        const before = createFocusedState(1, {
          capabilities: { ...ALL_CAPABILITIES, editDependencies: false },
        });

        // Act
        const state = typeTexts(before, insertLine(TEXT, 5, LODASH));

        // Assert
        expect(state.textAnchors).toBeUndefined();
      });

      it("should be replaced by the new draft of a state that holds the anchors of another one", () => {
        // Arrange
        const first = typeTexts(
          createFocusedState(1),
          insertLine(TEXT, 5, LODASH)
        );

        // Act
        const state = setTextDraft(first, TEXT);

        // Assert
        expect(state.textAnchors?.draft).toBe(TEXT);
        expect(state.textAnchors?.focus?.line).toBe(LINE_OF_REACT);
      });

      it("should drop the anchors that a read leaves without meaning", () => {
        // Arrange
        const typed = typeTexts(createFocusedState(1), TEXT);
        const stale = openTarget(typed, { kind: "file", path: "src/index.js" });

        // Act
        const state = readText(stale);

        // Assert
        expect(state.textAnchors).toBeUndefined();
      });
    });

    describe("the highlight", () => {
      it("should follow its dependency when a line is inserted above it", () => {
        // Arrange
        const before = createHighlightedState(2);

        // Act
        const state = readText(typeTexts(before, insertLine(TEXT, 5, LODASH)));

        // Assert
        expect(state.highlight).toEqual({
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 3 },
        });
        expect(state.focus).toEqual({ kind: "config" });
      });

      it("should keep the same highlight when its dependency is where it was", () => {
        // Arrange
        const before = createHighlightedState(2);

        // Act
        const state = readText(typeTexts(before, insertLine(TEXT, 8, LODASH)));

        // Assert
        expect(state.highlight).toBe(before.highlight);
      });

      it("should say where its dependency is written, besides the focus", () => {
        // Arrange
        const before = createHighlightedState(2);

        // Act
        const state = typeTexts(before, insertLine(TEXT, 5, LODASH));

        // Assert
        expect(state.textAnchors).toEqual({
          draft: insertLine(TEXT, 5, LODASH),
          focus: undefined,
          highlight: { dependency: before.highlight?.dependency, line: 8 },
        });
      });

      it("should stay while its line cannot be read, and take the dependency of the line when it reads again", () => {
        // Arrange
        const before = createHighlightedState(1);
        const broken = replaceLine(TEXT, LINE_OF_REACT, UNREADABLE);
        const unread = readText(typeTexts(before, broken));
        const inserted = insertLine(broken, 5, LODASH);
        const above = readText(typeTexts(unread, inserted));

        // Act
        const state = readText(
          typeTexts(above, replaceLine(inserted, LINE_OF_REACT + 1, REACT))
        );

        // Assert
        expect(unread.highlight).toBe(before.highlight);
        expect(above.highlight).toBe(before.highlight);
        expect(state.highlight).toEqual({
          range: RANGE,
          policy: 2,
          dependency: { path: "src/index.js", index: 2 },
        });
      });

      it("should keep its anchor for the dependency that its line gave it, so that the next keystroke moves the line without finding it again", () => {
        // Arrange
        const before = createHighlightedState(2);

        // Act
        const state = readText(typeTexts(before, insertLine(TEXT, 5, LODASH)));

        // Assert
        expect(state.highlight?.dependency).toEqual({
          path: "src/index.js",
          index: 3,
        });
        expect(state.textAnchors?.highlight).toEqual({
          dependency: state.highlight?.dependency,
          line: 8,
        });
        expect(state.textAnchors?.highlight?.dependency).toBe(
          state.highlight?.dependency
        );
      });

      it("should go when its line is deleted", () => {
        // Arrange
        const before = createHighlightedState(1);

        // Act
        const state = readText(
          typeTexts(before, deleteLine(TEXT, LINE_OF_REACT))
        );

        // Assert
        expect(state.highlight).toBeUndefined();
        expect(state.textAnchors).toBeUndefined();
      });

      it("should go when its line is no dependency line any more", () => {
        // Arrange
        const before = createHighlightedState(1);

        // Act
        const state = readText(
          typeTexts(before, replaceLine(TEXT, LINE_OF_REACT, "src/other.js"))
        );

        // Assert
        expect(state.highlight).toBeUndefined();
      });

      it("should follow the sketch by the data of the dependencies when another policy was opened after the last keystroke and the text is read", () => {
        // Arrange
        const typed = typeTexts(
          createHighlightedState(1),
          insertLine(TEXT, 5, LODASH)
        );
        const opened = openTarget(typed, {
          kind: "config",
          range: OTHER_RANGE,
          policy: 1,
          dependency: { path: "src/index.js", index: 2 },
        });

        // Act
        const state = readText(opened);

        // Assert
        expect(state.highlight?.dependency).toEqual({
          path: "src/index.js",
          index: 3,
        });
      });

      it("should anchor the dependency of another policy that was opened, and not the line of the one before, with the next keystroke", () => {
        // Arrange
        const typed = typeTexts(createHighlightedState(1), `${TEXT}\n`);
        const opened = openTarget(typed, {
          kind: "config",
          range: OTHER_RANGE,
          policy: 1,
          dependency: { path: "src/index.js", index: 2 },
        });

        // Act
        const state = readText(
          typeTexts(opened, insertLine(`${TEXT}\n`, 5, LODASH))
        );

        // Assert
        expect(state.highlight?.dependency).toEqual({
          path: "src/index.js",
          index: 3,
        });
      });

      it("should keep its anchor when the editor moves its range", () => {
        // Arrange
        const inserted = insertLine(TEXT, 5, LODASH);
        const typed = typeTexts(createHighlightedState(2), inserted);
        const moved = changeConfig(
          typed,
          "{ settings: {}, rules: { a: 1 } }",
          OTHER_RANGE
        );

        // Act
        const state = readText(
          typeTexts(moved, insertLine(inserted, 5, PREACT))
        );

        // Assert
        expect(state.highlight?.dependency).toEqual({
          path: "src/index.js",
          index: 4,
        });
        expect(state.highlight?.range).toEqual(OTHER_RANGE);
      });

      it("should follow its dependency and the focus follows another one", () => {
        // Arrange
        const focused = createFocusedState(1, {
          highlight: {
            range: RANGE,
            policy: 2,
            dependency: { path: "src/index.js", index: 2 },
          },
        });

        // Act
        const state = readText(typeTexts(focused, insertLine(TEXT, 5, LODASH)));

        // Assert
        expect(state.focus).toEqual(onDependency("src/index.js", 2));
        expect(state.highlight?.dependency).toEqual({
          path: "src/index.js",
          index: 3,
        });
      });
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

    it("should accept the tab of the node and the one of the sketch while a dependency is in focus", () => {
      // Arrange
      const before = createDependencyState({
        focus: onDependency("src/index.js", 1),
        tab: "dependency",
      });

      // Act
      const node = selectTab(before, "node");
      const sketch = selectTab(node, "sketch");
      const dependency = selectTab(sketch, "dependency");

      // Assert
      expect(node.tab).toBe("node");
      expect(sketch.tab).toBe("sketch");
      expect(dependency.tab).toBe("dependency");
      expect(sketch.focus).toBe(before.focus);
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
    it("should keep a new evaluation and its status", () => {
      // Arrange
      const evaluation = createEngine().evaluate({ ...SKETCH, config: "{}" });

      // Act
      const state = setEvaluation(createState(), evaluation, "pending");

      // Assert
      expect(state.evaluation).toBe(evaluation);
      expect(state.evaluationStatus).toBe("pending");
    });

    it("should return the same state when the evaluation and the status are the ones it has", () => {
      // Arrange
      const before = createState();

      // Act
      const state = setEvaluation(before, EVALUATION, "current");

      // Assert
      expect(state).toBe(before);
    });

    it("should keep a new status of the same evaluation", () => {
      // Arrange
      const before = createState();

      // Act
      const state = setEvaluation(before, EVALUATION, "late");

      // Assert
      expect(state.evaluation).toBe(EVALUATION);
      expect(state.evaluationStatus).toBe("late");
    });

    it("should keep no evaluation with a new status, before the first one arrives", () => {
      // Arrange
      const before = createSessionState(SKETCH, ALL_CAPABILITIES);

      // Act
      const state = setEvaluation(before, undefined, "stopped");

      // Assert
      expect(state.evaluation).toBeUndefined();
      expect(state.evaluationStatus).toBe("stopped");
    });

    it("should keep the highlight as it is when only the status changes, though the policies of the evaluation would place it elsewhere", () => {
      // Arrange
      const highlight = {
        range: RANGE,
        policy: 7,
        dependency: { path: "src/index.js", index: 0 },
      };
      const before = createState({ highlight });

      // Act
      const state = setEvaluation(before, EVALUATION, "late");

      // Assert
      expect(state.highlight).toBe(highlight);
    });
  });
});
