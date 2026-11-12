import type { ProjectCapabilities, Sketch } from "@/contract";
import { alignEvaluation } from "@/domains/evaluation/helpers/alignEvaluation";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { createEvaluator } from "@/domains/evaluation/helpers/evaluator";
import type {
  EvaluationOutcome,
  EvaluationStatus,
  EvaluatorFactory,
} from "@/domains/evaluation/helpers/evaluator";

import type { SessionState } from "./sessionState.types";
import { EVALUATION_DELAY } from "./store.constants";
import type { SessionStore } from "./store.types";
import {
  createSessionState,
  setEvaluation,
  openTarget,
  selectItem,
  toggleFolder,
  changeConfig,
  addNode,
  startRename,
  renameNode,
  cancelRename,
  removeNode,
  addDependency,
  replaceDependency,
  removeDependency,
  setView,
  setTextDraft,
  readText,
  settleText,
  selectTab,
  setProblemsCollapsed,
} from "./transitions";

/**
 * Tells how the evaluation on screen stands to a sketch that an edit has just made.
 * @param before How it stood to the sketch before the edit.
 * @returns `pending` after an evaluation that was current, and `late` after one that was already late, stopped or failed, so that the panes that showed it as out of date keep doing so until the evaluation of the new sketch arrives.
 */
function getStatusAfterEdit(before: EvaluationStatus): EvaluationStatus {
  return before === "current" || before === "pending" ? "pending" : "late";
}

/**
 * Creates the store of one playground instance, with its own evaluator, so that several instances on a page never share an evaluation. Each method applies the transition of `transitions.ts` with its name, `open` applies `openTarget`, and notifies the listeners when the state changed. The store asks the evaluator for the evaluation of the sketch after each edit: at once when only the tree changed, because adding, renaming or removing a node is one action, and a moment after the last edit of the config, which comes in keystrokes. Until the evaluation of the sketch arrives, the panes keep the last one, aligned to the sketch, and the status says how far behind it is.
 * @param sketch The sketch to start from. The store asks for its evaluation when it starts.
 * @param capabilities What the user can change in the project: an edit that they do not allow changes nothing and notifies no listener.
 * @param makeEvaluator Creates the evaluator. The one that evaluates in a worker unless a spec passes another one.
 * @returns The store.
 */
export function createSessionStore(
  sketch: Sketch,
  capabilities: ProjectCapabilities,
  makeEvaluator: EvaluatorFactory = createEvaluator
): SessionStore {
  const listeners = new Set<() => void>();
  let state = createSessionState(sketch, capabilities);
  /** The last evaluation that arrived, of the sketch it was asked for. The state has it aligned to the sketch on screen */
  let evaluated: Evaluation | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const evaluator = makeEvaluator(receive);

  /** Calls every listener. */
  function notify(): void {
    listeners.forEach((listener) => listener());
  }

  /** Asks for the evaluation of the sketch on screen. */
  function request(): void {
    evaluator.evaluate(state.sketch);
  }

  /**
   * Keeps a new state, asks for the evaluation of its sketch when an edit changed it, and notifies the listeners.
   * @param next The state after a transition. The same object as the current one means that nothing changed.
   */
  function set(next: SessionState): void {
    if (next === state) {
      return;
    }

    const previous = state;

    state = next;
    if (next.sketch !== previous.sketch) {
      clearTimeout(timer);
      // The panes keep the last evaluation, aligned to the new sketch, until the evaluation of this one arrives
      state = setEvaluation(
        state,
        evaluated && alignEvaluation(evaluated, state.sketch),
        getStatusAfterEdit(previous.evaluationStatus)
      );
      if (next.sketch.config === previous.sketch.config) {
        // The request covers an edit of the config that was waiting, too
        request();
      } else {
        timer = setTimeout(request, EVALUATION_DELAY);
      }
    }
    notify();
  }

  /**
   * Takes what the evaluator reports: an evaluation, which is current when it is of the sketch on screen; that it is late, which a pending status shows from then on; or that it stopped, which only the sketch on screen shows.
   * @param outcome What the evaluator reports.
   */
  function receive(outcome: EvaluationOutcome): void {
    if (outcome.kind === "evaluated") {
      // A reply is a copy, so the problems of a config text that did not change come as a new array that says the same: the config editor and the panes keep the one they have
      evaluated =
        evaluated?.sketch.config === outcome.evaluation.sketch.config
          ? { ...outcome.evaluation, problems: evaluated.problems }
          : outcome.evaluation;
      set(
        setEvaluation(
          state,
          alignEvaluation(evaluated, state.sketch),
          outcome.sketch === state.sketch ? "current" : state.evaluationStatus
        )
      );
    } else if (outcome.kind === "late") {
      if (state.evaluationStatus === "pending") {
        set(setEvaluation(state, state.evaluation, "late"));
      }
    } else if (outcome.sketch === state.sketch) {
      set(
        setEvaluation(
          state,
          state.evaluation,
          outcome.reason === "time-limit" ? "stopped" : "failed"
        )
      );
    }
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start: () => {
      if (evaluated?.sketch !== state.sketch) {
        request();
      }
    },
    dispose: () => {
      clearTimeout(timer);
      evaluator.dispose();
    },
    open: (target) => set(openTarget(state, target)),
    selectItem: (id) => set(selectItem(state, id)),
    toggleFolder: (path, isOpen) => set(toggleFolder(state, path, isOpen)),
    changeConfig: (config, highlight) =>
      set(changeConfig(state, config, highlight)),
    addNode: (kind) => set(addNode(state, kind)),
    startRename: (path) => set(startRename(state, path)),
    renameNode: (path, typedName) => {
      const result = renameNode(state, path, typedName);

      if ("error" in result) {
        return result;
      }
      set(result.state);
      return { path: result.path };
    },
    cancelRename: () => set(cancelRename(state)),
    removeNode: (path) => set(removeNode(state, path)),
    addDependency: (dependency) => set(addDependency(state, dependency)),
    replaceDependency: (ref, dependency) =>
      set(replaceDependency(state, ref, dependency)),
    removeDependency: (ref) => set(removeDependency(state, ref)),
    setView: (view) => set(setView(state, view)),
    setTextDraft: (text) => set(setTextDraft(state, text)),
    readText: () => set(readText(state)),
    settleText: () => set(settleText(state)),
    selectTab: (tab) => set(selectTab(state, tab)),
    setProblemsCollapsed: (collapsed) =>
      set(setProblemsCollapsed(state, collapsed)),
  };
}
