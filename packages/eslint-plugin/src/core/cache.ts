import type { Settings } from "../constants/settings";

class CacheManager {
  private _cache: Record<string, unknown>;
  private _name: string;
  private _settings: Settings;

  constructor(name: string, settings: Settings) {
    this._cache = {};
    this._name = name;
    this._settings = settings;
  }

  public get settings() {
    return this._settings;
  }

  save(key: string, value: unknown) {
    this._cache[key] = value;
  }

  load(key: string) {
    if (this._cache[key]) {
      return this._cache[key];
    }

    return null;
  }
}

class CachesManager {
  private _name: string;
  private _caches: CacheManager[];
  constructor(name: string) {
    this._name = name;
    this._caches = [];
  }

  findCacheForSettings(settings: Settings) {
    let cache = this._caches.find((cacheCandidate) => {
      return cacheCandidate.settings === settings;
    });
    if (!cache) {
      cache = new CacheManager(this._name, settings);
      this._caches.push(cache);
    }
    return cache;
  }

  save(key: string, value: unknown, settings: Settings) {
    const cache = this.findCacheForSettings(settings);
    cache.save(key, value);
  }

  load(key: string, settings: Settings) {
    const cache = this.findCacheForSettings(settings);
    return cache.load(key);
  }
}

export const elementsCache = new CachesManager("element");
