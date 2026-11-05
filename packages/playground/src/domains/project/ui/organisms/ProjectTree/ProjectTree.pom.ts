import { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom";
import { Pom } from "@/shared/testing/pom";
import { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom";

import { PROJECT_TREE_TEST_ID } from "./ProjectTree.constants";

/** Page object of the project tree. */
export class ProjectTreePom extends Pom {
  protected readonly defaultTestId = PROJECT_TREE_TEST_ID;

  /**
   * The accessible name of the tree.
   * @returns The `aria-label` attribute, or null when the tree has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * The item of a node.
   * @param path The path of the node, or `eslint.config.js` for the config.
   * @returns The page object of the item, which is not rendered for a node that is not in the tree or is inside a closed folder.
   */
  item(path: string): ProjectTreeItemPom {
    return this.childPom(ProjectTreeItemPom, { name: path });
  }

  /**
   * How many items the tree draws.
   * @returns The number of items, with those inside the open folders.
   */
  get itemCount(): number {
    return this.childPom(ProjectTreeItemPom).count;
  }

  /**
   * The paths of the nodes the tree shows.
   * @returns The path of each item, in the order they are drawn: the config first, and each folder before the items inside it.
   */
  get itemPaths(): string[] {
    return Array.from(
      { length: this.itemCount },
      (_, index) => this.childPom(ProjectTreeItemPom, { index }).path
    );
  }

  /**
   * What names the items of the tree.
   * @returns The label of each item, in the order they are drawn.
   */
  get itemLabels(): string[] {
    return Array.from(
      { length: this.itemCount },
      (_, index) => this.childPom(ProjectTreeItemPom, { index }).label
    );
  }

  /**
   * What the badges of the whole tree say to assistive technology.
   * @returns The `aria-label` of each image of the tree, in order; empty when no node has a badge.
   */
  get badgeLabels(): (string | null)[] {
    return Array.from(
      { length: this.childPom(CountBadgePom).total },
      (_, index) => this.childPom(CountBadgePom, { index }).label
    );
  }
}
