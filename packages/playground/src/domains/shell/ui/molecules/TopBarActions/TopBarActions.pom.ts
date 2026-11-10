import { act, fireEvent, waitFor } from "@testing-library/react";

import { CopiedAnnouncementPom } from "@/domains/share/ui/atoms/CopiedAnnouncement/CopiedAnnouncement.pom";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { CopyButtonPom } from "@/ui-kit/molecules/CopyButton/CopyButton.pom";

import {
  HELP_BUTTON_LABEL,
  RESET_BUTTON_LABEL,
  SHARE_BUTTON_TEST_ID,
  TOP_BAR_ACTIONS_TEST_ID,
} from "./TopBarActions.constants";

/**
 * What assistive technology reads in a node: its text, without the parts of it that are hidden from assistive technology.
 * @param node The node, such as a button.
 * @returns The text that a screen reader reads.
 */
function readText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  return node instanceof Element && node.getAttribute("aria-hidden") === "true"
    ? ""
    : Array.from(node.childNodes).map(readText).join("");
}

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

/** Page object of the actions at the end of the top bar. Its root is a box that takes no room of its own, so its buttons are found within it by their names, except Share, which is a copy button that it finds by its test id. */
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
   * The button that shares the sketch, which is not rendered when the actions cannot share.
   * @returns The page object of the copy button.
   */
  get share(): CopyButtonPom {
    return this.childPom(CopyButtonPom, { testId: SHARE_BUTTON_TEST_ID });
  }

  /**
   * The live region that tells screen readers that the link was copied, which is not rendered when the actions cannot share.
   * @returns The page object of the announcement.
   */
  get announcement(): CopiedAnnouncementPom {
    return this.childPom(CopiedAnnouncementPom);
  }

  /**
   * The tooltip of the help button, which is not rendered until the pointer or the keyboard is on the button.
   * @returns The page object of the tooltip.
   */
  private get tooltip(): TooltipPom {
    return this.childPom(TooltipPom, { portal: true });
  }

  /**
   * The parts of the actions in the order they are drawn: the buttons by their names, and the live region after them when there is one.
   * @returns What each element that the actions place says: `announcement` for the live region, and for a button its `aria-label` or the text that assistive technology reads in it, which leaves out the confirmation of Share.
   */
  get parts(): string[] {
    return Array.from(this.root.children).map((element) =>
      element.getAttribute("role") === "status"
        ? "announcement"
        : (element.getAttribute("aria-label") ?? readText(element))
    );
  }

  /**
   * How much each button shrinks when there is not room for the actions in the bar, which is none: the buttons keep their size.
   * @returns The computed `flex-shrink` of Help, Reset and, when the actions can share, Share, in the order they are drawn.
   */
  get buttonShrinks(): string[] {
    return this.scope
      .getAllByRole("button", { hidden: true })
      .map((button) => getComputedStyle(button).flexShrink);
  }

  /**
   * Whether the actions have the button that shares.
   * @returns True when there is one.
   */
  get hasShare(): boolean {
    return this.share.isRendered;
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
   * How a button that is a plain MUI button, such as Reset, is drawn. Share is a copy button, which has its own page object.
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
   * The icon of a plain MUI button that has an icon before its label, such as Reset.
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
    this.share.press();
  }
}
