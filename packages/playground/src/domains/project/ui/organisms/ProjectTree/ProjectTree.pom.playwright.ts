import { RenameFieldPom } from "@/domains/project/ui/atoms/RenameField/RenameField.pom.playwright";
import { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom.playwright";
import { Pom } from "@/shared/testing/pom/pom.playwright";

import { PROJECT_TREE_TEST_ID } from "./ProjectTree.constants";

/** Page object of the project tree, in a browser. */
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
   * The field that renames a node, which takes the place of its name: the item of the node cannot be found by its path while it is renamed.
   * @returns The page object of the field, which is not rendered while no node is renamed.
   */
  get renameField(): RenameFieldPom {
    return this.childPom(RenameFieldPom);
  }

  /**
   * How many items the tree draws. It reads once and does not wait.
   * @returns A promise of the number of items, with those inside the open folders.
   */
  get itemCount(): Promise<number> {
    return this.childPom(ProjectTreeItemPom).count;
  }

  // pom-parity: a browser spec compares the files that the user sees with those of an example, and no jsdom spec needs them apart from the folders and the config
  /**
   * The paths of the files that the tree shows, without the config and the folders: the files of the open folders. A project opens with every folder open, so it lists every file until the user closes a folder. It reads once and does not wait.
   * @returns A promise of the path of each file, in the order they are drawn.
   */
  get filePaths(): Promise<string[]> {
    return this.itemCount.then(async (count) => {
      const items = Array.from({ length: count }, (_, index) =>
        this.childPom(ProjectTreeItemPom, { index })
      );
      const nodes = await Promise.all(
        items.map(async (item) => ({
          kind: await item.kind,
          path: await item.path,
        }))
      );

      return nodes.flatMap(({ kind, path }) =>
        kind === "file" && path !== null ? [path] : []
      );
    });
  }
}
