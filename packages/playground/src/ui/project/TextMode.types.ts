import type { Sketch } from "../../contract";
import type { TextProblem } from "../../sketch";

/** Props of {@link TextMode}. */
export type TextModeProps = {
  /** The sketch to write as text. The latest one is always the base of what the text edits, so that its dependencies are kept */
  readonly sketch: Sketch;
  /** The text cannot be edited, only selected and copied */
  readonly readOnly: boolean;
  /** Called with the new sketch when the text, once read, differs from it */
  readonly onSketchChange: (sketch: Sketch) => void;
  /** Called with the lines that could not be read each time the text is read, and with an empty list when the view is left with unread lines */
  readonly onTextProblems: (problems: readonly TextProblem[]) => void;
};
