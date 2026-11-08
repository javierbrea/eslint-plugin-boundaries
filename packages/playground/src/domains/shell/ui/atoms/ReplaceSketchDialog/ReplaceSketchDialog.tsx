import type { ReactNode } from "react";

import { ConfirmDialog } from "@/ui-kit/atoms/ConfirmDialog";

import {
  EXAMPLE_DIALOG_CONFIRM_LABEL,
  REPLACE_DIALOG_CANCEL_LABEL,
  REPLACE_DIALOG_TEXT,
  RESET_DIALOG_CONFIRM_LABEL,
  RESET_DIALOG_TITLE,
} from "./ReplaceSketchDialog.constants";
import type { ReplaceSketchDialogProps } from "./ReplaceSketchDialog.types";

/**
 * The dialog that asks before the sketch that the user has edited is replaced, which loses the edits: by the sketch of the source when the user resets, or by an example when the user opens one. It names what takes the place of the sketch, and says that the changes go.
 * @param props ReplaceSketchDialog props.
 * @param props.isOpen Whether the dialog is open.
 * @param props.replacement What would replace the sketch.
 * @param props.onCancel Called when the user gives up.
 * @param props.onConfirm Called when the user goes on.
 * @returns The dialog.
 */
export function ReplaceSketchDialog({
  isOpen,
  replacement,
  onCancel,
  onConfirm,
}: Readonly<ReplaceSketchDialogProps>): ReactNode {
  const { title, confirmLabel } =
    replacement.kind === "reset"
      ? { title: RESET_DIALOG_TITLE, confirmLabel: RESET_DIALOG_CONFIRM_LABEL }
      : {
          title: `Open the ${replacement.title} example?`,
          confirmLabel: EXAMPLE_DIALOG_CONFIRM_LABEL,
        };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      text={REPLACE_DIALOG_TEXT}
      cancelLabel={REPLACE_DIALOG_CANCEL_LABEL}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
