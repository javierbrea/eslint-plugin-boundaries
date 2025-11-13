import type { DescriptorOptionsNormalized } from "../Config";
import type {
  ElementDescriptors,
  DescribeDependencyOptions,
  ElementDescription,
  DependencyDescription,
} from "../Descriptor";
import {
  Descriptors,
  isElementDescription,
  isDependencyDescription,
} from "../Descriptor";
import { isString } from "../Support";

import type { DependenciesMatcher } from "./DependenciesMatcher";
import type { ElementsMatcher } from "./ElementsMatcher";
import type {
  DependencySelector,
  MatcherOptions,
  ElementsSelector,
  ElementSelectorData,
  DependencyMatchResult,
  MatcherSerializedCache,
} from "./Matcher.types";
import { isDependencySelector, isElementsSelector } from "./MatcherHelpers";
import type { Micromatch } from "./Micromatch";

/**
 * Matcher class to evaluate if elements or dependencies match given selectors.
 */
export class Matcher {
  private readonly _descriptors: Descriptors;
  private readonly _elementsMatcher: ElementsMatcher;
  private readonly _dependenciesMatcher: DependenciesMatcher;

  /**
   * Constructor for the Matcher class.
   * @param descriptors Element descriptors to use for matching.
   * @param elementsMatcher Elements matcher instance.
   * @param dependenciesMatcher Dependencies matcher instance.
   * @param config Configuration options.
   * @param globalCache Global cache instance.
   */
  constructor(
    descriptors: ElementDescriptors,
    elementsMatcher: ElementsMatcher,
    dependenciesMatcher: DependenciesMatcher,
    config: DescriptorOptionsNormalized,
    micromatch: Micromatch
  ) {
    this._descriptors = new Descriptors(descriptors, config, micromatch);
    this._elementsMatcher = elementsMatcher;
    this._dependenciesMatcher = dependenciesMatcher;
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
  private _getDependencySelectorMatching(
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
    return this._getDependencySelectorMatching(
      descriptorOptions,
      selector as DependencySelector,
      options
    );
  }

  /**
   * Returns the selectors matching result for the given element or dependency description.
   * @param description The element or dependency  description to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, globals for dependency selectors, etc.
   * @returns The selectors matching result for the given description, and whether it matches or not.
   */
  public getSelectorMatchingDescription(
    description: DependencyDescription,
    selector: DependencySelector,
    options?: MatcherOptions
  ): DependencyMatchResult;
  public getSelectorMatchingDescription(
    description: ElementDescription,
    selector: ElementsSelector,
    options?: MatcherOptions
  ): ElementSelectorData;
  public getSelectorMatchingDescription(
    description: DependencyDescription | ElementDescription,
    selector: DependencySelector | ElementsSelector,
    options?: MatcherOptions
  ): DependencyMatchResult | ElementSelectorData | null {
    if (isElementsSelector(selector) && isElementDescription(description)) {
      return this._elementsMatcher.getSelectorMatching(
        description,
        selector,
        options
      );
    } else if (
      isDependencySelector(selector) &&
      isDependencyDescription(description)
    ) {
      return this._dependenciesMatcher.getSelectorsMatching(
        description,
        selector,
        options
      );
    }
    throw new Error(
      "Invalid arguments: Please provide a valid description and selector"
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
  }

  /**
   * Serializes the descriptors matchers cache to a plain object.
   * @returns The serialized cache
   */
  public serializeCache(): MatcherSerializedCache {
    return {
      descriptors: this._descriptors.serializeCache(),
    };
  }

  /**
   * Sets the descriptors matchers cache from a serialized object.
   * @param serializedCache The serialized cache
   */
  public setCacheFromSerialized(serializedCache: {
    descriptors: ReturnType<Descriptors["serializeCache"]>;
  }) {
    this._descriptors.setCacheFromSerialized(serializedCache.descriptors);
  }
}
