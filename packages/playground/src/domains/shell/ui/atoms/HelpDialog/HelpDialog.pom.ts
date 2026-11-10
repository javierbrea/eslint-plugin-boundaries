import { fireEvent, waitFor } from "@testing-library/react";

import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import {
  HELP_DIALOG_CLOSE_LABEL,
  HELP_DIALOG_PLAYGROUND_GUIDE_LABEL,
  HELP_DIALOG_QUICK_START_LABEL,
} from "./HelpDialog.constants";

/** The part of a step that holds its words: a title in bold and a sentence that follows it. */
type StepWords = {
  /** The name of the step. */
  readonly title: string;
  /** What the step explains. */
  readonly text: string;
};

/** Page object of a link of the footer of the help dialog, a part of the dialog: the page object of the dialog builds it, so it is exported only as a type. It has no test id: it finds the element with the role `link` whose accessible name is the `name` option, within the dialog. */
class GuideLinkPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const accessibleName = this.requireName();

    return this.pickMatch(
      this.searchBase.queryAllByRole("link", { name: accessibleName }),
      `the role "link" named ${accessibleName}`
    );
  }

  /**
   * Where the link goes.
   * @returns The `href` attribute of the link.
   */
  get href(): string | null {
    return this.root.getAttribute("href");
  }

  /**
   * The icon after the words of the link.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return new IconPom({
      root: this.root.querySelector("svg") as unknown as HTMLElement,
    });
  }

  /**
   * The color of the link.
   * @returns The computed value.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
  }

  /**
   * What the link looks like under the pointer, which a host may style.
   * @returns The color and the text decoration that the rule of the hover declares.
   */
  get hover(): {
    color: string | undefined;
    textDecoration: string | undefined;
  } {
    const style = getStyle(this.root, `${OWN_CLASS}:hover`);

    return { color: style.color, textDecoration: style["text-decoration"] };
  }

  /**
   * Whether the link takes the free space of the footer, which keeps what follows the links at the right edge.
   * @returns True when the link has an automatic margin at its end.
   */
  get takesFreeSpace(): boolean {
    return getComputedStyle(this.root).marginRight === "auto";
  }
}

/** Page object of the help dialog. It has no test id: it finds the element with the role `dialog` within its parent, whose accessible name is its title, the `name` option when it is set. A dialog is outside the element that opened it, so build it without a parent, or with the `portal` option. */
export class HelpDialogPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.queryAllByRole(
        "dialog",
        accessibleName === undefined ? {} : { name: accessibleName }
      ),
      accessibleName === undefined
        ? 'the role "dialog"'
        : `the role "dialog" named ${accessibleName}`
    );
  }

  /**
   * The steps, which are the items of the only list of the dialog.
   * @returns The elements of the items.
   */
  private get stepItems(): HTMLElement[] {
    return this.scope.getAllByRole("listitem");
  }

  /**
   * The paragraphs that are not the lead: the tips come after the steps, and each one starts with an icon.
   * @returns The elements of the tips.
   */
  private get tipItems(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("p")).filter(
      (paragraph) => paragraph.querySelector("svg") !== null
    );
  }

  /**
   * The title of the dialog.
   * @returns The text of its heading.
   */
  get title(): string {
    return this.scope.getByRole("heading").textContent;
  }

  /**
   * Whether assistive technology reads the dialog as a dialog with a given name, which is its title.
   * @param accessibleName The accessible name.
   * @returns True when the dialog is among the dialogs of that name of the element that holds it.
   */
  isDialogNamed(accessibleName: string): boolean {
    return this.isNamed("dialog", accessibleName);
  }

  /**
   * The sentence under the title.
   * @returns The text of the first paragraph of the dialog.
   */
  get lead(): string {
    return (this.root.querySelector("p") as HTMLElement).textContent;
  }

  /**
   * The words of each step, in order.
   * @returns The title and the text of each step.
   */
  get steps(): StepWords[] {
    return this.stepItems.map((item) => {
      const [title, text] = Array.from(
        (item.firstElementChild as HTMLElement).children
      ).map((part) => part.textContent);

      return { title, text };
    });
  }

  /**
   * The words of each tip, in order.
   * @returns The text of each tip.
   */
  get tips(): string[] {
    return this.tipItems.map((tip) => tip.textContent);
  }

  /**
   * The names and the paths that each tip draws in mono, in order.
   * @returns The text of each `code` element of each tip.
   */
  get tipCodes(): string[][] {
    return this.tipItems.map((tip) =>
      Array.from(tip.querySelectorAll("code")).map((code) => code.textContent)
    );
  }

  /**
   * The names and the paths that the steps draw in mono, in order.
   * @returns The text of each `code` element of each step.
   */
  get stepCodes(): string[][] {
    return this.stepItems.map((item) =>
      Array.from(item.querySelectorAll("code")).map((code) => code.textContent)
    );
  }

  /**
   * The icon of a tip.
   * @param index The position of the tip, from 0.
   * @returns The page object of the icon, which is the one inside the tip.
   */
  tipIcon(index: number): IconPom {
    return new IconPom({
      root: this.tipItems[index].querySelector("svg") as unknown as HTMLElement,
    });
  }

  /**
   * The number that the list draws before a step, which is generated by CSS and so is read from the rule that draws it.
   * @param index The position of the step, from 0.
   * @returns The declarations of the marker of the step.
   */
  stepMarker(index: number): Record<string, string> {
    return getStyle(this.stepItems[index], `${OWN_CLASS}::before`);
  }

  /**
   * How the list of steps numbers them, which is generated by CSS and so is read from the rules of the list and of its items.
   * @returns The counter that the list resets, and the one that each item increments.
   */
  get counters(): { reset: string | undefined; increment: string | undefined } {
    const list = this.scope.getByRole("list");

    return {
      reset: getStyle(list)["counter-reset"],
      increment: getStyle(this.stepItems[0])["counter-increment"],
    };
  }

  /**
   * The link to the playground guide, which is the first one of the footer.
   * @returns The page object of the link, which is not rendered when the dialog has no URL of the guide.
   */
  get playgroundGuideLink(): GuideLinkPom {
    return this.childPom(GuideLinkPom, {
      name: HELP_DIALOG_PLAYGROUND_GUIDE_LABEL,
    });
  }

  /**
   * The link to the Quick start, which is the second one of the footer, or the first when there is no guide.
   * @returns The page object of the link, which is not rendered when the dialog has no URL of the Quick start.
   */
  get quickStartLink(): GuideLinkPom {
    return this.childPom(GuideLinkPom, { name: HELP_DIALOG_QUICK_START_LABEL });
  }

  /**
   * The elements of the footer, in the order they are drawn: the links that there are, and the button.
   * @returns The text of each one.
   */
  get footerTexts(): string[] {
    const actions = (this.root.lastElementChild as HTMLElement).children;

    return Array.from(actions).map((element) => element.textContent);
  }

  /**
   * The room between the elements of the footer: the gap that the footer sets, and the margin that MUI puts before each element that follows the first unless it is told not to, which a rule of the footer declares for them.
   * @returns The computed `gap` of the footer, and the `margin-left` that the rule of the siblings declares, which is undefined when there is no such rule.
   */
  get footerSpacing(): { gap: string; siblingMargin: string | undefined } {
    const actions = this.root.lastElementChild as HTMLElement;

    return {
      gap: getComputedStyle(actions).gap,
      siblingMargin: getStyle(actions, `${OWN_CLASS}>:not(style)~:not(style)`)[
        "margin-left"
      ],
    };
  }

  /**
   * How the button that closes the dialog is drawn.
   * @returns `contained`, `outlined` or `text`, from the class MUI gives the button, or null when it has none of them.
   */
  get closeButtonVariant(): string | null {
    const variantClass = Array.from(
      this.scope.getByRole("button", { name: HELP_DIALOG_CLOSE_LABEL })
        .classList
    ).find((className) =>
      /^MuiButton-(outlined|contained|text)$/.test(className)
    );

    return variantClass?.replace("MuiButton-", "") ?? null;
  }

  /**
   * How the dialog is sized, which the element that holds its paper declares for the paper.
   * @returns The `width` and the `box-sizing` that the rule declares, each an empty string when there is none.
   */
  get size(): { width: string; boxSizing: string } {
    const holder = this.root.closest(".MuiDialog-root") as HTMLElement;
    const style = getStyle(holder, `${OWN_CLASS} .MuiDialog-paper`);

    return { width: style.width ?? "", boxSizing: style["box-sizing"] ?? "" };
  }

  /**
   * The element that has the keyboard focus, if the dialog holds it.
   * @returns The text of the focused element of the dialog, or null when the focus is outside it.
   */
  get focusedText(): string | null {
    return this.root.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).textContent
      : null;
  }

  /** Presses the button that closes the dialog. */
  close(): void {
    fireEvent.click(
      this.scope.getByRole("button", { name: HELP_DIALOG_CLOSE_LABEL })
    );
  }

  /** Presses Escape while the dialog has the focus. */
  pressEscape(): void {
    fireEvent.keyDown(this.root, { key: "Escape" });
  }

  /** Clicks outside the dialog, on the backdrop around it: the press starts and ends there, as a click that gives up does. */
  clickBackdrop(): void {
    const container = this.root.closest(".MuiDialog-container") as HTMLElement;

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

export type { GuideLinkPom };
