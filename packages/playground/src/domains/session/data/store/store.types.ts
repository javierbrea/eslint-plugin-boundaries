import type { SketchDependency } from "@/contract";
import type { TextRange } from "@/domains/evaluation/helpers/engine";
import type { DependencyRef } from "@/domains/project/helpers/sketch";
import type {
  ProblemsTabId,
  ProjectView,
  Target,
} from "@/domains/session/helpers/focus";

import type { SessionState } from "./sessionState.types";

/** The result of a rename: the new path of the node, or why the name is refused. */
export type RenameOutcome =
  | { readonly path: string }
  | { readonly error: string };

/** The state of one playground instance, with the commands that change it. It knows nothing of React or of the host: components read it through the hooks of `store.hooks.ts`, and every method is stable for the life of the store. */
export type SessionStore = {
  /** The current state. The same object until something changes. */
  readonly getState: () => SessionState;
  /** Calls a listener after each change, and returns the function that stops calling it. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Asks for the evaluation of the sketch, unless the evaluation on screen is of it. The provider calls it once it is mounted, and again after a `dispose` when React mounts it again. */
  readonly start: () => void;
  /** Cancels the evaluation that is waiting out its delay and stops the evaluator, when the instance goes away. The next edit or `start` asks for an evaluation again. */
  readonly dispose: () => void;
  /** Opens a target: the focus, the tab of the problems panel and the reveal in the config change together. */
  readonly open: (target: Target) => void;
  /** Closes what is in focus: nothing stays open, and the tab of the problems panel goes back to the sketch's. */
  readonly close: () => void;
  /** Handles the selection of an item of the tree: a file and the config open, a folder is selected. */
  readonly selectItem: (id: string) => void;
  /** Remembers that a folder of the tree was opened or closed. */
  readonly toggleFolder: (path: string, isOpen: boolean) => void;
  /** Replaces the config text. The editor passes where the highlighted policy is after its edit, so that the text and the range change together: `null` drops the highlight, and without it the highlight stays as it was. */
  readonly changeConfig: (config: string, highlight?: TextRange | null) => void;
  /** Adds a file or a folder with a free name, and starts renaming it. */
  readonly addNode: (kind: "file" | "folder") => void;
  /** Starts renaming a node. */
  readonly startRename: (path: string) => void;
  /** Renames a node in its folder with the name typed, or says why it cannot. */
  readonly renameNode: (path: string, typedName: string) => RenameOutcome;
  /** Gives up renaming. */
  readonly cancelRename: () => void;
  /** Removes a node and everything under it. */
  readonly removeNode: (path: string) => void;
  /** Adds a dependency at the end of the dependencies of its file, and puts it in focus. The sketch can refuse it: nothing changes then. */
  readonly addDependency: (dependency: SketchDependency) => void;
  /** Replaces a dependency with another one of the same file, in the same position; it stays in focus if it was. The sketch can refuse it: nothing changes then. */
  readonly replaceDependency: (
    ref: DependencyRef,
    dependency: SketchDependency
  ) => void;
  /** Removes a dependency. A dependency in focus moves with the ones after it, and the file takes the focus when the one in focus is removed. */
  readonly removeDependency: (ref: DependencyRef) => void;
  /** Shows the project as a tree or as text. */
  readonly setView: (view: ProjectView) => void;
  /** Keeps what the user typed in text mode. */
  readonly setTextDraft: (text: string) => void;
  /** Reads the text the user typed into the sketch, and keeps the draft. */
  readonly readText: () => void;
  /** Reads the text the user typed into the sketch, and drops the draft when every line was read. */
  readonly settleText: () => void;
  /** Selects a tab of the problems panel, and expands the panel. */
  readonly selectTab: (tab: ProblemsTabId) => void;
  /** Collapses or expands the problems panel. */
  readonly setProblemsCollapsed: (collapsed: boolean) => void;
};
