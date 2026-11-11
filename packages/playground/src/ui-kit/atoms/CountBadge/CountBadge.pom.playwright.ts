import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

/** Page object of a count badge, in a browser. It has no test id: it finds the image within its parent, named by the `name` option when it is set (the label of the badge). */
export class CountBadgePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.getByRole(
        "img",
        accessibleName === undefined
          ? {}
          : { name: accessibleName, exact: true }
      )
    );
  }

  /**
   * The number the badge shows. It reads once and does not wait.
   * @returns A promise of the text of the badge, which is empty when the badge is not in the page.
   */
  get count(): Promise<string> {
    return this.readText();
  }
}
