import { DependencyPickerDialogPom } from "@/domains/files/modules/DependencyPickerDialog/DependencyPickerDialog.pom";
import { FilePanePom } from "@/domains/files/ui/organisms/FilePane/FilePane.pom";

import { FILE_NODE_TEST_ID } from "./FileNode.constants";

/** Page object of the file node, which is the file pane with the dependencies of the store. It renders no element of its own: its root is the root of the file pane, which carries the test id of the node in place of its own. */
export class FileNodePom extends FilePanePom {
  protected readonly defaultTestId: string = FILE_NODE_TEST_ID;

  /**
   * The dialog that adds and edits a dependency. It is rendered in an overlay, outside the pane.
   * @returns The page object of the dialog, which is not rendered until the user asks to add or to edit a dependency.
   */
  get picker(): DependencyPickerDialogPom {
    return this.childPom(DependencyPickerDialogPom, { portal: true });
  }
}
