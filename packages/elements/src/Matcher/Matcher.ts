import type { ConfigOptions } from "../Config";
import type {
  ElementDescriptors,
  DescribeDependencyOptions,
} from "../Descriptor";
import { Descriptors } from "../Descriptor";
import { isString } from "../Support";

import { DependenciesMatcher } from "./DependenciesMatcher";
import { ElementsMatcher } from "./ElementsMatcher";
import type {
  DependencySelector,
  MatcherOptions,
  ElementsSelector,
  ElementSelectorData,
  DependencyMatchResult,
  MatcherSerializedCache,
} from "./ElementsMatcher.types";

/**
 * Matcher class to evaluate if elements or dependencies match given selectors.
 */
export class Matcher {
  private _descriptors: Descriptors;
  private _elementsMatcher: ElementsMatcher;
  private _dependenciesMatcher: DependenciesMatcher;

  /**
   * Constructor for the Matcher class.
   * @param descriptors Element descriptors to use for matching.
   * @param config Optional configuration options.
   */
  constructor(descriptors: ElementDescriptors, config?: ConfigOptions) {
    this._descriptors = new Descriptors(descriptors, config);
    this._elementsMatcher = new ElementsMatcher();
    this._dependenciesMatcher = new DependenciesMatcher(this._elementsMatcher);
  }

  /**
   * Determines if an element matches a given selector.
   * @param filePath The file path of the element
   * @param selector The selector to match against
   * @param options Extra matcher options
   * @returns True if the element matches the selector, false otherwise
   */
  private _isElementMatch(
    filePath: string,
    selector: ElementsSelector,
    options?: MatcherOptions
  ): boolean {
    const description = this._descriptors.describeElement(filePath);
    return this._elementsMatcher.isElementMatch(description, selector, options);
  }

  /**
   * Determines if a dependency matches a given selector.
   * @param dependencyData The data describing the dependency
   * @param selector The selector to match against
   * @param options Extra matcher options
   * @returns True if the dependency matches the selector, false otherwise
   */
  private _isDependencyMatch(
    dependencyData: DescribeDependencyOptions,
    selector: DependencySelector,
    options?: MatcherOptions
  ): boolean {
    const description = this._descriptors.describeDependency(dependencyData);
    return this._dependenciesMatcher.isDependencyMatch(
      description,
      selector,
      options
    );
  }

  /**
   * Determines if the given element or dependency matches the provided selector.
   * @param descriptorOptions The file path or dependency options to describe the element or dependency
   * @param selector The selector to match against
   * @param options Extra matcher options
   */
  public isMatch(
    descriptorOptions: string,
    selector: ElementsSelector,
    options?: MatcherOptions
  ): boolean;
  public isMatch(
    descriptorOptions: DescribeDependencyOptions,
    selector: DependencySelector,
    options?: MatcherOptions
  ): boolean;
  public isMatch(
    descriptorOptions: string | DescribeDependencyOptions,
    selector: ElementsSelector | DependencySelector,
    options?: MatcherOptions
  ): boolean {
    if (isString(descriptorOptions)) {
      return this._isElementMatch(
        descriptorOptions,
        selector as ElementsSelector,
        options
      );
    }
    return this._isDependencyMatch(
      descriptorOptions,
      selector as DependencySelector,
      options
    );
  }

  /**
   * Determines the selector matching for an element.
   * @param filePath The file path of the element
   * @param selector The selectors to match against
   * @param options Extra options for matching
   * @returns The matching selector data or null if no match is found
   */
  private _getElementSelectorMatching(
    filePath: string,
    selector: ElementsSelector,
    options?: MatcherOptions
  ) {
    const description = this._descriptors.describeElement(filePath);
    return this._elementsMatcher.getSelectorMatching(
      description,
      selector,
      options
    );
  }

  /**
   * Determines the selector matching for a dependency.
   * @param dependencyData The data describing the dependency
   * @param selector The selectors to match against
   * @param options Extra options for matching
   * @returns The matching dependency result or null if no match is found
   */
  private _isDependencySelectorMatching(
    dependencyData: DescribeDependencyOptions,
    selector: DependencySelector,
    options?: MatcherOptions
  ) {
    const description = this._descriptors.describeDependency(dependencyData);
    return this._dependenciesMatcher.getSelectorsMatching(
      description,
      selector,
      options
    );
  }

  /**
   * Determines the selector matching for a dependency or element.
   * @param descriptorOptions The file path or dependency options to describe the element or dependency
   * @param selector The selectors to match against
   * @param options Extra options for matching
   * @returns The matching dependency result or element selector data, or null if no match is found
   */
  public getSelectorMatching(
    descriptorOptions: string,
    selector: ElementsSelector,
    options?: MatcherOptions
  ): ElementSelectorData | null;
  public getSelectorMatching(
    descriptorOptions: DescribeDependencyOptions,
    selector: DependencySelector,
    options?: MatcherOptions
  ): DependencyMatchResult | null;
  public getSelectorMatching(
    descriptorOptions: string | DescribeDependencyOptions,
    selector: ElementsSelector | DependencySelector,
    options?: MatcherOptions
  ): ElementSelectorData | DependencyMatchResult | null {
    if (isString(descriptorOptions)) {
      return this._getElementSelectorMatching(
        descriptorOptions,
        selector as ElementsSelector,
        options
      );
    }
    return this._isDependencySelectorMatching(
      descriptorOptions,
      selector as DependencySelector,
      options
    );
  }

  /**
   * Describes an element given its file path.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  public describeElement(filePath: string) {
    return this._descriptors.describeElement(filePath);
  }

  /**
   * Describes a dependency element given its dependency source and file path.
   * @param dependencySource The source of the dependency.
   * @param filePath The path of the file being the dependency, if known.
   * @returns The description of the dependency element.
   */
  public describeDependencyElement(
    dependencySource: string,
    filePath?: string
  ) {
    return this._descriptors.describeDependencyElement(
      dependencySource,
      filePath
    );
  }

  /**
   * Describes elements in a dependency relationship, and provides additional information about the dependency itself.
   * @param options The options for describing the elements and the dependency details.
   * @returns The description of the dependency between the elements.
   */
  public describeDependency(options: DescribeDependencyOptions) {
    return this._descriptors.describeDependency(options);
  }

  /**
   * Clears all caches.
   */
  public clearCache() {
    this._descriptors.clearCache();
    this._elementsMatcher.clearCache();
    this._dependenciesMatcher.clearCache();
  }

  /**
   * Serializes the descriptors and elements matchers cache to a plain object.
   * @returns The serialized cache
   */
  public serializeCache(): MatcherSerializedCache {
    return {
      descriptors: this._descriptors.serializeCache(),
      elementsMatcher: this._elementsMatcher.serializeCache(),
      dependenciesMatcher: this._dependenciesMatcher.serializeCache(),
    };
  }

  /**
   * Sets the descriptors and elements matchers cache from a serialized object.
   * @param serializedCache The serialized cache
   */
  public setCacheFromSerialized(serializedCache: {
    descriptors: ReturnType<Descriptors["serializeCache"]>;
    elementsMatcher: ReturnType<ElementsMatcher["serializeCache"]>;
    dependenciesMatcher: ReturnType<DependenciesMatcher["serializeCache"]>;
  }) {
    this._descriptors.setCacheFromSerialized(serializedCache.descriptors);
    this._elementsMatcher.setCacheFromSerialized(
      serializedCache.elementsMatcher
    );
    this._dependenciesMatcher.setCacheFromSerialized(
      serializedCache.dependenciesMatcher
    );
  }
}
