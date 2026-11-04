import { useEffect, useMemo, useReducer, useRef } from "react";

import type { Sketch } from "../../contract";

import type { WorkbenchActions, WorkbenchController } from "./Workbench.types";
import { createWorkbenchState, workbenchReducer } from "./WorkbenchReducer";

/**
 * Holds the state of the workbench in a reducer and reports each new sketch. The sketch that it starts from is not reported: only the ones that an edit makes are.
 * @param initialSketch The sketch to start from. A later value is ignored: the workbench owns the sketch from then on.
 * @param onSketchChange Called with each new sketch, once, after the render that shows it. Edits that come in the same render are reported as the last one.
 * @returns The state and what the panes can ask of it.
 */
export function useWorkbench(
  initialSketch: Sketch,
  onSketchChange: (sketch: Sketch) => void
): WorkbenchController {
  const [state, dispatch] = useReducer(
    workbenchReducer,
    initialSketch,
    createWorkbenchState
  );
  const reportedRef = useRef(initialSketch);
  const { sketch } = state;

  // A callback that changes between renders must not report the same sketch again
  useEffect(() => {
    if (reportedRef.current !== sketch) {
      reportedRef.current = sketch;
      onSketchChange(sketch);
    }
  }, [sketch, onSketchChange]);

  const actions = useMemo<WorkbenchActions>(
    () => ({
      changeSketch: (next) => dispatch({ type: "sketch", sketch: next }),
      changeConfig: (config) => dispatch({ type: "config", config }),
      focus: (next) => dispatch({ type: "focus", focus: next }),
      reveal: (range) => dispatch({ type: "reveal", range }),
      changeView: (view) => dispatch({ type: "view", view }),
      selectTab: (tab) => dispatch({ type: "tab", tab }),
      setCollapsed: (collapsed) => dispatch({ type: "collapsed", collapsed }),
      setTextProblems: (problems) =>
        dispatch({ type: "textProblems", problems }),
    }),
    []
  );

  return { state, actions };
}
