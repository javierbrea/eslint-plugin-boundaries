import { Pom } from "@/shared/testing/pom";
import { NotePom } from "@/ui-kit/molecules/Note/Note.pom";

import { RULES_NOTE_TEST_ID } from "./RulesNote.constants";

/** Page object of the note about invalid rule options. */
export class RulesNotePom extends Pom {
  protected readonly defaultTestId = RULES_NOTE_TEST_ID;

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
