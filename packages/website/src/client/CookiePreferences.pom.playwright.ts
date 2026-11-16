import { Pom } from "@boundaries/playground/playwright";
import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { CONSENT_LABELS } from "./consent.constants";

/** Page object of the cookie preferences, in a browser, which vanilla-cookieconsent renders as a dialog of the document when the banner or the footer asks for them. It finds its root as the `dialog` named with the title of the preferences. After a choice is saved the library applies it a moment later, so a spec reads the state it leaves with a waiting method or `expect.poll` over a value getter, never once. */
export class CookiePreferencesPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the dialog that has the title of the preferences.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("dialog", {
        name: CONSENT_LABELS.preferencesTitle,
        exact: true,
      })
    );
  }

  /**
   * The checkbox of the Analytics category, named with the title of its section.
   * @returns The locator of the checkbox.
   */
  private get analyticsCheckbox(): Locator {
    return this.root.getByRole("checkbox", {
      name: CONSENT_LABELS.analyticsSection,
      exact: true,
    });
  }

  /**
   * Turns the Analytics category on, as the user does with its checkbox.
   * @returns A promise that settles when the checkbox is checked.
   */
  async turnAnalyticsOn(): Promise<void> {
    await this.analyticsCheckbox.check();
  }

  /**
   * Turns the Analytics category off, as the user does with its checkbox.
   * @returns A promise that settles when the checkbox is unchecked.
   */
  async turnAnalyticsOff(): Promise<void> {
    await this.analyticsCheckbox.uncheck();
  }

  /**
   * Waits for the Analytics category to be on in the dialog.
   * @returns A promise that settles when the checkbox is checked, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilAnalyticsOn(): Promise<void> {
    await expect(
      this.analyticsCheckbox,
      "The Analytics category is not on"
    ).toBeChecked();
  }

  /**
   * Waits for the Analytics category to be off in the dialog.
   * @returns A promise that settles when the checkbox is unchecked, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilAnalyticsOff(): Promise<void> {
    await expect(
      this.analyticsCheckbox,
      "The Analytics category is not off"
    ).toBeChecked({ checked: false });
  }

  /**
   * Saves the choices of the dialog, as the user does with the Save preferences button. The library applies them after the dialog hides, so the caller waits for the state they leave.
   * @returns A promise that settles when the button is clicked.
   */
  async save(): Promise<void> {
    await this.root
      .getByRole("button", {
        name: CONSENT_LABELS.savePreferences,
        exact: true,
      })
      .click();
  }

  /**
   * Waits for the dialog to be shown.
   * @returns A promise that settles when the dialog is visible, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilShown(): Promise<void> {
    await expect(
      this.root,
      "The cookie preferences are not shown"
    ).toBeVisible();
  }

  /**
   * Waits for the dialog to be hidden, as a choice that is saved or the Close button does.
   * @returns A promise that settles when the dialog is hidden, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilHidden(): Promise<void> {
    await expect(
      this.root,
      "The cookie preferences are still shown"
    ).toBeHidden();
  }
}
