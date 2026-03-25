import type { DescriptorOptionsNormalized } from "../Config";
import type {
  ElementDescriptors,
  DependencyDescriptorOptions,
  ElementDescription,
  DependencyDescription,
} from "../Descriptor";
import {
  Descriptors,
  isElementDescription,
  isDependencyDescription,
} from "../Descriptor";

import type {
  DependenciesMatcher,
  DependencySingleSelector,
  DependencyMatchResult,
} from "./Dependency";
import type {
  ElementsMatcher,
  ElementSelector,
  ElementSingleSelector,
} from "./Element";
import { isDependencySelector, isElementsSelector } from "./Element";
import type { MatcherSerializedCache } from "./Matcher.types";
import type { Micromatch, MatcherOptions } from "./Shared";

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
   * Describes an element given its file path.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  public describeElement(filePath: string) {
    return this._descriptors.describeElement(filePath);
  }

  /**
   * Describes elements in a dependency relationship, and provides additional information about the dependency itself.
   * @param options The options for describing the elements and the dependency details.
   * @returns The description of the dependency between the elements.
   */
  public describeDependency(options: DependencyDescriptorOptions) {
    return this._descriptors.describeDependency(options);
  }

  /**
   * Determines if an element matches a given selector.
   * @param filePath The file path of the element
   * @param selector The selector to match against
   * @param options Extra matcher options
   * @returns True if the element matches the selector, false otherwise
   */
  public isElementMatch(
    filePath: string,
    selector: ElementSelector,
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
  public isDependencyMatch(
    dependencyData: DependencyDescriptorOptions,
    selector: DependencySingleSelector,
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
   * Determines the selector matching for an element.
   * @param filePath The file path of the element
   * @param selector The selectors to match against
   * @param options Extra options for matching
   * @returns The matching selector data or null if no match is found
   */
  public getElementSelectorMatching(
    filePath: string,
    selector: ElementSelector,
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
  public getDependencySelectorMatching(
    dependencyData: DependencyDescriptorOptions,
    selector: DependencySingleSelector,
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
   * Returns the selectors matching result for the given element or dependency description.
   * @param description The element or dependency  description to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The selectors matching result for the given description, and whether it matches or not.
   */
  public getDependencySelectorMatchingDescription(
    description: DependencyDescription,
    selector: DependencySingleSelector,
    options?: MatcherOptions
  ): DependencyMatchResult {
    if (
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
   * Returns the first element selector matching result for the given element description.
   * @param description The element description to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The first matching selector result for the given description, or null if no match is found.
   */
  public getElementSelectorMatchingDescription(
    description: ElementDescription,
    selector: ElementSelector,
    options?: MatcherOptions
  ): ElementSingleSelector | null {
    if (isElementsSelector(selector) && isElementDescription(description)) {
      return this._elementsMatcher.getSelectorMatching(
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
