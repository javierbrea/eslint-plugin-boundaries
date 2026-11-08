import { isLongLink } from "@/domains/share/helpers/sketchHash";

import type { ShareOutcome } from "./shareOutcome.types";

/**
 * Tells how sharing ended once the link is on the clipboard.
 * @param link The link that was copied.
 * @returns `long` when some apps may cut the link when it is pasted (see `isLongLink`), and `copied` otherwise.
 */
export function getCopiedOutcome(link: string): ShareOutcome {
  return isLongLink(link) ? "long" : "copied";
}
