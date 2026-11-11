import { Pom } from "@boundaries/playground/playwright";
import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Page object of the document of a page of the site, in a browser: the `html` element, where Docusaurus says whether the browser has hydrated the page. Docusaurus renders the pages on the server, and a link or a button of a page does not do what its component says until the browser has hydrated it: a link is followed by loading the document, not by the router of the site. The page has no jsdom sibling, so `check:pom-parity` does not compare it. */
export class RootPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * Finds the root as the `html` element, the only one of a page.
   * @returns The locator of the root element.
   */
  protected findRoot(): Locator {
    return this.findRootBySelector("html");
  }

  /**
   * Whether the browser has hydrated the page, as Docusaurus says in the `data-has-hydrated` attribute of `html`, which the server render writes as `false`. It reads once and does not wait.
   * @returns A promise of true when the attribute is `true`.
   */
  get isHydrated(): Promise<boolean> {
    return this.readAttribute("data-has-hydrated").then(
      (hydrated) => hydrated === "true"
    );
  }

  /**
   * Waits for the browser to hydrate the page, which is also the moment after which it logs the errors of the hydration. A client-side navigation keeps the page hydrated, and a document that loads is hydrated again.
   * @returns A promise that settles when the page has hydrated, and rejects when it has not before the timeout of the assertions.
   */
  async waitUntilHydrated(): Promise<void> {
    await expect(this.root, "The page has not hydrated yet").toHaveAttribute(
      "data-has-hydrated",
      "true"
    );
  }
}
