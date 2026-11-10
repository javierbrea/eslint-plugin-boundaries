import { EVALUATION_TIME_LIMIT } from "@/domains/evaluation/helpers/evaluator";

/** What the panes say while the first evaluation of the project is late. */
export const EVALUATING_NOTE = "Evaluating the project…";

/** What the panes say when the evaluation of the project took longer than the limit. */
export const STOPPED_NOTE = `The evaluation took longer than ${EVALUATION_TIME_LIMIT / 1000} seconds and was stopped. Edit the project to evaluate it again.`;

/** What the panes say when the worker that evaluates the project failed, such as when its script could not load. */
export const FAILED_NOTE =
  "The evaluation could not run. Edit the project to try again.";

/** What the status of the top bar says in place of the problems while an evaluation is late. */
export const EVALUATING_STATUS = "evaluating…";

/** What the status of the top bar says in place of the problems when the evaluation was stopped. */
export const STOPPED_STATUS = "evaluation stopped";

/** What the status of the top bar says in place of the problems when the evaluation could not run. */
export const FAILED_STATUS = "evaluation failed";

/** What the line of a dependency that no evaluation decided says when the evaluation stopped or failed. */
export const NOT_EVALUATED_LABEL = "not evaluated";
