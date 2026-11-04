import type { ReactNode } from "react";

/** A line of the dependency list of a file. Phase 6 adds the actions and the verdict. */
export type DependencyLine = {
  /** Stable among the lines of a list. */
  readonly id: string;
  /** The statement that creates the dependency, as it reads in the code. */
  readonly statement: ReactNode;
};
