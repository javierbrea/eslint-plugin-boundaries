import { DependencyPickerDialogPom } from "@/domains/files/modules/DependencyPickerDialog/DependencyPickerDialog.pom";
import { FilePanePom } from "@/domains/files/ui/organisms/FilePane/FilePane.pom";

/** Page object of the file node, which is the file pane with the dependencies of the store. It renders no element of its own: its root is the root of the file pane, which has the test id. */
export class FileNodePom extends FilePanePom {
  /**
   * The dialog that adds and edits a dependency. It is rendered in an overlay, outside the pane.
   * @returns The page object of the dialog, which is not rendered until the user asks to add or to edit a dependency.
   */
  get picker(): DependencyPickerDialogPom {
    return this.childPom(DependencyPickerDialogPom, { portal: true });
  }
}
