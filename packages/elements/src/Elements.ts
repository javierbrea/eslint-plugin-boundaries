import type { ConfigOptions, ConfigOptionsNormalized } from "./Config";
import { Config } from "./Config";
import type {
  ElementsSerializedCache,
  MatcherDescriptors,
} from "./Elements.types";
import {
  Micromatch,
  DependenciesMatcher,
  ElementsMatcher,
  FilesMatcher,
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
          fileDescriptors: cache.fileDescriptors,
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
        {
          elementDescriptors: serializedCache.matchers[key].elementDescriptors,
          fileDescriptors: serializedCache.matchers[key].fileDescriptors,
        },
        serializedCache.matchers[key].config
      );
      matcher.setCacheFromSerialized(serializedCache.matchers[key].cache);
      this._matchersCache.set(key, {
        config: serializedCache.matchers[key].config,
        elementDescriptors: serializedCache.matchers[key].elementDescriptors,
        fileDescriptors: serializedCache.matchers[key].fileDescriptors,
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
   * Gets a Matcher instance using explicit element/file descriptor groups.
   * @param descriptors Descriptor collections to use.
   * @param config Optional configuration options.
   * @returns A matcher instance, unique for each different configuration.
   */
  public getMatcher(
    descriptors: MatcherDescriptors,
    config?: ConfigOptions
  ): Matcher;

  public getMatcher(
    descriptors: MatcherDescriptors,
    config?: ConfigOptions
  ): Matcher {
    const optionsToUse = config || this._globalConfigOptions;
    const configInstance = new Config(optionsToUse);
    const cacheIsEnabled = configInstance.cache;
    const configOptionsNormalized = configInstance.options;
    const descriptorNormalizedOptions = configInstance.descriptorOptions;
    const matchersNormalizedOptions = configInstance.matchersOptions;

    const elementDescriptors = descriptors.elementDescriptors || [];
    const fileDescriptors = descriptors.fileDescriptors;

    const cacheKey = this._matchersCache.getKey({
      config: configOptionsNormalized,
      elementDescriptors,
      fileDescriptors,
    });

    if (this._matchersCache.has(cacheKey)) {
      return this._matchersCache.get(cacheKey)!.matcher;
    }

    const micromatch = cacheIsEnabled
      ? this._micromatchWithCache
      : this._micromatchWithoutCache;

    const elementsMatcher = new ElementsMatcher(
      matchersNormalizedOptions,
      micromatch
    );
    const filesMatcherForDependencies = new FilesMatcher(
      matchersNormalizedOptions,
      elementsMatcher,
      micromatch
    );
    const filesMatcher = fileDescriptors ? filesMatcherForDependencies : null;
    const dependenciesMatcher = new DependenciesMatcher(
      filesMatcherForDependencies,
      matchersNormalizedOptions,
      micromatch
    );

    const matcher = new Matcher(
      elementDescriptors,
      fileDescriptors,
      elementsMatcher,
      dependenciesMatcher,
      filesMatcher,
      descriptorNormalizedOptions,
      micromatch
    );

    this._matchersCache.set(cacheKey, {
      config: configOptionsNormalized,
      elementDescriptors,
      fileDescriptors,
      matcher,
    });
    return matcher;
  }
}
