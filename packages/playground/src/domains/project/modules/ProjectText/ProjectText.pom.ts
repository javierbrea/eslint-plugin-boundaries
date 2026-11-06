import { ProjectTextAreaPom } from "@/domains/project/ui/atoms/ProjectTextArea/ProjectTextArea.pom";
import { Pom } from "@/shared/testing/pom";

import { PROJECT_TEXT_TEST_ID } from "./ProjectText.constants";

/** Page object of the project as text, which is its textarea: they have the same root element. It finds its root by the test id of the module. */
export class ProjectTextPom extends Pom {
  protected readonly defaultTestId = PROJECT_TEXT_TEST_ID;

  /**
   * The textarea the module is, which has the same root element.
   * @returns The page object of the textarea.
   */
  get area(): ProjectTextAreaPom {
    return this.childPom(ProjectTextAreaPom, { root: this.root });
  }

  /**
   * The text the textarea holds.
   * @returns The value of the textarea.
   */
  get value(): string {
    return this.area.value;
  }

  /**
   * Whether the text cannot be edited.
   * @returns True when the textarea is read only.
   */
  get isReadOnly(): boolean {
    return this.area.isReadOnly;
  }

  /**
   * Types in the textarea, as the user does.
   * @param value The whole text after the keystroke.
   */
  type(value: string): void {
    this.area.type(value);
  }

  /** Takes the focus away from the textarea, without moving it anywhere. */
  blur(): void {
    this.area.blur();
  }
}
