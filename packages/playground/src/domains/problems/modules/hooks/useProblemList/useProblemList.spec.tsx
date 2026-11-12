import { act, renderHook } from "@testing-library/react";

import type {
  DependencyResult,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import type {
  ProblemListFacts,
  ProblemRowsFacts,
} from "@/domains/problems/helpers/problemSelectors";
import { useView } from "@/domains/session/data/store";
import {
  renderHookInSession,
  waitForEvaluation,
} from "@/domains/session/data/store/store.mock";

import { useProblemList } from "./useProblemList";

const CHECKOUT = "src/modules/checkout/index.js";

// The rule options are invalid, so that the rules are not evaluated
const INVALID_RULES_CONFIG =
  '{ rules: { "boundaries/element-types": [2, { rules: [{ allow: {} }] }] } }';

// A dependency line that text mode cannot read: its source does not resolve to a file of the sketch
const UNREADABLE_LINE = "  import { a } from './b'";

/**
 * Narrows the facts of a list to the ones of a list of rows.
 * @param facts What the hook returned.
 * @returns The facts, which are not the body of a dependency.
 */
function getRows(facts: ProblemListFacts): ProblemRowsFacts {
  if ("result" in facts) {
    throw new Error("The facts are the body of a dependency.");
  }
  return facts;
}

/**
 * Gets where the policy that disallowed a dependency of the quick start is written.
 * @param dependencies The verdicts of the evaluation.
 * @param path The file that has the dependency.
 * @param index Its position among the dependencies of the file.
 * @returns The range of the policy in the config.
 */
function getPolicyRange(
  dependencies: readonly DependencyResult[],
  path: string,
  index: number
): TextRange {
  const found = dependencies.find(
    ({ ref }) => ref.path === path && ref.index === index
  );

  if (found?.verdict.status !== "disallowed" || !found.verdict.policy) {
    throw new Error(`${path}:${index + 1} is not disallowed by a policy.`);
  }
  return found.verdict.policy.range;
}

describe("useProblemList", () => {
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

    it("should throw when it is used in a pane outside SessionProvider", () => {
      // Act
      const render = (): unknown => renderHook(useProblemList);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should list the problems of the config under the sketch's tab", () => {
    // Act
    const { result } = renderHookInSession(useProblemList);

    // Assert
    expect(result.current.subject).toEqual({ kind: "sketch" });
    expect(getRows(result.current).configProblems).toHaveLength(1);
    expect(getRows(result.current).textProblems).toEqual([]);
    // The rules of the sketch are `{}`: no rule is written, which is not an invalid one
    expect(getRows(result.current).notEvaluated).toBe("no-rule");
  });

  it("should add the lines of text mode that cannot be read to the sketch's", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemList);

    act(() => store.setView("text"));

    // Act
    act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

    // Assert
    expect(getRows(result.current).configProblems).toHaveLength(1);
    expect(
      getRows(result.current).textProblems.map(({ line }) => line)
    ).toEqual([1]);
  });

  it("should list the problems of the config under the config's tab, without the lines of text", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemList);

    act(() => store.setView("text"));
    act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

    // Act
    act(() => store.open({ kind: "config" }));

    // Assert
    expect(result.current.subject).toEqual({ kind: "config" });
    expect(getRows(result.current).configProblems).toHaveLength(1);
    expect(getRows(result.current).textProblems).toEqual([]);
  });

  it("should list nothing of the config under the tab of a file that has no failing dependency", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemList);

    // Act
    act(() => store.open({ kind: "file", path: "src/index.js" }));

    // Assert
    expect(result.current).toEqual({
      subject: { kind: "file", path: "src/index.js" },
      configProblems: [],
      textProblems: [],
      dependencies: [],
      notEvaluated: undefined,
      highlight: undefined,
    });
  });

  it("should list the problems of the sketch under the sketch's tab although a file is in focus", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemList);

    act(() => store.open({ kind: "file", path: "src/index.js" }));

    // Act
    act(() => store.selectTab("sketch"));

    // Assert
    expect(result.current.subject).toEqual({ kind: "sketch" });
    expect(getRows(result.current).configProblems).toHaveLength(1);
    expect(getRows(result.current).textProblems).toEqual([]);
  });

  it("should say that the rule options are invalid under the tabs of the sketch and of the config", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemList);

    act(() => store.changeConfig(INVALID_RULES_CONFIG));
    waitForEvaluation();

    // Act
    const sketchNote = getRows(result.current).notEvaluated;

    act(() => store.open({ kind: "config" }));

    // Assert
    expect(sketchNote).toBe("rules-invalid");
    expect(getRows(result.current).notEvaluated).toBe("rules-invalid");
  });

  describe("with the dependencies of the quick start", () => {
    it("should list the failing dependencies under the sketch's tab", () => {
      // Act
      const { result } = renderHookInSession(
        useProblemList,
        QUICK_START_EXAMPLE.sketch
      );

      // Assert
      const { dependencies } = getRows(result.current);

      expect(
        dependencies.map(({ ref }) => `${ref.path}:${ref.index + 1}`)
      ).toEqual(["src/helpers/format/index.js:1", `${CHECKOUT}:3`]);
    });

    it("should list the failing dependencies of the file under the tab of the file", () => {
      // Arrange
      const { store, result } = renderHookInSession(
        useProblemList,
        QUICK_START_EXAMPLE.sketch
      );

      // Act
      act(() => store.open({ kind: "file", path: CHECKOUT }));

      // Assert
      const { dependencies } = getRows(result.current);

      expect(dependencies.map(({ ref }) => ref.index)).toEqual([2]);
    });

    it("should give the body of the dependency in focus: its verdict and its policy", () => {
      // Arrange
      const { store, result } = renderHookInSession(
        useProblemList,
        QUICK_START_EXAMPLE.sketch
      );

      // Act
      act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 2 }));

      // Assert
      expect(result.current).toEqual(
        expect.objectContaining({
          subject: { kind: "dependency", ref: { path: CHECKOUT, index: 2 } },
        })
      );
      expect(result.current).toEqual(
        expect.objectContaining({
          result: expect.objectContaining({
            verdict: expect.objectContaining({
              status: "disallowed",
            }) as unknown,
          }) as unknown,
          policy: expect.objectContaining({ index: 2 }) as unknown,
        })
      );
    });

    it("should list the file of the dependency under the tab of the node while the dependency is in focus", () => {
      // Arrange
      const { store, result } = renderHookInSession(
        useProblemList,
        QUICK_START_EXAMPLE.sketch
      );

      act(() => store.open({ kind: "dependency", path: CHECKOUT, index: 2 }));

      // Act
      act(() => store.selectTab("node"));

      // Assert
      expect(result.current.subject).toEqual({ kind: "file", path: CHECKOUT });
    });

    it("should give the policy that Open in config highlighted, and the dependency it came from", () => {
      // Arrange
      const { store, result } = renderHookInSession(
        useProblemList,
        QUICK_START_EXAMPLE.sketch
      );
      // The engine gives the same ranges for the config of the sketch as the worker does
      const range = getPolicyRange(
        createEngine().evaluate(QUICK_START_EXAMPLE.sketch).dependencies,
        CHECKOUT,
        2
      );

      // Act
      act(() =>
        store.open({
          kind: "config",
          range,
          policy: 2,
          dependency: { path: CHECKOUT, index: 2 },
        })
      );

      // Assert
      expect(result.current).toEqual(
        expect.objectContaining({
          subject: { kind: "config" },
          highlight: { policy: 2, dependency: { path: CHECKOUT, index: 2 } },
        })
      );
    });
  });

  it("should give the same facts while its inputs do not change", () => {
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
