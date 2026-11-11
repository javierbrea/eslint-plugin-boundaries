import { act, fireEvent, waitFor } from "@testing-library/react";

import { CopiedAnnouncementPom } from "@/domains/share/ui/atoms/CopiedAnnouncement/CopiedAnnouncement.pom";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { CopyButtonPom } from "@/ui-kit/molecules/CopyButton/CopyButton.pom";

import {
  SHARE_DIALOG_COPY_TEST_ID,
  SHARE_DIALOG_TEST_ID,
} from "./ShareDialog.constants";

/** What of the link is selected in its field. */
type LinkSelection = {
  /** The offset where the selection starts. */
  readonly start: number | null;
  /** The offset where the selection ends. */
  readonly end: number | null;
};

/** Page object of a button of the dialog that the dialog draws itself, a part of the dialog: the page object of the dialog builds it, so it is exported only as a type. It has no test id: it finds the button by its accessible name, the `name` option, within the dialog. The button that copies the link again is not one of them: the dialog has a page object of the copy button for it. */
class ShareDialogButtonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const buttonName = this.requireName();

    return this.pickMatch(
      this.searchBase.queryAllByRole("button", { name: buttonName }),
      `the role "button" named ${buttonName}`
    );
  }

  /**
   * How the button is drawn, which tells the one that closes beside another from the only one of a dialog.
   * @returns `outlined`, `contained` or `text`, from the class MUI gives the button, or null when it has none of them.
   */
  get variant(): string | null {
    const variantClass = Array.from(this.root.classList).find((className) =>
      /^MuiButton-(outlined|contained|text)$/.test(className)
    );

    return variantClass?.replace("MuiButton-", "") ?? null;
  }

  /**
   * Whether the button has the keyboard focus.
   * @returns True when it is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }
}

/** Page object of the field that holds the link, a part of the dialog: the page object of the dialog builds it, so it is exported only as a type. It has no test id: it finds the only element with the role `textbox` within the dialog. */
class ShareLinkFieldPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("textbox"),
      'the role "textbox"'
    );
  }

  /**
   * The input of the field.
   * @returns The element.
   */
  private get input(): HTMLInputElement {
    return this.root as HTMLInputElement;
  }

  /**
   * The link that the field holds.
   * @returns The value of the input.
   */
  get value(): string {
    return this.input.value;
  }

  /**
   * Whether the user can only read the link and select it.
   * @returns True when the input is read-only.
   */
  get isReadOnly(): boolean {
    return this.input.readOnly;
  }

  /**
   * What of the link is selected.
   * @returns The offsets of the two ends of the selection.
   */
  get selection(): LinkSelection {
    return { start: this.input.selectionStart, end: this.input.selectionEnd };
  }

  /**
   * Whether the field has the keyboard focus.
   * @returns True when the input is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /**
   * Whether assistive technology reads the field as a text box with a given name.
   * @param accessibleName The accessible name.
   * @returns True when the field is among the text boxes of that name of the element that holds it.
   */
  isTextBoxNamed(accessibleName: string): boolean {
    return this.isNamed("textbox", accessibleName);
  }

  /** Gives the field the keyboard focus, as a user does when they tab to it. */
  focus(): void {
    act(() => {
      this.input.focus();
    });
  }

  /** Takes the keyboard focus away from the field. */
  blur(): void {
    act(() => {
      this.input.blur();
    });
  }

  /** Collapses the selection to the start of the link, as a click in the field would. */
  collapseSelection(): void {
    this.input.setSelectionRange(0, 0);
  }
}

/** Page object of the reason that the reader of links gives, a part of the dialog: the page object of the dialog builds it, so it is exported only as a type. It has no test id: it finds the second paragraph of the dialog, which is the one after the text. */
class ShareReasonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      Array.from(this.searchBaseElement.querySelectorAll("p")).slice(1),
      "the second paragraph"
    );
  }

  /**
   * The reason.
   * @returns The text of the box, which is the words that follow its icon.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The icon before the reason.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }
}

/** Page object of the dialog of a share notice. It finds its root, the element of the dialog component, by the test id of the component, which is rendered only while the dialog is open or fading out. The dialog is a MUI overlay, so it searches the element that holds it, or the whole document when it has no parent. */
export class ShareDialogPom extends Pom {
  protected readonly defaultTestId: string = SHARE_DIALOG_TEST_ID;

  /**
   * The element with the role `dialog`, which is the paper that holds the title, the content and the buttons.
   * @returns The element.
   */
  private get paper(): HTMLElement {
    return this.scope.getByRole("dialog");
  }

  /**
   * The title of the dialog.
   * @returns The heading of the dialog.
   */
  private get titleElement(): HTMLElement {
    return this.scope.getByRole("heading");
  }

  /**
   * The content of the dialog, which is the part between the title and the buttons.
   * @returns The element.
   */
  private get content(): HTMLElement {
    return this.paper.children[1] as HTMLElement;
  }

  /**
   * What the notice is called.
   * @returns The text of the title.
   */
  get title(): string {
    return this.titleElement.textContent;
  }

  /**
   * Whether assistive technology reads the dialog as a dialog with a given name, which is its title.
   * @param accessibleName The accessible name.
   * @returns True when the dialog has an element of that role and name.
   */
  isDialogNamed(accessibleName: string): boolean {
    return (
      this.scope.queryAllByRole("dialog", { name: accessibleName }).length > 0
    );
  }

  /**
   * What assistive technology reads as the description of the dialog: the text of each element that the `aria-describedby` attribute of the dialog names, in the order it names them, separated by a space.
   * @returns The description, which is empty when the dialog names no element.
   */
  get description(): string {
    const ids = (this.paper.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .filter((id) => id !== "");
    const elements = Array.from(this.root.querySelectorAll("[id]"));

    return ids
      .map((id) => elements.find((element) => element.id === id)?.textContent)
      .join(" ");
  }

  /**
   * The icon before the title, which is the first one of the dialog.
   * @returns The page object of the icon.
   */
  get titleIcon(): IconPom {
    return new IconPom({
      root: this.titleElement.querySelector("svg") as unknown as HTMLElement,
    });
  }

  /**
   * The color of the icon before the title, which is the tone of the notice.
   * @returns The computed color of the element that wraps the icon.
   */
  get titleIconColor(): string {
    return this.titleIcon.wrapperStyle.color;
  }

  /**
   * What the notice says.
   * @returns The text of the first paragraph of the content.
   */
  get text(): string {
    return (this.content.querySelector("p") as HTMLElement).textContent;
  }

  /**
   * The reason that the reader of links gives, apart from the text.
   * @returns The page object of the reason, which is not rendered when the notice has none.
   */
  get reason(): ShareReasonPom {
    return this.childPom(ShareReasonPom);
  }

  /**
   * The field that holds the link, which only a notice of a link that was not copied has.
   * @returns The page object of the field, which is not rendered when the notice has no link.
   */
  get link(): ShareLinkFieldPom {
    return this.childPom(ShareLinkFieldPom);
  }

  /**
   * The button that copies the link again.
   * @returns The page object of the button, which is not rendered when the notice has no link.
   */
  get copyButton(): CopyButtonPom {
    return this.childPom(CopyButtonPom, { testId: SHARE_DIALOG_COPY_TEST_ID });
  }

  /**
   * The announcement of the copy from the dialog, which is a live region beside the field.
   * @returns The page object of the announcement, which is not rendered when the notice has no link.
   */
  get announcement(): CopiedAnnouncementPom {
    return this.childPom(CopiedAnnouncementPom);
  }

  /**
   * A button that the dialog draws itself, such as the one that closes it.
   * @param label The label of the button, such as `Got it`.
   * @returns The page object of the button.
   */
  button(label: string): ShareDialogButtonPom {
    return this.childPom(ShareDialogButtonPom, { name: label });
  }

  /**
   * The accessible names of the buttons, in the order they are drawn.
   * @returns The name of each button, which is its label whatever it draws while it confirms a copy.
   */
  get buttonNames(): string[] {
    return this.accessibleNames("button");
  }

  /**
   * How far the content is from the edge of the dialog, which is where the words of the title start.
   * @returns The computed `padding-left` of the content, in pixels.
   */
  get contentIndent(): number {
    return parseFloat(getComputedStyle(this.content).paddingLeft);
  }

  /**
   * How far the words of the title are from the edge of the dialog: the room the title leaves, the icon and the gap between the icon and the words.
   * @returns The sum, in pixels.
   */
  get titleTextStart(): number {
    const { paddingLeft, gap } = getComputedStyle(this.titleElement);

    return (
      parseFloat(paddingLeft) +
      parseFloat(this.titleIcon.width ?? "0") +
      parseFloat(gap)
    );
  }

  /**
   * How the paper of the dialog is sized.
   * @returns The computed `width` and `box-sizing` of the paper.
   */
  get size(): { width: string; boxSizing: string } {
    const { width, boxSizing } = getComputedStyle(this.paper);

    return { width, boxSizing };
  }

  /**
   * The props of the styled parts that reached the DOM as attributes, which they must not do.
   * @returns The name of each such attribute found in the dialog, in document order; empty when there is none.
   */
  get leakedPropAttributes(): string[] {
    return ["tone"].flatMap((attribute) =>
      Array.from(this.root.querySelectorAll("*"))
        .filter((element) => element.hasAttribute(attribute))
        .map(() => attribute)
    );
  }

  /** Moves the keyboard focus to the dialog itself, where its focus trap puts it when nothing inside the dialog has it. */
  focusDialog(): void {
    act(() => {
      this.paper.focus();
    });
  }

  /** Presses Escape while the dialog has the focus. */
  pressEscape(): void {
    fireEvent.keyDown(this.paper, { key: "Escape" });
  }

  /** Clicks outside the dialog, on the backdrop around it: the press starts and ends there, as a click that gives up does. */
  clickBackdrop(): void {
    const container = this.root.querySelector(
      ".MuiDialog-container"
    ) as HTMLElement;

    fireEvent.mouseDown(container);
    fireEvent.click(container);
  }

  /**
   * Waits for the dialog to be gone from the page, which MUI does when its transition ends after it closed.
   * @returns A promise that settles when the dialog is gone.
   */
  async waitUntilGone(): Promise<void> {
    await waitFor(() => {
      if (this.isRendered) {
        throw new Error("The dialog is still in the page");
      }
    });
  }
}

export type { ShareDialogButtonPom, ShareLinkFieldPom, ShareReasonPom };
