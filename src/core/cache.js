class Cache {
  constructor(name, settings) {
    this._cache = {};
    this._name = name;
    this._settings = settings;
  }

  save(key, value) {
    this._cache[key] = value;
  }

  load(key) {
    if (this._cache[key]) {
      return this._cache[key];
    }

    return null;
  }
}

class CachesManager {
  constructor(name) {
    this._name = name;
    this._caches = [];
  }

  findCacheForSettings(settings) {
    let cache = this._caches.find((cacheCandidate) => {
      return cacheCandidate._settings === settings;
    });
    if (!cache) {
      cache = new Cache(this._name, settings);
      this._caches.push(cache);
    }
    return cache;
  }

  save(key, value, settings) {
    const cache = this.findCacheForSettings(settings);
    cache.save(key, value);
  }

  load(key, settings) {
    const cache = this.findCacheForSettings(settings);
    return cache.load(key);
  }
}

const filesCache = new CachesManager("file");
const importsCache = new CachesManager("import");
const elementsCache = new CachesManager("element");

module.exports = {
  filesCache,
  importsCache,
  elementsCache,
};
