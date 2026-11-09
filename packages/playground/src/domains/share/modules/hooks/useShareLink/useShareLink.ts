import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSessionStore } from "@/domains/session/data/store";
import {
  getCopiedOutcome,
  getRefusedOutcome,
} from "@/domains/share/helpers/shareOutcome";
import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";

import {
  SHARE_COPIED_DURATION,
  SHARE_FAILED_DURATION,
  SHARE_LONG_DURATION,
  SHARE_REFUSED_DURATION,
} from "./useShareLink.constants";
import type { MakeLink, ShareLink } from "./useShareLink.types";

/** How long the message of each outcome that is a plain word stays. */
const MESSAGE_DURATIONS: Readonly<
  Record<Extract<ShareOutcome, string>, number>
> = {
  copied: SHARE_COPIED_DURATION,
  long: SHARE_LONG_DURATION,
  failed: SHARE_FAILED_DURATION,
};

/**
 * Tells how long the message of an outcome stays.
 * @param outcome How sharing ended.
 * @returns The time in milliseconds.
 */
function getMessageDuration(outcome: ShareOutcome): number {
  return typeof outcome === "string"
    ? MESSAGE_DURATIONS[outcome]
    : SHARE_REFUSED_DURATION;
}

/**
 * Shares the sketch on screen: checks that a link would open it, asks the host for that link, copies it to the clipboard, and keeps how it went for a few seconds. A sketch that no link could open is not shared: the host is not asked for a link, nothing is copied, and the outcome says why. Each click starts over, so a message from an earlier click never outlives the next one, and nothing is left running once the instance is gone.
 * @param makeLink Makes the link that opens a sketch, which the store of the host gives. Without it nothing can be shared.
 * @returns The action that shares, which is `undefined` when there is nothing to share with, and the outcome that the message shows.
 */
export function useShareLink(makeLink: MakeLink | undefined): ShareLink {
  const store = useSessionStore();
  const [outcome, setOutcome] = useState<ShareOutcome | undefined>(undefined);
  // The number of the latest click. A copy that ends after a newer click, or after the instance is gone, finds another number and shows nothing
  const attemptRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      attemptRef.current += 1;
      window.clearTimeout(timerRef.current);
    },
    []
  );

  const copyLink = useCallback(
    async (link: MakeLink) => {
      attemptRef.current += 1;

      const attempt = attemptRef.current;
      let result: ShareOutcome;

      window.clearTimeout(timerRef.current);
      setOutcome(undefined);
      try {
        const { sketch } = store.getState();
        const refusal = getRefusedOutcome(sketch);

        if (refusal === undefined) {
          const url = await link(sketch);

          await navigator.clipboard.writeText(url);
          result = getCopiedOutcome(url);
        } else {
          result = refusal;
        }
      } catch {
        // The sketch could not be checked, the store could not make the link, or the browser refused the clipboard: either way the user has no link
        result = "failed";
      }
      if (attempt !== attemptRef.current) {
        return;
      }
      setOutcome(result);
      timerRef.current = window.setTimeout(
        () => setOutcome(undefined),
        getMessageDuration(result)
      );
    },
    [store]
  );

  const share = useMemo(
    () =>
      makeLink === undefined
        ? undefined
        : () => {
            void copyLink(makeLink);
          },
    [makeLink, copyLink]
  );

  return { share, outcome };
}
