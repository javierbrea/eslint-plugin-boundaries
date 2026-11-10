import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Sketch } from "@/contract";
import { useSessionStore } from "@/domains/session/data/store";
import {
  getCopiedOutcome,
  getRefusedOutcome,
} from "@/domains/share/helpers/shareOutcome";
import type {
  ShareNotice,
  ShareOutcome,
} from "@/domains/share/helpers/shareOutcome";

import { SHARE_COPIED_DURATION } from "./useShareLink.constants";
import type { MakeLink, ShareLink } from "./useShareLink.types";

/**
 * Shares a sketch: checks that a link would open it, asks the host for that link and copies it to the clipboard.
 * @param makeLink Makes the link that opens a sketch.
 * @param sketch The sketch to share.
 * @param isLatest Tells whether this share is still the latest one, which it asks once the link is made.
 * @returns How it ended, or `undefined` when a newer share started while the link was made: then nothing is copied, so that the clipboard never ends with the link of an older sketch. A link that could not be made and a link that could not be copied are told apart, so that the user gets the link to copy by hand when there is one.
 */
async function shareSketch(
  makeLink: MakeLink,
  sketch: Sketch,
  isLatest: () => boolean
): Promise<ShareOutcome | undefined> {
  let link: string;

  try {
    const refusal = getRefusedOutcome(sketch);

    if (refusal !== undefined) {
      return refusal;
    }
    link = await makeLink(sketch);
  } catch {
    // The sketch could not be checked, or the store could not make the link: there is no link to give
    return { kind: "not-made" };
  }
  if (!isLatest()) {
    return undefined;
  }
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    // The browser refused the clipboard, or has none
    return { kind: "not-copied", link };
  }
  return getCopiedOutcome(link);
}

/**
 * Shares the sketch on screen and keeps how it went: a link that was copied with nothing more to say is a confirmation that lasts a few seconds, and any other outcome is a notice that stays until the user closes it. A sketch that no link could open is not shared: the host is not asked for a link, nothing is copied, and the notice says why. Each share starts over, so a confirmation or a copy from an earlier click never outlives the next one, an earlier click whose link comes after a newer click copies nothing, and nothing is left running once the instance is gone.
 * @param makeLink Makes the link that opens a sketch, which the store of the host gives. Without it nothing can be shared.
 * @returns The action that shares, which is `undefined` when there is nothing to share with, the confirmation, the notice and its dialog, and the action that copies the link of a notice again with its confirmation.
 */
export function useShareLink(makeLink: MakeLink | undefined): ShareLink {
  const store = useSessionStore();
  const [isCopied, setIsCopied] = useState(false);
  const [notice, setNotice] = useState<ShareNotice | undefined>(undefined);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isCopiedAgain, setIsCopiedAgain] = useState(false);
  // The number of the latest share. A copy that ends after a newer share, or after the instance is gone, finds another number and changes nothing
  const attemptRef = useRef(0);
  const copiedTimerRef = useRef<number | undefined>(undefined);
  const copiedAgainTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      attemptRef.current += 1;
      window.clearTimeout(copiedTimerRef.current);
      window.clearTimeout(copiedAgainTimerRef.current);
    },
    []
  );

  const copyLink = useCallback(
    async (link: MakeLink) => {
      attemptRef.current += 1;

      const attempt = attemptRef.current;

      window.clearTimeout(copiedTimerRef.current);
      window.clearTimeout(copiedAgainTimerRef.current);
      setIsCopied(false);
      setIsCopiedAgain(false);

      const outcome = await shareSketch(
        link,
        store.getState().sketch,
        () => attempt === attemptRef.current
      );

      if (outcome === undefined || attempt !== attemptRef.current) {
        return;
      }
      if (outcome.kind === "copied") {
        setIsCopied(true);
        copiedTimerRef.current = window.setTimeout(
          () => setIsCopied(false),
          SHARE_COPIED_DURATION
        );
      } else {
        setNotice(outcome);
        setIsNoticeOpen(true);
      }
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

  const closeNotice = useCallback(() => setIsNoticeOpen(false), []);

  const copyAgain = useCallback(async (link: string) => {
    const attempt = attemptRef.current;

    window.clearTimeout(copiedAgainTimerRef.current);
    setIsCopiedAgain(false);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      return false;
    }
    // A share that started meanwhile, or an instance that is gone, has nothing to confirm
    if (attempt === attemptRef.current) {
      window.clearTimeout(copiedAgainTimerRef.current);
      setIsCopiedAgain(true);
      copiedAgainTimerRef.current = window.setTimeout(
        () => setIsCopiedAgain(false),
        SHARE_COPIED_DURATION
      );
    }
    return true;
  }, []);

  return {
    share,
    isCopied,
    notice,
    isNoticeOpen,
    closeNotice,
    copyAgain,
    isCopiedAgain,
  };
}
