import type { Evaluation, TextRange } from "../../engine";
import type { Focus } from "../state/Focus.types";

/** Props of the inspector. */
export type InspectorProps = {
  /** What is in focus: the inspector describes it. */
  readonly focus: Focus;
  /** What the engine says about the sketch. */
  readonly evaluation: Evaluation;
  /** Called with the range of the config that a row of the config inspector is about, so that the workbench opens the config there. */
  readonly onReveal: (range: TextRange) => void;
};
