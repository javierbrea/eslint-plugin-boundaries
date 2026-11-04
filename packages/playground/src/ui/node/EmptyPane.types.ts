/** Props of the pane that shows when nothing is open. */
export type EmptyPaneProps = {
  /** Whether the project can have files added, and so whether the pane offers to add one. */
  readonly canAddFile: boolean;
  /** Called when the user asks to open the config. */
  readonly onOpenConfig: () => void;
  /** Called when the user asks to add a file. */
  readonly onAddFile: () => void;
};
