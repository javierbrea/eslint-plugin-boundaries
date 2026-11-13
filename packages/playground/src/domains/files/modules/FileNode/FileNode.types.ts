/** Props of {@link FileNode}. */
export type FileNodeProps = {
  /** The path of the open file, from the root of the sketch. */
  readonly path: string;
  /** The accessible name of the landmark of the pane. */
  readonly frameLabel: string;
  /** Called when the user presses the close button of the pane. */
  readonly onClose: () => void;
};

/** The state of the picker, which belongs to the page: whether it is open and which dependency of the file it edits. */
export type PickerRequest = {
  /** Whether the picker is open. */
  readonly isOpen: boolean;
  /** The position of the dependency being edited, or `undefined` to add one. It stays while the picker closes, so that the title does not change while it fades out. */
  readonly index: number | undefined;
};
