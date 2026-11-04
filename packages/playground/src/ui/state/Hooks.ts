import type { RefObject } from "react";
import { useContext, useMemo, useSyncExternalStore } from "react";

import type { ProjectCapabilities, Sketch } from "../../contract";
import type { ConfigProblem, Evaluation } from "../../engine";
import type { TextProblem } from "../../sketch";

import type { Focus } from "./Focus.types";
import type {
  ProblemCounts,
  ProblemListContent,
  ProblemSummary,
  ProblemsTab,
} from "./Problems.types";
import {
  getProblemCounts,
  getProblemList,
  getProblemTabs,
  getShownTab,
  getTextProblems,
  summarizeProblems,
} from "./Selectors";
import type { WorkbenchStore } from "./Store.types";
import { WorkbenchContext } from "./WorkbenchContext";
import type {
  ConfigEditorSnapshot,
  WorkbenchContextValue,
} from "./WorkbenchProvider.types";
import type {
  ConfigReveal,
  ProblemsTabId,
  ProjectView,
  WorkbenchState,
} from "./WorkbenchState.types";

/**
 * Reads what the provider gives the panes.
 * @returns The store, the capabilities and the snapshot of the config editor.
 * @throws {Error} When the component is not inside a `WorkbenchProvider`.
 */
function useWorkbenchContext(): WorkbenchContextValue {
  const value = useContext(WorkbenchContext);

  if (value === null) {
    throw new Error("A pane of the playground is outside WorkbenchProvider.");
  }
  return value;
}

/**
 * Gets the store of the instance. Its methods are stable, so they can go in the dependencies of a hook or in a memoized value.
 * @returns The store.
 */
export function useWorkbenchStore(): WorkbenchStore {
  return useWorkbenchContext().store;
}

/**
 * Reads a slice of the state and renders the component again when the slice changes. The selector must return a stable reference: a slice of the state, not an object built on each call, which would render the component again on each change of the store.
 * @param selector Picks the slice.
 * @returns The slice.
 */
export function useWorkbenchSelector<Slice>(
  selector: (state: WorkbenchState) => Slice
): Slice {
  const store = useWorkbenchStore();

  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getState())
  );
}

/**
 * Reads what the user can change in the project.
 * @returns The capabilities that the host gave.
 */
export function useCapabilities(): ProjectCapabilities {
  return useWorkbenchContext().capabilities;
}

/**
 * Gets where the config editor leaves its snapshot when the config closes, so that it opens again as the user left it.
 * @returns The ref of the instance.
 */
export function useConfigEditorSnapshot(): RefObject<
  ConfigEditorSnapshot | undefined
> {
  return useWorkbenchContext().configEditor;
}

/**
 * Reads the tree of the sketch, which stays the same object while only the config changes.
 * @returns The nodes of the sketch.
 */
export function useTree(): Sketch["tree"] {
  return useWorkbenchSelector((state) => state.sketch.tree);
}

/**
 * Reads the config text.
 * @returns The config, as JSON5 text.
 */
export function useConfig(): string {
  return useWorkbenchSelector((state) => state.sketch.config);
}

/**
 * Reads what the engine says about the sketch.
 * @returns The evaluation.
 */
export function useEvaluation(): Evaluation {
  return useWorkbenchSelector((state) => state.evaluation);
}

/**
 * Reads the problems of the config, which stay the same array while the config text does not change.
 * @returns The problems of the config.
 */
export function useConfigProblems(): readonly ConfigProblem[] {
  return useWorkbenchSelector((state) => state.evaluation.problems);
}

/**
 * Reads what is in focus.
 * @returns The focus.
 */
export function useFocus(): Focus {
  return useWorkbenchSelector((state) => state.focus);
}

/**
 * Reads how the project pane shows the sketch.
 * @returns The view.
 */
export function useView(): ProjectView {
  return useWorkbenchSelector((state) => state.view);
}

/**
 * Reads what the user typed in text mode.
 * @returns The draft, or `undefined` when the text is the sketch's.
 */
export function useTextDraft(): string | undefined {
  return useWorkbenchSelector((state) => state.textDraft);
}

/**
 * Reads the range that the config editor must scroll to.
 * @returns The request, or `undefined` when there is none.
 */
export function useReveal(): ConfigReveal | undefined {
  return useWorkbenchSelector((state) => state.reveal);
}

/**
 * Reads whether the problems panel shows its head only.
 * @returns Whether the panel is collapsed.
 */
export function useProblemsCollapsed(): boolean {
  return useWorkbenchSelector((state) => state.problemsCollapsed);
}

/**
 * Reads the folder the user selected in the tree.
 * @returns Its path, or `undefined` when no folder is selected.
 */
export function usePickedFolder(): string | undefined {
  return useWorkbenchSelector((state) => state.pickedFolder);
}

/**
 * Reads the folders the user closed in the tree.
 * @returns Their paths.
 */
export function useClosedFolders(): ReadonlySet<string> {
  return useWorkbenchSelector((state) => state.closedFolders);
}

/**
 * Reads the node whose name is being edited in the tree.
 * @returns Its path, or `undefined` when no node is being renamed.
 */
export function useRenaming(): string | undefined {
  return useWorkbenchSelector((state) => state.renaming);
}

/**
 * Reads the lines of text mode that cannot be read, derived from the draft.
 * @returns The lines, in order; the same array while the draft does not change.
 */
export function useTextProblems(): readonly TextProblem[] {
  const draft = useTextDraft();

  return useMemo(() => getTextProblems(draft), [draft]);
}

/**
 * Reads how many problems there are and how serious they are.
 * @returns The summary; the same object while the problems do not change.
 */
export function useProblemSummary(): ProblemSummary {
  const problems = useConfigProblems();
  const textProblems = useTextProblems();

  return useMemo(
    () => summarizeProblems(problems, textProblems),
    [problems, textProblems]
  );
}

/**
 * Reads the problems of each node of the tree.
 * @returns The counts; the same object while the numbers do not change.
 */
export function useProblemCounts(): ProblemCounts {
  const { configCount, configHasErrors } = useProblemSummary();

  // Keyed on the numbers, not on the problems: an evaluation of the config with as many problems as before must not render every item of the tree again
  return useMemo(
    () => getProblemCounts(configCount, configHasErrors),
    [configCount, configHasErrors]
  );
}

/**
 * Reads the tabs of the problems panel.
 * @returns The tabs, in order; the same array while the focus and the problems do not change.
 */
export function useProblemTabs(): readonly ProblemsTab<ProblemsTabId>[] {
  const openNode = useFocus();
  const summary = useProblemSummary();

  return useMemo(() => getProblemTabs(openNode, summary), [openNode, summary]);
}

/**
 * Reads the tab of the problems panel that shows.
 * @returns The selected tab, or the sketch's when nothing is in focus.
 */
export function useShownTab(): ProblemsTabId {
  const openNode = useFocus();
  const tab = useWorkbenchSelector((state) => state.tab);

  return getShownTab(openNode, tab);
}

/**
 * Reads what the tab that shows lists.
 * @returns The rows, the text for no rows and whether the note about invalid rule options shows.
 */
export function useProblemList(): ProblemListContent {
  const tab = useShownTab();
  const openNode = useFocus();
  const problems = useConfigProblems();
  const rulesValid = useWorkbenchSelector(
    (state) => state.evaluation.rulesValid
  );
  const textProblems = useTextProblems();

  return useMemo(
    () => getProblemList(tab, openNode, problems, rulesValid, textProblems),
    [tab, openNode, problems, rulesValid, textProblems]
  );
}

/**
 * Gets the command that opens a target.
 * @returns The stable method of the store.
 */
export function useOpen(): WorkbenchStore["open"] {
  return useWorkbenchStore().open;
}

/**
 * Gets the command that handles the selection of an item of the tree.
 * @returns The stable method of the store.
 */
export function useSelectItem(): WorkbenchStore["selectItem"] {
  return useWorkbenchStore().selectItem;
}

/**
 * Gets the command that remembers that a folder was opened or closed.
 * @returns The stable method of the store.
 */
export function useToggleFolder(): WorkbenchStore["toggleFolder"] {
  return useWorkbenchStore().toggleFolder;
}

/**
 * Gets the command that replaces the config text.
 * @returns The stable method of the store.
 */
export function useChangeConfig(): WorkbenchStore["changeConfig"] {
  return useWorkbenchStore().changeConfig;
}

/**
 * Gets the command that adds a file or a folder and starts renaming it.
 * @returns The stable method of the store.
 */
export function useAddNode(): WorkbenchStore["addNode"] {
  return useWorkbenchStore().addNode;
}

/**
 * Gets the command that starts renaming a node.
 * @returns The stable method of the store.
 */
export function useStartRename(): WorkbenchStore["startRename"] {
  return useWorkbenchStore().startRename;
}

/**
 * Gets the command that renames a node with the name typed.
 * @returns The stable method of the store.
 */
export function useRenameNode(): WorkbenchStore["renameNode"] {
  return useWorkbenchStore().renameNode;
}

/**
 * Gets the command that gives up renaming.
 * @returns The stable method of the store.
 */
export function useCancelRename(): WorkbenchStore["cancelRename"] {
  return useWorkbenchStore().cancelRename;
}

/**
 * Gets the command that removes a node.
 * @returns The stable method of the store.
 */
export function useRemoveNode(): WorkbenchStore["removeNode"] {
  return useWorkbenchStore().removeNode;
}

/**
 * Gets the command that shows the project as a tree or as text.
 * @returns The stable method of the store.
 */
export function useSetView(): WorkbenchStore["setView"] {
  return useWorkbenchStore().setView;
}

/**
 * Gets the command that keeps what the user typed in text mode.
 * @returns The stable method of the store.
 */
export function useSetTextDraft(): WorkbenchStore["setTextDraft"] {
  return useWorkbenchStore().setTextDraft;
}

/**
 * Gets the command that reads the text the user typed, and keeps the draft.
 * @returns The stable method of the store.
 */
export function useReadText(): WorkbenchStore["readText"] {
  return useWorkbenchStore().readText;
}

/**
 * Gets the command that reads the text the user typed, and drops the draft when every line was read.
 * @returns The stable method of the store.
 */
export function useSettleText(): WorkbenchStore["settleText"] {
  return useWorkbenchStore().settleText;
}

/**
 * Gets the command that selects a tab of the problems panel.
 * @returns The stable method of the store.
 */
export function useSelectTab(): WorkbenchStore["selectTab"] {
  return useWorkbenchStore().selectTab;
}

/**
 * Gets the command that collapses or expands the problems panel.
 * @returns The stable method of the store.
 */
export function useSetProblemsCollapsed(): WorkbenchStore["setProblemsCollapsed"] {
  return useWorkbenchStore().setProblemsCollapsed;
}
