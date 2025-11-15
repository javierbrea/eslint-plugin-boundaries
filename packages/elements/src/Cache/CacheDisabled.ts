import { CacheManager } from "./Cache";
import type { NotUndefined } from "./Cache.types";

/**
 * Disabled cache manager class. Disables caching of values.
 */
export class CacheManagerDisabled<
  CacheKey extends NotUndefined,
  CachedValue,
> extends CacheManager<CacheKey, CachedValue> {
  /**
   * Generates a fake cache key as caching is disabled
   * @param key The cache key to hash
   * @param cacheIsEnabled Whether the cache is enabled or not
   * @returns An empty string
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getKey(_key: CacheKey): string {
    return "";
  }

  /**
   * Does nothing as caching is disabled
   * @param hashedKey The hashed key to retrieve
   * @returns Undefined as caching is disabled
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public get(_hashedKey: string): CachedValue | undefined {
    return undefined;
  }

  /**
   * Does nothing as caching is disabled
   * @param hashedKey The hashed key to store
   * @param value The value to cache
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public set(_hashedKey: string, _value: CachedValue): void {
    return;
  }

  /**
   * Does nothing as caching is disabled
   * @param hashedKey The hashed key to check
   * @returns False as caching is disabled
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public has(_hashedKey: string): boolean {
    return false;
  }
}
