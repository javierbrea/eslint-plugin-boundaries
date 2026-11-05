/** Props of {@link RenameField}. */
export type RenameFieldProps = {
  /** The path of the node being renamed */
  readonly path: string;
  /** The current name of the node: the field starts with it, selected */
  readonly name: string;
  /** Called with the name that was typed. It returns why the name is refused, or `undefined` when the node was renamed */
  readonly onCommit: (path: string, name: string) => string | undefined;
  /** Called when the user gives up */
  readonly onCancel: () => void;
};

/** The part of the value of the field that is selected, as the offsets of its ends. */
export type RenameFieldSelection = {
  /** Where the selection starts. */
  readonly start: number | null;
  /** Where the selection ends. */
  readonly end: number | null;
};
