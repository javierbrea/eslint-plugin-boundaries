import type { ProjectCapabilities, Sketch } from "../../contract";
import type { TextProblem } from "../../sketch";
import type { Focus, ProblemCounts } from "../state/Focus.types";

/** How the pane shows the project: as a tree, or as one path per line */
export type ProjectView = "tree" | "text";

/** Props of {@link ProjectPane}. */
export type ProjectPaneProps = {
  /** The sketch to show. The pane keeps no copy of it: every edit goes through `onSketchChange` */
  readonly sketch: Sketch;
  /** What is in focus. The tree selects it, and follows it when the focused file is renamed or removed */
  readonly focus: Focus;
  /** How the project is shown */
  readonly view: ProjectView;
  /** Problems per node, for the badges of the tree */
  readonly counts: ProblemCounts;
  /** What the user can change: without `editTree` the tree cannot be edited and the text is read only */
  readonly capabilities: ProjectCapabilities;
  /** Called with the view the user asks for */
  readonly onViewChange: (view: ProjectView) => void;
  /** Called with the new sketch after each edit of the tree or of the text */
  readonly onSketchChange: (sketch: Sketch) => void;
  /** Called with what the user opens in the tree, or with `none` when the focused file is removed */
  readonly onFocus: (focus: Focus) => void;
  /** Called with the lines of text mode that could not be read, and with an empty list when there are none */
  readonly onTextProblems: (problems: readonly TextProblem[]) => void;
};
