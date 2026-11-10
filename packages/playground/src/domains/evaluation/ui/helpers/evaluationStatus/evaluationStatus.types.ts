import type { VerdictIcon } from "@/domains/evaluation/ui/helpers/verdictText";

/** What a dependency that no evaluation has decided yet shows in place of its verdict, once the evaluation is late, stopped or failed. */
export type PendingVerdict = {
  /** The icon of a verdict that is not known: `skip`. */
  readonly icon: VerdictIcon;
  /** What it reads after the icon: `evaluating…`, or `not evaluated` when the evaluation stopped or failed. */
  readonly label: string;
};
