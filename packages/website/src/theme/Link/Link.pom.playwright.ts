import { Pom } from "@boundaries/playground/playwright";
import type { Locator } from "@playwright/test";

import { RootPom } from "../Root/Root.pom.playwright";

/** Page object of a link of the site, in a browser, such as an item of the navbar or of the docs sidebar. It has no test id: it finds the element with the role `link` whose accessible name is the `name` option, within its parent. */
export class LinkPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the link by its accessible name, which must be the whole text of the link.
   * @returns The locator of the root element.
   */
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

  /**
   * Follows the link, as the user does by clicking it. It waits for the page to hydrate first, because before that the browser loads the document of the link, and the router of the site, which a hydrated page uses, loads none. The caller waits for the page it lands on, such as with its title or its URL.
   * @returns A promise that settles when the link is clicked.
   */
  async follow(): Promise<void> {
    await new RootPom({ page: this.page }).waitUntilHydrated();
    await this.root.click();
  }
}
