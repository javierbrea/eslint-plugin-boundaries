import type { Sketch } from "@/contract";
import {
  MAX_SKETCH_DEPENDENCIES,
  MAX_SKETCH_NODES,
} from "@/domains/project/helpers/sketch";
import {
  decodeHash,
  encodeSketch,
  isLongLink,
  LONG_LINK_LENGTH,
  MAX_SKETCH_JSON_BYTES,
} from "@/domains/share/helpers/sketchHash";
import type { LinkLimit } from "@/domains/share/helpers/sketchHash";

import type { ShareOutcome, ShareRefusal } from "./shareOutcome.types";

/** The most that a link can hold of each limit. */
const LINK_LIMITS: Readonly<Record<LinkLimit, number>> = {
  nodes: MAX_SKETCH_NODES,
  dependencies: MAX_SKETCH_DEPENDENCIES,
  bytes: MAX_SKETCH_JSON_BYTES,
};

/**
 * Tells how sharing ended once the link is on the clipboard.
 * @param link The link that was copied.
 * @returns `long`, with the length of the link and the length above which a link is long, when some apps may cut the link when it is pasted (see `isLongLink`), and `copied` otherwise.
 */
export function getCopiedOutcome(link: string): ShareOutcome {
  return isLongLink(link)
    ? { kind: "long", length: link.length, maxLength: LONG_LINK_LENGTH }
    : { kind: "copied" };
}

/**
 * Tells whether a sketch cannot be shared, before any link is made. A link is useful only if it opens the sketch, and the reader of links refuses what the edits and text mode do not (a sketch with more files, folders or dependencies than a link can hold, or whose JSON is larger than it can hold). So the sketch is written as a link and read back with that reader, which cannot differ from what opening the link does. It takes time in proportion to the size of the sketch, about 100 ms for the largest that a link can hold.
 * @param sketch The sketch to share.
 * @returns Why the link would not open the sketch, or `undefined` when it would: the limit that the sketch passes and the most that a link can hold of it, or the reason of the reader.
 */
export function getRefusedOutcome(sketch: Sketch): ShareRefusal | undefined {
  const reading = decodeHash(encodeSketch(sketch));

  if (reading.status !== "error") {
    return undefined;
  }
  return reading.tooLarge === undefined
    ? { kind: "invalid", reason: reading.error }
    : {
        kind: "too-large",
        limit: reading.tooLarge,
        max: LINK_LIMITS[reading.tooLarge],
      };
}
