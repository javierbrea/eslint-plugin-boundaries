import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";
import { CopyButtonPom } from "@/ui-kit/molecules/CopyButton/CopyButton.pom.playwright";

import {
  HELP_BUTTON_LABEL,
  RESET_BUTTON_LABEL,
  SHARE_BUTTON_TEST_ID,
  TOP_BAR_ACTIONS_TEST_ID,
} from "./TopBarActions.constants";

/** Page object of the actions at the end of the top bar, in a browser. Its root is a box that takes no room of its own, so its buttons are found within it by their names, except Share, which is a copy button that it finds by its test id. */
export class TopBarActionsPom extends Pom {
  protected readonly defaultTestId = TOP_BAR_ACTIONS_TEST_ID;

  /**
   * The button of the actions that has a label.
   * @param label The accessible name of the button, such as `Reset`.
   * @returns The locator of the button.
   */
  private button(label: string): Locator {
    return this.root.getByRole("button", { name: label, exact: true });
  }

  /**
   * The help button, which a spec reads while the help is open, when MUI hides the rest of the page from assistive technology. The button keeps its name then, because the name is an `aria-label`.
   * @returns The locator of the button.
   */
  private get helpButton(): Locator {
    return this.root.getByRole("button", {
      name: HELP_BUTTON_LABEL,
      exact: true,
      includeHidden: true,
    });
  }

  /**
   * The button that shares the sketch, which is not rendered when the actions cannot share.
   * @returns The page object of the copy button.
   */
  get share(): CopyButtonPom {
    return this.childPom(CopyButtonPom, { testId: SHARE_BUTTON_TEST_ID });
  }

  /**
   * Whether the help button looks pressed, which tells that the help is open. It reads once and does not wait.
   * @returns A promise of true when its `aria-pressed` attribute is `true`.
   */
  get isHelpPressed(): Promise<boolean> {
    return this.readAttribute("aria-pressed", this.helpButton).then(
      (pressed) => pressed === "true"
    );
  }

  /** Presses the help button. */
  async pressHelp(): Promise<void> {
    await this.helpButton.click();
  }

  /** Presses the reset button. The sketch is replaced at once when it is an example or the one of the source, and after a confirmation when the user has edited it. */
  async pressReset(): Promise<void> {
    await this.button(RESET_BUTTON_LABEL).click();
  }

  /** Presses the share button. */
  async pressShare(): Promise<void> {
    await this.share.press();
  }
}
