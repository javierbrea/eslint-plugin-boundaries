import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";

import { EVALUATION_DELAY } from "./store.constants";
import {
  useAddNode,
  useCancelRename,
  useCapabilities,
  useChangeConfig,
  useClosedFolders,
  useConfig,
  useConfigProblems,
  useEvaluation,
  useFocus,
  useOpen,
  usePickedFolder,
  useProblemsCollapsed,
  useReadText,
  useRemoveNode,
  useRenameNode,
  useRenaming,
  useReveal,
  useSelectItem,
  useSelectTab,
  useSessionSelector,
  useSessionStore,
  useSetProblemsCollapsed,
  useSetTextDraft,
  useSetView,
  useSettleText,
  useStartRename,
  useTextDraft,
  useToggleFolder,
  useTree,
  useView,
} from "./store.hooks";
import {
  ALL_CAPABILITIES,
  NO_CAPABILITIES,
  renderInSession,
} from "./store.mock";
import type { SessionStore } from "./store.types";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src/helpers/format.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
  ],
  dependencies: [],
};

// A parse error: the only problem is an error
const BROKEN_CONFIG = "{ settings: ";

const RANGE = { from: 1, to: 2, line: 1, column: 2 };

/** What {@link renderHookInSession} returns. */
type HookRender<Result> = {
  /** The store that the provider created. */
  readonly store: SessionStore;
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
function renderHookInSession<Result>(
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

  const { store } = renderInSession(<Probe />, { sketch });

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

describe("store hooks", () => {
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
      ["useSessionStore", useSessionStore],
      ["useSessionSelector", () => useSessionSelector((state) => state.view)],
      ["useCapabilities", useCapabilities],
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
      "should throw when %s is used in a pane outside SessionProvider",
      (_name, useHook) => {
        // Act
        const render = (): unknown => renderHook(useHook);

        // Assert
        expect(render).toThrow("outside SessionProvider");
      }
    );
  });

  describe("useSessionStore", () => {
    it("should give the store of the provider", () => {
      // Act
      const { store, result } = renderHookInSession(useSessionStore);

      // Assert
      expect(result.current).toBe(store);
    });
  });

  describe("useSessionSelector", () => {
    it("should read the slice the selector picks", () => {
      // Act
      const { result } = renderHookInSession(() =>
        useSessionSelector((state) => state.sketch.tree.length)
      );

      // Assert
      expect(result.current).toBe(2);
    });

    it("should render again when the slice changes", () => {
      // Arrange
      const { store, result } = renderHookInSession(() =>
        useSessionSelector((state) => state.sketch.tree.length)
      );

      // Act
      act(() => store.addNode("file"));

      // Assert
      expect(result.current).toBe(3);
    });

    it("should not render again when the slice stays", () => {
      // Arrange
      const { store, results } = renderHookInSession(() =>
        useSessionSelector((state) => state.sketch.tree.length)
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
      const { result } = renderHookInSession(useCapabilities);

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
      renderInSession(<Probe />, {
        sketch: SKETCH,
        capabilities: NO_CAPABILITIES,
      });

      // Assert
      expect(capabilities[0]).toBe(NO_CAPABILITIES);
    });
  });

  describe("slices of the state", () => {
    it.each<
      [string, () => unknown, (store: SessionStore) => void, unknown, unknown]
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
        const { store, result, results } = renderHookInSession(useHook);
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
      const { store, result } = renderHookInSession(useTree);

      // Act
      act(() => store.removeNode("src/helpers"));

      // Assert
      expect(result.current).toEqual([{ path: "src/index.js", kind: "file" }]);
    });

    it("should give the same tree while only the config changes", () => {
      // Arrange
      const { store, results } = renderHookInSession(() => ({
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
      const { store, result } = renderHookInSession(useEvaluation);
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
      const { store, result } = renderHookInSession(useConfigProblems);
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
      const { store, results } = renderHookInSession(useView);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(results).toHaveLength(1);
    });
  });

  describe("commands", () => {
    it.each<[string, () => unknown, (store: SessionStore) => unknown]>([
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
        const { store, result } = renderHookInSession(useHook);

        // Assert
        expect(result.current).toBe(getMethod(store));
      }
    );

    it("should give the same method after the store changes, so that it can be a dependency", () => {
      // Arrange
      const { store, results } = renderHookInSession(() => ({
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
      const { store, result } = renderHookInSession(() => ({
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
