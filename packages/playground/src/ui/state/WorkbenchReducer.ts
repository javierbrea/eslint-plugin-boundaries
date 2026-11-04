import type { Sketch } from "../../contract";
import { getFiles, setConfig } from "../../sketch";

import type { Focus } from "./Focus.types";
import type { WorkbenchAction, WorkbenchState } from "./Workbench.types";

const NO_FOCUS: Focus = { kind: "none" };

const CONFIG_FOCUS: Focus = { kind: "config" };

/**
 * Creates the state the workbench starts with: the sketch, with nothing in focus, the project as a tree and the problems panel open on the sketch.
 * @param sketch The sketch to start from.
 * @returns The first state.
 */
export function createWorkbenchState(sketch: Sketch): WorkbenchState {
  return {
    sketch,
    focus: NO_FOCUS,
    view: "tree",
    tab: "sketch",
    collapsed: false,
    textProblems: [],
    reveal: undefined,
    revealCount: 0,
  };
}

/**
 * Replaces the sketch. A file in focus that the new sketch no longer has, such as one whose line was deleted in text mode, leaves nothing in focus.
 * @param state The state before the edit.
 * @param sketch The sketch after it.
 * @returns The state after it.
 */
function replaceSketch(state: WorkbenchState, sketch: Sketch): WorkbenchState {
  const { focus: openNode } = state;

  if (openNode.kind === "file" && !getFiles(sketch).includes(openNode.path)) {
    return { ...state, sketch, focus: NO_FOCUS, tab: "sketch" };
  }
  return { ...state, sketch };
}

/**
 * Puts something in focus. The tab of the problems panel follows it: the node's tab when there is a node, the sketch's when there is none. The range to reveal belongs to the config, so it is dropped when the focus leaves it.
 * @param state The state before the focus changed.
 * @param next What is in focus now.
 * @returns The state after it.
 */
function focusOn(state: WorkbenchState, next: Focus): WorkbenchState {
  return {
    ...state,
    focus: next,
    tab: next.kind === "none" ? "sketch" : "node",
    reveal: next.kind === "config" ? state.reveal : undefined,
  };
}

/**
 * The transitions of the workbench: one for each thing the panes can ask. Every one returns a new state, and the same one when nothing changes, so that a pane that reports the same thing again does not render the workbench again.
 * @param state The state before the action.
 * @param action What happened.
 * @returns The state after it.
 */
export function workbenchReducer(
  state: WorkbenchState,
  action: WorkbenchAction
): WorkbenchState {
  switch (action.type) {
    case "sketch":
      return replaceSketch(state, action.sketch);
    case "config":
      return replaceSketch(state, setConfig(state.sketch, action.config));
    case "focus":
      return focusOn(state, action.focus);
    case "reveal": {
      const key = state.revealCount + 1;

      return {
        ...focusOn(state, CONFIG_FOCUS),
        reveal: { range: action.range, key },
        revealCount: key,
      };
    }
    case "view":
      return { ...state, view: action.view };
    case "tab":
      // A tab that is pressed while the panel is collapsed is pressed to read it
      return { ...state, tab: action.tab, collapsed: false };
    case "collapsed":
      return action.collapsed === state.collapsed
        ? state
        : { ...state, collapsed: action.collapsed };
    case "textProblems":
      return action.problems.length === 0 && state.textProblems.length === 0
        ? state
        : { ...state, textProblems: action.problems };
  }
}
