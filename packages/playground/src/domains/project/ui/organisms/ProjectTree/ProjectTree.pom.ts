import { fireEvent } from "@testing-library/react";

import { RenameFieldPom } from "@/domains/project/ui/atoms/RenameField/RenameField.pom";
import { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom";
import { Pom } from "@/shared/testing/pom";

import { PROJECT_TREE_TEST_ID } from "./ProjectTree.constants";

/** Page object of the project tree. */
export class ProjectTreePom extends Pom {
  protected readonly defaultTestId = PROJECT_TREE_TEST_ID;

  /**
   * Whether assistive technology reads the tree as a tree with a given name.
   * @param accessibleName The accessible name.
   * @returns True when the tree is among the trees of that name of the element that holds it.
   */
  isTreeNamed(accessibleName: string): boolean {
    return this.isNamed("tree", accessibleName);
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
   * @returns The accessible name of each item, in the order they are drawn.
   */
  get itemNames(): string[] {
    return this.accessibleNames("treeitem");
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
   * The field that renames a node, which takes the place of its name.
   * @returns The page object of the field, which is not rendered while no node is renamed.
   */
  get renameField(): RenameFieldPom {
    return this.childPom(RenameFieldPom);
  }

  /**
   * How many fields rename a node in the tree.
   * @returns The number of text boxes within the tree: one while a node is renamed, none otherwise.
   */
  get renameFieldCount(): number {
    return this.childPom(RenameFieldPom).count;
  }

  /**
   * What the buttons of the whole tree say to assistive technology.
   * @returns The accessible name of each button of the tree, in order: the actions of the rows; empty when nodes cannot be edited.
   */
  get buttonNames(): string[] {
    return Array.from(
      { length: this.itemCount },
      (_, index) => this.childPom(ProjectTreeItemPom, { index }).row.buttonNames
    ).flat();
  }

  /**
   * Right clicks the empty space of the tree, below its rows, as the user does to open the context menu of the root of the project.
   * @param at Where the pointer is, in pixels from the top left corner of the viewport.
   * @param at.x The distance from the left.
   * @param at.y The distance from the top.
   * @returns True when the page kept the menu of the browser from opening.
   */
  rightClickEmptySpace(at: { x: number; y: number } = { x: 0, y: 0 }): boolean {
    return !fireEvent.contextMenu(this.root, {
      clientX: at.x,
      clientY: at.y,
    });
  }

  /**
   * What the badges of the whole tree say to assistive technology.
   * @returns The accessible name of each image of the tree, in order; empty when no node has a badge.
   */
  get badgeNames(): string[] {
    return this.accessibleNames("img");
  }
}
