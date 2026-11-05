import { fireEvent } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

import {
  ADD_FILE_LABEL,
  ADD_FOLDER_LABEL,
  PROJECT_FOOT_TEST_ID,
} from "./ProjectFoot.constants";
import type { ProjectFootView } from "./ProjectFoot.types";

/** Page object of the foot of the project pane. */
export class ProjectFootPom extends Pom {
  protected readonly defaultTestId = PROJECT_FOOT_TEST_ID;

  /**
   * What the buttons of the foot say to assistive technology.
   * @returns The `aria-label` of each button, in order: the ones that add a file and a folder, when the foot has them, and then the buttons of the toggle, which are named by their text and so have none.
   */
  get buttonLabels(): (string | null)[] {
    return this.scope
      .queryAllByRole("button")
      .map((button) => button.getAttribute("aria-label"));
  }

  /**
   * The text of the buttons of the foot.
   * @returns The text of each button, in order.
   */
  get buttonTexts(): string[] {
    return this.scope
      .queryAllByRole("button")
      .map((button) => button.textContent);
  }

  /**
   * The name of the toggle that switches between the tree and the text.
   * @returns The `aria-label` of the group of the toggle, or null when the foot has no group.
   */
  get viewLabel(): string | null {
    return this.scope.queryByRole("group")?.getAttribute("aria-label") ?? null;
  }

  /**
   * The buttons of the toggle, which show how the project is shown.
   * @returns The text of each button of the group, in order, with its `aria-pressed` attribute.
   */
  get views(): ProjectFootView[] {
    const group = this.scope.getByRole("group");

    return Array.from(group.querySelectorAll("button")).map((button) => ({
      text: button.textContent,
      pressed: button.getAttribute("aria-pressed"),
    }));
  }

  /** Presses the button that adds a file. */
  addFile(): void {
    fireEvent.click(this.scope.getByRole("button", { name: ADD_FILE_LABEL }));
  }

  /** Presses the button that adds a folder. */
  addFolder(): void {
    fireEvent.click(this.scope.getByRole("button", { name: ADD_FOLDER_LABEL }));
  }

  /**
   * Presses a button of the toggle.
   * @param text The text of the button, such as `Text`.
   */
  pressView(text: string): void {
    fireEvent.click(this.scope.getByRole("button", { name: text }));
  }
}
