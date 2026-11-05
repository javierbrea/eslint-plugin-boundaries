import type { Evaluation } from "@/domains/evaluation/helpers/engine";

/** Props of the file inspector. */
export type FileInspectorProps = {
  /** Path of the file in focus. */
  readonly path: string;
  /** What the engine says about the sketch. */
  readonly evaluation: Evaluation;
};
