import { Pom } from "@boundaries/playground/playwright";
import type { Locator } from "@playwright/test";

import { COOKIE_SETTINGS_LABEL } from "../../client/consent.constants";
import { LinkPom } from "../Link/Link.pom.playwright";

/** The text of the link to the privacy page, which is its accessible name. */
const PRIVACY_LINK_LABEL = "Privacy";

/** Page object of the footer of a page of the site, in a browser, which Docusaurus renders from `themeConfig.footer`: the site swizzles only its Copyright. It finds its root as the `contentinfo` landmark of the page. */
export class FooterPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the contentinfo landmark, the only one of a page.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.pickMatch(this.searchBase.getByRole("contentinfo"));
  }

  /**
   * The link to the privacy page, in the Legal column.
   * @returns The page object of the link, which is not rendered when the footer has none.
   */
  get privacyLink(): LinkPom {
    return this.childPom(LinkPom, { name: PRIVACY_LINK_LABEL });
  }

  /**
   * Opens the cookie preferences, as the user does with the Cookie settings button. `consent.ts` listens for its clicks with a delegated listener, since the footer re-renders on every client-side navigation. The caller waits for the dialog with its page object.
   * @returns A promise that settles when the button is clicked.
   */
  async openCookieSettings(): Promise<void> {
    await this.root
      .getByRole("button", { name: COOKIE_SETTINGS_LABEL, exact: true })
      .click();
  }
}
