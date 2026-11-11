import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

/** Page object of a button of the dialog, a part of the dialog: the page object of the dialog builds it, so it is exported only as a type. It has no test id: it finds the button by its accessible name, the `name` option, within its parent. */
class DialogButtonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("button", {
        name: this.requireName(),
        exact: true,
      })
    );
  }

  /** Presses the button. */
  async press(): Promise<void> {
    await this.root.click();
  }
}

/** Page object of a confirmation dialog, in a browser. It has no test id: it finds the element with the role `dialog` within its parent, whose accessible name is its title, the `name` option when it is set. A dialog is outside the element that opened it, so build it without a parent, or with the `portal` option. */
export class ConfirmDialogPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.getByRole(
        "dialog",
        accessibleName === undefined
          ? {}
          : { name: accessibleName, exact: true }
      )
    );
  }

  /**
   * What the dialog asks. It reads once and does not wait.
   * @returns A promise of the text of the heading of the dialog, which is empty when the dialog is not in the page.
   */
  get title(): Promise<string> {
    return this.readText(this.root.getByRole("heading"));
  }

  /**
   * A button of the dialog.
   * @param label The label of the button, such as `Cancel`.
   * @returns The page object of the button.
   */
  button(label: string): DialogButtonPom {
    return this.childPom(DialogButtonPom, { name: label });
  }

  /**
   * Waits for the dialog to be gone from the page, which MUI does when its transition ends after it closed.
   * @returns A promise that settles when the dialog is gone, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilGone(): Promise<void> {
    await expect(this.root, "The dialog is still in the page").toHaveCount(0);
  }
}

export type { DialogButtonPom };
