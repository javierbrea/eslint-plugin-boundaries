import { CacheManager, GlobalCache } from "./Cache";
import type {
  ConfigOptions,
  ConfigOptionsNormalized,
  MatchersOptionsNormalized,
} from "./Config";
import { Config } from "./Config";
import type { ElementDescriptors } from "./Descriptor";
import type { ElementsSerializedCache } from "./Elements.types";
import {
  DependenciesMatcher,
  ElementsMatcher,
  Matcher,
  Micromatch,
} from "./Matcher";

/**
 * Main class to interact with Elements functionality.
 * It include one method to get descriptors with different caching for different configurations, methods to manage the cache, and methods to match element selectors against element descriptions.
 */
export class Elements {
  /** The global configuration options for Elements. Can be overridden when getting a descriptor */
  private readonly _globalConfigOptions: ConfigOptionsNormalized;

  /** Cache manager for Matcher instances, unique for each different configuration */
  private readonly _matchersCache: CacheManager<
    {
      config: ConfigOptionsNormalized;
      elementDescriptors: ElementDescriptors;
    },
    {
      config: ConfigOptionsNormalized;
      elementDescriptors: ElementDescriptors;
      matcher: Matcher;
    }
  > = new CacheManager();

  /** Cache manager for ElementsMatcher instances, unique for each different configuration */
  private readonly _elementsMatcherCache: CacheManager<
    { config: MatchersOptionsNormalized },
    {
      config: MatchersOptionsNormalized;
      elementsMatcher: ElementsMatcher;
    }
  > = new CacheManager();

  /** Cache manager for DependenciesMatcher instances, unique for each different configuration */
  private readonly _dependenciesMatcherCache: CacheManager<
    { config: MatchersOptionsNormalized },
    {
      config: MatchersOptionsNormalized;
      dependenciesMatcher: DependenciesMatcher;
    }
  > = new CacheManager();

  /** Global cache for various caching needs */
  private _globalCache: GlobalCache;

  /** Micromatch instance for path matching */
  private _micromatch: Micromatch;

  /**
   * Creates a new Elements instance
   * @param configOptions The global configuration options for Elements. Can be overridden when getting a descriptor.
   */
  constructor(configOptions?: ConfigOptions) {
    const globalConfig = new Config(configOptions);
    this._globalConfigOptions = globalConfig.options;
    this._globalCache = new GlobalCache();
    this._micromatch = new Micromatch(this._globalCache);
  }

  /**
   * Returns a serialized representation of the current state of the cache.
   * @returns A serialized representation of the cache.
   */
  public serializeCache(): ElementsSerializedCache {
    const matchersCache = Array.from(
      this._matchersCache.getAll().entries()
    ).reduce(
      (acc, [key, cache]) => {
        acc[key] = {
          config: cache.config,
          elementDescriptors: cache.elementDescriptors,
          cache: cache.matcher.serializeCache(),
        };
        return acc;
      },
      {} as ElementsSerializedCache["matchers"]
    );

    const elementsMatchersCache = Array.from(
      this._elementsMatcherCache.getAll().entries()
    ).reduce(
      (acc, [key, cache]) => {
        acc[key] = {
          config: cache.config,
          cache: cache.elementsMatcher.serializeCache(),
        };
        return acc;
      },
      {} as ElementsSerializedCache["elementsMatchers"]
    );

    const dependenciesMatchersCache = Array.from(
      this._dependenciesMatcherCache.getAll().entries()
    ).reduce(
      (acc, [key, cache]) => {
        acc[key] = {
          config: cache.config,
          cache: cache.dependenciesMatcher.serializeCache(),
        };
        return acc;
      },
      {} as ElementsSerializedCache["dependenciesMatchers"]
    );

    return {
      matchers: matchersCache,
      elementsMatchers: elementsMatchersCache,
      dependenciesMatchers: dependenciesMatchersCache,
      global: this._globalCache.serialize(),
    };
  }

  /**
   * Sets the Elements cache from a serialized representation.
   * @param serializedCache The serialized cache to set.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsSerializedCache
  ): void {
    this._globalCache.setFromSerialized(serializedCache.global);
    for (const key in serializedCache.matchers) {
      const matcher = this.getMatcher(
        serializedCache.matchers[key].elementDescriptors,
        serializedCache.matchers[key].config
      );
      matcher.setCacheFromSerialized(serializedCache.matchers[key].cache);
      this._matchersCache.restore(key, {
        config: serializedCache.matchers[key].config,
        elementDescriptors: serializedCache.matchers[key].elementDescriptors,
        matcher: matcher,
      });
    }
    for (const key in serializedCache.elementsMatchers) {
      const elementsMatcher = this._getElementsMatcher(
        serializedCache.elementsMatchers[key].config
      );
      elementsMatcher.setCacheFromSerialized(
        serializedCache.elementsMatchers[key].cache
      );
      this._elementsMatcherCache.restore(key, {
        config: serializedCache.elementsMatchers[key].config,
        elementsMatcher: elementsMatcher,
      });
    }
    for (const key in serializedCache.dependenciesMatchers) {
      const dependenciesMatcher = this._getDependenciesMatcher(
        serializedCache.dependenciesMatchers[key].config
      );
      dependenciesMatcher.setCacheFromSerialized(
        serializedCache.dependenciesMatchers[key].cache
      );
      this._dependenciesMatcherCache.restore(key, {
        config: serializedCache.dependenciesMatchers[key].config,
        dependenciesMatcher: dependenciesMatcher,
      });
    }
  }

  /**
   * Clears cache
   */
  public clearCache(): void {
    this._globalCache.clear();
    for (const { matcher } of this._matchersCache.getAll().values()) {
      matcher.clearCache();
    }
    this._matchersCache.clear();
    for (const { elementsMatcher } of this._elementsMatcherCache
      .getAll()
      .values()) {
      elementsMatcher.clearCache();
    }
    this._elementsMatcherCache.clear();
    for (const { dependenciesMatcher } of this._dependenciesMatcherCache
      .getAll()
      .values()) {
      dependenciesMatcher.clearCache();
    }
    this._dependenciesMatcherCache.clear();
  }

  /**
   * Creates or retrieves an ElementsMatcher instance for the given configuration options.
   * @param configOptions The configuration options.
   * @returns An ElementsMatcher instance. Unique for each different configuration.
   */
  private _getElementsMatcher(
    configOptions: MatchersOptionsNormalized
  ): ElementsMatcher {
    const cacheKey = this._elementsMatcherCache.getKey({
      config: configOptions,
    });

    if (this._elementsMatcherCache.has(cacheKey)) {
      return this._elementsMatcherCache.get(cacheKey)!.elementsMatcher;
    }

    const elementsMatcher = new ElementsMatcher(
      configOptions,
      this._micromatch,
      this._globalCache
    );
    this._elementsMatcherCache.set(cacheKey, {
      config: configOptions,
      elementsMatcher,
    });
    return elementsMatcher;
  }

  /**
   * Creates or retrieves a DependenciesMatcher instance for the given configuration options.
   * @param configOptions The configuration options.
   * @returns A DependenciesMatcher instance. Unique for each different configuration.
   */
  private _getDependenciesMatcher(
    configOptions: MatchersOptionsNormalized
  ): DependenciesMatcher {
    const cacheKey = this._dependenciesMatcherCache.getKey({
      config: configOptions,
    });

    if (this._dependenciesMatcherCache.has(cacheKey)) {
      return this._dependenciesMatcherCache.get(cacheKey)!.dependenciesMatcher;
    }

    const elementsMatcher = this._getElementsMatcher(configOptions);
    const dependenciesMatcher = new DependenciesMatcher(
      elementsMatcher,
      configOptions,
      this._micromatch,
      this._globalCache
    );
    this._dependenciesMatcherCache.set(cacheKey, {
      config: configOptions,
      dependenciesMatcher,
    });
    return dependenciesMatcher;
  }

  /**
   * Gets a Matcher instance for the given configuration options.
   * It uses caching to return the same instance for the same configuration options. If no options are provided, the global configuration options are used.
   * @param elementDescriptors The element descriptors to use.
   * @param configOptions Optional configuration options to override the global ones.
   * @returns A matcher instance, unique for each different configuration.
   */
  public getMatcher(
    elementDescriptors: ElementDescriptors,
    configOptions?: ConfigOptions
  ): Matcher {
    const optionsToUse = configOptions || this._globalConfigOptions;
    const configInstance = new Config(optionsToUse);
    const configOptionsNormalized = configInstance.options;
    const descriptorNormalizedOptions = configInstance.descriptorOptions;
    const matchersNormalizedOptions = configInstance.matchersOptions;

    const cacheKey = this._matchersCache.getKey({
      config: configOptionsNormalized,
      elementDescriptors,
    });

    if (this._matchersCache.has(cacheKey)) {
      return this._matchersCache.get(cacheKey)!.matcher;
    }

    const elementsMatcher = this._getElementsMatcher(matchersNormalizedOptions);
    const dependenciesMatcher = this._getDependenciesMatcher(
      matchersNormalizedOptions
    );

    const matcher = new Matcher(
      elementDescriptors,
      elementsMatcher,
      dependenciesMatcher,
      descriptorNormalizedOptions,
      this._micromatch
    );

    this._matchersCache.set(cacheKey, {
      config: configOptionsNormalized,
      elementDescriptors,
      matcher,
    });
    return matcher;
  }
}
