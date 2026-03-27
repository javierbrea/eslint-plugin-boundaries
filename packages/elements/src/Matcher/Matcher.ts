import type {
  DescriptorOptionsNormalized,
  MatchersOptionsNormalized,
} from "../Config";
import type {
  DependencyDescriptorOptions,
  ElementDescription,
  DependencyDescription,
  DescriptorsConfig,
} from "../Descriptor";
import {
  Descriptors,
  isElementDescription,
  isDependencyDescription,
} from "../Descriptor";
import {
  convertLegacyDescriptorsConfig,
  isLegacyDescriptorsConfig,
  isLegacyDependencySelector,
  isLegacyElementSelector,
  convertLegacyElementSelector,
  convertLegacyDependencySelector,
} from "../Legacy";
import type {
  BackwardCompatibleDependencySelector,
  BackwardCompatibleDescriptorsConfig,
  BackwardCompatibleElementSelector,
} from "../Legacy";

import type { DependencyMatchResult, DependencySelector } from "./Dependency";
import { isDependencySelector, DependenciesMatcher } from "./Dependency";
import type { ElementSelector, ElementSingleSelector } from "./Element";
import { isElementSelector, ElementsMatcher } from "./Element";
import { EntitiesMatcher } from "./Entity";
import { FilesMatcher } from "./File";
import type { MatcherSerializedCache } from "./Matcher.types";
import { OriginsMatcher } from "./Origin";
import type { Micromatch, MatcherOptions } from "./Shared";

const MIXED_LEGACY_AND_NON_LEGACY_ERROR =
  "Invalid configuration: Mixing legacy and non-legacy descriptors or selectors is not allowed. Please update your configuration to use non-legacy descriptors and selectors.";

/**
 * Matcher class to evaluate if elements or dependencies match given selectors.
 */
export class Matcher {
  private readonly _elementsMatcher: ElementsMatcher;
  private readonly _filesMatcher: FilesMatcher;
  private readonly _entitiesMatcher: EntitiesMatcher;
  private readonly _originsMatcher: OriginsMatcher;
  private readonly _dependenciesMatcher: DependenciesMatcher;
  private readonly _originalDescriptors: BackwardCompatibleDescriptorsConfig;
  private readonly _descriptorOptions: DescriptorOptionsNormalized;
  private readonly _micromatch: Micromatch;
  private _legacyDescriptorsConverted: DescriptorsConfig | null;
  private _descriptors: Descriptors;

  /**
   * Constructor for the Matcher class.
   * @param options The options to configure the Matcher instance, including descriptors, matchers for elements and dependencies, and micromatch instance for pattern matching.
   * @param options.descriptors The descriptors configuration to use for describing elements and dependencies.
   * @param options.options.descriptors The normalized descriptor options to use for describing elements and dependencies.
   * @param options.options.matchers The matchers configuration for elements and dependencies.
   * @param options.micromatch The micromatch instance to use for pattern matching.
   */
  constructor({
    descriptors,
    options: { descriptors: descriptorOptions, matchers: matchersOptions },
    micromatch,
  }: {
    descriptors: BackwardCompatibleDescriptorsConfig;
    options: {
      descriptors: DescriptorOptionsNormalized;
      matchers: MatchersOptionsNormalized;
    };
    micromatch: Micromatch;
  }) {
    this._originalDescriptors = descriptors;
    this._descriptorOptions = descriptorOptions;
    this._micromatch = micromatch;
    this._createOrConvertDescriptors(isLegacyDescriptorsConfig(descriptors));

    // end of getDescriptors method
    this._elementsMatcher = new ElementsMatcher(matchersOptions, micromatch);
    this._filesMatcher = new FilesMatcher(matchersOptions, micromatch);
    this._originsMatcher = new OriginsMatcher(matchersOptions, micromatch);
    this._entitiesMatcher = new EntitiesMatcher(
      this._elementsMatcher,
      this._filesMatcher,
      this._originsMatcher,
      matchersOptions,
      micromatch
    );

    this._dependenciesMatcher = new DependenciesMatcher(
      this._entitiesMatcher,
      matchersOptions,
      micromatch
    );
  }

  /**
   * Creates the descriptors instance from the original descriptors configuration, converting it if it's in legacy format.
   * This method ensures that the descriptors are created in a consistent format and that legacy configurations are properly converted to the new format.
   * It also checks for mixed legacy and non-legacy configurations and throws an error if such a case is detected.
   * @param convertFromLegacy Whether the descriptors should be converted from legacy format or not.
   */
  private _createOrConvertDescriptors(convertFromLegacy: boolean): void {
    if (!convertFromLegacy && this._legacyDescriptorsConverted) {
      throw new Error(MIXED_LEGACY_AND_NON_LEGACY_ERROR);
    }
    if (convertFromLegacy && !this._legacyDescriptorsConverted) {
      if (!isLegacyDescriptorsConfig(this._originalDescriptors)) {
        throw new Error(MIXED_LEGACY_AND_NON_LEGACY_ERROR);
      }
      this._legacyDescriptorsConverted = convertLegacyDescriptorsConfig(
        this._originalDescriptors
      );
      this._descriptors = new Descriptors(
        this._legacyDescriptorsConverted,
        this._descriptorOptions,
        this._micromatch
      );
    }
    if (!this._descriptors) {
      this._descriptors = new Descriptors(
        this._originalDescriptors,
        this._descriptorOptions,
        this._micromatch
      );
    }
  }

  /**
   * Transforms a backward compatible dependency selector into a new format dependency selector, converting it if it's in legacy format.
   * It also checks for mixed legacy and non-legacy selectors or descriptors and throws an error if such a case is detected.
   * @param selector The backward compatible dependency selector to transform into a new format dependency selector.
   * @returns The new format dependency selector, converted from legacy format if necessary.
   */
  private _backwardCompatibleDependencySelector(
    selector: BackwardCompatibleDependencySelector
  ): DependencySelector {
    if (isLegacyDependencySelector(selector)) {
      this._createOrConvertDescriptors(true);
      return convertLegacyDependencySelector(selector);
    }
    return selector;
  }

  /**
   * Converts a backward compatible element selector into a new format element selector, converting it if it's in legacy format.
   * It also checks for mixed legacy and non-legacy selectors or descriptors and throws an error if such a case is detected.
   * @param selector The backward compatible element selector to convert into a new format element selector.
   * @returns The new format element selector, converted from legacy format if necessary.
   */
  private _backwardCompatibleElementSelector(
    selector: BackwardCompatibleElementSelector
  ): ElementSelector {
    if (isLegacyElementSelector(selector)) {
      this._createOrConvertDescriptors(true);
      return convertLegacyElementSelector(selector);
    }
    return selector;
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
   * @param backwardCompatibleSelector The selector to match against
   * @param options Extra matcher options
   * @returns True if the element matches the selector, false otherwise
   */
  public isElementMatch(
    filePath: string,
    backwardCompatibleSelector: BackwardCompatibleElementSelector,
    options?: MatcherOptions
  ): boolean {
    const selector = this._backwardCompatibleElementSelector(
      backwardCompatibleSelector
    );
    const description = this._descriptors.describeElement(filePath);
    return this._elementsMatcher.isElementMatch(description, selector, options);
  }

  /**
   * Determines if a dependency matches a given selector.
   * @param dependencyData The data describing the dependency
   * @param backwardCompatibleSelector The selector to match against
   * @param options Extra matcher options
   * @returns True if the dependency matches the selector, false otherwise
   */
  public isDependencyMatch(
    dependencyData: DependencyDescriptorOptions,
    backwardCompatibleSelector: BackwardCompatibleDependencySelector,
    options?: MatcherOptions
  ): boolean {
    const selector = this._backwardCompatibleDependencySelector(
      backwardCompatibleSelector
    );
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
   * @param backwardCompatibleSelector The selectors to match against
   * @param options Extra options for matching
   * @returns The matching selector data or null if no match is found
   */
  public getElementSelectorMatching(
    filePath: string,
    backwardCompatibleSelector: BackwardCompatibleElementSelector,
    options?: MatcherOptions
  ) {
    const selector = this._backwardCompatibleElementSelector(
      backwardCompatibleSelector
    );
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
   * @param backwardCompatibleSelector The selectors to match against
   * @param options Extra options for matching
   * @returns The matching dependency result or null if no match is found
   */
  public getDependencySelectorMatching(
    dependencyData: DependencyDescriptorOptions,
    backwardCompatibleSelector: BackwardCompatibleDependencySelector,
    options?: MatcherOptions
  ) {
    const selector = this._backwardCompatibleDependencySelector(
      backwardCompatibleSelector
    );
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
   * @param backwardCompatibleSelector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The selectors matching result for the given description, and whether it matches or not.
   */
  public getDependencySelectorMatchingDescription(
    description: DependencyDescription,
    backwardCompatibleSelector: BackwardCompatibleDependencySelector,
    options?: MatcherOptions
  ): DependencyMatchResult {
    const selector = this._backwardCompatibleDependencySelector(
      backwardCompatibleSelector
    );
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
   * @param backwardCompatibleSelector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The first matching selector result for the given description, or null if no match is found.
   */
  public getElementSelectorMatchingDescription(
    description: ElementDescription,
    backwardCompatibleSelector: BackwardCompatibleElementSelector,
    options?: MatcherOptions
  ): ElementSingleSelector | null {
    const selector = this._backwardCompatibleElementSelector(
      backwardCompatibleSelector
    );
    if (isElementSelector(selector) && isElementDescription(description)) {
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
