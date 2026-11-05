import { act, renderHook } from "@testing-library/react";

import type { Sketch } from "@/contract";
import {
  EVALUATION_DELAY,
  useEvaluation,
  useFocus,
  useView,
} from "@/domains/session/data/store";
import type { SessionStore } from "@/domains/session/data/store";
import { renderInSession } from "@/domains/session/data/store/store.mock";

import {
  useProblemCounts,
  useProblemList,
  useProblemSummary,
  useProblemTabs,
  useShownTab,
  useTextProblems,
} from "./Hooks";

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

describe("problem hooks", () => {
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
      ["useTextProblems", useTextProblems],
      ["useProblemSummary", useProblemSummary],
      ["useProblemCounts", useProblemCounts],
      ["useProblemTabs", useProblemTabs],
      ["useShownTab", useShownTab],
      ["useProblemList", useProblemList],
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

  describe("useTextProblems", () => {
    it("should give no problems without a draft", () => {
      // Act
      const { result } = renderHookInSession(useTextProblems);

      // Assert
      expect(result.current).toEqual([]);
    });

    it("should give the lines of the draft that cannot be read", () => {
      // Arrange
      const { store, result } = renderHookInSession(useTextProblems);

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
      const { store, results } = renderHookInSession(() => ({
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
      const { store, results } = renderHookInSession(() => ({
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
      const { store, result } = renderHookInSession(useTextProblems);

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
      const { result } = renderHookInSession(useProblemSummary);

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
      const { store, result } = renderHookInSession(useProblemSummary);

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
      const { store, result } = renderHookInSession(useProblemSummary);

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
      const { store, results } = renderHookInSession(() => ({
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
      const { result } = renderHookInSession(useProblemCounts);

      // Assert
      expect(result.current.config).toBe(1);
      expect(result.current.configHasErrors).toBe(false);
      expect(result.current.byPath.size).toBe(0);
    });

    it("should give the same object after an evaluation of the config with the same counts", () => {
      // Arrange
      const { store, results } = renderHookInSession(() => ({
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
      const { store, results } = renderHookInSession(useProblemCounts);

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
      const { result } = renderHookInSession(useProblemTabs);

      // Assert
      expect(result.current).toEqual([
        { id: "sketch", label: "Sketch", count: 1, tone: "warn" },
      ]);
    });

    it("should add the tab of the config when it is in focus", () => {
      // Arrange
      const { store, result } = renderHookInSession(useProblemTabs);

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
      const { store, result } = renderHookInSession(useProblemTabs);

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
      const { store, results } = renderHookInSession(() => ({
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
      const { result } = renderHookInSession(useShownTab);

      // Assert
      expect(result.current).toBe("sketch");
    });

    it("should be the sketch's when nothing is in focus, whatever tab was selected", () => {
      // Arrange
      const { store, result } = renderHookInSession(useShownTab);

      // Act
      act(() => store.selectTab("node"));

      // Assert
      expect(result.current).toBe("sketch");
    });

    it("should be the tab of the node when something is opened", () => {
      // Arrange
      const { store, result } = renderHookInSession(useShownTab);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(result.current).toBe("node");
    });

    it("should be the tab that the user selects while something is in focus", () => {
      // Arrange
      const { store, result } = renderHookInSession(useShownTab);

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
      const { result } = renderHookInSession(useProblemList);

      // Assert
      expect(result.current.items.map(({ key }) => key)).toEqual(["config:0"]);
      expect(result.current.empty).toBe("No problems in the sketch.");
      expect(result.current.rulesNote).toBe(false);
    });

    it("should add the lines of text mode that cannot be read to the sketch's", () => {
      // Arrange
      const { store, result } = renderHookInSession(useProblemList);

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
      const { store, result } = renderHookInSession(useProblemList);

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
      const { store, result } = renderHookInSession(useProblemList);

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
      const { store, result } = renderHookInSession(useProblemList);

      act(() => store.open({ kind: "file", path: "src/index.js" }));

      // Act
      act(() => store.selectTab("sketch"));

      // Assert
      expect(result.current.items).toHaveLength(1);
      expect(result.current.empty).toBe("No problems in the sketch.");
    });

    it("should say that the rule options are invalid under the tabs of the sketch and of the config", () => {
      // Arrange
      const { store, result } = renderHookInSession(useProblemList);

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
      const { store, results } = renderHookInSession(() => ({
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
});
