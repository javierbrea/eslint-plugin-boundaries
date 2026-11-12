import type { Locator } from "@playwright/test";

import { LinkPom } from "../../theme/Link/Link.pom.playwright";

/** The text of the button, which is the accessible name of its link: its arrow is an image that is hidden from assistive technology. */
const OPEN_IN_PLAYGROUND_LABEL = "Open in playground";

/**
 * Page object of the Open in playground button of a docs page, in a browser, which is a link: the one that has the text of the button within its parent. A docs page holds one per example, so the `index` option picks among them. The link of the button is a Docusaurus link, so a hydrated page follows it with its router, which keeps the page and its state alive.
 */
export class OpenInPlaygroundPom extends LinkPom {
  /**
   * Finds the link by the text of the button.
   * @returns The locator of the root element.
   */
  protected override findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("link", {
        name: OPEN_IN_PLAYGROUND_LABEL,
        exact: true,
      })
    );
  }
}
