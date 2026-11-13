import { act, fireEvent, waitFor } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { CLOSE_BUTTON_TEST_ID } from "./CloseButton.constants";

/** Page object of the tooltip of the button, a part of the button: the page object of the button builds it, so it is exported only as a type. It is rendered in an overlay, outside the button, so it searches the whole document. It has no test id: it finds the element with the role `tooltip`. */
class CloseTooltipPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("tooltip"),
      'the role "tooltip"'
    );
  }

  /**
   * What the tooltip says.
   * @returns The text of the tooltip.
   */
  get text(): string {
    return this.root.textContent;
  }
}

/** Page object of a close button. It finds the button by its test id within its parent. */
export class CloseButtonPom extends Pom {
  protected readonly defaultTestId = CLOSE_BUTTON_TEST_ID;

  /**
   * Whether assistive technology reads the button as a button with a given name.
   * @param accessibleName The accessible name, such as `Close index.js`.
   * @returns True when the button is among the buttons of that name of the element that holds it.
   */
  isButtonNamed(accessibleName: string): boolean {
    return this.isNamed("button", accessibleName);
  }

  /**
   * The icon of the button.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * The size of the button, which the theme draws from the class that MUI gives it.
   * @returns True when it is the small icon button.
   */
  get isSmall(): boolean {
    return this.root.classList.contains("MuiIconButton-sizeSmall");
  }

  /**
   * The tooltip of the button, which renders outside it.
   * @returns The page object of the tooltip.
   */
  private get tooltip(): CloseTooltipPom {
    return new CloseTooltipPom();
  }

  /** Puts the pointer on the button. */
  async hover(): Promise<void> {
    await act(async () => {
      fireEvent.mouseOver(this.root);
    });
  }

  /**
   * Waits for the tooltip of the button to show.
   * @returns What the tooltip says.
   */
  async waitForTooltip(): Promise<string> {
    await waitFor(() => {
      if (!this.tooltip.isRendered) {
        throw new Error("The tooltip is not on screen yet");
      }
    });

    return this.tooltip.text;
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }
}

export type { CloseTooltipPom };
