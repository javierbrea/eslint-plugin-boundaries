/** Props of {@link ProblemNote}. */
export type ProblemNoteProps = {
  /** What the note says, as a sentence. */
  readonly children: string;
  /** The test id of the root element, in place of the default one. */
  readonly testId?: string;
};
