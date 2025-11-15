import micromatch from "micromatch";

import { CacheManager, CacheManagerDisabled } from "../Cache";
import { isArray } from "../Support";

import type { MicromatchSerializedCache } from "./Matcher.types";

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
   * @returns The generated cache key
   */
  protected generateKey({ pattern, target }: CapturedValueCacheKey): string {
    return `${pattern}|${target}`;
  }
}

/**
 * Micromatch wrapper class with caching capabilities.
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
   * Cache for micromatch makeRe results
   */
  private readonly _makeReCache: CacheManagerDisabled<string, RegExp> =
    new CacheManagerDisabled<string, RegExp>();

  /**
   * Creates an instance of Micromatch class.
   * @param cache Whether to use caching or not.
   */
  constructor(cache: boolean) {
    this._matchingResultsCache = cache
      ? new MatchingResultsCache()
      : new CacheManagerDisabled<MatchingResultsCacheKey, boolean>();
    this._capturesCache = cache
      ? new CapturedValueCache()
      : new CacheManagerDisabled<CapturedValueCacheKey, string[] | null>();
    this._makeReCache = cache
      ? new CacheManager<string, RegExp>()
      : new CacheManagerDisabled<string, RegExp>();
  }

  /**
   * Clears all caches.
   */
  public clearCache(): void {
    this._matchingResultsCache.clear();
    this._capturesCache.clear();
    this._makeReCache.clear();
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

    const isMatch = micromatch.isMatch(value, pattern);
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

    const result = micromatch.capture(pattern, target);
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
    const regexp = micromatch.makeRe(pattern);
    this._makeReCache.set(pattern, regexp);
    return regexp;
  }
}
