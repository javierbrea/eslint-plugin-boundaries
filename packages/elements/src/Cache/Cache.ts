import { isString } from "../Support";

import type { NotUndefined } from "./Cache.types";

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
   * Generates a string key from the given cache key. Has to be implemented for non-string keys.
   * @param key The cache key to generate from
   * @returns The generated string key
   */
  protected generateKey(key: CacheKey): string {
    if (isString(key)) {
      return key;
    }
    const errorMessage =
      "Cache key generation for non-string keys is not implemented because it causes performance issues: " +
      JSON.stringify(key);
    throw new Error(errorMessage);
  }

  /**
   * Generates a hashed key for the given cache key
   * @param key The cache key to hash
   * @returns The hashed key as a string
   */
  public getKey(key: CacheKey): string {
    return this.generateKey(key);
  }

  /**
   * Retrieves a value from the cache based on the given hashed key
   * @param hashedKey The hashed key to retrieve
   * @returns The cached value or undefined if not found
   */
  public get(hashedKey: string): CachedValue | undefined {
    return this._cache.get(hashedKey);
  }

  /**
   * Stores a value in the cache with a given hashed key
   * @param hashedKey The hashed key to store
   * @param value The value to cache
   */
  public set(hashedKey: string, value: CachedValue): void {
    this._cache.set(hashedKey, value);
  }

  /**
   * Checks if a value exists in the cache based on the given hashed key
   * @param hashedKey The hashed key to check
   * @returns True if the value exists, false otherwise
   */
  public has(hashedKey: string): boolean {
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
      this.set(key, serializedCache[key]);
    }
  }
}
