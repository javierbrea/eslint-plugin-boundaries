import { Pom } from "@/shared/testing/pom";
import { NotePom } from "@/ui-kit/molecules/Note/Note.pom";

import { PROBLEM_NOTE_TEST_ID } from "./ProblemNote.constants";

/** Page object of a note above the problems of a tab. */
export class ProblemNotePom extends Pom {
  protected readonly defaultTestId = PROBLEM_NOTE_TEST_ID;

  /**
   * The note it is made of, which has the same root element.
   * @returns The page object of the note.
   */
  get note(): NotePom {
    return this.childPom(NotePom, { root: this.root });
  }

  /**
   * What the note says.
   * @returns The text of the note.
   */
  get text(): string {
    return this.note.text;
  }

  /**
   * The space around the note, which places it above the list.
   * @returns The computed margin.
   */
  get margin(): string {
    return getComputedStyle(this.root).margin;
  }
}
