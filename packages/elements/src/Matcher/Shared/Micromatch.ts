import picomatch from "picomatch";

import { CacheManager, CacheManagerDisabled } from "../../Cache";
import { isArray, isWindows } from "../../Shared";

import type { MicromatchSerializedCache } from "./Micromatch.types";

/**
 * Cache key type for micromatch matching results
 */
type MatchingResultsCacheKey = {
  value: string;
  pattern: string | string[];
};

/**
 * Cache for micromatch matching results
 */
class MatchingResultsCache extends CacheManager<
  MatchingResultsCacheKey,
  boolean
> {
  /**
   * Generates a unique cache key based on the value and pattern
   * @param param0 The cache key components
   * @param param0.value The value to match.
   * @param param0.pattern The pattern, or patterns, to match the value against.
   * @returns The generated cache key
   */
  protected generateKey({ value, pattern }: MatchingResultsCacheKey): string {
    return `${value}::${isArray(pattern) ? pattern.join("|") : pattern}`;
  }
}

/**
 * Cache key type for micromatch captured values
 */
type CapturedValueCacheKey = {
  pattern: string;
  target: string;
};

/**
 * Cache for micromatch captured values
 */
class CapturedValueCache extends CacheManager<
  CapturedValueCacheKey,
  string[] | null
> {
  /**
   * Generates a unique cache key based on the pattern and target
   * @param param0 The cache key components
   * @param param0.pattern The pattern to capture the values with.
   * @param param0.target The string to capture the values from.
   * @returns The generated cache key
   */
  protected generateKey({ pattern, target }: CapturedValueCacheKey): string {
    return `${pattern}|${target}`;
  }
}

/**
 * Glob matching and capture wrapper with caching, backed by picomatch.
 * The static methods of picomatch do not detect Windows, so every call passes the `windows` option.
 */

export class Micromatch {
  /**
   * Cache for micromatch matching results
   */
  private readonly _matchingResultsCache:
    | MatchingResultsCache
    | CacheManagerDisabled<MatchingResultsCacheKey, boolean>;

  /**
   * Cache for micromatch captures
   */
  private readonly _capturesCache:
    | CapturedValueCache
    | CacheManagerDisabled<CapturedValueCacheKey, string[] | null> =
    new CacheManagerDisabled<CapturedValueCacheKey, string[] | null>();

  /**
   * Cache for micromatch makeRe results, keyed by pattern.
   * It is not governed by the cache option: a compiled pattern depends only on the pattern text, so it can be neither stale nor mismatched. The option only disables the caches of results.
   */
  private readonly _makeReCache = new CacheManager<string, RegExp>();

  /**
   * Cache for the regular expressions used by capture, keyed by pattern. Not governed by the cache option either, for the same reason as `_makeReCache`.
   */
  private readonly _captureReCache = new CacheManager<string, RegExp>();

  /**
   * Whether the code runs on Windows. The platform can not change during a process, so it is read once, and the compiled patterns and the normalized inputs always use the same value.
   */
  private readonly _windows = isWindows();

  /**
   * Creates an instance of Micromatch class.
   * @param cache Whether to cache the matching results and captures or not.
   */
  constructor(cache: boolean) {
    this._matchingResultsCache = cache
      ? new MatchingResultsCache()
      : new CacheManagerDisabled<MatchingResultsCacheKey, boolean>();
    this._capturesCache = cache
      ? new CapturedValueCache()
      : new CacheManagerDisabled<CapturedValueCacheKey, string[] | null>();
  }

  /**
   * Clears all caches.
   */
  public clearCache(): void {
    this._matchingResultsCache.clear();
    this._capturesCache.clear();
    this._makeReCache.clear();
    this._captureReCache.clear();
  }

  /**
   * Serializes the current cache state.
   * @returns The serialized cache data.
   */
  public serializeCache(): MicromatchSerializedCache {
    return {
      matchingResults: this._matchingResultsCache.serialize(),
      captures: this._capturesCache.serialize(),
    };
  }

  /**
   * Restores the cache state from serialized data.
   * @param serializedCache The serialized cache data.
   */
  public setFromSerialized(serializedCache: MicromatchSerializedCache): void {
    this._matchingResultsCache.setFromSerialized(
      serializedCache.matchingResults
    );
    this._capturesCache.setFromSerialized(serializedCache.captures);
  }

  /**
   * Optimized micromatch match with caching.
   * @param value The value to match.
   * @param pattern The pattern to match against.
   * @returns True if the value matches the pattern, false otherwise.
   */
  public isMatch(value: string, pattern: string | string[]): boolean {
    const cacheKey = this._matchingResultsCache.getKey({
      value,
      pattern,
    });

    if (this._matchingResultsCache.has(cacheKey)) {
      return this._matchingResultsCache.get(cacheKey)!;
    }

    const isMatch = picomatch.isMatch(value, pattern, {
      windows: this._windows,
    });
    this._matchingResultsCache.set(cacheKey, isMatch);
    return isMatch;
  }

  /**
   * Optimized micromatch capture with caching.
   * @param pattern The pattern to match against.
   * @param target The target string to test.
   * @returns Captured groups or null if no match.
   */
  public capture(pattern: string, target: string): string[] | null {
    const cacheKey = this._capturesCache.getKey({ pattern, target });

    if (this._capturesCache.has(cacheKey)) {
      return this._capturesCache.get(cacheKey)!;
    }

    // Compiling the pattern is expensive, and the captures cache misses on every new target, so the compiled pattern is cached separately
    const regexp =
      this._captureReCache.get(pattern) ??
      picomatch.makeRe(pattern, { capture: true, windows: this._windows });
    this._captureReCache.set(pattern, regexp);
    // Normalize Windows separators like micromatch does, keeping the backslashes that escape glob characters.
    const input = this._windows
      ? target.replace(picomatch.constants.REGEX_BACKSLASH, "/")
      : target;
    const match = regexp.exec(input);
    const result = match
      ? match.slice(1).map((value) => (value === undefined ? "" : value))
      : null;
    this._capturesCache.set(cacheKey, result);
    return result;
  }

  /**
   * Optimized micromatch makeRe with caching.
   * @param pattern The pattern to convert to RegExp.
   * @returns The RegExp instance.
   */
  public makeRe(pattern: string): RegExp {
    if (this._makeReCache.has(pattern)) {
      return this._makeReCache.get(pattern)!;
    }
    const regexp = picomatch.makeRe(pattern, { windows: this._windows });
    this._makeReCache.set(pattern, regexp);
    return regexp;
  }
}
