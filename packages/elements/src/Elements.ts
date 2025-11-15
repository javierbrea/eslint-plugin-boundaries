import type { ConfigOptions, ConfigOptionsNormalized } from "./Config";
import { Config } from "./Config";
import type { ElementDescriptors } from "./Descriptor";
import type { ElementsSerializedCache } from "./Elements.types";
import {
  Micromatch,
  DependenciesMatcher,
  ElementsMatcher,
  Matcher,
} from "./Matcher";
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
          elementDescriptors: cache.elementDescriptors,
          cache: cache.matcher.serializeCache(),
        };
        return acc;
      },
      {} as ElementsSerializedCache["matchers"]
    );

    return {
      matchers: matchersCache,
    };
  }

  /**
   * Sets the Elements cache from a serialized representation.
   * @param serializedCache The serialized cache to set.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsSerializedCache
  ): void {
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
  }

  /**
   * Clears cache
   */
  public clearCache(): void {
    for (const { matcher } of this._matchersCache.getAll().values()) {
      matcher.clearCache();
    }
    this._matchersCache.clear();
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

    const cacheKey = this._matchersCache.getKey({
      config: configOptionsNormalized,
      elementDescriptors,
    });

    if (this._matchersCache.has(cacheKey)) {
      return this._matchersCache.get(cacheKey)!.matcher;
    }

    const micromatch = configOptionsNormalized.cache
      ? this._micromatchWithCache
      : this._micromatchWithoutCache;

    const elementsMatcher = new ElementsMatcher(
      matchersNormalizedOptions,
      micromatch
    );
    const dependenciesMatcher = new DependenciesMatcher(
      elementsMatcher,
      matchersNormalizedOptions,
      micromatch
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
