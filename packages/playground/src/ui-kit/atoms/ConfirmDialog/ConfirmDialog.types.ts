/** Props of {@link ConfirmDialog}. */
export type ConfirmDialogProps = {
  /** Whether the dialog is open. */
  readonly isOpen: boolean;
  /** What the dialog asks, which is also its accessible name. */
  readonly title: string;
  /** What the dialog explains below its title. */
  readonly text: string;
  /** The label of the button that gives up. */
  readonly cancelLabel: string;
  /** The label of the button that goes on. */
  readonly confirmLabel: string;
  /** The test id of the root element. The dialog renders none when it is unset: the component that is the dialog sets its own. */
  readonly testId?: string;
  /** Called when the user gives up: the cancel button, Escape, or a click outside the dialog. */
  readonly onCancel: () => void;
  /** Called when the user goes on. */
  readonly onConfirm: () => void;
  /** Called when the dialog is gone from the page after it closed. The dialog keeps the focus while it fades out, so a caller that gives the focus back waits for this. */
  readonly onExited: () => void;
};
