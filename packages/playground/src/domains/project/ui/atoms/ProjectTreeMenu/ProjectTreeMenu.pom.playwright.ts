import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

import { NODE_MENU_LABEL } from "./ProjectTreeMenu.constants";

/** The start of the accessible name of every menu of the tree, the one of a node and the one of the root alike */
const MENU_NAME = new RegExp(`^${NODE_MENU_LABEL} `);

/** Page object of the context menu of the project tree, in a browser. It is rendered in an overlay inside the root element of the playground, outside the tree, so a parent searches it with the `portal` option. It has no test id: it finds the element with the role `menu` and the accessible name of the `name` option, or of any menu of the tree without it, while it closes too. */
export class ProjectTreeMenuPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("menu", {
        name: this.options.name ?? MENU_NAME,
        includeHidden: true,
      })
    );
  }

  /**
   * Picks an item, which waits for it to be on screen.
   * @param label The accessible name of the item, such as `Rename`.
   */
  async pick(label: string): Promise<void> {
    await this.root.getByRole("menuitem", { name: label, exact: true }).click();
  }

  /**
   * Waits for the menu to be gone from the page, which MUI does when its transition ends after it closed, and which is when what the user picked runs.
   * @returns A promise that settles when the menu is gone, and rejects when it is not before the timeout of the assertions.
   */
  async waitUntilGone(): Promise<void> {
    await expect
      .poll(() => this.isRendered, { message: "The menu is still in the page" })
      .toBe(false);
  }
}
