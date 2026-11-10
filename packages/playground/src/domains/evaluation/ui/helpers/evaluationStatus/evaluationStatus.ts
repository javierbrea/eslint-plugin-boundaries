import type { EvaluationStatus } from "@/domains/evaluation/helpers/evaluator";
import type { StateTone } from "@/ui-kit/helpers/tone";

import {
  EVALUATING_NOTE,
  EVALUATING_STATUS,
  NOT_EVALUATED_LABEL,
  FAILED_NOTE,
  FAILED_STATUS,
  STOPPED_NOTE,
  STOPPED_STATUS,
} from "./evaluationStatus.constants";

/**
 * Tells whether the panes dim what the evaluation on screen says, because it is of an older sketch and has been for long enough to be seen. They do not dim it while a newer evaluation is on its way and not late, which is most of the time just after an edit, so that nothing flickers.
 * @param evaluationStatus How the evaluation on screen stands to the sketch.
 * @returns `true` while it is late, stopped or failed.
 */
export function isEvaluationDimmed(
  evaluationStatus: EvaluationStatus
): boolean {
  return (
    evaluationStatus === "late" ||
    evaluationStatus === "stopped" ||
    evaluationStatus === "failed"
  );
}

/**
 * Writes the note of the panes about the evaluation: the inspector shows it in place of a description, when there is no evaluation, and the problems panel above its list.
 * @param evaluationStatus How the evaluation on screen stands to the sketch.
 * @param hasEvaluation Whether there is an evaluation on screen.
 * @returns That the evaluation was stopped or could not run; that the project is being evaluated, when the first evaluation is late; and `undefined` otherwise.
 */
export function getEvaluationNote(
  evaluationStatus: EvaluationStatus,
  hasEvaluation: boolean
): string | undefined {
  if (evaluationStatus === "stopped") {
    return STOPPED_NOTE;
  }
  if (evaluationStatus === "failed") {
    return FAILED_NOTE;
  }
  return evaluationStatus === "late" && !hasEvaluation
    ? EVALUATING_NOTE
    : undefined;
}

/**
 * Writes what the status of the top bar says in place of the problems.
 * @param evaluationStatus How the evaluation on screen stands to the sketch.
 * @returns The text and its tone while the evaluation is late, stopped or failed, and `undefined` otherwise.
 */
export function getEvaluationStatusText(
  evaluationStatus: EvaluationStatus
): { readonly text: string; readonly tone: StateTone } | undefined {
  if (evaluationStatus === "late") {
    return { text: EVALUATING_STATUS, tone: "faint" };
  }
  if (evaluationStatus === "stopped") {
    return { text: STOPPED_STATUS, tone: "warn" };
  }
  return evaluationStatus === "failed"
    ? { text: FAILED_STATUS, tone: "bad" }
    : undefined;
}

/**
 * Writes what the line of a dependency that no evaluation has decided yet says in place of a verdict.
 * @param evaluationStatus How the evaluation on screen stands to the sketch.
 * @returns `evaluating…` while the evaluation is late, `not evaluated` when it stopped or failed, and `undefined` otherwise, when the line shows no verdict yet: a usual evaluation arrives before anyone could read it.
 */
export function getPendingVerdictLabel(
  evaluationStatus: EvaluationStatus
): string | undefined {
  if (evaluationStatus === "late") {
    return EVALUATING_STATUS;
  }
  return evaluationStatus === "stopped" || evaluationStatus === "failed"
    ? NOT_EVALUATED_LABEL
    : undefined;
}
