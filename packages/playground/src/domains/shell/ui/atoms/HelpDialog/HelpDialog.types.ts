/** Props of {@link HelpDialog}. */
export type HelpDialogProps = {
  /** Whether the dialog is open. It never opens by itself: the caller opens it when the user asks. */
  readonly isOpen: boolean;
  /** The URL of the Quick start guide, which the link of the dialog points to. The dialog draws no link without it. */
  readonly quickStartUrl?: string;
  /** Called when the user closes the dialog: the button, Escape, or a click outside it. */
  readonly onClose: () => void;
  /** Called when the dialog is gone from the page after it closed. The dialog keeps the focus while it fades out, so a caller that gives the focus back waits for this. */
  readonly onExited: () => void;
};
