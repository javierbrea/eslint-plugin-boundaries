import type { Sketch } from "@/contract";
import {
  decodeHash,
  encodeSketch,
  isLongLink,
} from "@/domains/share/helpers/sketchHash";

import type { ShareOutcome, ShareRefusal } from "./shareOutcome.types";

/**
 * Tells how sharing ended once the link is on the clipboard.
 * @param link The link that was copied.
 * @returns `long` when some apps may cut the link when it is pasted (see `isLongLink`), and `copied` otherwise.
 */
export function getCopiedOutcome(link: string): ShareOutcome {
  return isLongLink(link) ? "long" : "copied";
}

/**
 * Tells whether a sketch cannot be shared, before any link is made. A link is useful only if it opens the sketch, and the reader of links refuses what the edits and text mode do not (a sketch with more files, folders or dependencies than a link can hold, or whose JSON is larger than it can hold). So the sketch is written as a link and read back with that reader, which cannot differ from what opening the link does. It takes time in proportion to the size of the sketch, about 100 ms for the largest that a link can hold.
 * @param sketch The sketch to share.
 * @returns Why the link would not open the sketch, or `undefined` when it would.
 */
export function getRefusedOutcome(sketch: Sketch): ShareRefusal | undefined {
  const reading = decodeHash(encodeSketch(sketch));

  return reading.status === "error"
    ? {
        kind: reading.tooLarge === true ? "too-large" : "invalid",
        reason: reading.error,
      }
    : undefined;
}
