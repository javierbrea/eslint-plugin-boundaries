import { waitFor } from "@testing-library/react";

import { ProjectTextPom } from "@/domains/project/modules/ProjectText/ProjectText.pom";
import { DeleteFolderDialogPom } from "@/domains/project/ui/molecules/DeleteFolderDialog/DeleteFolderDialog.pom";
import { ProjectFootPom } from "@/domains/project/ui/molecules/ProjectFoot/ProjectFoot.pom";
import type { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom";
import { ProjectTreePom } from "@/domains/project/ui/organisms/ProjectTree/ProjectTree.pom";
import { ProjectPaneLayoutPom } from "@/domains/project/ui/templates/ProjectPaneLayout/ProjectPaneLayout.pom";
import { Pom } from "@/shared/testing/pom";

import { PROJECT_PANE_TEST_ID } from "./ProjectPane.constants";

/** Page object of the project pane, which is its layout: the tree or the text, the foot, and the dialog that asks before a folder with files is removed. It composes the page objects of those pieces and has shortcuts for what a spec does most. */
export class ProjectPanePom extends Pom {
  protected readonly defaultTestId = PROJECT_PANE_TEST_ID;

  /**
   * The layout the pane is, which has the same root element.
   * @returns The page object of the layout.
   */
  get layout(): ProjectPaneLayoutPom {
    return this.childPom(ProjectPaneLayoutPom, { root: this.root });
  }

  /**
   * The tree, which is not rendered while the project is shown as text.
   * @returns The page object of the tree.
   */
  get tree(): ProjectTreePom {
    return this.childPom(ProjectTreePom);
  }

  /**
   * The project as text, which is not rendered while the project is shown as a tree.
   * @returns The page object of the text.
   */
  get text(): ProjectTextPom {
    return this.childPom(ProjectTextPom);
  }

  /**
   * The foot, with the buttons that add a node and the toggle of the view.
   * @returns The page object of the foot.
   */
  get foot(): ProjectFootPom {
    return this.childPom(ProjectFootPom);
  }

  /**
   * The dialog that asks before a folder with files is removed. It is rendered outside the pane, next to it, so it is searched in the whole document.
   * @returns The page object of the dialog, which is not rendered until a removal is asked for.
   */
  get deleteDialog(): DeleteFolderDialogPom {
    return this.childPom(DeleteFolderDialogPom, { portal: true });
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
  click(path: string): void {
    this.item(path).row.clickName();
  }

  /**
   * Renames a node with the keyboard, as the user does: F2 on its item, the new name, and Enter.
   * @param path The path of the node.
   * @param newName What the user types in the field, which replaces the name of the node.
   */
  rename(path: string, newName: string): void {
    const item = this.item(path);

    item.pressKey("F2");

    const { field } = item;

    field.type(newName);
    field.pressKey("Enter");
  }

  /**
   * Asks to remove a node as a keyboard user does: its item takes the focus, and Delete is pressed.
   * @param path The path of the node.
   */
  askToDelete(path: string): void {
    const item = this.item(path);

    item.focus();
    item.pressKey("Delete");
  }

  /**
   * Waits for the dialog that asks before a folder is removed to be gone from the page, which MUI does when its transition ends after the dialog closed.
   * @returns A promise that settles when the dialog is gone.
   */
  async waitUntilDeleteDialogGone(): Promise<void> {
    await this.deleteDialog.dialog.waitUntilGone();
  }

  /**
   * Waits for an element to have the keyboard focus, which is when the tree took it back after a rename or after the dialog went. The focus is on the body until then.
   * @returns A promise that settles when something has the focus.
   */
  async waitForFocus(): Promise<void> {
    await waitFor(() => {
      if (document.activeElement === document.body) {
        throw new Error("The focus is still on the body");
      }
    });
  }
}
