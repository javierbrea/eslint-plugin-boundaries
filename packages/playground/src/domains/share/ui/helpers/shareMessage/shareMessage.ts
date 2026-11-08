import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";
import { STATE_TEXT } from "@/ui-kit/helpers/tone";

import type { ShareMessageView } from "./shareMessage.types";

/** What the message says and how it looks for each outcome. A link that was copied is plain news, in the muted color after a check; one that is long asks something of the user, in the color of warnings; one that could not be copied is a failure, in the color of errors. */
const MESSAGES: Readonly<Record<ShareOutcome, ShareMessageView>> = {
  copied: { text: "Link copied", color: "var(--jsb-muted)", hasCheck: true },
  long: {
    text: "Long link copied: some apps may cut it",
    color: STATE_TEXT.warn,
    hasCheck: false,
  },
  failed: {
    text: "The link could not be copied",
    color: STATE_TEXT.bad,
    hasCheck: false,
  },
};

/**
 * Chooses how the message that follows a share looks.
 * @param outcome How sharing ended.
 * @returns The words of the message, their color, and whether a check comes first.
 */
export function getShareMessage(outcome: ShareOutcome): ShareMessageView {
  return MESSAGES[outcome];
}
