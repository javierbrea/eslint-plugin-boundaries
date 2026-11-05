import type { Evaluation } from "@/engine";
import type { Focus, Target } from "@/ui/state";

/** Props of the inspector. */
export type InspectorProps = {
  /** What is in focus: the inspector describes it. */
  readonly focus: Focus;
  /** What the engine says about the sketch. */
  readonly evaluation: Evaluation;
  /** Called with what a row opens, such as the entry of the config that a row of the config inspector is about. */
  readonly onOpen: (target: Target) => void;
};
