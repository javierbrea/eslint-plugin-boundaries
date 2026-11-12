import type { VerdictIcon } from "@/domains/evaluation/ui/helpers/verdictText";
import type { StateTone } from "@/ui-kit/helpers/tone";

/** What the status of the top bar says about the evaluation, in place of the problems. */
export type EvaluationStatusText = {
  /** The text, such as `evaluation stopped`. */
  readonly text: string;
  /** The color of the text and of the dot. */
  readonly tone: StateTone;
  /** Whether a screen reader is told when the status starts saying it: the end of an evaluation that stopped or failed, which the faded panes do not tell. `evaluating…` is not, since it would come with every slow edit. */
  readonly announce: boolean;
};

/** What a dependency that no evaluation has decided yet shows in place of its verdict, once the evaluation is late, stopped or failed. */
export type PendingVerdict = {
  /** The icon of a verdict that is not known: `skip`. */
  readonly icon: VerdictIcon;
  /** What it reads after the icon: `evaluating…`, or `not evaluated` when the evaluation stopped or failed. */
  readonly label: string;
};
