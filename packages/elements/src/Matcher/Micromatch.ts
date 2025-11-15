import micromatch from "micromatch";

import { CacheManager, CacheManagerDisabled } from "../Cache";
import { isArray } from "../Support";

export class Micromatch {
  /**
   * Cache for micromatch matching results
   */
  private _matchingResultsCache:
    | CacheManager<string, boolean>
    | CacheManagerDisabled<string, boolean>;

  /**
   * Cache for micromatch captures
   */
  private _capturesCache: CacheManagerDisabled<string, string[] | null> =
    new CacheManagerDisabled<string, string[] | null>();

  /**
   * Cache for micromatch makeRe results
   */
  private _makeReCache: CacheManagerDisabled<string, RegExp> =
    new CacheManagerDisabled<string, RegExp>();

  /**
   * Creates an instance of Micromatch class.
   * @param cache Whether to use caching or not.
   */
  constructor(cache: boolean) {
    this._matchingResultsCache = cache
      ? new CacheManager<string, boolean>()
      : new CacheManagerDisabled<string, boolean>();
    this._capturesCache = cache
      ? new CacheManager<string, string[] | null>()
      : new CacheManagerDisabled<string, string[] | null>();
    this._makeReCache = cache
      ? new CacheManager<string, RegExp>()
      : new CacheManagerDisabled<string, RegExp>();
  }

  /**
   * Optimized micromatch match with caching.
   * @param value The value to match.
   * @param pattern The pattern to match against.
   * @returns True if the value matches the pattern, false otherwise.
   */
  public isMatch(value: string, pattern: string | string[]): boolean {
    const cacheKey = this._matchingResultsCache.getKey(
      `${value}::${isArray(pattern) ? pattern.join("|") : pattern}`
    );

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
    const cacheKey = this._capturesCache.getKey(`${pattern}|${target}`);

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
    const cacheKey = this._makeReCache.getKey(pattern);
    if (this._makeReCache.has(cacheKey)) {
      return this._makeReCache.get(cacheKey)!;
    }
    const regexp = micromatch.makeRe(pattern);
    this._makeReCache.set(cacheKey, regexp);
    return regexp;
  }
}
