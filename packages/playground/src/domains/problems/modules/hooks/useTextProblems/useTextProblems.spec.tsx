import { act, renderHook } from "@testing-library/react";

import { useFocus } from "@/domains/session/data/store";
import { renderHookInSession } from "@/domains/session/data/store/store.mock";

import { useTextProblems } from "./useTextProblems";

// A line that text mode cannot read: dependencies are not written in it yet
const UNREADABLE_LINE = "  import { a } from './b'";

describe("useTextProblems", () => {
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
      const render = (): unknown => renderHook(useTextProblems);

      // Assert
      expect(render).toThrow("outside SessionProvider");
    });
  });

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
        reason: '"./b" does not resolve to a file of the sketch.',
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
