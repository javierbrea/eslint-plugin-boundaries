import { act, renderHook } from "@testing-library/react";

import type { Sketch } from "../../contract";
import { createEngine } from "../../engine";
import type { Engine } from "../../engine";

import { EVALUATION_DELAY, useEvaluation } from "./useEvaluation";

// The real engines, whose evaluations the tests only count
jest.mock<{ createEngine: typeof createEngine }>("../../engine", () => {
  const actual = jest.requireActual<{ createEngine: typeof createEngine }>(
    "../../engine"
  );
  return {
    ...actual,
    createEngine: jest.fn(() => {
      const engine = actual.createEngine();
      return { evaluate: jest.fn(engine.evaluate) };
    }),
  };
});

/**
 * Gets the `evaluate` of an engine that the hook created.
 * @param index The position of the engine among the ones created since the test began.
 * @returns The `evaluate` of the engine, which counts its calls.
 */
function getEvaluate(index = 0): jest.MockedFunction<Engine["evaluate"]> {
  return jest.mocked(
    jest.mocked(createEngine).mock.results[index].value.evaluate
  );
}

const FIRST: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.js", kind: "file" }],
  dependencies: [],
};

const SECOND: Sketch = {
  ...FIRST,
  tree: [...FIRST.tree, { path: "src/main.js", kind: "file" }],
};

const THIRD: Sketch = {
  ...FIRST,
  tree: [...SECOND.tree, { path: "src/util.js", kind: "file" }],
};

describe("useEvaluation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should evaluate the first sketch at once, so that the first render has an evaluation", () => {
    // Act
    const { result } = renderHook(() => useEvaluation(FIRST));

    // Assert
    expect(result.current.sketch).toBe(FIRST);
    expect(result.current.files.size).toBe(1);
  });

  it("should not evaluate the first sketch again after the delay", () => {
    // Arrange
    renderHook(() => useEvaluation(FIRST));

    // Act
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY * 2));

    // Assert
    expect(getEvaluate()).toHaveBeenCalledTimes(1);
  });

  it("should keep the previous evaluation until the delay after a change has passed", () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ sketch }) => useEvaluation(sketch),
      { initialProps: { sketch: FIRST } }
    );

    // Act
    rerender({ sketch: SECOND });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY - 1));

    // Assert
    expect(result.current.sketch).toBe(FIRST);
  });

  it("should evaluate the new sketch when the delay has passed", () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ sketch }) => useEvaluation(sketch),
      { initialProps: { sketch: FIRST } }
    );

    // Act
    rerender({ sketch: SECOND });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY));

    // Assert
    expect(result.current.sketch).toBe(SECOND);
    expect(result.current.files.size).toBe(2);
  });

  it("should wait for the delay after the last of the changes, and evaluate only that one", () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ sketch }) => useEvaluation(sketch),
      { initialProps: { sketch: FIRST } }
    );
    getEvaluate().mockClear();

    // Act
    rerender({ sketch: SECOND });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY - 50));
    rerender({ sketch: THIRD });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY - 50));
    const midway = result.current.sketch;
    act(() => jest.advanceTimersByTime(50));

    // Assert
    expect(midway).toBe(FIRST);
    expect(result.current.sketch).toBe(THIRD);
    expect(getEvaluate()).toHaveBeenCalledTimes(1);
    expect(getEvaluate()).toHaveBeenCalledWith(THIRD);
  });

  it("should not evaluate when the sketch goes back to the one that is evaluated", () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ sketch }) => useEvaluation(sketch),
      { initialProps: { sketch: FIRST } }
    );
    getEvaluate().mockClear();

    // Act
    rerender({ sketch: SECOND });
    rerender({ sketch: FIRST });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY * 2));

    // Assert
    expect(result.current.sketch).toBe(FIRST);
    expect(getEvaluate()).not.toHaveBeenCalled();
  });

  it("should clear the delay when it unmounts", () => {
    // Arrange
    const { rerender, unmount } = renderHook(
      ({ sketch }) => useEvaluation(sketch),
      { initialProps: { sketch: FIRST } }
    );
    rerender({ sketch: SECOND });
    getEvaluate().mockClear();

    // Act
    unmount();
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY * 2));

    // Assert
    expect(jest.getTimerCount()).toBe(0);
    expect(getEvaluate()).not.toHaveBeenCalled();
  });

  it("should create the engine once for the hook, whatever the number of renders", () => {
    // Arrange
    const { rerender } = renderHook(({ sketch }) => useEvaluation(sketch), {
      initialProps: { sketch: FIRST },
    });

    // Act
    rerender({ sketch: SECOND });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY));
    rerender({ sketch: THIRD });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY));

    // Assert
    expect(createEngine).toHaveBeenCalledTimes(1);
  });

  it("should give each use of the hook an engine of its own, so that playgrounds on one page share no evaluations", () => {
    // Act
    renderHook(() => useEvaluation(FIRST));
    renderHook(() => useEvaluation(FIRST));

    // Assert
    expect(createEngine).toHaveBeenCalledTimes(2);
    expect(getEvaluate(0)).toHaveBeenCalledWith(FIRST);
    expect(getEvaluate(1)).toHaveBeenCalledWith(FIRST);
    expect(getEvaluate(0)).not.toBe(getEvaluate(1));
  });
});
