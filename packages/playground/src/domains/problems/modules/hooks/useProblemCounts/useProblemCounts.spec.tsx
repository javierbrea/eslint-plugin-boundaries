import { act, renderHook } from "@testing-library/react";

import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { useProblemSummary } from "@/domains/problems/modules/hooks/useProblemSummary";
import { useEvaluation } from "@/domains/session/data/store";
import {
  renderHookInSession,
  waitForEvaluation,
} from "@/domains/session/data/store/store.mock";

import { useProblemCounts } from "./useProblemCounts";

// The same problems as the config of the sketch, one warning, in other words
const SAME_COUNTS_CONFIG = "{ settings: {}, rules: {}, }";

// A parse error: the only problem is an error
const BROKEN_CONFIG = "{ settings: ";

describe("useProblemCounts", () => {
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
      const render = (): unknown => renderHook(useProblemCounts);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should count the problems of the config and none of the paths when no dependency fails", () => {
    // Act
    const { result } = renderHookInSession(useProblemCounts);

    // Assert
    expect(result.current.config).toBe(1);
    expect(result.current.configHasErrors).toBe(false);
    expect(result.current.byPath.size).toBe(0);
  });

  it("should count the failing dependencies of each file and folder of the quick start", () => {
    // Act
    const { result } = renderHookInSession(
      useProblemCounts,
      QUICK_START_EXAMPLE.sketch
    );

    // Assert
    expect(Object.fromEntries(result.current.byPath)).toEqual({
      "src/helpers/format/index.js": { count: 1, hasErrors: true },
      "src/helpers/format": { count: 1, hasErrors: true },
      "src/helpers": { count: 1, hasErrors: true },
      "src/modules/checkout/index.js": { count: 1, hasErrors: true },
      "src/modules/checkout": { count: 1, hasErrors: true },
      "src/modules": { count: 1, hasErrors: true },
      src: { count: 2, hasErrors: true },
    });
  });

  it("should give the same object after an evaluation with new verdicts that make the same counts", () => {
    // Arrange
    const { store, results } = renderHookInSession(
      () => ({ counts: useProblemCounts(), evaluation: useEvaluation() }),
      QUICK_START_EXAMPLE.sketch
    );

    // Act
    act(() => store.changeConfig(`${QUICK_START_EXAMPLE.sketch.config}\n`));
    waitForEvaluation();

    // Assert
    const [first, last] = [results[0], results[results.length - 1]];

    expect(last.evaluation.dependencies).not.toBe(
      first.evaluation.dependencies
    );
    expect(last.counts).toBe(first.counts);
  });

  it("should give a new object when a dependency stops failing", () => {
    // Arrange
    const { store, results } = renderHookInSession(
      useProblemCounts,
      QUICK_START_EXAMPLE.sketch
    );

    // Act
    act(() =>
      store.removeDependency({ path: "src/helpers/format/index.js", index: 0 })
    );

    // Assert
    const last = results[results.length - 1];

    expect(last).not.toBe(results[0]);
    expect(Object.fromEntries(last.byPath)).toEqual({
      "src/modules/checkout/index.js": { count: 1, hasErrors: true },
      "src/modules/checkout": { count: 1, hasErrors: true },
      "src/modules": { count: 1, hasErrors: true },
      src: { count: 1, hasErrors: true },
    });
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

  it("should give a new object, saying the failing dependencies are warnings, when the rule becomes a warning", () => {
    // Arrange
    const { store, results } = renderHookInSession(
      useProblemCounts,
      QUICK_START_EXAMPLE.sketch
    );

    // Act
    act(() =>
      store.changeConfig(
        QUICK_START_EXAMPLE.sketch.config.replace(
          '"boundaries/dependencies": [2,',
          '"boundaries/dependencies": ["warn",'
        )
      )
    );
    waitForEvaluation();

    // Assert
    const [first, last] = [results[0], results[results.length - 1]];

    expect(last).not.toBe(first);
    expect(last.byPath.get("src")).toEqual({ count: 2, hasErrors: false });
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
