import type { Evaluation } from "@/domains/evaluation/helpers/engine";

/** Props of the summary of the sketch. */
export type ProjectSummaryProps = {
  /** What the engine says about the sketch. */
  readonly evaluation: Evaluation;
};
