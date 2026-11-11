import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

import {
  HELP_DIALOG_CLOSE_LABEL,
  HELP_DIALOG_PLAYGROUND_GUIDE_LABEL,
  HELP_DIALOG_QUICK_START_LABEL,
} from "./HelpDialog.constants";

/** Page object of a link of the footer of the help dialog, a part of the dialog: the page object of the dialog builds it, so it is exported only as a type. It has no test id: it finds the element with the role `link` whose accessible name is the `name` option, within the dialog. */
class GuideLinkPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("link", {
        name: this.requireName(),
        exact: true,
      })
    );
  }

  /**
   * Where the link goes. It reads once and does not wait.
   * @returns A promise of the `href` attribute of the link, or null when the link has none or is not in the page.
   */
  get href(): Promise<string | null> {
    return this.readAttribute("href");
  }

  // pom-parity: a jsdom page object cannot follow a link, since jsdom does not navigate
  /**
   * Follows the link, as the user does by clicking it. The guides are other pages of the host, so the page navigates away: the caller waits for the new page, such as with its URL.
   */
  async follow(): Promise<void> {
    await this.root.click();
  }
}

/** Page object of the help dialog, in a browser. It has no test id: it finds the element with the role `dialog` within its parent, whose accessible name is its title, the `name` option when it is set. A dialog is outside the element that opened it, so build it without a parent, or with the `portal` option. */
export class HelpDialogPom extends Pom {
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
   * The title of the dialog. It reads once and does not wait.
   * @returns A promise of the text of its heading, which is empty when the dialog is not in the page.
   */
  get title(): Promise<string> {
    return this.readText(this.root.getByRole("heading"));
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

  /** Presses the button that closes the dialog. */
  async close(): Promise<void> {
    await this.root
      .getByRole("button", { name: HELP_DIALOG_CLOSE_LABEL, exact: true })
      .click();
  }

  /**
   * Waits for the dialog to be gone from the page, which MUI does when its transition ends after it closed.
   * @returns A promise that settles when the dialog is gone, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilGone(): Promise<void> {
    await expect(this.root, "The dialog is still in the page").toHaveCount(0);
  }
}

export type { GuideLinkPom };
