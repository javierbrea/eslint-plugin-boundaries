import type { ProjectCapabilities, Sketch } from "@/contract";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import type { DependencyRef } from "@/domains/project/helpers/sketch";
import type {
  ConfigReveal,
  Focus,
  PolicyHighlight,
  ProblemsTabId,
  ProjectView,
} from "@/domains/session/helpers/focus";

/** A focus that has a file: the file itself, or one of its dependencies. */
export type FileFocus = Extract<
  Focus,
  { readonly kind: "file" | "dependency" }
>;

/** The line of the text draft where the dependency in focus is written, kept for as long as that focus is the one in the state. */
export type FocusAnchor = {
  /** The focus that the line was found for: a dependency, or the file of a dependency whose line cannot be read. The anchor says nothing once the focus in the state is another object. */
  readonly focus: FileFocus;
  /** Number of the line in the draft, from 1, or `undefined` when an edit of the text deleted the line. */
  readonly line: number | undefined;
};

/** The line of the text draft where the dependency of the highlight is written, kept for as long as that dependency is the one in the highlight. */
export type HighlightAnchor = {
  /** The dependency that the line was found for. The anchor says nothing once the highlight in the state has another dependency object. */
  readonly dependency: DependencyRef;
  /** Number of the line in the draft, from 1, or `undefined` when an edit of the text deleted the line. */
  readonly line: number | undefined;
};

/** Where the dependency in focus and the dependency of the highlight are written in the text draft. Each keystroke moves the lines through the edit it made, and each read of the draft puts the focus and the highlight on the dependencies of those lines, so that they follow what the user edits while a line cannot be read, and when lines are repeated, added or deleted around them. */
export type TextAnchors = {
  /** The draft that the lines are of: the anchors say nothing about any other text. */
  readonly draft: string;
  /** The line of the focus, if the focus is a dependency or the file of one whose line cannot be read. */
  readonly focus?: FocusAnchor;
  /** The line of the dependency of the highlight, if there is a highlight. */
  readonly highlight?: HighlightAnchor;
};

/** What a playground instance remembers: the sketch it edits, its evaluation, and everything about how they are shown. Every transition returns a new state and never changes one. */
export type SessionState = {
  /** The sketch being edited. It is replaced by a new one after each edit. */
  readonly sketch: Sketch;
  /** What the engine says about the sketch, or about the one before it while an edit of the config waits out the delay. */
  readonly evaluation: Evaluation;
  /** What the user can change in the project. The host gives them with the sketch, and they do not change for the life of the instance: an edit that they do not allow leaves the state as it was. */
  readonly capabilities: ProjectCapabilities;
  /** What is in focus. */
  readonly focus: Focus;
  /** The selected tab of the problems panel. It is `node` only while a file, the config or a dependency is in focus, and `dependency` only while a dependency is. */
  readonly tab: ProblemsTabId;
  /** Whether the problems panel shows its head only. */
  readonly problemsCollapsed: boolean;
  /** The range that the config editor must scroll to. It is set only while the config is in focus. */
  readonly reveal: ConfigReveal | undefined;
  /** The policy that the user opened from a dependency, which the config editor keeps marked. It is kept while the config stays in focus: the focus leaving the config, or the config opening without a dependency, drops it. Its range moves with each edit of the config, as the editor reports it with the text, and an edit that deletes the policy drops it; its policy is found again after each evaluation of the text. */
  readonly highlight: PolicyHighlight | undefined;
  /** How many ranges were revealed so far: the key of the next request is the next number, so that a key is never used twice even when the request before it was dropped. */
  readonly revealCount: number;
  /** How the project pane shows the sketch. */
  readonly view: ProjectView;
  /** What the user typed in text mode since the text was last in sync with the sketch; `undefined` shows the text of the sketch. Leaving text mode drops it, and so does adding, replacing or removing a dependency, which the file pane can do in text mode: the next read of a stale draft would bring back the dependencies the edit changed, so the edit wins and the lines of the draft that could not be read are lost. */
  readonly textDraft: string | undefined;
  /** Where the dependency in focus and the dependency of the highlight are written in the text draft, while there is one. An anchor counts only while the draft, the focus and the highlight are the ones it was made for: the transitions that mean another draft, focus or highlight make new values, so the anchors they leave behind are never read. They go when the draft settles. */
  readonly textAnchors: TextAnchors | undefined;
  /** The folder the user selected in the tree: it does not take the focus, which stays on the open file, but it is where a new node goes. It can be gone or be a file after an edit. */
  readonly pickedFolder: string | undefined;
  /** The folders the user closed in the tree. The others are open. */
  readonly closedFolders: ReadonlySet<string>;
  /** The path of the node whose name is being edited in the tree, if any. */
  readonly renaming: string | undefined;
};
