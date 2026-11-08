import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSessionStore } from "@/domains/session/data/store";
import { getCopiedOutcome } from "@/domains/share/helpers/shareOutcome";
import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";

import {
  SHARE_COPIED_DURATION,
  SHARE_FAILED_DURATION,
  SHARE_LONG_DURATION,
} from "./useShareLink.constants";
import type { MakeLink, ShareLink } from "./useShareLink.types";

/** How long the message of each outcome stays. */
const MESSAGE_DURATIONS: Readonly<Record<ShareOutcome, number>> = {
  copied: SHARE_COPIED_DURATION,
  long: SHARE_LONG_DURATION,
  failed: SHARE_FAILED_DURATION,
};

/**
 * Shares the sketch on screen: asks the host for the link that opens it, copies it to the clipboard, and keeps how it went for a few seconds. Each click starts over, so a message from an earlier click never outlives the next one, and nothing is left running once the instance is gone.
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
        const url = await link(store.getState().sketch);

        await navigator.clipboard.writeText(url);
        result = getCopiedOutcome(url);
      } catch {
        // The store could not make the link, or the browser refused the clipboard: either way the user has no link
        result = "failed";
      }
      if (attempt !== attemptRef.current) {
        return;
      }
      setOutcome(result);
      timerRef.current = window.setTimeout(
        () => setOutcome(undefined),
        MESSAGE_DURATIONS[result]
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
