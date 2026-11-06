/** How many dependencies a set of verdicts holds, by what the engine decided. A dependency that is not evaluated is in `total` and in no other count. */
export type VerdictCounts = {
  /** Every dependency of the set */
  readonly total: number;
  /** The ones a policy or the default allowed */
  readonly allowed: number;
  /** The ones a policy or the default disallowed, whatever the level of the rule */
  readonly disallowed: number;
  /** The disallowed ones that are errors, because the rule has the severity `error`; the others are warnings */
  readonly errors: number;
  /** The ones the rule does not check */
  readonly notChecked: number;
};
