import { fireEvent, waitFor } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

/** Page object of a button of the dialog, a part of the dialog: the page object of the dialog builds it, so it is exported only as a type. It has no test id: it finds the button by its accessible name, the `name` option, within its parent. */
class DialogButtonPom extends Pom {
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
   * How the button is drawn, which tells the button that goes on from the one that gives up.
   * @returns `outlined`, `contained` or `text`, from the class MUI gives the button, or null when it has none of them.
   */
  get variant(): string | null {
    const variantClass = Array.from(this.root.classList).find((className) =>
      /^MuiButton-(outlined|contained|text)$/.test(className)
    );

    return variantClass?.replace("MuiButton-", "") ?? null;
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }
}

/** Page object of a confirmation dialog. It has no test id: it finds the element with the role `dialog` within its parent, whose accessible name is its title, the `name` option when it is set. A dialog is outside the element that opened it, so build it without a parent, or with the `portal` option. */
export class ConfirmDialogPom extends Pom {
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
   * The title of the dialog.
   * @returns The heading of the dialog.
   */
  private get titleElement(): HTMLElement {
    return this.scope.getByRole("heading");
  }

  /**
   * What the dialog asks.
   * @returns The text of the title.
   */
  get title(): string {
    return this.titleElement.textContent;
  }

  /**
   * The id of the title, which the dialog points to as its name.
   * @returns The `id` attribute of the title.
   */
  get titleId(): string {
    return this.titleElement.id;
  }

  /**
   * The element that names the dialog.
   * @returns The `aria-labelledby` attribute of the dialog, or null when it has none.
   */
  get labelledBy(): string | null {
    return this.root.getAttribute("aria-labelledby");
  }

  /**
   * What the dialog explains below its title.
   * @returns The text of the content, which is the second part of the dialog, between the title and the buttons.
   */
  get text(): string {
    return (this.root.children[1] as HTMLElement).textContent;
  }

  /**
   * The labels of the buttons, in the order they are drawn.
   * @returns The text of each button.
   */
  get buttonTexts(): string[] {
    return this.scope
      .queryAllByRole("button")
      .map((button) => button.textContent);
  }

  /**
   * The test id of the root element of the component that is the dialog, which is the nearest ancestor that has one.
   * @returns The `data-testid` attribute, or null when the dialog has none.
   */
  get renderedTestId(): string | null {
    return (
      this.root.closest("[data-testid]")?.getAttribute("data-testid") ?? null
    );
  }

  /**
   * A button of the dialog.
   * @param label The label of the button, such as `Cancel`.
   * @returns The page object of the button.
   */
  button(label: string): DialogButtonPom {
    return this.childPom(DialogButtonPom, { name: label });
  }

  /** Presses Escape while the dialog has the focus. */
  pressEscape(): void {
    fireEvent.keyDown(this.root, { key: "Escape" });
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

export type { DialogButtonPom };
