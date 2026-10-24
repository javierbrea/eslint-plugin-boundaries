import { useEffect, useState } from "react";

/** A stat that starts at its fallback and switches to the live value once fetched. */
export type LiveStat = {
  /** The live value when available, otherwise the fallback. */
  value: number;
  /** Whether `value` comes from the API (or its cache) rather than the fallback. */
  isLive: boolean;
};

/**
 * Renders the fallback first, so the server and the first client render match, and fetches the live value after mount.
 * @param fetcher Resolves the live value, or `undefined` on failure.
 * @param fallback Value shown until the live one arrives, and kept when it fails.
 * @returns The current value of the stat.
 */
export function useLiveStat(
  fetcher: () => Promise<number | undefined>,
  fallback: number
): LiveStat {
  const [stat, setStat] = useState<LiveStat>({
    value: fallback,
    isLive: false,
  });

  useEffect(() => {
    let isMounted = true;
    fetcher().then((value) => {
      if (isMounted && value !== undefined) {
        setStat({ value, isLive: true });
      }
    });
    return () => {
      isMounted = false;
    };
    // The fetcher is called once per mount; callers pass inline functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return stat;
}
