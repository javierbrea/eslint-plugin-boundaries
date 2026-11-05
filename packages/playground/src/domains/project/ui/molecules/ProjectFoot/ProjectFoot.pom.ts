import { act, fireEvent } from "@testing-library/react";

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
   * Whether the foot has a button that assistive technology announces with a name.
   * @param accessibleName The accessible name, such as `Add file`.
   * @returns True when the foot has a button with that name.
   */
  hasButtonNamed(accessibleName: string): boolean {
    return this.scope.queryByRole("button", { name: accessibleName }) !== null;
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
   * The button of the toggle with a text.
   * @param text The text of the button, such as `Tree`.
   * @returns The element of the button.
   */
  private viewButton(text: string): HTMLElement {
    return this.scope.getByRole("button", { name: text });
  }

  /**
   * Gives the keyboard focus to a button of the toggle, as a click or the Tab key outside the tree does. Dispatching a `blur` event never moves the focus, so this is how a spec tells where the focus ends.
   * @param text The text of the button, such as `Tree`.
   */
  focusView(text: string): void {
    const button = this.viewButton(text);

    act(() => button.focus());
  }

  /**
   * Whether a button of the toggle has the keyboard focus.
   * @param text The text of the button, such as `Tree`.
   * @returns True when the button is the active element of the page.
   */
  isViewFocused(text: string): boolean {
    return document.activeElement === this.viewButton(text);
  }

  /**
   * Presses a button of the toggle.
   * @param text The text of the button, such as `Text`.
   */
  pressView(text: string): void {
    fireEvent.click(this.viewButton(text));
  }
}
