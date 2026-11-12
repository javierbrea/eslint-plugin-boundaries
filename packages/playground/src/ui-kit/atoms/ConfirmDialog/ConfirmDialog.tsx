import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useId } from "react";
import type { ReactNode } from "react";

import type { ConfirmDialogProps } from "./ConfirmDialog.types";

/**
 * A dialog that asks the user to confirm before something goes: a title that names it, a text, and a button to give up next to a button to go on.
 * @param props ConfirmDialog props.
 * @param props.isOpen Whether the dialog is open.
 * @param props.title What the dialog asks.
 * @param props.text What the dialog explains below its title.
 * @param props.cancelLabel The label of the button that gives up.
 * @param props.confirmLabel The label of the button that goes on.
 * @param props.testId The test id of the root element, when the component that is the dialog has one.
 * @param props.onCancel Called when the user gives up.
 * @param props.onConfirm Called when the user goes on.
 * @param props.onExited Called when the dialog is gone from the page after it closed.
 * @returns The dialog.
 */
export function ConfirmDialog({
  isOpen,
  title,
  text,
  cancelLabel,
  confirmLabel,
  testId,
  onCancel,
  onConfirm,
  onExited,
}: Readonly<ConfirmDialogProps>): ReactNode {
  const titleId = useId();

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      aria-labelledby={titleId}
      data-testid={testId}
      // The dialog keeps the focus while it fades out, so the caller can take it back only when it is gone
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
