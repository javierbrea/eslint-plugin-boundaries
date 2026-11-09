import { act, fireEvent, waitFor } from "@testing-library/react";

import { ShareMessagePom } from "@/domains/share/ui/atoms/ShareMessage/ShareMessage.pom";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import {
  HELP_BUTTON_LABEL,
  RESET_BUTTON_LABEL,
  SHARE_BUTTON_LABEL,
  TOP_BAR_ACTIONS_TEST_ID,
} from "./TopBarActions.constants";

/** The style of a button that a spec reads: how it is sized and colored. */
type ButtonLook = {
  /** The computed `width`. */
  readonly width: string;
  /** The computed `height`. */
  readonly height: string;
  /** The computed `color`. */
  readonly color: string;
  /** The computed `background-color`. */
  readonly background: string;
};

/** Page object of the tooltip that the help button shows, a part of the actions: the page object of the actions builds it, so it is exported only as a type. It is rendered in an overlay, outside the actions, so it searches the whole document. It has no test id: it finds the element with the role `tooltip`. */
class TooltipPom extends Pom {
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

/** Page object of the actions at the end of the top bar. Its root is a box that takes no room of its own, so its buttons are found within it by their names. */
export class TopBarActionsPom extends Pom {
  protected readonly defaultTestId = TOP_BAR_ACTIONS_TEST_ID;

  /**
   * The element of a button of the actions.
   * @param label The accessible name of the button, such as `Reset`.
   * @returns The element.
   */
  private button(label: string): HTMLElement {
    return this.scope.getByRole("button", { name: label });
  }

  /**
   * The element of the help button, which a spec reads while the help is open, when MUI hides the rest of the page from assistive technology. The button keeps its name then, because the name is an `aria-label`.
   * @returns The element.
   */
  private get helpButton(): HTMLElement {
    return this.scope.getByRole("button", {
      name: HELP_BUTTON_LABEL,
      hidden: true,
    });
  }

  /**
   * The message that says how the last share went.
   * @returns The page object of the message, which is not rendered when the actions cannot share.
   */
  get message(): ShareMessagePom {
    return this.childPom(ShareMessagePom);
  }

  /**
   * The tooltip of the help button, which is not rendered until the pointer or the keyboard is on the button.
   * @returns The page object of the tooltip.
   */
  private get tooltip(): TooltipPom {
    return this.childPom(TooltipPom, { portal: true });
  }

  /**
   * The parts of the actions in the order they are drawn: the message when there is one, and the buttons by their names.
   * @returns What each element that the actions place says: `message` for the live region, and the accessible name of a button.
   */
  get parts(): string[] {
    return Array.from(this.root.children).map((element) =>
      element.getAttribute("role") === "status"
        ? "message"
        : (element.getAttribute("aria-label") ?? element.textContent)
    );
  }

  /**
   * Whether the actions have the button that shares.
   * @returns True when there is one.
   */
  get hasShare(): boolean {
    return (
      this.scope.queryAllByRole("button", { name: SHARE_BUTTON_LABEL }).length >
      0
    );
  }

  /**
   * Whether the help button looks pressed, which tells that the help is open.
   * @returns True when its `aria-pressed` attribute is `true`.
   */
  get isHelpPressed(): boolean {
    return this.helpButton.getAttribute("aria-pressed") === "true";
  }

  /**
   * The kind of popup that the help button announces.
   * @returns The `aria-haspopup` attribute of the button, or null when it has none.
   */
  get helpPopup(): string | null {
    return this.helpButton.getAttribute("aria-haspopup");
  }

  /**
   * Whether the help button has the keyboard focus.
   * @returns True when it is the active element of the page.
   */
  get isHelpFocused(): boolean {
    return document.activeElement === this.helpButton;
  }

  /**
   * Whether the reset button has the keyboard focus.
   * @returns True when it is the active element of the page.
   */
  get isResetFocused(): boolean {
    return document.activeElement === this.button(RESET_BUTTON_LABEL);
  }

  /**
   * How the help button is sized and colored.
   * @returns Its computed width, height, color and background.
   */
  get helpLook(): ButtonLook {
    const { width, height, color, backgroundColor } = getComputedStyle(
      this.helpButton
    );

    return { width, height, color, background: backgroundColor };
  }

  /**
   * The icon of the help button.
   * @returns The page object of the icon.
   */
  get helpIcon(): IconPom {
    return new IconPom({
      root: this.helpButton.querySelector("svg") as unknown as HTMLElement,
    });
  }

  /**
   * How a text button, such as Reset, or a contained one, such as Share, is drawn.
   * @param label The label of the button.
   * @returns `outlined`, `contained` or `text`, from the class MUI gives the button, or null when it has none of them.
   */
  variantOf(label: string): string | null {
    const variantClass = Array.from(this.button(label).classList).find(
      (className) => /^MuiButton-(outlined|contained|text)$/.test(className)
    );

    return variantClass?.replace("MuiButton-", "") ?? null;
  }

  /**
   * The icon of a button that has an icon before its label.
   * @param label The label of the button.
   * @returns The page object of the icon.
   */
  iconOf(label: string): IconPom {
    return new IconPom({
      root: this.button(label).querySelector("svg") as unknown as HTMLElement,
    });
  }

  /**
   * The words of the tooltip that the help button shows, once it has shown.
   * @returns A promise of the text of the tooltip.
   */
  async waitForHelpTooltip(): Promise<string> {
    await waitFor(() => {
      if (!this.tooltip.isRendered) {
        throw new Error("The tooltip is not on screen yet");
      }
    });

    return this.tooltip.text;
  }

  /** Puts the pointer on the help button. */
  async hoverHelp(): Promise<void> {
    await act(async () => {
      fireEvent.mouseOver(this.helpButton);
    });
  }

  /** Gives the keyboard focus to the help button. */
  focusHelp(): void {
    act(() => this.helpButton.focus());
  }

  /** Presses the help button. */
  pressHelp(): void {
    fireEvent.click(this.helpButton);
  }

  /** Gives the keyboard focus to the reset button. */
  focusReset(): void {
    act(() => this.button(RESET_BUTTON_LABEL).focus());
  }

  /** Presses the reset button. */
  pressReset(): void {
    fireEvent.click(this.button(RESET_BUTTON_LABEL));
  }

  /** Presses the share button. */
  pressShare(): void {
    fireEvent.click(this.button(SHARE_BUTTON_LABEL));
  }
}
