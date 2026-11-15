import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ProjectCapabilities } from "@/contract";
import {
  holdInlineWorkers,
  releaseInlineWorkers,
} from "@/shared/testing/inlineWorker";

import {
  useAddDependency,
  useAddNode,
  useCancelRename,
  useCapabilities,
  useChangeConfig,
  useClose,
  useClosedFolders,
  useConfig,
  useConfigProblems,
  useDependencyResults,
  useEvaluation,
  useEvaluationStatus,
  useFileDescriptions,
  useFocus,
  useOpen,
  usePickedFolder,
  usePolicyHighlight,
  useProblemsCollapsed,
  useReadText,
  useRemoveDependency,
  useRemoveNode,
  useRenameNode,
  useRenaming,
  useReplaceDependency,
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
  HOOK_SKETCH,
  NO_CAPABILITIES,
  renderHookInSession,
  renderInSession,
  waitForEvaluation,
} from "./store.mock";
import type { SessionStore } from "./store.types";

// A parse error: the only problem is an error
const BROKEN_CONFIG = "{ settings: ";

const RANGE = { from: 1, to: 2, line: 1, column: 2 };

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
      ["useEvaluationStatus", useEvaluationStatus],
      ["useDependencyResults", useDependencyResults],
      ["useFileDescriptions", useFileDescriptions],
      ["useConfigProblems", useConfigProblems],
      ["useFocus", useFocus],
      ["useView", useView],
      ["useTextDraft", useTextDraft],
      ["useReveal", useReveal],
      ["usePolicyHighlight", usePolicyHighlight],
      ["useProblemsCollapsed", useProblemsCollapsed],
      ["usePickedFolder", usePickedFolder],
      ["useClosedFolders", useClosedFolders],
      ["useRenaming", useRenaming],
      ["useOpen", useOpen],
      ["useClose", useClose],
      ["useSelectItem", useSelectItem],
      ["useToggleFolder", useToggleFolder],
      ["useChangeConfig", useChangeConfig],
      ["useAddNode", useAddNode],
      ["useStartRename", useStartRename],
      ["useRenameNode", useRenameNode],
      ["useCancelRename", useCancelRename],
      ["useRemoveNode", useRemoveNode],
      ["useAddDependency", useAddDependency],
      ["useReplaceDependency", useReplaceDependency],
      ["useRemoveDependency", useRemoveDependency],
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
        sketch: HOOK_SKETCH,
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
        HOOK_SKETCH.config,
        "{}",
      ],
      [
        "useFocus",
        useFocus,
        (store) => store.open({ kind: "file", path: "src/index.js" }),
        { kind: "config" },
        { kind: "file", path: "src/index.js" },
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
        "usePolicyHighlight",
        usePolicyHighlight,
        (store) =>
          store.open({
            kind: "config",
            range: RANGE,
            policy: 1,
            dependency: { path: "src/index.js", index: 0 },
          }),
        undefined,
        {
          range: RANGE,
          policy: 1,
          dependency: { path: "src/index.js", index: 0 },
        },
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
      expect(first?.sketch).toBe(HOOK_SKETCH);
      expect(duringDelay).toBe(first);
      expect(result.current?.sketch.config).toBe("{}");
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
      act(() => store.open({ kind: "file", path: "src/index.js" }));

      // Assert
      expect(results).toHaveLength(1);
    });
  });

  describe("the slices of the evaluation", () => {
    /** What the probe reads in one render. */
    type EvaluationSlices = {
      evaluation: ReturnType<typeof useEvaluation>;
      evaluationStatus: ReturnType<typeof useEvaluationStatus>;
      problems: ReturnType<typeof useConfigProblems>;
      results: ReturnType<typeof useDependencyResults>;
      descriptions: ReturnType<typeof useFileDescriptions>;
      /** Read so that the probe renders again when the focus changes */
      focus: ReturnType<typeof useFocus>;
    };

    /**
     * Renders a probe that reads the slices of the evaluation in each render, with the workers held, so that the evaluation of the sketch has not arrived when it returns.
     * @returns The store and what the probe read in each render.
     */
    function renderHeld(): { store: SessionStore; seen: EvaluationSlices[] } {
      const seen: EvaluationSlices[] = [];

      /**
       * Reads the slices.
       * @returns Nothing to render.
       */
      function Probe(): null {
        seen.push({
          evaluation: useEvaluation(),
          evaluationStatus: useEvaluationStatus(),
          problems: useConfigProblems(),
          results: useDependencyResults(),
          descriptions: useFileDescriptions(),
          focus: useFocus(),
        });
        return null;
      }

      holdInlineWorkers();
      const { store } = renderInSession(<Probe />, { sketch: HOOK_SKETCH });

      return { store, seen };
    }

    it("should read no evaluation, a pending status and no problems, verdicts or descriptions before the first evaluation arrives", () => {
      // Act
      const { seen } = renderHeld();

      // Assert
      const last = seen[seen.length - 1];

      expect(last.evaluation).toBeUndefined();
      expect(last.evaluationStatus).toBe("pending");
      expect(last.problems).toEqual([]);
      expect(last.results).toEqual([]);
      expect(last.descriptions.size).toBe(0);
    });

    it("should read the same empty values in each render before the first evaluation, so that the panes that read them do not render again for nothing", () => {
      // Arrange
      const { store, seen } = renderHeld();
      const before = seen[seen.length - 1];

      // Act
      act(() => store.open({ kind: "file", path: "src/index.js" }));

      // Assert
      const after = seen[seen.length - 1];

      expect(after).not.toBe(before);
      expect(after.problems).toBe(before.problems);
      expect(after.results).toBe(before.results);
      expect(after.descriptions).toBe(before.descriptions);
    });

    it("should read the evaluation of the sketch, current, once it arrives", () => {
      // Arrange
      const { seen } = renderHeld();

      // Act
      act(() => releaseInlineWorkers());

      // Assert
      const { evaluation, evaluationStatus } = seen[seen.length - 1];

      expect(evaluation?.sketch).toBe(HOOK_SKETCH);
      expect(evaluationStatus).toBe("current");
    });

    it("should read the problems, the verdicts and the descriptions of the evaluation once it arrives", () => {
      // Arrange
      const { seen } = renderHeld();

      // Act
      act(() => releaseInlineWorkers());

      // Assert
      const { evaluation, problems, results, descriptions } =
        seen[seen.length - 1];

      expect(problems).toBe(evaluation?.problems);
      expect(results).toBe(evaluation?.dependencies);
      expect(descriptions).toBe(evaluation?.files);
      expect(Array.from(descriptions.keys())).toEqual([
        "src/helpers/format.js",
        "src/index.js",
      ]);
    });
  });

  describe("commands", () => {
    it.each<[string, () => unknown, (store: SessionStore) => unknown]>([
      ["useOpen", useOpen, (store) => store.open],
      ["useClose", useClose, (store) => store.close],
      ["useSelectItem", useSelectItem, (store) => store.selectItem],
      ["useToggleFolder", useToggleFolder, (store) => store.toggleFolder],
      ["useChangeConfig", useChangeConfig, (store) => store.changeConfig],
      ["useAddNode", useAddNode, (store) => store.addNode],
      ["useStartRename", useStartRename, (store) => store.startRename],
      ["useRenameNode", useRenameNode, (store) => store.renameNode],
      ["useCancelRename", useCancelRename, (store) => store.cancelRename],
      ["useRemoveNode", useRemoveNode, (store) => store.removeNode],
      ["useAddDependency", useAddDependency, (store) => store.addDependency],
      [
        "useReplaceDependency",
        useReplaceDependency,
        (store) => store.replaceDependency,
      ],
      [
        "useRemoveDependency",
        useRemoveDependency,
        (store) => store.removeDependency,
      ],
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
      act(() => store.open({ kind: "file", path: "src/index.js" }));

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
