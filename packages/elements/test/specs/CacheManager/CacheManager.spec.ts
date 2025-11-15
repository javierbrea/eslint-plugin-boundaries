import { CacheManager, CacheManagerDisabled } from "../../../src/Cache";

describe("CacheManager", () => {
  let cacheManager: CacheManager<string, string>;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  it("should store and retrieve a value", () => {
    cacheManager.set("key1", "value1");

    expect(cacheManager.get("key1")).toBe("value1");
  });

  it("should return undefined for non-existent keys", () => {
    expect(cacheManager.get("nonExistentKey")).toBeUndefined();
  });

  it("should clear all values", () => {
    cacheManager.set("key3", "value3");
    cacheManager.set("key4", "value4");
    cacheManager.clear();

    expect(cacheManager.get("key3")).toBeUndefined();
    expect(cacheManager.get("key4")).toBeUndefined();
  });
});

describe("CacheManager with custom key generation", () => {
  class CustomCacheManager extends CacheManager<string, string> {
    protected generateKey(key: string): string {
      return `custom-${key}`;
    }
  }

  let customCacheManager: CustomCacheManager;

  beforeEach(() => {
    customCacheManager = new CustomCacheManager();
  });

  it("should use custom key generation", () => {
    const cacheKey = customCacheManager.getKey("keyA");

    expect(cacheKey).toBe("custom-keyA");

    customCacheManager.set(cacheKey, "valueA");

    expect(customCacheManager.get(cacheKey)).toBe("valueA");
    expect(customCacheManager.get("keyA")).toBeUndefined();
  });
});

describe("CacheManager with non-string keys", () => {
  class ObjectKeyCacheManager extends CacheManager<{ id: number }, string> {
    protected generateKey(key: { id: number }): string {
      return `id-${key.id}`;
    }
  }

  let objectKeyCacheManager: ObjectKeyCacheManager;

  beforeEach(() => {
    objectKeyCacheManager = new ObjectKeyCacheManager();
  });

  it("should store and retrieve values with object keys", () => {
    const key = { id: 1 };
    const hashedKey = objectKeyCacheManager.getKey(key);
    objectKeyCacheManager.set(hashedKey, "objectValue1");

    expect(objectKeyCacheManager.get(hashedKey)).toBe("objectValue1");
  });
});

describe("CacheManager with non-string keys without implementation", () => {
  let cacheManager: CacheManager<{ id: number }, string>;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  it("should throw error when generating key for non-string key", () => {
    const key = { id: 2 };

    expect(() => cacheManager.getKey(key)).toThrow(
      /Cache key generation for non-string keys is not implemented because it causes performance issues/
    );
  });
});

describe("CacheManagerDisabled", () => {
  let cacheManagerDisabled: CacheManagerDisabled<string, string>;

  beforeEach(() => {
    cacheManagerDisabled = new CacheManagerDisabled();
  });

  it("should always return undefined on get", () => {
    expect(cacheManagerDisabled.get("anyKey")).toBeUndefined();
  });

  it("should not store any value on set", () => {
    cacheManagerDisabled.set("key1", "value1");

    expect(cacheManagerDisabled.get("key1")).toBeUndefined();
  });

  it("should not throw error on clear", () => {
    expect(() => cacheManagerDisabled.clear()).not.toThrow();
  });
});
