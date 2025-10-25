import { CacheManager } from "./Cache";
import type { ConfigOptions } from "./Config";
import { Config } from "./Config";
import { Descriptors } from "./Descriptor";
import type { ElementDescriptors } from "./Descriptor/ElementsDescriptor.types";
import type { ElementsSerializedCache } from "./Elements.types";

/**
 * Main class to interact with Elements functionality.
 * It include one method to get descriptors with different caching for different configurations, methods to manage the cache, and methods to match element selectors against element descriptions.
 */
export class Elements {
  private _globalConfigOptions: ConfigOptions;
  private _descriptorsCache: CacheManager<
    { config: ConfigOptions; elementDescriptors: ElementDescriptors },
    {
      config: ConfigOptions;
      elementDescriptors: ElementDescriptors;
      descriptors: Descriptors;
    }
  > = new CacheManager();

  /**
   * Creates a new Elements instance
   * @param configOptions The global configuration options for Elements. Can be overridden when getting a descriptor.
   */
  constructor(configOptions?: ConfigOptions) {
    this._globalConfigOptions = configOptions ? { ...configOptions } : {};
  }

  /**
   * Returns a serialized representation of the current state of Elements cache.
   * @returns A serialized representation of the Elements cache.
   */
  public serializeCache(): ElementsSerializedCache {
    const descriptorsCache = Array.from(
      this._descriptorsCache.getAll().entries(),
    ).reduce(
      (acc, [key, descriptorCache]) => {
        acc[key] = {
          cache: descriptorCache.descriptors.serializeCache(),
          config: descriptorCache.config,
          elementDescriptors: descriptorCache.elementDescriptors,
        };
        return acc;
      },
      {} as ElementsSerializedCache["descriptors"],
    );

    return {
      descriptors: descriptorsCache,
    };
  }

  /**
   * Sets the Elements cache from a serialized representation.
   * @param serializedCache The serialized cache to set.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsSerializedCache,
  ): void {
    for (const key in serializedCache.descriptors) {
      const descriptors = this.getDescriptors(
        serializedCache.descriptors[key].elementDescriptors,
        serializedCache.descriptors[key].config,
      );
      descriptors.setCacheFromSerialized(
        serializedCache.descriptors[key].cache,
      );
      this._descriptorsCache.restore(key, {
        config: serializedCache.descriptors[key].config,
        elementDescriptors: serializedCache.descriptors[key].elementDescriptors,
        descriptors,
      });
    }
  }

  // TODO: Add method to clean caches

  /**
   * Gets Elements and Dependencies descriptor instances based on the provided configuration options.
   * If no options are provided, the global configuration options are used.
   * @param configOptions Optional configuration options to override the global ones.
   * @returns An ElementsDescriptor instance, unique for each different configuration.
   */
  public getDescriptors(
    elementDescriptors: ElementDescriptors,
    configOptions?: ConfigOptions,
  ): Descriptors {
    const optionsToUse = configOptions || this._globalConfigOptions;
    const configInstance = new Config(optionsToUse);
    const normalizedOptions = configInstance.options;

    const cacheKey = { config: normalizedOptions, elementDescriptors };

    if (this._descriptorsCache.has(cacheKey)) {
      return this._descriptorsCache.get(cacheKey)!.descriptors;
    }

    const descriptors = new Descriptors(elementDescriptors, normalizedOptions);
    this._descriptorsCache.set(cacheKey, {
      config: normalizedOptions,
      elementDescriptors,
      descriptors,
    });
    return descriptors;
  }

  // TODO: Expose methods to match elements or dependencies. Create unique instances in the constructor, and get/set caches in cache serializer methods

  // TODO: Expose method to normalize selectors
}
