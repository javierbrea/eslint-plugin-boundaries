import { act, renderHook } from "@testing-library/react";

import type { Sketch } from "../../contract";
import { evaluate } from "../../engine";

import { EVALUATION_DELAY, useEvaluation } from "./useEvaluation";

// The real engine, which the tests only count
jest.mock<{ evaluate: typeof evaluate }>("../../engine", () => {
  const actual = jest.requireActual<{ evaluate: typeof evaluate }>(
    "../../engine"
  );
  return { ...actual, evaluate: jest.fn(actual.evaluate) };
});

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
    jest.mocked(evaluate).mockClear();
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
    expect(evaluate).toHaveBeenCalledTimes(1);
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
    jest.mocked(evaluate).mockClear();

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
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith(THIRD);
  });

  it("should not evaluate when the sketch goes back to the one that is evaluated", () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ sketch }) => useEvaluation(sketch),
      { initialProps: { sketch: FIRST } }
    );
    jest.mocked(evaluate).mockClear();

    // Act
    rerender({ sketch: SECOND });
    rerender({ sketch: FIRST });
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY * 2));

    // Assert
    expect(result.current.sketch).toBe(FIRST);
    expect(evaluate).not.toHaveBeenCalled();
  });

  it("should clear the delay when it unmounts", () => {
    // Arrange
    const { rerender, unmount } = renderHook(
      ({ sketch }) => useEvaluation(sketch),
      { initialProps: { sketch: FIRST } }
    );
    rerender({ sketch: SECOND });
    jest.mocked(evaluate).mockClear();

    // Act
    unmount();
    act(() => jest.advanceTimersByTime(EVALUATION_DELAY * 2));

    // Assert
    expect(jest.getTimerCount()).toBe(0);
    expect(evaluate).not.toHaveBeenCalled();
  });
});
