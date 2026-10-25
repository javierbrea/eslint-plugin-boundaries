import { readCachedStat, writeCachedStat } from "./statsCache";

// One request per stat and page load: every component asking for the same stat shares the promise
const inFlight = new Map<string, Promise<number | undefined>>();

function fetchStat(
  key: string,
  url: string,
  headers: Record<string, string>,
  pick: (body: unknown) => unknown
): Promise<number | undefined> {
  const cached = readCachedStat(key);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }
  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }
  const request = fetch(url, { headers })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then((body: unknown) => {
      const value = pick(body);
      if (typeof value !== "number") {
        throw new Error("Unexpected response shape");
      }
      writeCachedStat(key, value);
      return value;
    })
    .catch(() => {
      // Let a later mount retry; failures are never cached
      inFlight.delete(key);
      return undefined;
    });
  inFlight.set(key, request);
  return request;
}

function readProperty(body: unknown, property: string): unknown {
  return typeof body === "object" && body !== null
    ? (body as Record<string, unknown>)[property]
    : undefined;
}

/**
 * Fetches the GitHub stars of a repository, from the cache when fresh.
 * @param repo Repository as `owner/name`.
 * @returns The number of stars, or `undefined` on any failure.
 */
export function fetchGithubStars(repo: string): Promise<number | undefined> {
  return fetchStat(
    `github-stars:${repo}`,
    `https://api.github.com/repos/${repo}`,
    { Accept: "application/vnd.github+json" },
    (body) => readProperty(body, "stargazers_count")
  );
}

/**
 * Fetches the npm downloads of a package in the last month, from the cache when fresh.
 * @param pkg Package name.
 * @returns The number of downloads, or `undefined` on any failure.
 */
export function fetchNpmMonthlyDownloads(
  pkg: string
): Promise<number | undefined> {
  return fetchStat(
    `npm-downloads:${pkg}`,
    `https://api.npmjs.org/downloads/point/last-month/${pkg}`,
    { Accept: "application/json" },
    (body) => readProperty(body, "downloads")
  );
}
