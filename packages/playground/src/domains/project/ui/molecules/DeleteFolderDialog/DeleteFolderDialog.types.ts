/** Props of {@link DeleteFolderDialog}. */
export type DeleteFolderDialogProps = {
  /** Whether the dialog is open. */
  readonly isOpen: boolean;
  /** The path of the folder the dialog asks about. It keeps the last one while the dialog closes. */
  readonly path: string;
  /** How many files are inside the folder, at any depth. */
  readonly files: number;
  /** Called when the user gives up. */
  readonly onCancel: () => void;
  /** Called when the user removes the folder. */
  readonly onConfirm: () => void;
  /** Called when the dialog is gone from the page after it closed. */
  readonly onExited: () => void;
};
