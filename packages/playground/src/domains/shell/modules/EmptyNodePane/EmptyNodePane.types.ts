/** Props of {@link EmptyNodePane}. */
export type EmptyNodePaneProps = {
  /** The accessible name of the landmark of the pane. */
  readonly frameLabel: string;
  /** Whether the pane gives the keyboard focus to its first button, the one that opens the config, when it is first rendered. */
  readonly autoFocus?: boolean;
};
