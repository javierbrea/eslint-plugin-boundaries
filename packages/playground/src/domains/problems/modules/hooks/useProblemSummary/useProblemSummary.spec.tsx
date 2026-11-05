import { act, renderHook } from "@testing-library/react";

import { useFocus } from "@/domains/session/data/store";
import {
  renderHookInSession,
  waitForEvaluation,
} from "@/domains/session/data/store/store.mock";

import { useProblemSummary } from "./useProblemSummary";

// A parse error: the only problem is an error
const BROKEN_CONFIG = "{ settings: ";

// A line that text mode cannot read: dependencies are not written in it yet
const UNREADABLE_LINE = "  import { a } from './b'";

describe("useProblemSummary", () => {
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
      const render = (): unknown => renderHook(useProblemSummary);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

  it("should count the problems of the config", () => {
    // Act
    const { result } = renderHookInSession(useProblemSummary);

    // Assert
    expect(result.current).toEqual({
      configCount: 1,
      configHasErrors: false,
      total: 1,
      hasErrors: false,
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
      configHasErrors: false,
      total: 2,
      hasErrors: true,
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
      configHasErrors: true,
      total: 1,
      hasErrors: true,
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
