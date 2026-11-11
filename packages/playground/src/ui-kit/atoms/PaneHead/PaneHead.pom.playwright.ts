import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

/** Page object of the head of a pane, in a browser. It has no role or test id: it finds the head as the first child of its parent, which is where a pane puts it, or, with the `name` option, by the text of its label, and then takes the parent of the label as its root. */
export class PaneHeadPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: labelName } = this.options;

    if (labelName === undefined) {
      return this.findRootBySelector(":scope > :first-child");
    }

    return this.pickMatch(
      this.searchBase.getByText(labelName, { exact: true }).locator("xpath=..")
    );
  }

  /**
   * The element of the path, which is the one of the items of the head that has a title. What the end slot or the hint holds is not an item, so a title inside them is not the path.
   * @returns The locator of the path, which resolves to nothing when the head has none.
   */
  private get pathElement(): Locator {
    return this.root.locator(":scope > [title]").first();
  }

  /**
   * The path of what the pane shows, such as the path of the open file. It reads once and does not wait.
   * @returns A promise of the text of the path, or null when the head has none or is not in the page.
   */
  get path(): Promise<string | null> {
    return this.pathElement.allTextContents().then(([text]) => text ?? null);
  }
}
