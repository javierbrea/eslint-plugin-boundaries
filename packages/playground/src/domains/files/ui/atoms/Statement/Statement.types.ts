import type { StatementToken } from "@/domains/project/helpers/sketch";

/** Props of {@link Statement}. */
export type StatementProps = {
  /** The pieces of the statement, in order. A keyword and a source are colored, and the rest takes the color of its surroundings */
  readonly tokens: readonly StatementToken[];
};

/** A piece of a statement, as its page object reads it. */
export type StatementPart = {
  /** The text of the piece. */
  readonly text: string;
  /** The computed color of the piece. A piece that is plain text has the color it inherits from the statement. */
  readonly color: string;
};
