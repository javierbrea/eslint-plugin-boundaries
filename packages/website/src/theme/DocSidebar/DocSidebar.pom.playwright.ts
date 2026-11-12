import { Pom } from "@boundaries/playground/playwright";
import type { Locator } from "@playwright/test";

import { LinkPom } from "../Link/Link.pom.playwright";

/** The accessible name that Docusaurus gives the navigation landmark of the docs sidebar (`theme.docs.sidebar.navAriaLabel`). */
const DOC_SIDEBAR_LABEL = "Docs sidebar";

/**
 * Page object of the docs sidebar, in a browser, which Docusaurus renders from `sidebars.ts`: the site does not swizzle it. It finds its root as the `navigation` landmark named `Docs sidebar`.
 *
 * It describes the sidebar of a wide screen, from 997 px up. Below that width Docusaurus hides it and shows its items in the menu of the navbar, as a list with no landmark, so a spec that follows a link of the sidebar runs on a wide screen.
 */
export class DocSidebarPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the navigation landmark that has the name of the sidebar.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("navigation", {
        name: DOC_SIDEBAR_LABEL,
        exact: true,
      })
    );
  }

  /**
   * A page of the sidebar, as the link of its item.
   * @param label The text of the item, such as `Quick Start`.
   * @returns The page object of the link, which is not rendered when the sidebar has none of that name, or it is inside a category that is closed.
   */
  link(label: string): LinkPom {
    return this.childPom(LinkPom, { name: label });
  }
}
