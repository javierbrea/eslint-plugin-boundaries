import { ProjectTreeMenuPom } from "@/domains/project/ui/atoms/ProjectTreeMenu/ProjectTreeMenu.pom.playwright";
import type { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom.playwright";
import { ProjectTreePom } from "@/domains/project/ui/organisms/ProjectTree/ProjectTree.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { PROJECT_PANE_TEST_ID } from "./ProjectPane.constants";

/** Page object of the project pane, in a browser, which is its layout: the tree or the text, the foot, the context menu of the tree, and the dialog that asks before a folder with files is removed. It composes the page objects of the tree and of its menu, and has shortcuts for what a spec does most. */
export class ProjectPanePom extends Pom {
  protected readonly defaultTestId = PROJECT_PANE_TEST_ID;

  /**
   * The tree, which is not rendered while the project is shown as text.
   * @returns The page object of the tree.
   */
  get tree(): ProjectTreePom {
    return this.childPom(ProjectTreePom);
  }

  /**
   * The context menu of the tree. It is rendered outside the pane, next to it, so it is searched in the whole page.
   * @returns The page object of the menu, which is not rendered until the user opens it.
   */
  get menu(): ProjectTreeMenuPom {
    return this.childPom(ProjectTreeMenuPom, { portal: true });
  }

  /**
   * The item of a node of the tree.
   * @param path The path of the node, or `eslint.config.js` for the config.
   * @returns The page object of the item.
   */
  item(path: string): ProjectTreeItemPom {
    return this.tree.item(path);
  }

  /**
   * Clicks the name of a node, as the user does to open a file, or to close or open a folder.
   * @param path The path of the node.
   */
  async click(path: string): Promise<void> {
    await this.item(path).row.clickName();
  }
}
