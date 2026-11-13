/** Props of {@link ConfigNode}. */
export type ConfigNodeProps = {
  /** The accessible name of the landmark of the pane. */
  readonly frameLabel: string;
  /** Called when the user presses the close button of the pane. */
  readonly onClose: () => void;
};
