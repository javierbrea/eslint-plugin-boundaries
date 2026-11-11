import { fireEvent, within } from "@testing-library/react";

import { SHELL_TEST_ID } from "@/domains/shell/modules/Shell/Shell.constants";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { LOAD_STATE_RESET_LABEL } from "./LoadState.constants";

/** The selector of the message: a status while the sketch loads, an alert when it could not be loaded. */
const MESSAGE_SELECTOR = "[role='status'], [role='alert']";

/** The selector of the shell, which takes the place of the message and has live regions of its own, such as the status of the top bar and the region that announces that a link was copied. */
const SHELL_SELECTOR = `[data-testid='${SHELL_TEST_ID}']`;

/** Page object of the message that describes why the sketch is not on screen. It has no test id: it finds the status or the alert within its parent that is not in a shell. */
export class LoadStatePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      Array.from(
        this.searchBaseElement.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR)
      ).filter((element) => element.closest(SHELL_SELECTOR) === null),
      `the selector "${MESSAGE_SELECTOR}" outside a shell`
    );
  }

  /**
   * What assistive technology announces the message as: a status while the sketch loads, an alert when it could not be loaded.
   * @returns The `role` attribute, or null when the message has none.
   */
  get role(): string | null {
    return this.root.getAttribute("role");
  }

  /**
   * Everything the message says.
   * @returns The text of the message.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The color of the message.
   * @returns The computed value.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
  }

  /**
   * Where the message may break a word that is longer than its line.
   * @returns The computed value.
   */
  get overflowWrap(): string {
    return getComputedStyle(this.root).overflowWrap;
  }

  /**
   * The button that resets the sketch, which sits next to the message and not inside it.
   * @returns The elements of the buttons next to the message that have its label.
   */
  private get resetButtons(): HTMLElement[] {
    return within(this.root.parentElement as HTMLElement).queryAllByRole(
      "button",
      { name: LOAD_STATE_RESET_LABEL }
    );
  }

  /**
   * Whether the message has a button to reset the sketch.
   * @returns True when there is one next to the message.
   */
  get hasResetButton(): boolean {
    return this.resetButtons.length > 0;
  }

  /**
   * The icon of the button that resets the sketch.
   * @returns The page object of the icon.
   */
  get resetIcon(): IconPom {
    return new IconPom({
      root: this.resetButtons[0].querySelector("svg") as unknown as HTMLElement,
    });
  }

  /** Presses the button that resets the sketch. */
  pressReset(): void {
    fireEvent.click(this.resetButtons[0]);
  }
}
