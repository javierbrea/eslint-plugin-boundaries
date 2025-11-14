import { CacheManager, GlobalCache } from "./Cache";
import type {
  ConfigOptions,
  ConfigOptionsNormalized,
  MatchersOptionsNormalized,
  GlobalCacheOptionsNormalized,
} from "./Config";
import { Config } from "./Config";
import type { ElementDescriptors } from "./Descriptor";
import type { ElementsSerializedCache } from "./Elements.types";
import {
  Micromatch,
  DependenciesMatcher,
  ElementsMatcher,
  Matcher,
} from "./Matcher";

class MatchersCache extends CacheManager<
  {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
  },
  {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
    matcher: Matcher;
  }
> {
  protected generateKey({
    config,
    elementDescriptors,
  }: {
    config: ConfigOptionsNormalized;
    elementDescriptors: ElementDescriptors;
  }): string {
    const configHash = `${config.legacyTemplates}|${config.includePaths}|${config.ignorePaths}|${
      config.cache.global.micromatchPathRegexps
    }|${config.cache.global.micromatchCaptures}|${
      config.cache.global.micromatchMatchingResults
    }|${config.cache.global.elementSelectorsNormalization}|${
      config.cache.global.handlebarsTemplates
    }|${config.cache.descriptor.files}|${config.cache.descriptor.elements}|${
      config.cache.descriptor.dependencies
    }|${config.cache.matcher.dependencies}|${config.cache.matcher.elements}`;

    const elementDescriptorsHash = elementDescriptors
      .map(
        (descriptor) =>
          `${descriptor.type}|${descriptor.category}|${descriptor.pattern}|${descriptor.basePattern}|${descriptor.mode}|${descriptor.capture}|${descriptor.baseCapture}`
      )
      .join(",");
    return `${configHash}|:|${elementDescriptorsHash}`;
  }
}

class ElementsMatcherCache extends CacheManager<
  MatchersOptionsNormalized,
  {
    config: MatchersOptionsNormalized;
    elementsMatcher: ElementsMatcher;
  }
> {
  protected generateKey(config: MatchersOptionsNormalized): string {
    return `${config.legacyTemplates}|${config.cache.dependencies}|${config.cache.elements}|${config.cacheGlobal.micromatchCaptures}|${config.cacheGlobal.micromatchMatchingResults}|${config.cacheGlobal.micromatchPathRegexps}|${config.cacheGlobal.elementSelectorsNormalization}|${config.cacheGlobal.handlebarsTemplates}`;
  }
}

class DependenciesMatcherCache extends CacheManager<
  MatchersOptionsNormalized,
  {
    config: MatchersOptionsNormalized;
    dependenciesMatcher: DependenciesMatcher;
  }
> {
  protected generateKey(config: MatchersOptionsNormalized): string {
    return `${config.legacyTemplates}|${config.cache.dependencies}|${config.cache.elements}|${config.cacheGlobal.micromatchCaptures}|${config.cacheGlobal.micromatchMatchingResults}|${config.cacheGlobal.micromatchPathRegexps}|${config.cacheGlobal.elementSelectorsNormalization}|${config.cacheGlobal.handlebarsTemplates}`;
  }
}

class MicromatchCache extends CacheManager<
  GlobalCacheOptionsNormalized,
  {
    config: GlobalCacheOptionsNormalized;
    micromatch: Micromatch;
  }
> {
  protected generateKey(config: GlobalCacheOptionsNormalized): string {
    return `${config.micromatchPathRegexps}|${config.micromatchCaptures}|${config.micromatchMatchingResults}|${config.elementSelectorsNormalization}|${config.handlebarsTemplates}`;
  }
}

/**
 * Main class to interact with Elements functionality.
 * It include one method to get descriptors with different caching for different configurations, methods to manage the cache, and methods to match element selectors against element descriptions.
 */
export class Elements {
  /** The global configuration options for Elements. Can be overridden when getting a descriptor */
  private readonly _globalConfigOptions: ConfigOptionsNormalized;

  /** Cache manager for Matcher instances, unique for each different configuration */
  private readonly _matchersCache = new MatchersCache();
  /** Cache manager for ElementsMatcher instances, unique for each different configuration */
  private readonly _elementsMatcherCache = new ElementsMatcherCache();
  /** Cache manager for DependenciesMatcher instances, unique for each different configuration */
  private readonly _dependenciesMatcherCache = new DependenciesMatcherCache();

  /** Cache manager for different micromatch instances, unique for each different global cache configuration */
  private readonly _micromatchCache = new MicromatchCache();

  /** Global cache for various caching needs */
  private _globalCache: GlobalCache;

  /**
   * Creates a new Elements instance
   * @param configOptions The global configuration options for Elements. Can be overridden when getting a descriptor.
   */
  constructor(configOptions?: ConfigOptions) {
    const globalConfig = new Config(configOptions);
    this._globalConfigOptions = globalConfig.options;
    this._globalCache = new GlobalCache();
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
   * Retrieves or creates a Micromatch instance for the given global cache configuration.
   * @param globalCacheOptions The global cache configuration options.
   * @param cacheIsEnabled Whether the cache is enabled.
   * @returns A Micromatch instance. Unique for each different global cache configuration.
   */
  private _getMicromatch(
    config: GlobalCacheOptionsNormalized,
    cacheIsEnabled?: boolean
  ): Micromatch {
    const cacheKey = this._micromatchCache.getKey(config, cacheIsEnabled);
    if (this._micromatchCache.has(cacheKey)) {
      return this._micromatchCache.get(cacheKey)!.micromatch;
    }

    const micromatch = new Micromatch(this._globalCache);

    this._micromatchCache.set(cacheKey, {
      config,
      micromatch,
    });
    return micromatch;
  }

  /**
   * Creates or retrieves an ElementsMatcher instance for the given configuration options.
   * @param config The configuration options.
   * @param cacheIsEnabled Whether the cache is disabled or not.
   * @returns An ElementsMatcher instance. Unique for each different configuration.
   */
  private _getElementsMatcher(
    config: MatchersOptionsNormalized,
    micromatch?: Micromatch,
    cacheIsEnabled?: boolean
  ): ElementsMatcher {
    const cacheKey = this._elementsMatcherCache.getKey(config, cacheIsEnabled);
    if (this._elementsMatcherCache.has(cacheKey)) {
      return this._elementsMatcherCache.get(cacheKey)!.elementsMatcher;
    }

    const micromatchToUse =
      micromatch || this._getMicromatch(config.cacheGlobal, cacheIsEnabled);

    const elementsMatcher = new ElementsMatcher(
      config,
      micromatchToUse,
      this._globalCache
    );

    this._elementsMatcherCache.set(cacheKey, {
      config,
      elementsMatcher,
    });
    return elementsMatcher;
  }

  /**
   * Creates or retrieves a DependenciesMatcher instance for the given configuration options.
   * @param config The configuration options.
   * @param cacheIsEnabled Whether the cache is disabled.
   * @returns A DependenciesMatcher instance. Unique for each different configuration.
   */
  private _getDependenciesMatcher(
    config: MatchersOptionsNormalized,
    micromatch?: Micromatch,
    cacheIsEnabled?: boolean
  ): DependenciesMatcher {
    const cacheKey = this._dependenciesMatcherCache.getKey(
      config,
      cacheIsEnabled
    );
    if (this._dependenciesMatcherCache.has(cacheKey)) {
      return this._dependenciesMatcherCache.get(cacheKey)!.dependenciesMatcher;
    }

    const micromatchToUse =
      micromatch || this._getMicromatch(config.cacheGlobal, cacheIsEnabled);
    const elementsMatcher = this._getElementsMatcher(
      config,
      micromatchToUse,
      cacheIsEnabled
    );
    const dependenciesMatcher = new DependenciesMatcher(
      elementsMatcher,
      config,
      micromatchToUse,
      this._globalCache
    );
    this._dependenciesMatcherCache.set(cacheKey!, {
      config,
      dependenciesMatcher,
    });
    return dependenciesMatcher;
  }

  /**
   * Gets a Matcher instance for the given configuration options.
   * It uses caching to return the same instance for the same configuration options. If no options are provided, the global configuration options are used.
   * @param elementDescriptors The element descriptors to use.
   * @param config Optional configuration options to override the global ones.
   * @returns A matcher instance, unique for each different configuration.
   */
  public getMatcher(
    elementDescriptors: ElementDescriptors,
    config?: ConfigOptions
  ): Matcher {
    const optionsToUse = config || this._globalConfigOptions;
    const configInstance = new Config(optionsToUse);
    const configOptionsNormalized = configInstance.options;
    const descriptorNormalizedOptions = configInstance.descriptorOptions;
    const matchersNormalizedOptions = configInstance.matchersOptions;
    const cacheIsEnabled = configInstance.cacheIsEnabled;
    const globalCacheOptions = configInstance.globalCacheOptions;

    const cacheKey = this._matchersCache.getKey(
      {
        config: configOptionsNormalized,
        elementDescriptors,
      },
      cacheIsEnabled
    );

    if (this._matchersCache.has(cacheKey)) {
      return this._matchersCache.get(cacheKey)!.matcher;
    }

    const micromatch = this._getMicromatch(globalCacheOptions, cacheIsEnabled);
    const elementsMatcher = this._getElementsMatcher(
      matchersNormalizedOptions,
      micromatch,
      cacheIsEnabled
    );
    const dependenciesMatcher = this._getDependenciesMatcher(
      matchersNormalizedOptions,
      micromatch,
      cacheIsEnabled
    );

    const matcher = new Matcher(
      elementDescriptors,
      elementsMatcher,
      dependenciesMatcher,
      descriptorNormalizedOptions,
      micromatch
    );

    this._matchersCache.set(cacheKey, {
      config: configOptionsNormalized,
      elementDescriptors,
      matcher,
    });

    return matcher;
  }
}
