import type { ReactNode } from "react";

/** How a disclosure looks: a `section` is bare, with its label in the pane label style, and a `box` is framed, with its label in the accent color. */
export type DisclosureVariant = "section" | "box";

/** Props of {@link Disclosure}. */
export type DisclosureProps = {
  /** Name of what the disclosure folds, which the header starts with after the chevron. */
  readonly label: string;
  /** Text after the label, in mono and cut with an ellipsis when it does not fit: a path, or a digest of what is folded. */
  readonly summary?: string;
  /** Draws the summary in the muted color instead of the ink color. */
  readonly isSummaryMuted?: boolean;
  /** How it looks. It is a `section` by default. */
  readonly variant?: DisclosureVariant;
  /** Whether the body is shown. */
  readonly isOpen: boolean;
  /** Called when the header is pressed, so that the owner of the state flips `isOpen`. */
  readonly onToggle: () => void;
  /** What the disclosure folds, which is not rendered while it is folded. */
  readonly children: ReactNode;
  /** The test id of the root element. It is the one of the disclosure when it is unset. */
  readonly testId?: string;
};
