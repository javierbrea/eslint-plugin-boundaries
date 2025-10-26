import { CacheManager } from "./Cache";
import type { ConfigOptions } from "./Config";
import { Config } from "./Config";
import { Descriptors } from "./Descriptor";
import type {
  ElementDescriptors,
  ElementDescription,
  DependencyDescription,
} from "./Descriptor";
import type { ElementsSerializedCache } from "./Elements.types";
import { DependenciesMatcher, ElementsMatcher } from "./Selector";
import type {
  BaseElementsSelector,
  DependencySelector,
  MatcherOptions,
  ElementSelector,
  ElementSelectorData,
} from "./Selector";

/**
 * Main class to interact with Elements functionality.
 * It include one method to get descriptors with different caching for different configurations, methods to manage the cache, and methods to match element selectors against element descriptions.
 */
export class Elements {
  /** The global configuration options for Elements. Can be overridden when getting a descriptor */
  private _globalConfigOptions: ConfigOptions;

  /** Cache manager for Descriptors instances, unique for each different configuration */
  private _descriptorsCache: CacheManager<
    { config: ConfigOptions; elementDescriptors: ElementDescriptors },
    {
      config: ConfigOptions;
      elementDescriptors: ElementDescriptors;
      descriptors: Descriptors;
    }
  > = new CacheManager();

  /** Matcher for element selectors */
  private _elementsMatcher: ElementsMatcher;

  /** Matcher for dependency selectors */
  private _dependenciesMatcher: DependenciesMatcher;

  /**
   * Creates a new Elements instance
   * @param configOptions The global configuration options for Elements. Can be overridden when getting a descriptor.
   */
  constructor(configOptions?: ConfigOptions) {
    this._globalConfigOptions = configOptions ? { ...configOptions } : {};
    this._elementsMatcher = new ElementsMatcher();
    this._dependenciesMatcher = new DependenciesMatcher(this._elementsMatcher);
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

  /**
   * Determines if an element matches a given elements selector.
   * @param element The element to check
   * @param selector The elements selector to check against
   * @param options Additional options for matching
   * @returns True if the element matches the selector, false otherwise
   */
  public isElementMatch(
    element: ElementDescription,
    selector: BaseElementsSelector,
    options?: MatcherOptions,
  ): boolean {
    return this._elementsMatcher.isElementMatch(element, selector, options);
  }

  /**
   * Returns whether the given dependency matches the selector.
   * @param dependency The dependency to check.
   * @param selector The dependency selector to check against.
   * @param options Additional options for matching
   * @returns Whether the dependency matches the selector properties.
   */
  public isDependencyMatch(
    dependency: DependencyDescription,
    selector: DependencySelector,
    options?: MatcherOptions,
  ): boolean {
    return this._dependenciesMatcher.isDependencyMatch(
      dependency,
      selector,
      options,
    );
  }

  /**
   * Normalizes an element selector with any supported format into an array of ElementSelectorData.
   * @param selector The element selector to normalize.
   * @returns An array of normalized ElementSelectorData.
   */
  public normalizeSelector(selector: ElementSelector): ElementSelectorData[] {
    return this._elementsMatcher.normalize(selector);
  }
}
