import type { Sketch } from "../../contract";
import type { TextRange } from "../../engine";
import type { TextProblem } from "../../sketch";
import type { ConfigEditorReveal } from "../config";
import type { ProjectView } from "../project";

import type { Focus } from "./Focus.types";

/** A tab of the problems panel in M1: the sketch as a whole, or the node in focus. Phase 6 adds the dependency in focus. */
export type ProblemsTabId = "sketch" | "node";

/** What the workbench remembers: the sketch it edits and everything about how it is shown. */
export type WorkbenchState = {
  /** The sketch being edited. It is replaced by a new one after each edit and never changed. */
  readonly sketch: Sketch;
  /** What is in focus. */
  readonly focus: Focus;
  /** How the project pane shows the sketch. */
  readonly view: ProjectView;
  /** The selected tab of the problems panel. It is `node` only while something is in focus. */
  readonly tab: ProblemsTabId;
  /** Whether the problems panel shows its head only. */
  readonly collapsed: boolean;
  /** The lines of text mode that could not be read. */
  readonly textProblems: readonly TextProblem[];
  /** The range that the config editor must scroll to. It is set only while the config is in focus. */
  readonly reveal: ConfigEditorReveal | undefined;
  /** How many ranges were revealed so far: the key of the next request is the next number, so that a key is never used twice even when the request before it was dropped. */
  readonly revealCount: number;
};

/** What happens to the workbench. */
export type WorkbenchAction =
  /** The tree or the text of the project changed: a new sketch. */
  | { readonly type: "sketch"; readonly sketch: Sketch }
  /** The user edited the config. */
  | { readonly type: "config"; readonly config: string }
  /** Something else is in focus. */
  | { readonly type: "focus"; readonly focus: Focus }
  /** The config opens scrolled to a range. */
  | { readonly type: "reveal"; readonly range: TextRange }
  /** The project pane shows another view. */
  | { readonly type: "view"; readonly view: ProjectView }
  /** The user selected a tab of the problems panel. */
  | { readonly type: "tab"; readonly tab: ProblemsTabId }
  /** The problems panel was collapsed or expanded. */
  | { readonly type: "collapsed"; readonly collapsed: boolean }
  /** The lines of text mode that could not be read changed. */
  | {
      readonly type: "textProblems";
      readonly problems: readonly TextProblem[];
    };

/** What the panes can ask of the workbench. */
export type WorkbenchActions = {
  /** Replaces the sketch after an edit of the tree or of the text. */
  readonly changeSketch: (sketch: Sketch) => void;
  /** Replaces the config text of the sketch. */
  readonly changeConfig: (config: string) => void;
  /** Puts something in focus. */
  readonly focus: (focus: Focus) => void;
  /** Opens the config scrolled to a range. */
  readonly reveal: (range: TextRange) => void;
  /** Shows the project as a tree or as text. */
  readonly changeView: (view: ProjectView) => void;
  /** Selects a tab of the problems panel, and expands the panel. */
  readonly selectTab: (tab: ProblemsTabId) => void;
  /** Collapses or expands the problems panel. */
  readonly setCollapsed: (collapsed: boolean) => void;
  /** Keeps the lines of text mode that could not be read. */
  readonly setTextProblems: (problems: readonly TextProblem[]) => void;
};

/** What `useWorkbench` returns. */
export type WorkbenchController = {
  /** What the workbench remembers. */
  readonly state: WorkbenchState;
  /** What the panes can ask of it. The functions never change. */
  readonly actions: WorkbenchActions;
};
