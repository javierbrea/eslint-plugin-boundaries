import type { ConfigOptions, ConfigOptionsNormalized } from "./Config";
import { Config } from "./Config";
import type { ElementsSerializedCache } from "./Elements.types";
import type { BackwardCompatibleDescriptorsConfig } from "./Legacy";
import { Micromatch, Matcher } from "./Matcher";
import { MatchersCache } from "./MatchersCache";

/**
 * Main class to interact with Elements functionality.
 * It include one method to get descriptors with different caching for different configurations, methods to manage the cache, and methods to match element selectors against element descriptions.
 */
export class Elements {
  /** The global configuration options for Elements. Can be overridden when getting a descriptor */
  private readonly _globalConfigOptions: ConfigOptionsNormalized;

  /** Cache manager for Matcher instances, unique for each different configuration */
  private readonly _matchersCache = new MatchersCache();

  /** Micromatch instances for pattern matching */
  private readonly _micromatchWithCache = new Micromatch(true);
  private readonly _micromatchWithoutCache = new Micromatch(false);

  /**
   * Creates a new Elements instance
   * @param configOptions The global configuration options for Elements. Can be overridden when getting a descriptor.
   */
  constructor(configOptions?: ConfigOptions) {
    const globalConfig = new Config(configOptions);
    this._globalConfigOptions = globalConfig.options;
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
          descriptors: cache.descriptors,
          cache: cache.matcher.serializeCache(),
        };
        return acc;
      },
      {} as ElementsSerializedCache["matchers"]
    );

    const micromatchCache = this._micromatchWithCache.serializeCache();

    return {
      matchers: matchersCache,
      micromatch: micromatchCache,
    };
  }

  /**
   * Sets the Elements cache from a serialized representation.
   * @param serializedCache The serialized cache to set.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsSerializedCache
  ): void {
    this._micromatchWithCache.setFromSerialized(serializedCache.micromatch);
    for (const key in serializedCache.matchers) {
      const matcher = this.getMatcher(
        serializedCache.matchers[key].descriptors,
        serializedCache.matchers[key].config
      );
      matcher.setCacheFromSerialized(serializedCache.matchers[key].cache);
      this._matchersCache.set(key, {
        config: serializedCache.matchers[key].config,
        descriptors: serializedCache.matchers[key].descriptors,
        matcher: matcher,
      });
    }
  }

  /**
   * Clears cache
   */
  public clearCache(): void {
    for (const { matcher } of this._matchersCache.getAll().values()) {
      matcher.clearCache();
    }
    this._matchersCache.clear();
    this._micromatchWithCache.clearCache();
  }

  /**
   * Gets a Matcher instance for the given configuration options.
   * It uses caching to return the same instance for the same configuration options. If no options are provided, the global configuration options are used.
   * @param descriptors The descriptors to use.
   * @param config Optional configuration options to override the global ones.
   * @returns A matcher instance, unique for each different configuration.
   */
  public getMatcher(
    descriptors: BackwardCompatibleDescriptorsConfig,
    config?: ConfigOptions
  ): Matcher {
    const optionsToUse = config || this._globalConfigOptions;
    const configInstance = new Config(optionsToUse);
    const cacheIsEnabled = configInstance.cache;
    const configOptionsNormalized = configInstance.options;
    const descriptorNormalizedOptions = configInstance.descriptorOptions;
    const matchersNormalizedOptions = configInstance.matchersOptions;

    const cacheKey = this._matchersCache.getKey({
      config: configOptionsNormalized,
      descriptors,
    });

    if (this._matchersCache.has(cacheKey)) {
      return this._matchersCache.get(cacheKey)!.matcher;
    }

    const micromatch = cacheIsEnabled
      ? this._micromatchWithCache
      : this._micromatchWithoutCache;

    const matcher = new Matcher({
      descriptors,
      micromatch,
      options: {
        descriptors: descriptorNormalizedOptions,
        matchers: matchersNormalizedOptions,
      },
    });

    this._matchersCache.set(cacheKey, {
      config: configOptionsNormalized,
      descriptors,
      matcher,
    });
    return matcher;
  }
}
