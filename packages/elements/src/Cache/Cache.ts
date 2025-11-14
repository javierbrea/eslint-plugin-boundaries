import { isNull, isString } from "../Support";

import type { NotUndefined } from "./Cache.types";

function stringifyObject(value: unknown): string {
  if (isString(value)) {
    return value;
  }
  // NOTE: Using JSON.stringify for efficiency. Other mechanisms (like hashing with node-object-hash) were tested but had worse performance.
  // Object keys are not ordered for performance reasons. It is better to skip some edge cases that are unlikely to happen in cache keys than to pay the cost of ordering keys.
  return JSON.stringify(value);
}

/**
 * Generic cache manager class. Enables caching of values based on complex keys.
 */
export class CacheManager<CacheKey extends NotUndefined, CachedValue> {
  /**
   * Internal cache map
   */
  private readonly _cache: Map<string, CachedValue>;

  /**
   * Creates a new CacheManager instance
   */
  constructor() {
    this._cache = new Map<string, CachedValue>();
  }

  /**
   * Generates a hashed key for the given cache key
   * @param key The cache key to hash
   * @param cacheIsEnabled Whether the cache is enabled or not
   * @returns The hashed key as a string, or null if cache is disabled
   */
  public getKey<T extends boolean | undefined = undefined>(
    key: CacheKey,
    cacheIsEnabled?: T
  ): T extends false ? null : string {
    if (cacheIsEnabled === false) {
      return null as T extends false ? null : string;
    }
    return stringifyObject(key) as T extends false ? null : string;
  }

  /**
   * Retrieves a value from the cache based on the given hashed key
   * @param hashedKey The hashed key to retrieve. If null, no value will be returned
   * @returns The cached value or undefined if not found
   */
  public get(hashedKey: string | null): CachedValue | undefined {
    if (isNull(hashedKey)) {
      return;
    }
    return this._cache.get(hashedKey);
  }

  /**
   * Stores a value in the cache with a given hashed key
   * @param hashedKey The hashed key to store, or null. If null, item won't be stored
   * @param value The value to cache
   */
  public set(hashedKey: string | null, value: CachedValue): void {
    if (isNull(hashedKey)) {
      return;
    }
    this._cache.set(hashedKey, value);
  }

  /**
   * Restores a value in the cache from a given already hashed key
   * @param key The hashed key to restore
   * @param value The value to restore
   */
  public restore(hashedKey: string, value: CachedValue): void {
    this._cache.set(hashedKey, value);
  }

  /**
   * Checks if a value exists in the cache based on the given hashed key
   * @param hashedKey The hashed key to check. If null, it will always return false
   * @returns True if the value exists, false otherwise
   */
  public has(hashedKey: string | null): boolean {
    if (isNull(hashedKey)) {
      return false;
    }
    return this._cache.has(hashedKey);
  }

  /**
   * Retrieves all cached values
   * @returns A map of all cached values
   */
  public getAll(): Map<string, CachedValue> {
    return this._cache;
  }

  /**
   * Clears the entire cache
   */
  public clear(): void {
    this._cache.clear();
  }

  /**
   * Serializes the  cache to a plain object.
   * @returns The serialized cache.
   */
  public serialize(): Record<string, CachedValue> {
    return Array.from(this.getAll().entries()).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, CachedValue>
    );
  }

  /**
   * Sets the cache from a serialized object.
   * @param serializedCache The serialized cache.
   */
  public setFromSerialized(serializedCache: Record<string, CachedValue>): void {
    for (const key in serializedCache) {
      this.restore(key, serializedCache[key]);
    }
  }
}
