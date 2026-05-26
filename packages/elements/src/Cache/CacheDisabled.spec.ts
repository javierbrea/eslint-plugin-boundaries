import { CacheManagerDisabled } from "./CacheDisabled";

describe("CacheManagerDisabled", () => {
  let cache: CacheManagerDisabled<string, string>;

  beforeEach(() => {
    cache = new CacheManagerDisabled();
  });

  describe("getKey", () => {
    it("should return an empty string for any key", () => {
      expect(cache.getKey("someKey")).toBe("");
    });

    it("should return an empty string for a different key", () => {
      expect(cache.getKey("anotherKey")).toBe("");
    });
  });

  describe("get", () => {
    it("should return undefined for any key", () => {
      expect(cache.get("anyKey")).toBeUndefined();
    });

    it("should return undefined even after set is called", () => {
      cache.set("key1", "value1");

      expect(cache.get("key1")).toBeUndefined();
    });
  });

  describe("set", () => {
    it("should not store any value", () => {
      cache.set("key1", "value1");

      expect(cache.has("key1")).toBe(false);
      expect(cache.get("key1")).toBeUndefined();
    });

    it("should not increase cache size", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      expect(cache.getAll().size).toBe(0);
    });
  });

  describe("has", () => {
    it("should return false for any key", () => {
      expect(cache.has("someKey")).toBe(false);
    });

    it("should return false even after set is called", () => {
      cache.set("key1", "value1");

      expect(cache.has("key1")).toBe(false);
    });
  });

  describe("inherited methods", () => {
    it("should not throw on clear", () => {
      expect(() => cache.clear()).not.toThrow();
    });

    it("should return an empty map from getAll", () => {
      cache.set("key1", "value1");

      expect(cache.getAll().size).toBe(0);
    });

    it("should serialize to an empty object", () => {
      cache.set("key1", "value1");

      expect(cache.serialize()).toEqual({});
    });
  });
});

describe("CacheManagerDisabled with object keys", () => {
  let cache: CacheManagerDisabled<{ id: number }, number>;

  beforeEach(() => {
    cache = new CacheManagerDisabled();
  });

  it("should return an empty string for object keys", () => {
    expect(cache.getKey({ id: 1 })).toBe("");
  });

  it("should return undefined for get with any hashed key", () => {
    expect(cache.get("id-1")).toBeUndefined();
  });

  it("should return false for has with any hashed key", () => {
    expect(cache.has("id-1")).toBe(false);
  });
});
