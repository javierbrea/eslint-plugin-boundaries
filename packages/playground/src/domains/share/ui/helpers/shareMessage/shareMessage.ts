import type {
  ShareOutcome,
  ShareRefusal,
} from "@/domains/share/helpers/shareOutcome";
import { STATE_TEXT } from "@/ui-kit/helpers/tone";

import type { ShareMessageView } from "./shareMessage.types";

/** What the message says and how it looks for each outcome that is a plain word. A link that was copied is plain news, in the muted color after a check; one that is long asks something of the user, in the color of warnings; one that could not be copied is a failure, in the color of errors. */
const MESSAGES: Readonly<
  Record<Extract<ShareOutcome, string>, ShareMessageView>
> = {
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

/** How the message of a sketch that is not shared starts, for each kind of refusal. It is followed by a colon and the reason, as the message of a sketch that could not be loaded is. */
const REFUSAL_LEADS: Readonly<Record<ShareRefusal["kind"], string>> = {
  "too-large": "The sketch is too large for a link",
  invalid: "The sketch cannot be shared",
};

/**
 * Chooses how the message that follows a share looks. A sketch that is not shared is a failure too, in the color of errors, and says why.
 * @param outcome How sharing ended.
 * @returns The words of the message, their color, and whether a check comes first.
 */
export function getShareMessage(outcome: ShareOutcome): ShareMessageView {
  return typeof outcome === "string"
    ? MESSAGES[outcome]
    : {
        text: `${REFUSAL_LEADS[outcome.kind]}: ${outcome.reason}`,
        color: STATE_TEXT.bad,
        hasCheck: false,
      };
}
