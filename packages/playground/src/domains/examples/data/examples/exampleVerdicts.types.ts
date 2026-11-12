/** A message that ESLint reported for a statement of the project of an example */
export type ExampleMessage = {
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

/** A dependency that the engine disallowed, as the verdict specs of the examples compare it with a message of ESLint */
export type DisallowedDependency = {
  readonly path: string;
  readonly line: number;
  readonly message: string;
  readonly level: "error" | "warning";
};
