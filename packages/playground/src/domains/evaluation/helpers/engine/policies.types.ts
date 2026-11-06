/** How many dependencies a policy decided, how many of them it disallowed, and how many of those are errors */
export type PolicyCount = {
  readonly decided: number;
  readonly disallowed: number;
  /** The disallowed ones that are errors, because the rule has the severity `error`; the others are warnings */
  readonly errors: number;
};
