/** A message that ESLint reported for a statement of the quick-start project */
export type QuickStartMessage = {
  /** The path of the file, from the root of the project */
  readonly path: string;
  /** The line of the statement in the file, which is the index of the dependency plus one */
  readonly line: number;
  /** The rule that reported it */
  readonly ruleId: string;
  /** The severity of the rule: 1 for a warning, 2 for an error */
  readonly severity: 1 | 2;
  /** The text ESLint prints for it */
  readonly message: string;
};
