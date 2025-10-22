import type { NotUndefined } from "object-hash";
import objectHash from "object-hash";

/**
 * Generic cache manager class. Enables caching of values based on complex keys.
 */
export class CacheManager<CacheKey extends NotUndefined, CachedValue> {
  /**
   * Internal cache map
   */
  private _cache: Map<string, CachedValue>;

  /**
   * Creates a new CacheManager instance
   */
  constructor() {
    this._cache = new Map<string, CachedValue>();
  }

  /**
   * Generates a hashed key for the given cache key
   * @param key The cache key to hash
   * @returns The hashed key as a string
   */
  private _getHashedKey(key: CacheKey): string {
    return objectHash(key);
  }

  /**
   * Retrieves a value from the cache based on the given key
   * @param key The cache key to retrieve
   * @returns The cached value or undefined if not found
   */
  public get(key: CacheKey): CachedValue | undefined {
    const hashedKey = this._getHashedKey(key);
    return this._cache.get(hashedKey);
  }

  /**
   * Stores a value in the cache
   * @param key The cache key to store
   * @param value The value to cache
   */
  public set(key: CacheKey, value: CachedValue): void {
    const hashedKey = this._getHashedKey(key);
    this._cache.set(hashedKey, value);
  }

  /**
   * Restores a value in the cache from a given already hashed key
   * @param key The hashed key to restore
   * @param value The value to restore
   */
  public restore(key: string, value: CachedValue): void {
    this._cache.set(key, value);
  }

  /**
   * Checks if a value exists in the cache
   * @param key The cache key to check
   * @returns True if the value exists, false otherwise
   */
  public has(key: CacheKey): boolean {
    const hashedKey = this._getHashedKey(key);
    return this._cache.has(hashedKey);
  }

  /**
   * Gets the number of items in the cache
   * @returns The size of the cache
   */
  public get size(): number {
    return this._cache.size;
  }

  /**
   * Retrieves all cached values
   * @returns A map of all cached values
   */
  public getAll(): Map<string, CachedValue> {
    return this._cache;
  }

  /**
   * Sets multiple values in the cache
   * @param cache A map of cache keys and their corresponding values
   */
  public setAll(cache: Map<string, CachedValue>): void {
    this._cache = cache;
  }

  /**
   * Clears the entire cache
   */
  public clear(): void {
    this._cache.clear();
  }
}
