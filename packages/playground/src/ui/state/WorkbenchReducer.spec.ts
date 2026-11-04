import type { Sketch } from "../../contract";
import type { TextRange } from "../../engine";
import type { TextProblem } from "../../sketch";

import type { WorkbenchState } from "./Workbench.types";
import { createWorkbenchState, workbenchReducer } from "./WorkbenchReducer";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src/index.js", kind: "file" },
    { path: "src/helpers/format.js", kind: "file" },
  ],
  dependencies: [],
};

const RANGE: TextRange = { from: 10, to: 20, line: 2, column: 3 };

const OTHER_RANGE: TextRange = { from: 30, to: 40, line: 4, column: 5 };

const TEXT_PROBLEM: TextProblem = {
  line: 2,
  text: "src//index.js",
  reason: "A path cannot have an empty segment.",
};

/**
 * Creates the state of a workbench that has a file open.
 * @param overrides What differs from the first state.
 * @returns The state.
 */
function createState(overrides: Partial<WorkbenchState> = {}): WorkbenchState {
  return { ...createWorkbenchState(SKETCH), ...overrides };
}

describe("createWorkbenchState", () => {
  it("should start with the sketch, nothing in focus, the tree and the sketch tab", () => {
    // Act
    const state = createWorkbenchState(SKETCH);

    // Assert
    expect(state).toEqual({
      sketch: SKETCH,
      focus: { kind: "none" },
      view: "tree",
      tab: "sketch",
      collapsed: false,
      textProblems: [],
      reveal: undefined,
      revealCount: 0,
    });
  });
});

describe("workbenchReducer", () => {
  describe("sketch", () => {
    it("should replace the sketch", () => {
      // Arrange
      const next: Sketch = { ...SKETCH, tree: [] };

      // Act
      const state = workbenchReducer(createState(), {
        type: "sketch",
        sketch: next,
      });

      // Assert
      expect(state.sketch).toBe(next);
    });

    it("should keep the focus on a file that the new sketch still has", () => {
      // Arrange
      const focused = createState({
        focus: { kind: "file", path: "src/index.js" },
        tab: "node",
      });
      const next: Sketch = {
        ...SKETCH,
        tree: [{ path: "src/index.js", kind: "file" }],
      };

      // Act
      const state = workbenchReducer(focused, { type: "sketch", sketch: next });

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "src/index.js" });
      expect(state.tab).toBe("node");
    });

    it("should leave nothing in focus when the new sketch has no longer the file in focus", () => {
      // Arrange
      const focused = createState({
        focus: { kind: "file", path: "src/index.js" },
        tab: "node",
      });
      const next: Sketch = {
        ...SKETCH,
        tree: [{ path: "src/helpers/format.js", kind: "file" }],
      };

      // Act
      const state = workbenchReducer(focused, { type: "sketch", sketch: next });

      // Assert
      expect(state.sketch).toBe(next);
      expect(state.focus).toEqual({ kind: "none" });
      expect(state.tab).toBe("sketch");
    });

    it("should not take a folder with the same path for the file in focus", () => {
      // Arrange
      const focused = createState({
        focus: { kind: "file", path: "src/index.js" },
        tab: "node",
      });
      const next: Sketch = {
        ...SKETCH,
        tree: [{ path: "src/index.js/inner.js", kind: "file" }],
      };

      // Act
      const state = workbenchReducer(focused, { type: "sketch", sketch: next });

      // Assert
      expect(state.focus).toEqual({ kind: "none" });
    });

    it("should keep the config in focus whatever the new sketch has", () => {
      // Arrange
      const focused = createState({ focus: { kind: "config" }, tab: "node" });

      // Act
      const state = workbenchReducer(focused, {
        type: "sketch",
        sketch: { ...SKETCH, tree: [] },
      });

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
    });
  });

  describe("config", () => {
    it("should replace the config of the sketch and keep the rest of it", () => {
      // Act
      const state = workbenchReducer(createState(), {
        type: "config",
        config: "{ settings: { a: 1 }, rules: {} }",
      });

      // Assert
      expect(state.sketch).toEqual({
        ...SKETCH,
        config: "{ settings: { a: 1 }, rules: {} }",
      });
      expect(state.sketch.tree).toBe(SKETCH.tree);
    });
  });

  describe("focus", () => {
    it("should select the tab of the node when a file is put in focus", () => {
      // Act
      const state = workbenchReducer(createState(), {
        type: "focus",
        focus: { kind: "file", path: "src/index.js" },
      });

      // Assert
      expect(state.focus).toEqual({ kind: "file", path: "src/index.js" });
      expect(state.tab).toBe("node");
    });

    it("should select the tab of the node when the config is put in focus", () => {
      // Act
      const state = workbenchReducer(createState(), {
        type: "focus",
        focus: { kind: "config" },
      });

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
    });

    it("should select the sketch tab when nothing is put in focus", () => {
      // Arrange
      const focused = createState({
        focus: { kind: "file", path: "src/index.js" },
        tab: "node",
      });

      // Act
      const state = workbenchReducer(focused, {
        type: "focus",
        focus: { kind: "none" },
      });

      // Assert
      expect(state.focus).toEqual({ kind: "none" });
      expect(state.tab).toBe("sketch");
    });

    it("should select the tab of the node even when the user had selected the sketch's", () => {
      // Arrange
      const focused = createState({
        focus: { kind: "file", path: "src/index.js" },
        tab: "sketch",
      });

      // Act
      const state = workbenchReducer(focused, {
        type: "focus",
        focus: { kind: "file", path: "src/helpers/format.js" },
      });

      // Assert
      expect(state.tab).toBe("node");
    });

    it("should drop the range to reveal when the focus leaves the config", () => {
      // Arrange
      const revealed = workbenchReducer(createState(), {
        type: "reveal",
        range: RANGE,
      });

      // Act
      const state = workbenchReducer(revealed, {
        type: "focus",
        focus: { kind: "file", path: "src/index.js" },
      });

      // Assert
      expect(state.reveal).toBeUndefined();
    });

    it("should keep the range to reveal when the config is put in focus again", () => {
      // Arrange
      const revealed = workbenchReducer(createState(), {
        type: "reveal",
        range: RANGE,
      });

      // Act
      const state = workbenchReducer(revealed, {
        type: "focus",
        focus: { kind: "config" },
      });

      // Assert
      expect(state.reveal).toEqual({ range: RANGE, key: 1 });
    });

    it("should leave the collapsed panel as it is", () => {
      // Act
      const state = workbenchReducer(createState({ collapsed: true }), {
        type: "focus",
        focus: { kind: "config" },
      });

      // Assert
      expect(state.collapsed).toBe(true);
    });
  });

  describe("reveal", () => {
    it("should put the config in focus and ask to show the range with the first key", () => {
      // Arrange
      const focused = createState({
        focus: { kind: "file", path: "src/index.js" },
        tab: "node",
      });

      // Act
      const state = workbenchReducer(focused, { type: "reveal", range: RANGE });

      // Assert
      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
      expect(state.reveal).toEqual({ range: RANGE, key: 1 });
    });

    it("should use a new key for each request", () => {
      // Arrange
      const first = workbenchReducer(createState(), {
        type: "reveal",
        range: RANGE,
      });

      // Act
      const second = workbenchReducer(first, {
        type: "reveal",
        range: OTHER_RANGE,
      });

      // Assert
      expect(second.reveal).toEqual({ range: OTHER_RANGE, key: 2 });
    });

    it("should not use a key again after the request was dropped", () => {
      // Arrange
      const first = workbenchReducer(createState(), {
        type: "reveal",
        range: RANGE,
      });
      const left = workbenchReducer(first, {
        type: "focus",
        focus: { kind: "none" },
      });

      // Act
      const again = workbenchReducer(left, { type: "reveal", range: RANGE });

      // Assert
      expect(again.reveal?.key).toBe(2);
    });
  });

  describe("view", () => {
    it("should change how the project is shown", () => {
      // Act
      const state = workbenchReducer(createState(), {
        type: "view",
        view: "text",
      });

      // Assert
      expect(state.view).toBe("text");
    });
  });

  describe("tab", () => {
    it("should select the tab", () => {
      // Arrange
      const focused = createState({ focus: { kind: "config" }, tab: "node" });

      // Act
      const state = workbenchReducer(focused, { type: "tab", tab: "sketch" });

      // Assert
      expect(state.tab).toBe("sketch");
    });

    it("should expand the panel, because a tab is pressed to be read", () => {
      // Act
      const state = workbenchReducer(createState({ collapsed: true }), {
        type: "tab",
        tab: "sketch",
      });

      // Assert
      expect(state.collapsed).toBe(false);
    });
  });

  describe("collapsed", () => {
    it("should collapse the panel", () => {
      // Act
      const state = workbenchReducer(createState(), {
        type: "collapsed",
        collapsed: true,
      });

      // Assert
      expect(state.collapsed).toBe(true);
    });

    it("should expand the panel", () => {
      // Act
      const state = workbenchReducer(createState({ collapsed: true }), {
        type: "collapsed",
        collapsed: false,
      });

      // Assert
      expect(state.collapsed).toBe(false);
    });

    it("should return the same state when the panel is already as asked", () => {
      // Arrange
      const before = createState({ collapsed: true });

      // Act
      const state = workbenchReducer(before, {
        type: "collapsed",
        collapsed: true,
      });

      // Assert
      expect(state).toBe(before);
    });
  });

  describe("textProblems", () => {
    it("should keep the lines that could not be read", () => {
      // Act
      const state = workbenchReducer(createState(), {
        type: "textProblems",
        problems: [TEXT_PROBLEM],
      });

      // Assert
      expect(state.textProblems).toEqual([TEXT_PROBLEM]);
    });

    it("should drop them when there are none", () => {
      // Arrange
      const before = createState({ textProblems: [TEXT_PROBLEM] });

      // Act
      const state = workbenchReducer(before, {
        type: "textProblems",
        problems: [],
      });

      // Assert
      expect(state.textProblems).toEqual([]);
    });

    it("should return the same state when there were none and there are none", () => {
      // Arrange
      const before = createState();

      // Act
      const state = workbenchReducer(before, {
        type: "textProblems",
        problems: [],
      });

      // Assert
      expect(state).toBe(before);
    });
  });
});
