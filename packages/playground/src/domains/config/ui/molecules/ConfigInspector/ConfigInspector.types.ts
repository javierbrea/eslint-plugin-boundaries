import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import type { Target } from "@/domains/session/helpers/focus";

/** Props of the config inspector. */
export type ConfigInspectorProps = {
  /** What the engine says about the sketch. */
  readonly evaluation: Evaluation;
  /** Called with the target of the row that the user chose: its entry in the config. */
  readonly onOpen: (target: Target) => void;
};
