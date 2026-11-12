import type { ReactNode } from "react";

/** Props of {@link Note}. */
export type NoteProps = {
  /** What the note says. */
  children: ReactNode;
  /** A class for the root element, which is how `styled(Note)` places the note. */
  className?: string;
  /** The test id of the root element. It is the one of the note when it is unset. */
  testId?: string;
};
