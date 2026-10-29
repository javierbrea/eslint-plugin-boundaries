type CachedStat = {
  value: number;
  timestamp: number;
};

// The public GitHub and npm APIs are rate-limited per IP, so a successful value is reused for a day
const TTL = 24 * 60 * 60 * 1000;

function isCachedStat(entry: unknown): entry is CachedStat {
  return (
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as CachedStat).value === "number" &&
    typeof (entry as CachedStat).timestamp === "number"
  );
}

/**
 * Reads a stat cached by a previous visit, if it is still fresh.
 * @param key Storage key of the stat.
 * @returns The cached value, or `undefined` when there is none, it expired or storage is not available.
 */
export function readCachedStat(key: string): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return undefined;
    }
    const entry: unknown = JSON.parse(raw);
    if (!isCachedStat(entry) || Date.now() - entry.timestamp >= TTL) {
      return undefined;
    }
    return entry.value;
  } catch {
    return undefined;
  }
}

/**
 * Caches a successfully fetched stat. Failures must never be cached, so that the next visit retries.
 * @param key Storage key of the stat.
 * @param value The fetched value.
 */
export function writeCachedStat(key: string, value: number): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const entry: CachedStat = { value, timestamp: Date.now() };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage may be full or blocked; the stat is fetched again on the next visit
  }
}
