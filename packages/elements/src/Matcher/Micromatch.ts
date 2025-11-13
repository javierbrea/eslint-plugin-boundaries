import micromatch from "micromatch";

import type { GlobalCache } from "../Cache";
import { isArray } from "../Support";

export class Micromatch {
  /**
   * The global cache instance.
   */
  private _globalCache: GlobalCache;

  /**
   * Creates an instance of Micromatch class.
   */
  constructor(globalCache: GlobalCache) {
    this._globalCache = globalCache;
  }

  /**
   * Optimized micromatch match with caching.
   * @param value The value to match.
   * @param pattern The pattern to match against.
   * @returns True if the value matches the pattern, false otherwise.
   */
  public isMatch(value: string, pattern: string | string[]): boolean {
    const cacheKey = `${value}::${isArray(pattern) ? pattern.join("|") : pattern}`;
    const cachedResult =
      this._globalCache.micromatchMatchingResults.get(cacheKey);

    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const isMatch = micromatch.isMatch(value, pattern);
    this._globalCache.micromatchMatchingResults.set(cacheKey, isMatch);
    return isMatch;
  }

  /**
   * Optimized micromatch capture with caching.
   * @param pattern The pattern to match against.
   * @param target The target string to test.
   * @returns Captured groups or null if no match.
   */
  public capture(pattern: string, target: string): string[] | null {
    const cacheKey = `${pattern}|${target}`;

    if (this._globalCache.micromatchCaptures.has(cacheKey)) {
      return this._globalCache.micromatchCaptures.get(cacheKey)!;
    }

    const result = micromatch.capture(pattern, target);
    this._globalCache.micromatchCaptures.set(cacheKey, result);
    return result;
  }

  /**
   * Optimized micromatch makeRe with caching.
   * @param pattern The pattern to convert to RegExp.
   * @returns The RegExp instance.
   */
  public makeRe(pattern: string): RegExp {
    const cachedRegexp = this._globalCache.micromatchPathRegexps.get(pattern);

    if (cachedRegexp) {
      return cachedRegexp;
    }

    const regexp = micromatch.makeRe(pattern);
    this._globalCache.micromatchPathRegexps.set(pattern, regexp);
    return regexp;
  }
}
