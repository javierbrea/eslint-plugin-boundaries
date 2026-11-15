/** Props of {@link CloseButton}. */
export type CloseButtonProps = {
  /** What the button closes, such as the path of a file: the accessible name of the button is `Close` and this. */
  readonly subject: string;
  /** Called when the user presses the button. */
  readonly onClose: () => void;
};
