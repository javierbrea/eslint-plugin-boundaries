import type { EvaluationStatus } from "@/domains/evaluation/helpers/evaluator";

import {
  EVALUATING_NOTE,
  EVALUATING_STATUS,
  NOT_EVALUATED_LABEL,
  FAILED_NOTE,
  FAILED_STATUS,
  STOPPED_NOTE,
  STOPPED_STATUS,
} from "./evaluationStatus.constants";
import type {
  EvaluationStatusText,
  PendingVerdict,
} from "./evaluationStatus.types";

/** What a dependency that no evaluation has decided yet shows while the evaluation is late. One object, so that what depends on it is not made again while it does not change */
const EVALUATING_VERDICT: PendingVerdict = {
  icon: "skip",
  label: EVALUATING_STATUS,
};

/** What a dependency that no evaluation has decided yet shows when the evaluation stopped or failed. One object, as {@link EVALUATING_VERDICT} */
const NOT_EVALUATED_VERDICT: PendingVerdict = {
  icon: "skip",
  label: NOT_EVALUATED_LABEL,
};

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
 * @returns The text, its tone and whether it is announced while the evaluation is late, stopped or failed, and `undefined` otherwise. Only a stopped or failed evaluation is announced.
 */
export function getEvaluationStatusText(
  evaluationStatus: EvaluationStatus
): EvaluationStatusText | undefined {
  if (evaluationStatus === "late") {
    return { text: EVALUATING_STATUS, tone: "faint", announce: false };
  }
  if (evaluationStatus === "stopped") {
    return { text: STOPPED_STATUS, tone: "warn", announce: true };
  }
  return evaluationStatus === "failed"
    ? { text: FAILED_STATUS, tone: "bad", announce: true }
    : undefined;
}

/**
 * Writes what a dependency that no evaluation has decided yet shows in place of a verdict, wherever a verdict shows: the line of the file pane, the dependency tab and the icon of its tab.
 * @param evaluationStatus How the evaluation on screen stands to the sketch.
 * @returns The `skip` icon with `evaluating…` while the evaluation is late, with `not evaluated` when it stopped or failed, and `undefined` otherwise, when the dependency shows no verdict yet: a usual evaluation arrives before anyone could read it. Each answer is always the same object.
 */
export function getPendingVerdict(
  evaluationStatus: EvaluationStatus
): PendingVerdict | undefined {
  if (evaluationStatus === "late") {
    return EVALUATING_VERDICT;
  }
  return evaluationStatus === "stopped" || evaluationStatus === "failed"
    ? NOT_EVALUATED_VERDICT
    : undefined;
}
