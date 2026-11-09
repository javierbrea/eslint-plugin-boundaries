/** What would take the place of the sketch on screen: the sketch of the source, or an example. */
export type SketchReplacement =
  | { readonly kind: "reset" }
  | { readonly kind: "example"; readonly title: string };

/** Props of {@link ReplaceSketchDialog}. */
export type ReplaceSketchDialogProps = {
  /** Whether the dialog is open. */
  readonly isOpen: boolean;
  /** What would replace the sketch, which names the dialog. It keeps the last one while the dialog closes. */
  readonly replacement: SketchReplacement;
  /** Called when the user gives up. */
  readonly onCancel: () => void;
  /** Called when the user goes on. */
  readonly onConfirm: () => void;
  /** Called when the dialog is gone from the page after it closed. The dialog keeps the focus while it fades out, so a caller that puts something else on screen and gives it the focus waits for this. */
  readonly onExited: () => void;
};
