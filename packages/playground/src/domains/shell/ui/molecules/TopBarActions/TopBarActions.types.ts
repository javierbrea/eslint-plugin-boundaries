import type { Ref } from "react";

/** Props of {@link TopBarActions}. */
export type TopBarActionsProps = {
  /** Whether the help that the first button opens is open, which the button shows as pressed. */
  readonly isHelpOpen: boolean;
  /** Gives the caller the element of the help button, so that it can give it the keyboard focus back when the help closes. */
  readonly helpButtonRef?: Ref<HTMLButtonElement>;
  /** Whether Share confirms that it copied the link: a check and `Copied` take the place of its icon and label. It defaults to `false`. */
  readonly isShareCopied?: boolean;
  /** Gives the caller the element of the Share button, so that it can give it the keyboard focus back when the dialog of a share closes. */
  readonly shareButtonRef?: Ref<HTMLButtonElement>;
  /** Called when the user asks for the help. */
  readonly onHelp: () => void;
  /** Called when the user asks to reset the sketch. */
  readonly onReset: () => void;
  /** Called when the user asks to share the sketch. The bar has neither the Share button nor the region that says it copied without it. */
  readonly onShare?: () => void;
  /** Whether the Reset button takes the keyboard focus when it is first rendered, such as the one of a new shell that replaced the one in which the user pressed Reset. It defaults to `false`. */
  readonly autoFocusReset?: boolean;
  /** The test id of the root element, in place of the default one. */
  readonly testId?: string;
};
