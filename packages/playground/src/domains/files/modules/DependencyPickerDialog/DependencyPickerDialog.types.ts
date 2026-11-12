/** Props of {@link DependencyPickerDialog}. */
export type DependencyPickerDialogProps = {
  /** Whether the dialog is open. */
  readonly open: boolean;
  /** Path of the file the dependency belongs to. */
  readonly from: string;
  /** The position of the dependency being edited among the ones of the file, or `undefined` to add one. */
  readonly index: number | undefined;
  /** Called when the dialog has to close: the user gave up, or the dependency was saved. */
  readonly onClose: () => void;
};
