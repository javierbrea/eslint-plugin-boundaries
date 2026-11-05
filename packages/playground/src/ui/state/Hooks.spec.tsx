import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";

import {
  ALL_CAPABILITIES,
  NO_CAPABILITIES,
  renderInWorkbench,
} from "./__fixtures__/RenderInWorkbench";
import {
  useAddNode,
  useCancelRename,
  useCapabilities,
  useChangeConfig,
  useClosedFolders,
  useConfig,
  useConfigEditorSnapshot,
  useConfigProblems,
  useEvaluation,
  useFocus,
  useOpen,
  usePickedFolder,
  useProblemCounts,
  useProblemList,
  useProblemSummary,
  useProblemTabs,
  useProblemsCollapsed,
  useReadText,
  useRemoveNode,
  useRenameNode,
  useRenaming,
  useReveal,
  useSelectItem,
  useSelectTab,
  useSetProblemsCollapsed,
  useSetTextDraft,
  useSetView,
  useSettleText,
  useShownTab,
  useStartRename,
  useTextDraft,
  useTextProblems,
  useToggleFolder,
  useTree,
  useView,
  useWorkbenchSelector,
  useWorkbenchStore,
} from "./Hooks";
import { EVALUATION_DELAY } from "./Store";
import type { WorkbenchStore } from "./Store.types";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src/helpers/format.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
  ],
  dependencies: [],
};

// The same problems as the config of the sketch, one warning, in other words
const SAME_COUNTS_CONFIG = "{ settings: {}, rules: {}, }";

// A parse error: the only problem is an error
const BROKEN_CONFIG = "{ settings: ";

// The rule options are invalid, so that the rules are not evaluated
const INVALID_RULES_CONFIG =
  '{ rules: { "boundaries/element-types": [2, { rules: [{ allow: {} }] }] } }';

// A line that text mode cannot read: dependencies are not written in it yet
const UNREADABLE_LINE = "  import { a } from './b'";

const RANGE = { from: 1, to: 2, line: 1, column: 2 };

/** What {@link renderHookInWorkbench} returns. */
type HookRender<Result> = {
  /** The store that the provider created. */
  readonly store: WorkbenchStore;
  /** What the hook returned in each render, in order. */
  readonly results: Result[];
  /** What the hook returned in the last render. */
  readonly result: { readonly current: Result };
};

/**
 * Renders a hook inside a provider that has a store, so that a spec can drive the store as another pane would.
 * @param useHook The hook, or a function that calls several.
 * @param sketch The sketch the store starts from.
 * @returns The store and what the hook returned.
 */
function renderHookInWorkbench<Result>(
  useHook: () => Result,
  sketch: Sketch = SKETCH
): HookRender<Result> {
  const results: Result[] = [];

  /**
   * Calls the hook in a component and remembers what it returned.
   * @returns Nothing to render.
   */
  function Probe(): null {
    results.push(useHook());
    return null;
  }

  const { store } = renderInWorkbench(<Probe />, { sketch });

  return {
    store,
    results,
    result: {
      get current(): Result {
        return results[results.length - 1];
      },
    },
  };
}

/**
 * Advances the clock past the delay of an evaluation of the config, inside `act` so that the panes render the evaluation.
 */
function waitForEvaluation(): void {
  act(() => jest.advanceTimersByTime(EVALUATION_DELAY));
}

describe("Hooks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("outside the provider", () => {
    beforeEach(() => {
      // React logs the error that a component throws
      jest.spyOn(console, "error").mockReturnValue(undefined);
    });

    afterEach(() => {
      jest.mocked(console.error).mockRestore();
    });

    it.each<[string, () => unknown]>([
      ["useWorkbenchStore", useWorkbenchStore],
      [
        "useWorkbenchSelector",
        () => useWorkbenchSelector((state) => state.view),
      ],
      ["useCapabilities", useCapabilities],
      ["useConfigEditorSnapshot", useConfigEditorSnapshot],
      ["useTree", useTree],
      ["useConfig", useConfig],
      ["useEvaluation", useEvaluation],
      ["useConfigProblems", useConfigProblems],
      ["useFocus", useFocus],
      ["useView", useView],
      ["useTextDraft", useTextDraft],
      ["useReveal", useReveal],
      ["useProblemsCollapsed", useProblemsCollapsed],
      ["usePickedFolder", usePickedFolder],
      ["useClosedFolders", useClosedFolders],
      ["useRenaming", useRenaming],
      ["useTextProblems", useTextProblems],
      ["useProblemSummary", useProblemSummary],
      ["useProblemCounts", useProblemCounts],
      ["useProblemTabs", useProblemTabs],
      ["useShownTab", useShownTab],
      ["useProblemList", useProblemList],
      ["useOpen", useOpen],
      ["useSelectItem", useSelectItem],
      ["useToggleFolder", useToggleFolder],
      ["useChangeConfig", useChangeConfig],
      ["useAddNode", useAddNode],
      ["useStartRename", useStartRename],
      ["useRenameNode", useRenameNode],
      ["useCancelRename", useCancelRename],
      ["useRemoveNode", useRemoveNode],
      ["useSetView", useSetView],
      ["useSetTextDraft", useSetTextDraft],
      ["useReadText", useReadText],
      ["useSettleText", useSettleText],
      ["useSelectTab", useSelectTab],
      ["useSetProblemsCollapsed", useSetProblemsCollapsed],
    ])(
      "should throw when %s is used in a pane outside WorkbenchProvider",
      (_name, useHook) => {
        // Act
        const render = (): unknown => renderHook(useHook);

        // Assert
        expect(render).toThrow("outside WorkbenchProvider");
      }
    );
  });

  describe("useWorkbenchStore", () => {
    it("should give the store of the provider", () => {
      // Act
      const { store, result } = renderHookInWorkbench(useWorkbenchStore);

      // Assert
      expect(result.current).toBe(store);
    });
  });

  describe("useWorkbenchSelector", () => {
    it("should read the slice the selector picks", () => {
      // Act
      const { result } = renderHookInWorkbench(() =>
        useWorkbenchSelector((state) => state.sketch.tree.length)
      );

      // Assert
      expect(result.current).toBe(2);
    });

    it("should render again when the slice changes", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(() =>
        useWorkbenchSelector((state) => state.sketch.tree.length)
      );

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(result.current).toBe(3);
    });

    it("should not render again when the slice stays", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() =>
        useWorkbenchSelector((state) => state.sketch.tree.length)
      );

      // Act
      act(() => store.setView("text"));

      // Assert
      expect(results).toHaveLength(1);
    });
  });

  describe("useCapabilities", () => {
    it("should give what the host allows", () => {
      // Arrange
      const { result } = renderHookInWorkbench(useCapabilities);

      // Assert
      expect(result.current).toBe(ALL_CAPABILITIES);
    });

    it("should give the capabilities of the provider it is in", () => {
      // Arrange
      const capabilities: ProjectCapabilities[] = [];

      /**
       * Remembers the capabilities it reads.
       * @returns Nothing to render.
       */
      function Probe(): ReactNode {
        capabilities.push(useCapabilities());
        return null;
      }

      // Act
      renderInWorkbench(<Probe />, {
        sketch: SKETCH,
        capabilities: NO_CAPABILITIES,
      });

      // Assert
      expect(capabilities[0]).toBe(NO_CAPABILITIES);
    });
  });

  describe("useConfigEditorSnapshot", () => {
    it("should give a ref of the instance that holds nothing at first", () => {
      // Act
      const { result } = renderHookInWorkbench(useConfigEditorSnapshot);

      // Assert
      expect(result.current.current).toBeUndefined();
    });

    it("should give the same ref after the store changes", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        snapshot: useConfigEditorSnapshot(),
        focus: useFocus(),
      }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(results).toHaveLength(2);
      expect(results[1].snapshot).toBe(results[0].snapshot);
    });
  });

  describe("slices of the state", () => {
    it.each<
      [string, () => unknown, (store: WorkbenchStore) => void, unknown, unknown]
    >([
      [
        "useConfig",
        useConfig,
        (store) => store.changeConfig("{}"),
        SKETCH.config,
        "{}",
      ],
      [
        "useFocus",
        useFocus,
        (store) => store.open({ kind: "config" }),
        { kind: "none" },
        { kind: "config" },
      ],
      ["useView", useView, (store) => store.setView("text"), "tree", "text"],
      [
        "useTextDraft",
        useTextDraft,
        (store) => store.setTextDraft("main.js\n"),
        undefined,
        "main.js\n",
      ],
      [
        "useReveal",
        useReveal,
        (store) => store.open({ kind: "config", range: RANGE }),
        undefined,
        { range: RANGE, key: 1 },
      ],
      [
        "useProblemsCollapsed",
        useProblemsCollapsed,
        (store) => store.setProblemsCollapsed(true),
        false,
        true,
      ],
      [
        "usePickedFolder",
        usePickedFolder,
        (store) => store.selectItem("src"),
        undefined,
        "src",
      ],
      [
        "useClosedFolders",
        () => Array.from(useClosedFolders()),
        (store) => store.toggleFolder("src", false),
        [],
        ["src"],
      ],
      [
        "useRenaming",
        useRenaming,
        (store) => store.startRename("src/index.js"),
        undefined,
        "src/index.js",
      ],
    ])(
      "should read the slice of %s and render again when it changes",
      (_name, useHook, change, initial, changed) => {
        // Arrange
        const { store, result, results } = renderHookInWorkbench(useHook);
        const first = result.current;

        // Act
        act(() => change(store));

        // Assert
        expect(first).toEqual(initial);
        expect(result.current).toEqual(changed);
        expect(results).toHaveLength(2);
      }
    );

    it("should read the tree and render again when it changes", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useTree);

      // Act
      act(() => store.removeNode("src/helpers"));

      // Assert
      expect(result.current).toEqual([{ path: "src/index.js", kind: "file" }]);
    });

    it("should give the same tree while only the config changes", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        tree: useTree(),
        config: useConfig(),
      }));

      // Act
      act(() => store.changeConfig("{}"));

      // Assert
      expect(results).toHaveLength(2);
      expect(results[1].config).toBe("{}");
      expect(results[1].tree).toBe(results[0].tree);
    });

    it("should read the evaluation, which follows the config after the delay", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useEvaluation);
      const first = result.current;

      // Act
      act(() => store.changeConfig("{}"));
      const duringDelay = result.current;

      waitForEvaluation();

      // Assert
      expect(first.sketch).toBe(SKETCH);
      expect(duringDelay).toBe(first);
      expect(result.current.sketch.config).toBe("{}");
    });

    it("should read the problems of the config, which follow the evaluation", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useConfigProblems);
      const first = result.current;

      // Act
      act(() => store.changeConfig(BROKEN_CONFIG));
      waitForEvaluation();

      // Assert
      expect(first.map(({ level }) => level)).toEqual(["warning"]);
      expect(result.current.map(({ level }) => level)).toEqual(["error"]);
    });

    it("should not render again when another slice changes", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(useView);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(results).toHaveLength(1);
    });
  });

  describe("useTextProblems", () => {
    it("should give no problems without a draft", () => {
      // Act
      const { result } = renderHookInWorkbench(useTextProblems);

      // Assert
      expect(result.current).toEqual([]);
    });

    it("should give the lines of the draft that cannot be read", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useTextProblems);

      act(() => store.setView("text"));

      // Act
      act(() => store.setTextDraft(`main.js\n${UNREADABLE_LINE}\n`));

      // Assert
      expect(result.current).toEqual([
        {
          line: 2,
          text: UNREADABLE_LINE,
          reason: "Dependencies are not written in text mode yet.",
        },
      ]);
    });

    it("should give the same array while the draft does not change", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        problems: useTextProblems(),
        focus: useFocus(),
      }));

      act(() => store.setView("text"));
      act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      const [last, previous] = [results.at(-1), results.at(-2)];

      expect(last?.focus).toEqual({ kind: "config" });
      expect(last?.problems).toBe(previous?.problems);
    });

    it("should give the same empty array each time there is no draft", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        problems: useTextProblems(),
        focus: useFocus(),
      }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(results[1].problems).toBe(results[0].problems);
    });

    it("should give no problems again when the draft is dropped", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useTextProblems);

      act(() => store.setView("text"));
      act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

      // Act
      act(() => store.setView("tree"));

      // Assert
      expect(result.current).toEqual([]);
    });
  });

  describe("useProblemSummary", () => {
    it("should count the problems of the config", () => {
      // Act
      const { result } = renderHookInWorkbench(useProblemSummary);

      // Assert
      expect(result.current).toEqual({
        configCount: 1,
        configTone: "warn",
        total: 1,
        tone: "warn",
        configHasErrors: false,
      });
    });

    it("should count the lines that cannot be read as errors, apart from the config", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemSummary);

      act(() => store.setView("text"));

      // Act
      act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

      // Assert
      expect(result.current).toEqual({
        configCount: 1,
        configTone: "warn",
        total: 2,
        tone: "bad",
        configHasErrors: false,
      });
    });

    it("should follow the evaluation of the config", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemSummary);

      // Act
      act(() => store.changeConfig(BROKEN_CONFIG));
      waitForEvaluation();

      // Assert
      expect(result.current).toEqual({
        configCount: 1,
        configTone: "bad",
        total: 1,
        tone: "bad",
        configHasErrors: true,
      });
    });

    it("should give the same object while the problems do not change", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        summary: useProblemSummary(),
        focus: useFocus(),
      }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(results[1].summary).toBe(results[0].summary);
    });
  });

  describe("useProblemCounts", () => {
    it("should count the problems of the config and none of the paths yet", () => {
      // Act
      const { result } = renderHookInWorkbench(useProblemCounts);

      // Assert
      expect(result.current.config).toBe(1);
      expect(result.current.configHasErrors).toBe(false);
      expect(result.current.byPath.size).toBe(0);
    });

    it("should give the same object after an evaluation of the config with the same counts", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        counts: useProblemCounts(),
        summary: useProblemSummary(),
        evaluation: useEvaluation(),
      }));

      // Act
      act(() => store.changeConfig(SAME_COUNTS_CONFIG));
      waitForEvaluation();

      // Assert
      const [first, last] = [results[0], results[results.length - 1]];

      expect(last.evaluation).not.toBe(first.evaluation);
      expect(last.summary).not.toBe(first.summary);
      expect(last.counts).toBe(first.counts);
    });

    it("should give a new object when the config has an error", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(useProblemCounts);

      // Act
      act(() => store.changeConfig(BROKEN_CONFIG));
      waitForEvaluation();

      // Assert
      const [first, last] = [results[0], results[results.length - 1]];

      expect(last).not.toBe(first);
      expect(last.configHasErrors).toBe(true);
    });
  });

  describe("useProblemTabs", () => {
    it("should give the tab of the sketch when nothing is in focus", () => {
      // Act
      const { result } = renderHookInWorkbench(useProblemTabs);

      // Assert
      expect(result.current).toEqual([
        { id: "sketch", label: "Sketch", count: 1, tone: "warn" },
      ]);
    });

    it("should add the tab of the config when it is in focus", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemTabs);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(result.current).toEqual([
        { id: "sketch", label: "Sketch", count: 1, tone: "warn" },
        {
          id: "node",
          label: "eslint.config.js",
          mono: true,
          count: 1,
          tone: "warn",
        },
      ]);
    });

    it("should add the tab of the file in focus", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemTabs);

      // Act
      act(() => store.open({ kind: "file", path: "src/helpers/format.js" }));

      // Assert
      expect(result.current.map(({ id, label }) => [id, label])).toEqual([
        ["sketch", "Sketch"],
        ["node", "helpers/format.js"],
      ]);
    });

    it("should give the same array while the focus and the problems do not change", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        tabs: useProblemTabs(),
        view: useView(),
      }));

      // Act
      act(() => store.setView("text"));

      // Assert
      expect(results).toHaveLength(2);
      expect(results[1].tabs).toBe(results[0].tabs);
    });
  });

  describe("useShownTab", () => {
    it("should be the sketch's when nothing is in focus", () => {
      // Act
      const { result } = renderHookInWorkbench(useShownTab);

      // Assert
      expect(result.current).toBe("sketch");
    });

    it("should be the sketch's when nothing is in focus, whatever tab was selected", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useShownTab);

      // Act
      act(() => store.selectTab("node"));

      // Assert
      expect(result.current).toBe("sketch");
    });

    it("should be the tab of the node when something is opened", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useShownTab);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(result.current).toBe("node");
    });

    it("should be the tab that the user selects while something is in focus", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useShownTab);

      act(() => store.open({ kind: "file", path: "src/index.js" }));

      // Act
      act(() => store.selectTab("sketch"));

      // Assert
      expect(result.current).toBe("sketch");
    });
  });

  describe("useProblemList", () => {
    it("should list the problems of the config under the sketch's tab", () => {
      // Act
      const { result } = renderHookInWorkbench(useProblemList);

      // Assert
      expect(result.current.items.map(({ key }) => key)).toEqual(["config:0"]);
      expect(result.current.empty).toBe("No problems in the sketch.");
      expect(result.current.rulesNote).toBe(false);
    });

    it("should add the lines of text mode that cannot be read to the sketch's", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemList);

      act(() => store.setView("text"));

      // Act
      act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

      // Assert
      expect(result.current.items.map(({ key }) => key)).toEqual([
        "config:0",
        "text:0",
      ]);
    });

    it("should list the problems of the config under the config's tab, without the lines of text", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemList);

      act(() => store.setView("text"));
      act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(result.current.items.map(({ key }) => key)).toEqual(["config:0"]);
      expect(result.current.empty).toBe("No problems in the config.");
    });

    it("should list nothing under the tab of a file", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemList);

      // Act
      act(() => store.open({ kind: "file", path: "src/index.js" }));

      // Assert
      expect(result.current).toEqual({
        items: [],
        empty: "No problems in this file.",
        rulesNote: false,
      });
    });

    it("should list the problems of the sketch under the sketch's tab although a file is in focus", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemList);

      act(() => store.open({ kind: "file", path: "src/index.js" }));

      // Act
      act(() => store.selectTab("sketch"));

      // Assert
      expect(result.current.items).toHaveLength(1);
      expect(result.current.empty).toBe("No problems in the sketch.");
    });

    it("should say that the rule options are invalid under the tabs of the sketch and of the config", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(useProblemList);

      act(() => store.changeConfig(INVALID_RULES_CONFIG));
      waitForEvaluation();

      // Act
      const sketchNote = result.current.rulesNote;

      act(() => store.open({ kind: "config" }));

      // Assert
      expect(sketchNote).toBe(true);
      expect(result.current.rulesNote).toBe(true);
    });

    it("should give the same content while its inputs do not change", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        list: useProblemList(),
        view: useView(),
      }));

      // Act
      act(() => store.setView("text"));

      // Assert
      expect(results).toHaveLength(2);
      expect(results[1].list).toBe(results[0].list);
    });
  });

  describe("commands", () => {
    it.each<[string, () => unknown, (store: WorkbenchStore) => unknown]>([
      ["useOpen", useOpen, (store) => store.open],
      ["useSelectItem", useSelectItem, (store) => store.selectItem],
      ["useToggleFolder", useToggleFolder, (store) => store.toggleFolder],
      ["useChangeConfig", useChangeConfig, (store) => store.changeConfig],
      ["useAddNode", useAddNode, (store) => store.addNode],
      ["useStartRename", useStartRename, (store) => store.startRename],
      ["useRenameNode", useRenameNode, (store) => store.renameNode],
      ["useCancelRename", useCancelRename, (store) => store.cancelRename],
      ["useRemoveNode", useRemoveNode, (store) => store.removeNode],
      ["useSetView", useSetView, (store) => store.setView],
      ["useSetTextDraft", useSetTextDraft, (store) => store.setTextDraft],
      ["useReadText", useReadText, (store) => store.readText],
      ["useSettleText", useSettleText, (store) => store.settleText],
      ["useSelectTab", useSelectTab, (store) => store.selectTab],
      [
        "useSetProblemsCollapsed",
        useSetProblemsCollapsed,
        (store) => store.setProblemsCollapsed,
      ],
    ])(
      "should give the method of the store with %s",
      (_name, useHook, getMethod) => {
        // Act
        const { store, result } = renderHookInWorkbench(useHook);

        // Assert
        expect(result.current).toBe(getMethod(store));
      }
    );

    it("should give the same method after the store changes, so that it can be a dependency", () => {
      // Arrange
      const { store, results } = renderHookInWorkbench(() => ({
        open: useOpen(),
        focus: useFocus(),
      }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(results[1].open).toBe(results[0].open);
    });

    it("should change the state when the method is called", () => {
      // Arrange
      const { store, result } = renderHookInWorkbench(() => ({
        setView: useSetView(),
        view: useView(),
      }));

      // Act
      act(() => result.current.setView("text"));

      // Assert
      expect(store.getState().view).toBe("text");
      expect(result.current.view).toBe("text");
    });
  });
});
