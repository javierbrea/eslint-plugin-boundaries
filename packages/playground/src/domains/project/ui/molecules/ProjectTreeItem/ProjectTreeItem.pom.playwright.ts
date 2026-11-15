import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

import { PROJECT_TREE_ITEM_TEST_ID } from "./ProjectTreeItem.constants";

/** Page object of a button of the actions of a row, a part of the row, exported only as a type. No browser spec reaches it: it exists because the jsdom page object exports a class of this name, which `check:pom-parity` requires of this file too. */
class RowActionPom extends Pom {
  protected readonly defaultTestId = "";
}

/** Page object of the row of an item, a part of the item: the page object of the item builds it, so it is exported only as a type. It has no test id: its root is the first element of its parent, which is the item. The row holds the chevron, the name, and at the end the actions and the badge, and not the items inside a folder. */
class ProjectRowPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.findRootBySelector(":scope > :first-child");
  }

  /** Clicks the name of the node, as the user does to open a file, or to close or open a folder. */
  async clickName(): Promise<void> {
    await this.root.locator("[title]").first().click();
  }

  /** Right clicks the name of the node, as the user does to open its context menu. */
  async rightClickName(): Promise<void> {
    await this.root.locator("[title]").first().click({ button: "right" });
  }
}

/** Page object of an item of the project tree, in a browser. It finds the item by the path of its node, the `name` option when it is set: the title of the name of the item. Without it, the `index` option picks among all the items of its parent, folders before the items inside them, in the order they are drawn. The items inside a folder are not part of the item, and neither are their rows. */
export class ProjectTreeItemPom extends Pom {
  protected readonly defaultTestId = PROJECT_TREE_ITEM_TEST_ID;

  /**
   * Every item within the parent, whatever the options but the test id, in the order they are drawn.
   * @returns The locator of the items.
   */
  private get items(): Locator {
    return this.searchBase.getByTestId(
      this.options.testId ?? this.defaultTestId
    );
  }

  /**
   * The element that holds the name of the node, read from the row of the item and not from the items inside it.
   * @returns The locator of the name, which resolves to nothing when the row has none.
   */
  private get ownName(): Locator {
    return this.root.locator(":scope > :first-child [title]").first();
  }

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: path } = this.options;

    if (path === undefined) {
      return this.pickMatch(this.items);
    }

    return this.pickMatch(
      this.items.filter({
        has: this.page
          .locator(":scope > :first-child")
          .getByTitle(path, { exact: true }),
      })
    );
  }

  /**
   * How many items its parent holds, whatever the `name`, `index` and `containing` options. A page object that lists them builds one `ProjectTreeItemPom` per index below this number. It reads once and does not wait.
   * @returns A promise of the number of items within the parent, with those inside the folders.
   */
  get count(): Promise<number> {
    return this.items.count();
  }

  /**
   * The path of the node the item shows, read from its own row and not from the items inside it. It reads once and does not wait.
   * @returns A promise of the title of its name, or null when the item has none or is not in the page.
   */
  get path(): Promise<string | null> {
    return this.readAttribute("title", this.ownName);
  }

  /**
   * The row of the item, without the items inside it.
   * @returns The page object of the row.
   */
  get row(): ProjectRowPom {
    return this.childPom(ProjectRowPom);
  }

  /**
   * What kind of node the item shows. It reads once and does not wait.
   * @returns A promise of the `data-kind` attribute: `config`, `file` or `folder`, or null when the item is not in the page.
   */
  get kind(): Promise<string | null> {
    return this.readAttribute("data-kind");
  }
}

export type { ProjectRowPom, RowActionPom };
