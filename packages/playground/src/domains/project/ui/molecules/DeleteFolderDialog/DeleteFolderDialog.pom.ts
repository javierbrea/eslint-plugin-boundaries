import { Pom } from "@/shared/testing/pom";
import { ConfirmDialogPom } from "@/ui-kit/atoms/ConfirmDialog/ConfirmDialog.pom";

import {
  DELETE_FOLDER_DIALOG_CANCEL_LABEL,
  DELETE_FOLDER_DIALOG_CONFIRM_LABEL,
  DELETE_FOLDER_DIALOG_TEST_ID,
} from "./DeleteFolderDialog.constants";

/** Page object of the dialog that asks before a folder with files is removed. It is rendered in an overlay, outside the element that opened it, so build it without a parent, or with the `portal` option. */
export class DeleteFolderDialogPom extends Pom {
  protected readonly defaultTestId = DELETE_FOLDER_DIALOG_TEST_ID;

  /**
   * The confirmation dialog it is made of: its title, its text and its buttons.
   * @returns The page object of the dialog.
   */
  get dialog(): ConfirmDialogPom {
    return this.childPom(ConfirmDialogPom);
  }

  /** Presses the button that removes the folder. */
  confirm(): void {
    this.dialog.button(DELETE_FOLDER_DIALOG_CONFIRM_LABEL).press();
  }

  /** Presses the button that gives up. */
  cancel(): void {
    this.dialog.button(DELETE_FOLDER_DIALOG_CANCEL_LABEL).press();
  }
}
