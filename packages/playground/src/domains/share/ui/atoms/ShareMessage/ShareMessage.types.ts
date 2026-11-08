import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";

/** Props of {@link ShareMessage}. */
export type ShareMessageProps = {
  /** How the last share ended. The message is empty when it is unset. */
  readonly outcome: ShareOutcome | undefined;
};
