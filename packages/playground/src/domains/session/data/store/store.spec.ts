import type { Sketch, SketchDependency } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { Engine, TextRange } from "@/domains/evaluation/helpers/engine";

import { createSessionStore } from "./store";
import { EVALUATION_DELAY } from "./store.constants";
import { ALL_CAPABILITIES, NO_CAPABILITIES } from "./store.mock";
import type { SessionStore } from "./store.types";

// The real engines, whose evaluations the tests only count
jest.mock<{ createEngine: typeof createEngine }>(
  "@/domains/evaluation/helpers/engine",
  () => {
    const actual = jest.requireActual<{ createEngine: typeof createEngine }>(
      "@/domains/evaluation/helpers/engine"
    );
    return {
      ...actual,
      createEngine: jest.fn(() => {
        const engine = actual.createEngine();
        return { evaluate: jest.fn(engine.evaluate) };
      }),
    };
  }
);

/**
 * Gets the `evaluate` of an engine that a store created.
 * @param index The position of the engine among the ones created since the test began.
 * @returns The `evaluate` of the engine, which counts its calls.
 */
function getEvaluate(index = 0): jest.MockedFunction<Engine["evaluate"]> {
  return jest.mocked(
    jest.mocked(createEngine).mock.results[index].value.evaluate
  );
}

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src/helpers/format.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
  ],
  dependencies: [],
};

/** A value import of the format helper by `src/index.js` */
const INDEX_IMPORTS_FORMAT: SketchDependency = {
  from: "src/index.js",
  target: { kind: "node", path: "src/helpers/format.js" },
  syntax: "import",
  importKind: "value",
  specifiers: [{ kind: "named", name: "format" }],
};

/** A require of `react` by `src/index.js` */
const INDEX_REQUIRES_REACT: SketchDependency = {
  from: "src/index.js",
  target: { kind: "external", name: "react" },
  syntax: "require",
  importKind: "value",
  specifiers: [],
};

const SKETCH_WITH_DEPENDENCY: Sketch = {
  ...SKETCH,
  dependencies: [INDEX_IMPORTS_FORMAT],
};

const OTHER_SKETCH: Sketch = {
  ...SKETCH,
  tree: [{ path: "main.js", kind: "file" }],
};

/** A config with two policies, one per line */
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

/** The policy that an edit puts before the second one */
const INSERTED_POLICY =
  '        { allow: { to: { element: { type: "main" } } } },\n';

const SECOND_POLICY_AT = POLICY_CONFIG.indexOf("        { disallow");

/** The config with a policy before the second one, which is the third now */
const EDITED_POLICY_CONFIG =
  POLICY_CONFIG.slice(0, SECOND_POLICY_AT) +
  INSERTED_POLICY +
  POLICY_CONFIG.slice(SECOND_POLICY_AT);

const POLICY_SKETCH: Sketch = { ...SKETCH, config: POLICY_CONFIG };

describe("createSessionStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getState", () => {
    it("should start from the sketch, with nothing in focus", () => {
      // Act
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Assert
      expect(store.getState().sketch).toBe(SKETCH);
      expect(store.getState().focus).toEqual({ kind: "none" });
    });

    it("should have the evaluation of the sketch at once, so that the first render has one", () => {
      // Act
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Assert
      expect(store.getState().evaluation.sketch).toBe(SKETCH);
      expect(store.getState().evaluation.files.size).toBe(2);
    });

    it("should not evaluate the first sketch again after the delay", () => {
      // Arrange
      createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      jest.advanceTimersByTime(EVALUATION_DELAY * 2);

      // Assert
      expect(getEvaluate()).toHaveBeenCalledTimes(1);
    });

    it("should give the same state until something changes", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const first = store.getState();

      // Act
      store.setView("tree");
      store.cancelRename();

      // Assert
      expect(store.getState()).toBe(first);
    });
  });

  describe("evaluation of a tree edit", () => {
    it("should be at once", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.removeNode("src/index.js");

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(evaluation.sketch).toBe(sketch);
      expect(evaluation.files.size).toBe(1);
      expect(getEvaluate()).toHaveBeenCalledTimes(2);
    });

    it("should not wait for a timer", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.addNode("file");

      // Assert
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should be at once for the lines read from text mode", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.setView("text");
      store.setTextDraft("main.js\n");

      // Act
      store.readText();

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(evaluation.sketch).toBe(sketch);
      expect(Array.from(evaluation.files.keys())).toEqual(["main.js"]);
    });
  });

  describe("evaluation of a config edit", () => {
    it("should keep the previous evaluation until the delay has passed", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.changeConfig("{}");
      jest.advanceTimersByTime(EVALUATION_DELAY - 1);

      // Assert
      expect(store.getState().sketch.config).toBe("{}");
      expect(store.getState().evaluation.sketch).toBe(SKETCH);
    });

    it("should evaluate the new sketch when the delay has passed", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.changeConfig("{}");

      // Act
      jest.advanceTimersByTime(EVALUATION_DELAY);

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(evaluation.sketch).toBe(sketch);
      expect(sketch.config).toBe("{}");
    });

    it("should wait for the delay after the last of the edits, and evaluate only that one", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.changeConfig("{ a");
      jest.advanceTimersByTime(EVALUATION_DELAY - 50);
      store.changeConfig("{ ab");
      jest.advanceTimersByTime(EVALUATION_DELAY - 50);
      const midway = store.getState().evaluation.sketch;
      jest.advanceTimersByTime(50);

      // Assert
      expect(midway).toBe(SKETCH);
      expect(store.getState().evaluation.sketch.config).toBe("{ ab");
      expect(getEvaluate()).toHaveBeenCalledTimes(2);
      expect(getEvaluate()).toHaveBeenLastCalledWith(
        expect.objectContaining({ config: "{ ab" })
      );
    });

    it("should wait for the delay although a command that does not edit the sketch came in between", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.changeConfig("{}");

      // Act
      store.setView("text");
      jest.advanceTimersByTime(EVALUATION_DELAY);

      // Assert
      expect(store.getState().evaluation.sketch.config).toBe("{}");
    });

    it("should not evaluate when the config does not change", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.changeConfig(SKETCH.config);
      jest.advanceTimersByTime(EVALUATION_DELAY * 2);

      // Assert
      expect(getEvaluate()).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe("evaluation of a tree edit while a config edit waits", () => {
    it("should evaluate everything at once, the config edit included", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.changeConfig("{}");

      // Act
      store.addNode("file");

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(sketch.config).toBe("{}");
      expect(evaluation.sketch).toBe(sketch);
    });

    it("should cancel the timer, so that nothing is evaluated again", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.changeConfig("{}");
      store.addNode("file");
      getEvaluate().mockClear();

      // Act
      jest.advanceTimersByTime(EVALUATION_DELAY * 2);

      // Assert
      expect(jest.getTimerCount()).toBe(0);
      expect(getEvaluate()).not.toHaveBeenCalled();
    });
  });

  describe("subscribe", () => {
    it("should call the listener once for a tree edit", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      store.removeNode("src/index.js");

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should call the listener for a config edit, and again when its evaluation comes", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      store.changeConfig("{}");
      const afterEdit = listener.mock.calls.length;
      jest.advanceTimersByTime(EVALUATION_DELAY);

      // Assert
      expect(afterEdit).toBe(1);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("should call the listener once for a change that is not an edit", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      store.open({ kind: "config" });

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should not call the listener when a command changes nothing", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      store.setView("tree");
      store.cancelRename();
      store.changeConfig(SKETCH.config);
      store.removeNode("gone.js");
      store.toggleFolder("src", true);
      store.setProblemsCollapsed(false);
      store.readText();
      store.settleText();

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });

    it("should call every listener", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const first = jest.fn();
      const second = jest.fn();

      store.subscribe(first);
      store.subscribe(second);

      // Act
      store.setView("text");

      // Assert
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should read the new state when the listener is called", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const views: string[] = [];

      store.subscribe(() => views.push(store.getState().view));

      // Act
      store.setView("text");

      // Assert
      expect(views).toEqual(["text"]);
    });

    it("should stop calling the listener that unsubscribed, and keep calling the others", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const removed = jest.fn();
      const kept = jest.fn();
      const unsubscribe = store.subscribe(removed);

      store.subscribe(kept);

      // Act
      unsubscribe();
      store.setView("text");

      // Assert
      expect(removed).not.toHaveBeenCalled();
      expect(kept).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispose", () => {
    it("should cancel the evaluation that waits out its delay", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();

      store.changeConfig("{}");
      store.subscribe(listener);
      getEvaluate().mockClear();

      // Act
      store.dispose();
      jest.advanceTimersByTime(EVALUATION_DELAY * 2);

      // Assert
      expect(jest.getTimerCount()).toBe(0);
      expect(getEvaluate()).not.toHaveBeenCalled();
      expect(listener).not.toHaveBeenCalled();
      expect(store.getState().evaluation.sketch).toBe(SKETCH);
    });

    it("should do nothing when no evaluation waits", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      const dispose = (): void => store.dispose();

      // Assert
      expect(dispose).not.toThrow();
    });
  });

  describe("open", () => {
    it("should open the target", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.open({ kind: "file", path: "src/index.js" });

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "file",
        path: "src/index.js",
      });
      expect(store.getState().tab).toBe("node");
    });

    it("should ask to reveal the range of a config target", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const range = { from: 1, to: 2, line: 1, column: 2 };

      // Act
      store.open({ kind: "config", range });

      // Assert
      expect(store.getState().focus).toEqual({ kind: "config" });
      expect(store.getState().reveal).toEqual({ range, key: 1 });
    });
  });

  describe("open with a dependency", () => {
    it("should put the dependency in focus and select its tab", () => {
      // Arrange
      const store = createSessionStore(
        SKETCH_WITH_DEPENDENCY,
        ALL_CAPABILITIES
      );

      // Act
      store.open({ kind: "dependency", path: "src/index.js", index: 0 });

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: "src/index.js",
        index: 0,
      });
      expect(store.getState().tab).toBe("dependency");
    });

    it("should keep the policy that a config target came from highlighted", () => {
      // Arrange
      const store = createSessionStore(
        SKETCH_WITH_DEPENDENCY,
        ALL_CAPABILITIES
      );
      const range = { from: 1, to: 2, line: 1, column: 2 };
      const dependency = { path: "src/index.js", index: 0 };

      // Act
      store.open({ kind: "config", range, policy: 0, dependency });

      // Assert
      expect(store.getState().highlight).toEqual({
        range,
        policy: 0,
        dependency,
      });
    });
  });

  describe("selectItem", () => {
    it("should select a folder", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.selectItem("src");

      // Assert
      expect(store.getState().pickedFolder).toBe("src");
    });

    it("should open a file", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.selectItem("src/index.js");

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "file",
        path: "src/index.js",
      });
    });
  });

  describe("toggleFolder", () => {
    it("should remember the folders that are closed", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.toggleFolder("src", false);

      // Assert
      expect(Array.from(store.getState().closedFolders)).toEqual(["src"]);
    });

    it("should forget the folders that are open again", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.toggleFolder("src", false);

      // Act
      store.toggleFolder("src", true);

      // Assert
      expect(store.getState().closedFolders.size).toBe(0);
    });
  });

  describe("changeConfig", () => {
    it("should replace the config of the sketch", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.changeConfig("{}");

      // Assert
      expect(store.getState().sketch).toEqual({ ...SKETCH, config: "{}" });
    });

    describe("with the highlighted policy", () => {
      const DEPENDENCY = { path: "src/index.js", index: 0 };

      /**
       * Creates a store with the config open at its second policy.
       * @returns The store, and the range that the second policy has after an edit that puts a policy before it, as the editor reports it.
       */
      function openSecondPolicy(): {
        store: SessionStore;
        moved: TextRange;
      } {
        const store = createSessionStore(POLICY_SKETCH, ALL_CAPABILITIES);
        const second = store.getState().evaluation.policies[1];

        store.open({
          kind: "config",
          range: second.range,
          policy: 1,
          dependency: DEPENDENCY,
        });

        return {
          store,
          moved: {
            ...second.range,
            from: second.range.from + INSERTED_POLICY.length,
            to: second.range.to + INSERTED_POLICY.length,
            line: second.range.line + 1,
          },
        };
      }

      it("should move the range with the text in one notification", () => {
        // Arrange
        const { store, moved } = openSecondPolicy();
        const listener = jest.fn(() => {
          const { sketch, highlight } = store.getState();

          expect(sketch.config).toBe(EDITED_POLICY_CONFIG);
          expect(highlight?.range).toEqual(moved);
        });
        store.subscribe(listener);

        // Act
        store.changeConfig(EDITED_POLICY_CONFIG, moved);

        // Assert
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it("should keep the index of the policy until the config is evaluated, and find it again then", () => {
        // Arrange
        const { store, moved } = openSecondPolicy();

        // Act
        store.changeConfig(EDITED_POLICY_CONFIG, moved);
        const whileBehind = store.getState().highlight?.policy;
        jest.advanceTimersByTime(EVALUATION_DELAY);

        // Assert
        expect(whileBehind).toBe(1);
        expect(store.getState().highlight).toEqual({
          range: moved,
          policy: 2,
          dependency: DEPENDENCY,
        });
      });

      it("should find the policy again with the evaluation that an edit of the tree makes at once", () => {
        // Arrange
        const { store, moved } = openSecondPolicy();
        store.changeConfig(EDITED_POLICY_CONFIG, moved);

        // Act
        store.addNode("folder");

        // Assert
        expect(store.getState().highlight?.policy).toBe(2);
      });

      it("should drop the highlight when the editor says it has none", () => {
        // Arrange
        const { store } = openSecondPolicy();

        // Act
        store.changeConfig(EDITED_POLICY_CONFIG, null);

        // Assert
        expect(store.getState().highlight).toBeUndefined();
      });

      it("should leave the highlight alone when the text changes without a range", () => {
        // Arrange
        const { store } = openSecondPolicy();
        const { highlight } = store.getState();

        // Act
        store.changeConfig(EDITED_POLICY_CONFIG);
        jest.advanceTimersByTime(EVALUATION_DELAY);

        // Assert
        expect(store.getState().highlight?.range).toBe(highlight?.range);
      });
    });
  });

  describe("addNode", () => {
    it("should add the node, open it and start renaming it", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.addNode("file");

      // Assert
      const state = store.getState();

      expect(state.sketch.tree).toContainEqual({
        path: "new-file.js",
        kind: "file",
      });
      expect(state.focus).toEqual({ kind: "file", path: "new-file.js" });
      expect(state.renaming).toBe("new-file.js");
    });
  });

  describe("startRename and cancelRename", () => {
    it("should start renaming a node and give up", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.startRename("src/index.js");
      const renaming = store.getState().renaming;

      store.cancelRename();

      // Assert
      expect(renaming).toBe("src/index.js");
      expect(store.getState().renaming).toBeUndefined();
    });
  });

  describe("renameNode", () => {
    it("should rename the node and give its new path", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.startRename("src/index.js");

      // Act
      const outcome = store.renameNode("src/index.js", "app.js");

      // Assert
      expect(outcome).toEqual({ path: "src/app.js" });
      expect(store.getState().sketch.tree).toContainEqual({
        path: "src/app.js",
        kind: "file",
      });
      expect(store.getState().renaming).toBeUndefined();
    });

    it("should evaluate the renamed sketch at once", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.renameNode("src/index.js", "app.js");

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(evaluation.sketch).toBe(sketch);
      expect(evaluation.files.has("src/app.js")).toBe(true);
    });

    it("should give the reason and change nothing when the name is refused", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();
      const before = store.getState();

      store.subscribe(listener);

      // Act
      const outcome = store.renameNode("src/index.js", "helpers/format.js");

      // Assert
      expect(outcome).toEqual({ error: "That path already exists." });
      expect(store.getState()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });

    it("should end the rename without a change when the name is the same", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.startRename("src/index.js");

      // Act
      const outcome = store.renameNode("src/index.js", "index.js");

      // Assert
      expect(outcome).toEqual({ path: "src/index.js" });
      expect(store.getState().sketch).toBe(SKETCH);
      expect(store.getState().renaming).toBeUndefined();
      expect(getEvaluate()).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeNode", () => {
    it("should remove the node and everything under it", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.removeNode("src/helpers");

      // Assert
      expect(store.getState().sketch.tree).toEqual([
        { path: "src/index.js", kind: "file" },
      ]);
    });
  });

  describe("addDependency", () => {
    it("should add the dependency and put it in focus", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.addDependency(INDEX_IMPORTS_FORMAT);

      // Assert
      const { sketch, focus: openNode, tab } = store.getState();

      expect(sketch.dependencies).toEqual([INDEX_IMPORTS_FORMAT]);
      expect(openNode).toEqual({
        kind: "dependency",
        path: "src/index.js",
        index: 0,
      });
      expect(tab).toBe("dependency");
    });

    it("should evaluate the dependency at once, without waiting for a timer", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.addDependency(INDEX_IMPORTS_FORMAT);

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(evaluation.sketch).toBe(sketch);
      expect(evaluation.dependencies).toHaveLength(1);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should evaluate the config edit that was waiting too", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.changeConfig("{ settings: {}, rules: {}, }");

      // Act
      store.addDependency(INDEX_IMPORTS_FORMAT);

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(evaluation.sketch).toBe(sketch);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should call the listener once", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      store.addDependency(INDEX_IMPORTS_FORMAT);

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("should change nothing and notify no listener when the dependency points to its own file", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const before = store.getState();
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      store.addDependency({
        ...INDEX_IMPORTS_FORMAT,
        target: { kind: "node", path: "src/index.js" },
      });

      // Assert
      expect(store.getState()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("replaceDependency", () => {
    it("should replace the dependency in its position, and evaluate the new one at once", () => {
      // Arrange
      const store = createSessionStore(
        SKETCH_WITH_DEPENDENCY,
        ALL_CAPABILITIES
      );

      // Act
      store.replaceDependency(
        { path: "src/index.js", index: 0 },
        INDEX_REQUIRES_REACT
      );

      // Assert
      const { sketch, evaluation } = store.getState();

      expect(sketch.dependencies).toEqual([INDEX_REQUIRES_REACT]);
      expect(evaluation.sketch).toBe(sketch);
      expect(evaluation.dependencies[0].source).toBe("react");
    });

    it("should change nothing without editDependencies", () => {
      // Arrange
      const store = createSessionStore(SKETCH_WITH_DEPENDENCY, NO_CAPABILITIES);
      const before = store.getState();

      // Act
      store.replaceDependency(
        { path: "src/index.js", index: 0 },
        INDEX_REQUIRES_REACT
      );

      // Assert
      expect(store.getState()).toBe(before);
    });
  });

  describe("removeDependency", () => {
    it("should remove the dependency, and the focus goes to its file when it was in focus", () => {
      // Arrange
      const store = createSessionStore(
        SKETCH_WITH_DEPENDENCY,
        ALL_CAPABILITIES
      );

      store.open({ kind: "dependency", path: "src/index.js", index: 0 });

      // Act
      store.removeDependency({ path: "src/index.js", index: 0 });

      // Assert
      const { sketch, focus: openNode, tab, evaluation } = store.getState();

      expect(sketch.dependencies).toEqual([]);
      expect(openNode).toEqual({ kind: "file", path: "src/index.js" });
      expect(tab).toBe("node");
      expect(evaluation.dependencies).toEqual([]);
    });

    it("should change nothing without editDependencies", () => {
      // Arrange
      const store = createSessionStore(SKETCH_WITH_DEPENDENCY, NO_CAPABILITIES);
      const before = store.getState();
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      store.removeDependency({ path: "src/index.js", index: 0 });

      // Assert
      expect(store.getState()).toBe(before);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("setView", () => {
    it("should change how the project is shown", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.setView("text");

      // Assert
      expect(store.getState().view).toBe("text");
    });
  });

  describe("setTextDraft, readText and settleText", () => {
    it("should keep the draft, read it into the sketch and drop it when settled", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.setView("text");

      // Act
      store.setTextDraft("src/index.js\nmain.js\n");
      const draft = store.getState().textDraft;

      store.readText();
      const afterRead = store.getState();

      store.settleText();

      // Assert
      expect(draft).toBe("src/index.js\nmain.js\n");
      expect(afterRead.sketch.tree.map(({ path }) => path)).toEqual([
        "src/index.js",
        "main.js",
      ]);
      expect(afterRead.textDraft).toBe("src/index.js\nmain.js\n");
      expect(store.getState().textDraft).toBeUndefined();
    });
  });

  describe("a dependency edited while text mode shows", () => {
    // The text of the sketch with its dependency, and a line under it that cannot be read
    const STALE_TEXT = [
      "src/helpers/format.js",
      "src/index.js",
      '  import { format } from "./helpers/format";',
      "  nonsense",
      "",
    ].join("\n");

    it.each<
      [string, (store: SessionStore) => void, readonly SketchDependency[]]
    >([
      [
        "addDependency",
        (store) => store.addDependency(INDEX_REQUIRES_REACT),
        [INDEX_IMPORTS_FORMAT, INDEX_REQUIRES_REACT],
      ],
      [
        "replaceDependency",
        (store) =>
          store.replaceDependency(
            { path: "src/index.js", index: 0 },
            INDEX_REQUIRES_REACT
          ),
        [INDEX_REQUIRES_REACT],
      ],
      [
        "removeDependency",
        (store) => store.removeDependency({ path: "src/index.js", index: 0 }),
        [],
      ],
    ])(
      "should drop the draft with %s, so that reading the text keeps the edit",
      (_name, edit, expected) => {
        // Arrange
        const store = createSessionStore(
          SKETCH_WITH_DEPENDENCY,
          ALL_CAPABILITIES
        );

        store.setView("text");
        store.setTextDraft(STALE_TEXT);
        store.readText();

        // Act
        edit(store);
        const edited = store.getState();

        store.readText();
        store.settleText();

        // Assert
        expect(edited.textDraft).toBeUndefined();
        expect(edited.sketch.dependencies).toEqual(expected);
        expect(store.getState().sketch.dependencies).toEqual(expected);
      }
    );

    it("should evaluate the edit at once and keep the view", () => {
      // Arrange
      const store = createSessionStore(
        SKETCH_WITH_DEPENDENCY,
        ALL_CAPABILITIES
      );

      store.setView("text");
      store.setTextDraft(STALE_TEXT);

      // Act
      store.removeDependency({ path: "src/index.js", index: 0 });

      // Assert
      expect(store.getState().view).toBe("text");
      expect(store.getState().evaluation.dependencies).toEqual([]);
    });
  });

  describe("text mode without editDependencies", () => {
    const NO_DEPENDENCY_EDITS = {
      ...ALL_CAPABILITIES,
      editDependencies: false,
    };

    it("should settle a draft whose dependency lines cannot be read, and keep the dependencies of the sketch", () => {
      // Arrange
      const store = createSessionStore(
        SKETCH_WITH_DEPENDENCY,
        NO_DEPENDENCY_EDITS
      );

      store.setView("text");
      store.setTextDraft(
        "src/helpers/format.js\nsrc/index.js\n  nonsense\n  import { a } from './missing'\nmain.js\n"
      );

      // Act
      store.settleText();

      // Assert
      const { textDraft, sketch } = store.getState();

      expect(textDraft).toBeUndefined();
      expect(sketch.tree.map(({ path }) => path)).toEqual([
        "src/helpers/format.js",
        "src/index.js",
        "main.js",
      ]);
      expect(sketch.dependencies).toEqual([INDEX_IMPORTS_FORMAT]);
    });

    it("should keep the draft of a node line that cannot be read", () => {
      // Arrange
      const store = createSessionStore(SKETCH, NO_DEPENDENCY_EDITS);
      const draft = "src/index.js\nsrc/index.js\n";

      store.setView("text");
      store.setTextDraft(draft);

      // Act
      store.settleText();

      // Assert
      expect(store.getState().textDraft).toBe(draft);
    });
  });

  describe("selectTab and setProblemsCollapsed", () => {
    it("should select a tab and expand the panel that was collapsed", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      store.setProblemsCollapsed(true);
      const collapsed = store.getState().problemsCollapsed;

      // Act
      store.selectTab("node");

      // Assert
      expect(collapsed).toBe(true);
      expect(store.getState().tab).toBe("node");
      expect(store.getState().problemsCollapsed).toBe(false);
    });
  });

  describe("capabilities", () => {
    it("should keep the capabilities it was created with in its state", () => {
      // Act
      const store = createSessionStore(SKETCH, NO_CAPABILITIES);

      // Assert
      expect(store.getState().capabilities).toBe(NO_CAPABILITIES);
    });

    it.each<[string, (store: SessionStore) => unknown]>([
      ["adding a file", (store) => store.addNode("file")],
      ["adding a folder", (store) => store.addNode("folder")],
      ["starting a rename", (store) => store.startRename("src/index.js")],
      [
        "renaming a node",
        (store) => store.renameNode("src/index.js", "main.js"),
      ],
      ["removing a node", (store) => store.removeNode("src/index.js")],
      ["changing the config", (store) => store.changeConfig("{}")],
      ["typing in text mode", (store) => store.setTextDraft("main.js\n")],
      [
        "adding a dependency",
        (store) => store.addDependency(INDEX_IMPORTS_FORMAT),
      ],
    ])(
      "should change nothing, notify no listener and evaluate nothing when %s is not allowed",
      (_title, edit) => {
        // Arrange
        const store = createSessionStore(SKETCH, NO_CAPABILITIES);
        const before = store.getState();
        const listener = jest.fn();
        store.subscribe(listener);

        // Act
        edit(store);
        jest.advanceTimersByTime(EVALUATION_DELAY);

        // Assert
        expect(store.getState()).toBe(before);
        expect(listener).not.toHaveBeenCalled();
        expect(getEvaluate()).toHaveBeenCalledTimes(1);
      }
    );

    it("should give the path of the node when a rename is not allowed, which keeps its name", () => {
      // Arrange
      const store = createSessionStore(SKETCH, NO_CAPABILITIES);

      // Act
      const outcome = store.renameNode("src/index.js", "main.js");

      // Assert
      expect(outcome).toEqual({ path: "src/index.js" });
    });
  });

  describe("instances", () => {
    it("should give each store an engine of its own, so that playgrounds on one page share no evaluations", () => {
      // Act
      createSessionStore(SKETCH, ALL_CAPABILITIES);
      createSessionStore(OTHER_SKETCH, ALL_CAPABILITIES);

      // Assert
      expect(createEngine).toHaveBeenCalledTimes(2);
      expect(getEvaluate(0).mock.calls).toEqual([[SKETCH]]);
      expect(getEvaluate(1).mock.calls).toEqual([[OTHER_SKETCH]]);
      expect(getEvaluate(0)).not.toBe(getEvaluate(1));
    });

    it("should create the engine once for the store, whatever the number of edits", () => {
      // Arrange
      const store = createSessionStore(SKETCH, ALL_CAPABILITIES);

      // Act
      store.addNode("file");
      store.changeConfig("{}");
      jest.advanceTimersByTime(EVALUATION_DELAY);

      // Assert
      expect(createEngine).toHaveBeenCalledTimes(1);
    });

    it("should not share state, listeners or timers between stores", () => {
      // Arrange
      const first = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const second = createSessionStore(SKETCH, ALL_CAPABILITIES);
      const listener = jest.fn();

      second.subscribe(listener);

      // Act
      first.changeConfig("{}");
      first.dispose();
      jest.advanceTimersByTime(EVALUATION_DELAY);

      // Assert
      expect(second.getState().sketch).toBe(SKETCH);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
