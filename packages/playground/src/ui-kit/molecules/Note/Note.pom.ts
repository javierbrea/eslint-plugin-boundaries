import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { MonoPom } from "@/ui-kit/atoms/Mono/Mono.pom";

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
   * The classes of the root element, which include the one a caller passes to place the note.
   * @returns The class names.
   */
  get classNames(): string[] {
    return Array.from(this.root.classList);
  }

  /**
   * The space around the note, which a caller sets to place it.
   * @returns The computed margin.
   */
  get margin(): string {
    return getComputedStyle(this.root).margin;
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
   * @returns The text of each name or path in mono of the note, in order.
   */
  get codeTexts(): string[] {
    const { count } = this.childPom(MonoPom);

    return Array.from(
      { length: count },
      (_, index) => this.childPom(MonoPom, { index }).text
    );
  }
}
