import { CacheManager } from "./Cache";
import type { ConfigOptions } from "./Config";
import { Config } from "./Config";
import type {
  ElementDescriptors,
  ElementDescription,
  DependencyDescription,
} from "./Descriptor";
import type { ElementsSerializedCache } from "./Elements.types";
import { DependenciesMatcher, ElementsMatcher, Matcher } from "./Matcher";
import type {
  BaseElementsSelector,
  ElementSelectorData,
  MatcherOptions,
  DependencySelector,
  DependencyMatchResult,
} from "./Matcher";

/**
 * Main class to interact with Elements functionality.
 * It include one method to get descriptors with different caching for different configurations, methods to manage the cache, and methods to match element selectors against element descriptions.
 */
export class Elements {
  /** The global configuration options for Elements. Can be overridden when getting a descriptor */
  private _globalConfigOptions: ConfigOptions;

  /** Cache manager for Matcher instances, unique for each different configuration */
  private _matchersCache: CacheManager<
    { config: ConfigOptions; elementDescriptors: ElementDescriptors },
    {
      config: ConfigOptions;
      elementDescriptors: ElementDescriptors;
      matcher: Matcher;
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
   * Returns a serialized representation of the current state of the cache.
   * @returns A serialized representation of the cache.
   */
  public serializeCache(): ElementsSerializedCache {
    const matchersCache = Array.from(
      this._matchersCache.getAll().entries()
    ).reduce(
      (acc, [key, descriptorCache]) => {
        acc[key] = {
          config: descriptorCache.config,
          elementDescriptors: descriptorCache.elementDescriptors,
          cache: descriptorCache.matcher.serializeCache(),
        };
        return acc;
      },
      {} as ElementsSerializedCache["matchers"]
    );

    return {
      matchers: matchersCache,
      elementsMatcher: this._elementsMatcher.serializeCache(),
      dependenciesMatcher: this._dependenciesMatcher.serializeCache(),
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
    this._elementsMatcher.setCacheFromSerialized(
      serializedCache.elementsMatcher
    );
    this._dependenciesMatcher.setCacheFromSerialized(
      serializedCache.dependenciesMatcher
    );
  }

  /**
   * Clears cache
   */
  public clearCache(): void {
    this._elementsMatcher.clearCache();
    this._dependenciesMatcher.clearCache();
    this._matchersCache.getAll().forEach(({ matcher }) => {
      matcher.clearCache();
    });
    this._matchersCache.clear();
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
    const normalizedOptions = configInstance.options;

    const cacheKey = { config: normalizedOptions, elementDescriptors };

    if (this._matchersCache.has(cacheKey)) {
      return this._matchersCache.get(cacheKey)!.matcher;
    }

    const matcher = new Matcher(elementDescriptors, normalizedOptions);
    this._matchersCache.set(cacheKey, {
      config: normalizedOptions,
      elementDescriptors,
      matcher,
    });
    return matcher;
  }
  /**
   * Returns the selector matching result for the given element description, or null if none matches.
   * It omits checks in keys applying only to dependency between elements, such as relationship.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, globals for dependency selectors, etc.
   * @returns The selector matching result for the given element, or null if none matches.
   * @deprecated Use getMatcher(...).getSelectorMatching instead.
   */
  public getElementSelectorMatching(
    element: ElementDescription,
    selector: BaseElementsSelector,
    options?: MatcherOptions
  ): ElementSelectorData | null {
    return this._elementsMatcher.getSelectorMatching(
      element,
      selector,
      options
    );
  }

  /**
   * Determines if an element description matches a given elements selector.
   * @param element The element to check
   * @param selector The elements selector to check against
   * @param options Additional options for matching
   * @returns True if the element matches the selector, false otherwise
   * @deprecated Use getMatcher(...).isElementMatch instead.
   */
  public isElementMatch(
    element: ElementDescription,
    selector: BaseElementsSelector,
    options?: MatcherOptions
  ): boolean {
    return this._elementsMatcher.isElementMatch(element, selector, options);
  }

  /**
   * Returns the selectors matching result for the given dependency description.
   * @param dependency The dependency to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, globals for dependency selectors, etc.
   * @returns The selectors matching result for the given dependency, and whether it matches or not.
   * @deprecated Use getMatcher(...).getSelectorMatching instead.
   */
  public getDependencySelectorsMatching(
    dependency: DependencyDescription,
    selector: DependencySelector,
    options?: MatcherOptions
  ): DependencyMatchResult {
    return this._dependenciesMatcher.getSelectorsMatching(
      dependency,
      selector,
      options
    );
  }

  /**
   * Returns whether the given dependency description matches the selector.
   * @param dependency The dependency to check.
   * @param selector The dependency selector to check against.
   * @param options Additional options for matching
   * @returns Whether the dependency matches the selector properties.
   * @deprecated Use getMatcher(...).isMatch instead.
   */
  public isDependencyMatch(
    dependency: DependencyDescription,
    selector: DependencySelector,
    options?: MatcherOptions
  ): boolean {
    return this._dependenciesMatcher.isDependencyMatch(
      dependency,
      selector,
      options
    );
  }
}
