import { Pom } from "@boundaries/playground/playwright";

import { LinkPom } from "../../Link/Link.pom.playwright";

import { NOT_FOUND_CONTENT_TEST_ID } from "./NotFoundContent.constants";

/** The text of the link of the 404 page to the docs, which is its accessible name: its arrow is an image that is hidden from assistive technology. */
const DOCS_LINK_LABEL = "Go to the docs";

/** Page object of the content of the 404 page, in a browser, which the site swizzles as `NotFound/Content`: its root is the `main` landmark of the page, which carries the test id of the content. */
export class NotFoundContentPom extends Pom {
  protected readonly defaultTestId = NOT_FOUND_CONTENT_TEST_ID;

  /**
   * The title of the page, which is its level 1 heading. It reads once and does not wait.
   * @returns A promise of the text of the heading, which is empty when the page has no content of the 404 page.
   */
  get title(): Promise<string> {
    return this.readText(this.root.getByRole("heading", { level: 1 }));
  }

  /**
   * The link to the docs.
   * @returns The page object of the link, which is not rendered when the page has none.
   */
  get docsLink(): LinkPom {
    return this.childPom(LinkPom, { name: DOCS_LINK_LABEL });
  }
}
