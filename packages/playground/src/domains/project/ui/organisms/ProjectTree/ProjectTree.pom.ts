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
   * The items that the tree view selects.
   * @returns The path of each selected item, in the order they are drawn; empty when nothing is selected.
   */
  get selectedPaths(): string[] {
    return this.itemPaths.filter(
      (_, index) =>
        this.childPom(ProjectTreeItemPom, { index }).ariaSelected === "true"
    );
  }

  /**
   * Whether each folder shows the items inside it.
   * @returns The `aria-expanded` attribute of each item that can be expanded, in the order they are drawn: `true` for an open folder and `false` for a closed one.
   */
  get expandedStates(): string[] {
    return Array.from({ length: this.itemCount }, (_, index) =>
      this.childPom(ProjectTreeItemPom, { index })
    ).flatMap((item) => item.ariaExpanded ?? []);
  }

  /**
   * How many fields rename a node in the tree.
   * @returns The number of text boxes within the tree: one while a node is renamed, none otherwise.
   */
  get renameFieldCount(): number {
    return this.scope.queryAllByRole("textbox").length;
  }

  /**
   * What the buttons of the whole tree say to assistive technology.
   * @returns The `aria-label` of each button of the tree, in order: the actions of the rows; empty when nodes cannot be edited.
   */
  get buttonLabels(): (string | null)[] {
    return this.scope
      .queryAllByRole("button")
      .map((button) => button.getAttribute("aria-label"));
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
