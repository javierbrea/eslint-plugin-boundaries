/** How many dependencies a policy decided, and how many of them it disallowed */
export type PolicyCount = {
  readonly decided: number;
  readonly disallowed: number;
};
