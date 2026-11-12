/** Props of the pane that shows when nothing is open. */
export type EmptyNodeProps = {
  /** Whether the project can have files added, and so whether the pane offers to add one. */
  readonly canAddFile: boolean;
  /** Called when the user asks to open the config. */
  readonly onOpenConfig: () => void;
  /** Called when the user asks to add a file. */
  readonly onAddFile: () => void;
  /** The accessible name of the landmark of the pane. */
  readonly frameLabel: string;
  /** The test id of the root element. It is the one of the pane when it is unset, and a module that is this pane gives it its own. */
  readonly testId?: string;
};
