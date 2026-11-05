import type { Sketch } from "@/contract";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import type {
  ConfigReveal,
  Focus,
  ProblemsTabId,
  ProjectView,
} from "@/domains/session/helpers/focus";

/** What a playground instance remembers: the sketch it edits, its evaluation, and everything about how they are shown. Every transition returns a new state and never changes one. */
export type SessionState = {
  /** The sketch being edited. It is replaced by a new one after each edit. */
  readonly sketch: Sketch;
  /** What the engine says about the sketch, or about the one before it while an edit of the config waits out the delay. */
  readonly evaluation: Evaluation;
  /** What is in focus. */
  readonly focus: Focus;
  /** The selected tab of the problems panel. It is `node` only while something is in focus. */
  readonly tab: ProblemsTabId;
  /** Whether the problems panel shows its head only. */
  readonly problemsCollapsed: boolean;
  /** The range that the config editor must scroll to. It is set only while the config is in focus. */
  readonly reveal: ConfigReveal | undefined;
  /** How many ranges were revealed so far: the key of the next request is the next number, so that a key is never used twice even when the request before it was dropped. */
  readonly revealCount: number;
  /** How the project pane shows the sketch. */
  readonly view: ProjectView;
  /** What the user typed in text mode since the text was last in sync with the sketch; `undefined` shows the text of the sketch. Leaving text mode drops it. */
  readonly textDraft: string | undefined;
  /** The folder the user selected in the tree: it does not take the focus, which stays on the open file, but it is where a new node goes. It can be gone or be a file after an edit. */
  readonly pickedFolder: string | undefined;
  /** The folders the user closed in the tree. The others are open. */
  readonly closedFolders: ReadonlySet<string>;
  /** The path of the node whose name is being edited in the tree, if any. */
  readonly renaming: string | undefined;
};
