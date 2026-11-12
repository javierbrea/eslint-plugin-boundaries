import type { ReactNode } from "react";

import { formatCount } from "@/shared/helpers/formatCount";
import { ConfirmDialog } from "@/ui-kit/atoms/ConfirmDialog";

import {
  DELETE_FOLDER_DIALOG_CANCEL_LABEL,
  DELETE_FOLDER_DIALOG_CONFIRM_LABEL,
  DELETE_FOLDER_DIALOG_TEST_ID,
  DELETE_FOLDER_DIALOG_TEXT,
} from "./DeleteFolderDialog.constants";
import type { DeleteFolderDialogProps } from "./DeleteFolderDialog.types";

/**
 * The dialog that asks before a folder with files is removed: it names the folder and says how many files go with it.
 * @param props DeleteFolderDialog props.
 * @param props.isOpen Whether the dialog is open.
 * @param props.path The path of the folder.
 * @param props.files How many files are inside the folder.
 * @param props.onCancel Called when the user gives up.
 * @param props.onConfirm Called when the user removes the folder.
 * @param props.onExited Called when the dialog is gone from the page after it closed.
 * @returns The dialog.
 */
export function DeleteFolderDialog({
  isOpen,
  path,
  files,
  onCancel,
  onConfirm,
  onExited,
}: Readonly<DeleteFolderDialogProps>): ReactNode {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={`Delete ${path}/ and its ${formatCount(files, "file", "files")}?`}
      text={DELETE_FOLDER_DIALOG_TEXT}
      cancelLabel={DELETE_FOLDER_DIALOG_CANCEL_LABEL}
      confirmLabel={DELETE_FOLDER_DIALOG_CONFIRM_LABEL}
      testId={DELETE_FOLDER_DIALOG_TEST_ID}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onExited={onExited}
    />
  );
}
