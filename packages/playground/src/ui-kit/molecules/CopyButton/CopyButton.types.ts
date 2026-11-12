import type { Ref } from "react";

import type { IconName } from "@/ui-kit/atoms/Icon";

/** Props of {@link CopyButton}. */
export type CopyButtonProps = {
  /** What the button says, which is also its accessible name, also while it confirms. */
  readonly label: string;
  /** The icon before the label, if any. */
  readonly icon?: IconName;
  /** Whether the button confirms that it copied: a check and `Copied` take the place of the icon and the label. */
  readonly isCopied: boolean;
  /** Gives the caller the element of the button, such as to give it the keyboard focus back. */
  readonly buttonRef?: Ref<HTMLButtonElement>;
  /** Called when the user presses the button. */
  readonly onClick: () => void;
  /** The test id of the root element, in place of the default one. */
  readonly testId?: string;
};

/** The styles of a face of the button, as its page object reads them to tell which one shows. */
export type CopyButtonFaceStyle = Pick<CSSStyleDeclaration, "opacity">;
