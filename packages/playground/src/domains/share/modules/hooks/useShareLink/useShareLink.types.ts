import type { Sketch } from "@/contract";
import type { ShareNotice } from "@/domains/share/helpers/shareOutcome";

/** Makes the link that opens a sketch, as the store of the host does. */
export type MakeLink = (sketch: Sketch) => Promise<string>;

/** What {@link useShareLink} returns. */
export type ShareLink = {
  /** Copies the link of the sketch on screen to the clipboard, and says how it went. It is `undefined` when the host cannot make a link, so that nothing offers to share. */
  readonly share: (() => void) | undefined;
  /** Whether the link of the last share was copied with nothing more to say, for as long as Share says so. */
  readonly isCopied: boolean;
  /** What the last share has to tell the user about, which a dialog shows; `undefined` until a share needs one. It stays after the dialog closes, so that the dialog does not change while it fades out. */
  readonly notice: ShareNotice | undefined;
  /** Whether the dialog of the notice is open. */
  readonly isNoticeOpen: boolean;
  /** Closes the dialog of the notice. */
  readonly closeNotice: () => void;
  /** Copies a link to the clipboard again, such as the link of a notice that could not copy it, and tells whether it was copied. */
  readonly copyAgain: (link: string) => Promise<boolean>;
  /** Whether the last copy of {@link ShareLink.copyAgain} worked, for as long as its button says so. */
  readonly isCopiedAgain: boolean;
};
