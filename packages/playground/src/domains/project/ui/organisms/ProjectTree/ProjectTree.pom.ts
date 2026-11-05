import { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom";
import { Pom } from "@/shared/testing/pom";

import { PROJECT_TREE_TEST_ID } from "./ProjectTree.constants";

/** Page object of the project tree. */
export class ProjectTreePom extends Pom {
  protected readonly defaultTestId = PROJECT_TREE_TEST_ID;

  /**
   * The item of a node.
   * @param path The path of the node, or `eslint.config.js` for the config.
   * @returns The page object of the item, which is not rendered for a node that is not in the tree or is inside a closed folder.
   */
  item(path: string): ProjectTreeItemPom {
    return this.childPom(ProjectTreeItemPom, { name: path });
  }

  /**
   * What the badges of the whole tree say to assistive technology.
   * @returns The `aria-label` of each image of the tree, in order; empty when no node has a badge.
   */
  get badgeLabels(): (string | null)[] {
    return this.scope
      .queryAllByRole("img")
      .map((image) => image.getAttribute("aria-label"));
  }
}
