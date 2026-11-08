import type { Ref } from "react";

import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";

/** Props of {@link TopBarActions}. */
export type TopBarActionsProps = {
  /** Whether the help that the first button opens is open, which the button shows as pressed. */
  readonly isHelpOpen: boolean;
  /** Gives the caller the element of the help button, so that it can give it the keyboard focus back when the help closes. */
  readonly helpButtonRef?: Ref<HTMLButtonElement>;
  /** How the last share ended, for the message that comes before the buttons. Only a bar that can share has the message. */
  readonly shareOutcome?: ShareOutcome;
  /** Called when the user asks for the help. */
  readonly onHelp: () => void;
  /** Called when the user asks to reset the sketch. */
  readonly onReset: () => void;
  /** Called when the user asks to share the sketch. The bar has neither the Share button nor its message without it. */
  readonly onShare?: () => void;
  /** The test id of the root element, in place of the default one. */
  readonly testId?: string;
};
