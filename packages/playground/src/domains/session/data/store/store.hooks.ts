import { useContext, useSyncExternalStore } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import type {
  ConfigProblem,
  DependencyResult,
  EntityDescription,
  Evaluation,
} from "@/domains/evaluation/helpers/engine";
import type { EvaluationStatus } from "@/domains/evaluation/helpers/evaluator";
import type {
  ConfigReveal,
  Focus,
  PolicyHighlight,
  ProjectView,
} from "@/domains/session/helpers/focus";

import { SessionContext } from "./sessionContext";
import type { SessionContextValue } from "./SessionProvider.types";
import type { SessionState } from "./sessionState.types";
import { NO_DESCRIPTIONS, NO_PROBLEMS, NO_RESULTS } from "./store.constants";
import type { SessionStore } from "./store.types";

/**
 * Reads what the provider gives the panes.
 * @returns The store.
 * @throws {Error} When the component is not inside a `SessionProvider`.
 */
function useSessionContext(): SessionContextValue {
  const value = useContext(SessionContext);

  if (value === null) {
    throw new Error("A pane of the playground is outside SessionProvider.");
  }
  return value;
}

/**
 * Gets the store of the instance. Its methods are stable, so they can go in the dependencies of a hook or in a memoized value.
 * @returns The store.
 */
export function useSessionStore(): SessionStore {
  return useSessionContext().store;
}

/**
 * Reads a slice of the state and renders the component again when the slice changes. The selector must return a stable reference: a slice of the state, not an object built on each call, which would render the component again on each change of the store.
 * @param selector Picks the slice.
 * @returns The slice.
 */
export function useSessionSelector<Slice>(
  selector: (state: SessionState) => Slice
): Slice {
  const store = useSessionStore();

  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getState())
  );
}

/**
 * Reads what the user can change in the project, to show or hide the controls that edit it. The store refuses the edits that they do not allow, whatever a pane shows.
 * @returns The capabilities that the host gave when the store was created.
 */
export function useCapabilities(): ProjectCapabilities {
  return useSessionSelector((state) => state.capabilities);
}

/**
 * Reads the tree of the sketch, which stays the same object while only the config changes.
 * @returns The nodes of the sketch.
 */
export function useTree(): Sketch["tree"] {
  return useSessionSelector((state) => state.sketch.tree);
}

/**
 * Reads the config text.
 * @returns The config, as JSON5 text.
 */
export function useConfig(): string {
  return useSessionSelector((state) => state.sketch.config);
}

/**
 * Reads what the engine says about the sketch, or the last evaluation aligned to it while the evaluation of the sketch is behind it (see {@link useEvaluationStatus}).
 * @returns The evaluation, or `undefined` until the first one arrives.
 */
export function useEvaluation(): Evaluation | undefined {
  return useSessionSelector((state) => state.evaluation);
}

/**
 * Reads how the evaluation on screen stands to the sketch: current, on its way, late, stopped or failed.
 * @returns The status.
 */
export function useEvaluationStatus(): EvaluationStatus {
  return useSessionSelector((state) => state.evaluationStatus);
}

/**
 * Reads the problems of the config, which stay the same array while the config text does not change.
 * @returns The problems of the config of the evaluation on screen, and none until the first evaluation arrives.
 */
export function useConfigProblems(): readonly ConfigProblem[] {
  return useSessionSelector(
    (state) => state.evaluation?.problems ?? NO_PROBLEMS
  );
}

/**
 * Reads the verdict of each dependency of the sketch, as the evaluation on screen gives them.
 * @returns The dependencies of the evaluation, aligned to the sketch, and none until the first evaluation arrives.
 */
export function useDependencyResults(): readonly DependencyResult[] {
  return useSessionSelector(
    (state) => state.evaluation?.dependencies ?? NO_RESULTS
  );
}

/**
 * Reads how the plugin describes each file of the sketch, as the evaluation on screen gives them.
 * @returns The descriptions by path, and none until the first evaluation arrives.
 */
export function useFileDescriptions(): ReadonlyMap<string, EntityDescription> {
  return useSessionSelector(
    (state) => state.evaluation?.files ?? NO_DESCRIPTIONS
  );
}

/**
 * Reads what is in focus.
 * @returns The focus.
 */
export function useFocus(): Focus {
  return useSessionSelector((state) => state.focus);
}

/**
 * Reads how the project pane shows the sketch.
 * @returns The view.
 */
export function useView(): ProjectView {
  return useSessionSelector((state) => state.view);
}

/**
 * Reads what the user typed in text mode.
 * @returns The draft, or `undefined` when the text is the sketch's.
 */
export function useTextDraft(): string | undefined {
  return useSessionSelector((state) => state.textDraft);
}

/**
 * Reads the range that the config editor must scroll to.
 * @returns The request, or `undefined` when there is none.
 */
export function useReveal(): ConfigReveal | undefined {
  return useSessionSelector((state) => state.reveal);
}

/**
 * Reads the policy that the user opened from a dependency, which the config editor keeps marked.
 * @returns The highlight, or `undefined` when there is none.
 */
export function usePolicyHighlight(): PolicyHighlight | undefined {
  return useSessionSelector((state) => state.highlight);
}

/**
 * Reads whether the problems panel shows its head only.
 * @returns Whether the panel is collapsed.
 */
export function useProblemsCollapsed(): boolean {
  return useSessionSelector((state) => state.problemsCollapsed);
}

/**
 * Reads the folder the user selected in the tree.
 * @returns Its path, or `undefined` when no folder is selected.
 */
export function usePickedFolder(): string | undefined {
  return useSessionSelector((state) => state.pickedFolder);
}

/**
 * Reads the folders the user closed in the tree.
 * @returns Their paths.
 */
export function useClosedFolders(): ReadonlySet<string> {
  return useSessionSelector((state) => state.closedFolders);
}

/**
 * Reads the node whose name is being edited in the tree.
 * @returns Its path, or `undefined` when no node is being renamed.
 */
export function useRenaming(): string | undefined {
  return useSessionSelector((state) => state.renaming);
}

/**
 * Gets the command that opens a target.
 * @returns The stable method of the store.
 */
export function useOpen(): SessionStore["open"] {
  return useSessionStore().open;
}

/**
 * Gets the command that closes what is in focus.
 * @returns The stable method of the store.
 */
export function useClose(): SessionStore["close"] {
  return useSessionStore().close;
}

/**
 * Gets the command that handles the selection of an item of the tree.
 * @returns The stable method of the store.
 */
export function useSelectItem(): SessionStore["selectItem"] {
  return useSessionStore().selectItem;
}

/**
 * Gets the command that remembers that a folder was opened or closed.
 * @returns The stable method of the store.
 */
export function useToggleFolder(): SessionStore["toggleFolder"] {
  return useSessionStore().toggleFolder;
}

/**
 * Gets the command that replaces the config text, with where the highlighted policy is after an edit of the editor.
 * @returns The stable method of the store.
 */
export function useChangeConfig(): SessionStore["changeConfig"] {
  return useSessionStore().changeConfig;
}

/**
 * Gets the command that adds a file or a folder and starts renaming it.
 * @returns The stable method of the store.
 */
export function useAddNode(): SessionStore["addNode"] {
  return useSessionStore().addNode;
}

/**
 * Gets the command that starts renaming a node.
 * @returns The stable method of the store.
 */
export function useStartRename(): SessionStore["startRename"] {
  return useSessionStore().startRename;
}

/**
 * Gets the command that renames a node with the name typed.
 * @returns The stable method of the store.
 */
export function useRenameNode(): SessionStore["renameNode"] {
  return useSessionStore().renameNode;
}

/**
 * Gets the command that gives up renaming.
 * @returns The stable method of the store.
 */
export function useCancelRename(): SessionStore["cancelRename"] {
  return useSessionStore().cancelRename;
}

/**
 * Gets the command that removes a node.
 * @returns The stable method of the store.
 */
export function useRemoveNode(): SessionStore["removeNode"] {
  return useSessionStore().removeNode;
}

/**
 * Gets the command that adds a dependency and puts it in focus.
 * @returns The stable method of the store.
 */
export function useAddDependency(): SessionStore["addDependency"] {
  return useSessionStore().addDependency;
}

/**
 * Gets the command that replaces a dependency with another one of the same file.
 * @returns The stable method of the store.
 */
export function useReplaceDependency(): SessionStore["replaceDependency"] {
  return useSessionStore().replaceDependency;
}

/**
 * Gets the command that removes a dependency.
 * @returns The stable method of the store.
 */
export function useRemoveDependency(): SessionStore["removeDependency"] {
  return useSessionStore().removeDependency;
}

/**
 * Gets the command that shows the project as a tree or as text.
 * @returns The stable method of the store.
 */
export function useSetView(): SessionStore["setView"] {
  return useSessionStore().setView;
}

/**
 * Gets the command that keeps what the user typed in text mode.
 * @returns The stable method of the store.
 */
export function useSetTextDraft(): SessionStore["setTextDraft"] {
  return useSessionStore().setTextDraft;
}

/**
 * Gets the command that reads the text the user typed, and keeps the draft.
 * @returns The stable method of the store.
 */
export function useReadText(): SessionStore["readText"] {
  return useSessionStore().readText;
}

/**
 * Gets the command that reads the text the user typed, and drops the draft when every line was read.
 * @returns The stable method of the store.
 */
export function useSettleText(): SessionStore["settleText"] {
  return useSessionStore().settleText;
}

/**
 * Gets the command that selects a tab of the problems panel.
 * @returns The stable method of the store.
 */
export function useSelectTab(): SessionStore["selectTab"] {
  return useSessionStore().selectTab;
}

/**
 * Gets the command that collapses or expands the problems panel.
 * @returns The stable method of the store.
 */
export function useSetProblemsCollapsed(): SessionStore["setProblemsCollapsed"] {
  return useSessionStore().setProblemsCollapsed;
}
