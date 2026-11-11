import { Pom } from "@boundaries/playground/playwright";
import type { Locator } from "@playwright/test";

import { OpenInPlaygroundPom } from "../../components/OpenInPlayground/OpenInPlayground.pom.playwright";

/** Page object of a docs page, in a browser, which Docusaurus renders from the docs: the site does not swizzle it. Its root is the `article` of the page, which holds its breadcrumbs, its title and its text, and not the navbar, the sidebar or the footer. */
export class DocItemPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the `article` of the page, the only one it has.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.pickMatch(this.searchBase.getByRole("article"));
  }

  /**
   * The title of the page, which is the level 1 heading of its text. It reads once and does not wait.
   * @returns A promise of the text of the heading, which is empty when the page is not a docs page or has not rendered it.
   */
  get title(): Promise<string> {
    return this.readText(this.root.getByRole("heading", { level: 1 }));
  }

  /**
   * The Open in playground button of the page.
   * @returns The page object of the button, which is not rendered when the page has none.
   */
  get openInPlayground(): OpenInPlaygroundPom {
    return this.childPom(OpenInPlaygroundPom);
  }
}
