import { Pom } from "@boundaries/playground/playwright";
import type { Locator } from "@playwright/test";

import { LinkPom } from "../Link/Link.pom.playwright";

/** The accessible name that Docusaurus gives the navigation landmark of the navbar (`theme.NavBar.navAriaLabel`). */
const NAVBAR_LABEL = "Main";

/**
 * Page object of the navbar of the site, in a browser, which Docusaurus renders from `themeConfig.navbar`: the site does not swizzle it. It finds its root as the `navigation` landmark named `Main`.
 *
 * It describes the navbar of a wide screen, from 997 px up. Below that width Docusaurus hides the items and shows a button that opens them in a menu, and the docs sidebar moves into that menu, so a spec that follows a link of the navbar runs on a wide screen.
 */
export class NavbarPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the navigation landmark that has the name of the navbar.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("navigation", {
        name: NAVBAR_LABEL,
        exact: true,
      })
    );
  }

  /**
   * A link of the navbar.
   * @param label The text of the link, such as `Getting Started`.
   * @returns The page object of the link, which is not rendered when the navbar has none of that name.
   */
  link(label: string): LinkPom {
    return this.childPom(LinkPom, { name: label });
  }
}
