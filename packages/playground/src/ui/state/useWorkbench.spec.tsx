import { act, renderHook } from "@testing-library/react";

import type { Sketch } from "../../contract";

import { useWorkbench } from "./useWorkbench";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [{ path: "src/index.js", kind: "file" }],
  dependencies: [],
};

const EDITED: Sketch = {
  ...SKETCH,
  tree: [
    { path: "src/index.js", kind: "file" },
    { path: "src/main.js", kind: "file" },
  ],
};

describe("useWorkbench", () => {
  describe("state", () => {
    it("should start from the sketch, with nothing in focus", () => {
      // Act
      const { result } = renderHook(() => useWorkbench(SKETCH, jest.fn()));

      // Assert
      expect(result.current.state.sketch).toBe(SKETCH);
      expect(result.current.state.focus).toEqual({ kind: "none" });
    });

    it("should keep the sketch it started from when a later one is passed", () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ sketch }) => useWorkbench(sketch, jest.fn()),
        { initialProps: { sketch: SKETCH } }
      );

      // Act
      rerender({ sketch: EDITED });

      // Assert
      expect(result.current.state.sketch).toBe(SKETCH);
    });

    it("should change the state with each action", () => {
      // Arrange
      const { result } = renderHook(() => useWorkbench(SKETCH, jest.fn()));

      // Act
      act(() => {
        result.current.actions.focus({ kind: "file", path: "src/index.js" });
        result.current.actions.changeView("text");
        result.current.actions.setCollapsed(true);
      });

      // Assert
      expect(result.current.state).toMatchObject({
        focus: { kind: "file", path: "src/index.js" },
        view: "text",
        collapsed: true,
      });
    });

    it("should select a tab, reveal a range and keep the text problems", () => {
      // Arrange
      const range = { from: 1, to: 2, line: 1, column: 2 };
      const problem = { line: 1, text: "a//b", reason: "Empty segment." };
      const { result } = renderHook(() => useWorkbench(SKETCH, jest.fn()));

      // Act
      act(() => {
        result.current.actions.reveal(range);
        result.current.actions.selectTab("sketch");
        result.current.actions.setTextProblems([problem]);
      });

      // Assert
      expect(result.current.state).toMatchObject({
        focus: { kind: "config" },
        tab: "sketch",
        reveal: { range, key: 1 },
        textProblems: [problem],
      });
    });

    it("should give the same actions on every render", () => {
      // Arrange
      const { result } = renderHook(() => useWorkbench(SKETCH, jest.fn()));
      const first = result.current.actions;

      // Act
      act(() => result.current.actions.changeView("text"));

      // Assert
      expect(result.current.actions).toBe(first);
    });
  });

  describe("onSketchChange", () => {
    it("should not report the sketch it started from", () => {
      // Arrange
      const onSketchChange = jest.fn();

      // Act
      renderHook(() => useWorkbench(SKETCH, onSketchChange));

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should report the sketch that an edit of the tree makes, once", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { result } = renderHook(() => useWorkbench(SKETCH, onSketchChange));

      // Act
      act(() => result.current.actions.changeSketch(EDITED));

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(onSketchChange).toHaveBeenCalledWith(EDITED);
    });

    it("should report the sketch that an edit of the config makes", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { result } = renderHook(() => useWorkbench(SKETCH, onSketchChange));

      // Act
      act(() => result.current.actions.changeConfig("{}"));

      // Assert
      expect(onSketchChange).toHaveBeenCalledWith({ ...SKETCH, config: "{}" });
    });

    it("should report only the last of the edits that come in the same render", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { result } = renderHook(() => useWorkbench(SKETCH, onSketchChange));

      // Act
      act(() => {
        result.current.actions.changeSketch(EDITED);
        result.current.actions.changeConfig("{}");
      });

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(onSketchChange).toHaveBeenCalledWith({ ...EDITED, config: "{}" });
    });

    it("should not report a change that is not of the sketch", () => {
      // Arrange
      const onSketchChange = jest.fn();
      const { result } = renderHook(() => useWorkbench(SKETCH, onSketchChange));

      // Act
      act(() => {
        result.current.actions.focus({ kind: "config" });
        result.current.actions.changeView("text");
      });

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not report the same sketch again when the callback changes", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { result, rerender } = renderHook(
        ({ callback }) => useWorkbench(SKETCH, callback),
        { initialProps: { callback: first } }
      );
      act(() => result.current.actions.changeSketch(EDITED));

      // Act
      rerender({ callback: second });

      // Assert
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    it("should report the next sketch to the callback it has then", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const { result, rerender } = renderHook(
        ({ callback }) => useWorkbench(SKETCH, callback),
        { initialProps: { callback: first } }
      );
      rerender({ callback: second });

      // Act
      act(() => result.current.actions.changeSketch(EDITED));

      // Assert
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith(EDITED);
    });
  });
});
