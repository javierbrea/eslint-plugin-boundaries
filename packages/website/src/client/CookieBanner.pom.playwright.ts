import { Pom } from "@boundaries/playground/playwright";
import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { CONSENT_LABELS } from "./consent.constants";

/** Page object of the consent banner, in a browser, which `consent.ts` builds with vanilla-cookieconsent: the site does not render it. It finds its root as the `region` named with the title of the banner. The library builds it only for a visitor it does not take for a bot, so in a spec it exists only in a context whose `navigator.webdriver` reads false, which the `consentBanner` fixture option sets. */
export class CookieBannerPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the region that has the title of the banner.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("region", {
        name: CONSENT_LABELS.consentTitle,
        exact: true,
      })
    );
  }

  /**
   * Accepts every category, as the user does with the Accept all button.
   * @returns A promise that settles when the button is clicked.
   */
  async acceptAll(): Promise<void> {
    await this.root
      .getByRole("button", { name: CONSENT_LABELS.acceptAll, exact: true })
      .click();
  }

  /**
   * Rejects every category but the necessary one, as the user does with the Reject all button.
   * @returns A promise that settles when the button is clicked.
   */
  async rejectAll(): Promise<void> {
    await this.root
      .getByRole("button", { name: CONSENT_LABELS.rejectAll, exact: true })
      .click();
  }

  /**
   * Opens the cookie preferences, as the user does with the Manage preferences button. The caller waits for the dialog with its page object.
   * @returns A promise that settles when the button is clicked.
   */
  async openPreferences(): Promise<void> {
    await this.root
      .getByRole("button", {
        name: CONSENT_LABELS.managePreferences,
        exact: true,
      })
      .click();
  }

  /**
   * Waits for the banner to be shown, which the library does only when the visitor has made no choice yet.
   * @returns A promise that settles when the banner is visible, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilShown(): Promise<void> {
    await expect(this.root, "The consent banner is not shown").toBeVisible();
  }

  /**
   * Waits for the banner to be hidden, as a choice or a remembered consent does.
   * @returns A promise that settles when the banner is hidden, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilHidden(): Promise<void> {
    await expect(this.root, "The consent banner is still shown").toBeHidden();
  }
}
