import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { NOTE_TEST_ID } from "./Note.constants";

/** Page object of a note. */
export class NotePom extends Pom {
  protected readonly defaultTestId = NOTE_TEST_ID;

  /**
   * What the note says.
   * @returns The text of the note.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The role of the note.
   * @returns The `role` attribute.
   */
  get role(): string | null {
    return this.root.getAttribute("role");
  }

  /**
   * The icon of the note.
   * @returns The page object of the info icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * The code a note holds, when it accepts elements as content.
   * @returns The text of each `code` element of the note.
   */
  get codeTexts(): string[] {
    return Array.from(this.root.querySelectorAll("code")).map(
      (code) => code.textContent
    );
  }
}
