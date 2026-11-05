import type { ProjectCapabilities, Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";

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
  setView,
  setTextDraft,
  readText,
  settleText,
  selectTab,
  setProblemsCollapsed,
} from "./transitions";

/**
 * Creates the store of one playground instance, with its own engine, so that several instances on a page never share an evaluation. Each method applies the transition of `transitions.ts` with its name, `open` applies `openTarget`, and notifies the listeners when the state changed. The store evaluates the sketch after each edit: at once when only the tree changed, because adding, renaming or removing a node is one action and the panes must not disagree in between, and a moment after the last edit of the config, which comes in keystrokes.
 * @param sketch The sketch to start from. It is evaluated at once, so that the panes never render without an evaluation.
 * @param capabilities What the user can change in the project: an edit that they do not allow changes nothing and notifies no listener.
 * @returns The store.
 */
export function createSessionStore(
  sketch: Sketch,
  capabilities: ProjectCapabilities
): SessionStore {
  const engine = createEngine();
  const listeners = new Set<() => void>();
  let state = createSessionState(sketch, engine.evaluate(sketch), capabilities);
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Calls every listener. */
  function notify(): void {
    listeners.forEach((listener) => listener());
  }

  /**
   * Keeps a new state, evaluates its sketch when an edit changed it, and notifies the listeners.
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
      if (next.sketch.config === previous.sketch.config) {
        // The evaluation covers an edit of the config that was waiting, too
        state = setEvaluation(state, engine.evaluate(state.sketch));
      } else {
        // The panes keep the previous evaluation until then
        timer = setTimeout(() => {
          set(setEvaluation(state, engine.evaluate(state.sketch)));
        }, EVALUATION_DELAY);
      }
    }
    notify();
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose: () => clearTimeout(timer),
    open: (target) => set(openTarget(state, target)),
    selectItem: (id) => set(selectItem(state, id)),
    toggleFolder: (path, isOpen) => set(toggleFolder(state, path, isOpen)),
    changeConfig: (config) => set(changeConfig(state, config)),
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
    setView: (view) => set(setView(state, view)),
    setTextDraft: (text) => set(setTextDraft(state, text)),
    readText: () => set(readText(state)),
    settleText: () => set(settleText(state)),
    selectTab: (tab) => set(selectTab(state, tab)),
    setProblemsCollapsed: (collapsed) =>
      set(setProblemsCollapsed(state, collapsed)),
  };
}
