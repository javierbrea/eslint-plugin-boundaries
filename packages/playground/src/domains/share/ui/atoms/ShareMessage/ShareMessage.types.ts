import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";

/** Props of {@link ShareMessage}. */
export type ShareMessageProps = {
  /** How the last share ended. The message is empty when it is unset. */
  readonly outcome: ShareOutcome | undefined;
};

/** The styles that cut the text of a message that does not fit, as its page object reads them. */
export type ShareMessageTextStyle = Pick<
  CSSStyleDeclaration,
  "minWidth" | "overflow" | "textOverflow" | "whiteSpace"
>;
