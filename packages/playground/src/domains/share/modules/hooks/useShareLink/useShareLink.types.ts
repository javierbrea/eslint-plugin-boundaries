import type { Sketch } from "@/contract";
import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";

/** Makes the link that opens a sketch, as the store of the host does. */
export type MakeLink = (sketch: Sketch) => Promise<string>;

/** What {@link useShareLink} returns. */
export type ShareLink = {
  /** Copies the link of the sketch on screen to the clipboard, and starts the message that says how it went. It is `undefined` when the host cannot make a link, so that nothing offers to share. */
  readonly share: (() => void) | undefined;
  /** How the last copy ended, for as long as the message stays; `undefined` when there is no message. */
  readonly outcome: ShareOutcome | undefined;
};
