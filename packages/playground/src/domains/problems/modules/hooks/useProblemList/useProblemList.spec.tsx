import { act, renderHook } from "@testing-library/react";

import { useView } from "@/domains/session/data/store";
import {
  renderHookInSession,
  waitForEvaluation,
} from "@/domains/session/data/store/store.mock";

import { useProblemList } from "./useProblemList";

// The rule options are invalid, so that the rules are not evaluated
const INVALID_RULES_CONFIG =
  '{ rules: { "boundaries/element-types": [2, { rules: [{ allow: {} }] }] } }';

// A line that text mode cannot read: dependencies are not written in it yet
const UNREADABLE_LINE = "  import { a } from './b'";

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
    expect(result.current.configProblems).toHaveLength(1);
    expect(result.current.textProblems).toEqual([]);
    expect(result.current.rulesNote).toBe(false);
  });

  it("should add the lines of text mode that cannot be read to the sketch's", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemList);

    act(() => store.setView("text"));

    // Act
    act(() => store.setTextDraft(`${UNREADABLE_LINE}\n`));

    // Assert
    expect(result.current.configProblems).toHaveLength(1);
    expect(result.current.textProblems.map(({ line }) => line)).toEqual([1]);
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
    expect(result.current.configProblems).toHaveLength(1);
    expect(result.current.textProblems).toEqual([]);
  });

  it("should list nothing under the tab of a file", () => {
    // Arrange
    const { store, result } = renderHookInSession(useProblemList);

    // Act
    act(() => store.open({ kind: "file", path: "src/index.js" }));

    // Assert
    expect(result.current).toEqual({
      subject: { kind: "file", path: "src/index.js" },
      configProblems: [],
      textProblems: [],
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
    expect(result.current.subject).toEqual({ kind: "sketch" });
    expect(result.current.configProblems).toHaveLength(1);
    expect(result.current.textProblems).toEqual([]);
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
