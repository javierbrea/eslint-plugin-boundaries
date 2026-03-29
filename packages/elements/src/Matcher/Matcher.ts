import type {
  DescriptorOptionsNormalized,
  MatchersOptionsNormalized,
} from "../Config";
import type {
  DependencyDescriptorOptions,
  ElementDescription,
  DependencyDescription,
  EntityDescription,
  OriginDescription,
} from "../Descriptor";
import {
  Descriptors,
  isElementDescription,
  isDependencyDescription,
  isEntityDescription,
  isOriginDescription,
} from "../Descriptor";
import {
  getLegacyDependencySelectorExtraTemplateData,
  getLegacyElementSelectorExtraTemplateData,
  getLegacyEntitySelectorExtraTemplateData,
  isLegacyDescriptorsConfig,
  isLegacyDependencySelector,
  isLegacyElementSelector,
  convertLegacyElementSelector,
  convertLegacyDependencySelector,
  convertLegacyEntitySelector,
  isLegacyEntitySelector,
} from "../Legacy";
import type {
  BackwardCompatibleDependencySelector,
  BackwardCompatibleDescriptorsConfig,
  BackwardCompatibleElementSelector,
  BackwardCompatibleEntitySelector,
} from "../Legacy";

import type {
  DependencySelector,
  DependencySingleSelectorMatchResult,
} from "./Dependency";
import { isDependencySelector, DependenciesMatcher } from "./Dependency";
import type { ElementSelector, ElementSingleSelector } from "./Element";
import { isElementSelector, ElementsMatcher } from "./Element";
import { EntitiesMatcher, isEntitySelector } from "./Entity";
import type { EntitySelector, EntitySingleSelectorMatchResult } from "./Entity";
import { FilesMatcher } from "./File";
import type { MatcherSerializedCache } from "./Matcher.types";
import type { OriginSelector } from "./Origin";
import { isOriginSelector, OriginsMatcher } from "./Origin";
import type {
  Micromatch,
  MatcherOptions,
  EntityMatcherOptions,
} from "./Shared";

const INVALID_SELECTOR_OR_DESCRIPTION_ERROR =
  "Invalid arguments: Please provide valid descriptions and selectors of the correct type.";

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
  private _legacyDescriptorsOrSelectorsDetected = false;
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
    this._legacyDescriptorsOrSelectorsDetected =
      isLegacyDescriptorsConfig(descriptors);
    this._descriptors = new Descriptors(
      this._originalDescriptors,
      this._descriptorOptions,
      this._micromatch
    );

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
   * Transforms a backward compatible dependency selector into a new format dependency selector, converting it if it's in legacy format.
   * It also checks for mixed legacy and non-legacy selectors or descriptors and throws an error if such a case is detected.
   * @param selector The backward compatible dependency selector to transform into a new format dependency selector.
   * @returns The new format dependency selector, converted from legacy format if necessary.
   */
  private _backwardCompatibleDependencySelector(
    selector: BackwardCompatibleDependencySelector
  ): DependencySelector {
    if (isLegacyDependencySelector(selector)) {
      this._legacyDescriptorsOrSelectorsDetected = true;
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
      this._legacyDescriptorsOrSelectorsDetected = true;
      return convertLegacyElementSelector(selector);
    }
    return selector;
  }

  /**
   * Converts a backward compatible entity selector into a new format entity selector, converting it if it's in legacy format.
   * It also checks for mixed legacy and non-legacy selectors or descriptors and throws an error if such a case is detected.
   * @param selector The backward compatible entity selector to convert into a new format entity selector.
   * @returns The new format entity selector, converted from legacy format if necessary.
   */
  private _backwardCompatibleEntitySelector(
    selector: BackwardCompatibleEntitySelector
  ): EntitySelector {
    if (isLegacyEntitySelector(selector)) {
      this._legacyDescriptorsOrSelectorsDetected = true;
      return convertLegacyEntitySelector(selector);
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
   * Describes an entity given its file path, including both the file, element and origin description.
   * @param filePath The path of the file to describe.
   * @param source The optional dependency source (e.g., the importer file path) to use for describing the origin of the entity being imported.
   * @returns The description of the entity.
   */
  public describeEntity(filePath: string, source?: string) {
    return this._descriptors.describeEntity(filePath, source);
  }

  /**
   * Describes the origin of a file given its path and the path of the importer file.
   * @param filePath The path of the file to describe.
   * @param source The optional dependency source (e.g., the importer file path) to use for describing the origin of the entity being imported.
   * @returns The description of the file's origin.
   */
  public describeOrigin(filePath?: string, source?: string) {
    return this._descriptors.describeOrigin(filePath, source);
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
    const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
      ? {
          ...options,
          extraTemplateData: {
            ...getLegacyElementSelectorExtraTemplateData(description),
            ...options?.extraTemplateData,
          },
        }
      : options;

    return this._elementsMatcher.isElementMatch(
      description,
      selector,
      matcherOptions
    );
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
    const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
      ? {
          ...options,
          extraTemplateData: {
            ...getLegacyDependencySelectorExtraTemplateData(description),
            ...options?.extraTemplateData,
          },
        }
      : options;

    return this._dependenciesMatcher.isDependencyMatch(
      description,
      selector,
      matcherOptions
    );
  }

  /**
   * Determines if an entity matches a given selector.
   * @param filePath The file path of the entity
   * @param backwardCompatibleSelector The selector to match against
   * @param options Extra matcher options
   * @returns True if the entity matches the selector, false otherwise
   */
  public isEntityMatch(
    filePath: string,
    backwardCompatibleSelector: BackwardCompatibleEntitySelector,
    options?: EntityMatcherOptions
  ): boolean {
    const selector = this._backwardCompatibleEntitySelector(
      backwardCompatibleSelector
    );
    const description = this._descriptors.describeEntity(
      filePath,
      options?.source
    );
    const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
      ? {
          ...options,
          extraTemplateData: {
            ...getLegacyEntitySelectorExtraTemplateData(description),
            ...options?.extraTemplateData,
          },
        }
      : options;

    return this._entitiesMatcher.isEntityMatch(
      description,
      selector,
      matcherOptions
    );
  }

  /**
   * Determines if an origin matches a given selector.
   * @param filePath The file path of the origin
   * @param selector The selector to match against
   * @param options Extra matcher options
   * @returns True if the origin matches the selector, false otherwise
   */
  public isOriginMatch(
    filePath: string,
    selector: OriginSelector,
    options?: EntityMatcherOptions
  ): boolean {
    const description = this._descriptors.describeOrigin(
      filePath,
      options?.source
    );
    return this._originsMatcher.isOriginMatch(description, selector, options);
  }

  /**
   * Determines if an entity matches a given selector.
   * @param filePath The file path of the entity
   * @param backwardCompatibleSelector The selector to match against
   * @param options Extra matcher options
   * @returns True if the entity matches the selector, false otherwise
   */
  public getEntitySelectorMatching(
    filePath: string,
    backwardCompatibleSelector: BackwardCompatibleEntitySelector,
    options?: EntityMatcherOptions
  ) {
    const selector = this._backwardCompatibleEntitySelector(
      backwardCompatibleSelector
    );
    const description = this._descriptors.describeEntity(
      filePath,
      options?.source
    );
    const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
      ? {
          ...options,
          extraTemplateData: {
            ...getLegacyEntitySelectorExtraTemplateData(description),
            ...options?.extraTemplateData,
          },
        }
      : options;

    return this._entitiesMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
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
    const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
      ? {
          ...options,
          extraTemplateData: {
            ...getLegacyElementSelectorExtraTemplateData(description),
            ...options?.extraTemplateData,
          },
        }
      : options;

    return this._elementsMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
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
    const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
      ? {
          ...options,
          extraTemplateData: {
            ...getLegacyDependencySelectorExtraTemplateData(description),
            ...options?.extraTemplateData,
          },
        }
      : options;

    return this._dependenciesMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
    );
  }

  /**
   * Determines the selector matching for an origin.
   * @param filePath The file path of the origin
   * @param selector The selector to match against
   * @param options Extra options for matching
   * @returns The matching origin result or null if no match is found
   */
  public getOriginSelectorMatching(
    filePath: string,
    selector: OriginSelector,
    options?: EntityMatcherOptions
  ) {
    const description = this._descriptors.describeOrigin(
      filePath,
      options?.source
    );
    return this._originsMatcher.getSelectorMatching(
      description,
      selector,
      options
    );
  }

  /**
   * Returns the first selector matching result for the given entity and selector.
   * @param description The entity description to check.
   * @param backwardCompatibleSelector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The first selector matching result for the given entity and selector, or null if no match is found.
   */
  public getEntitySelectorMatchingDescription(
    description: EntityDescription,
    backwardCompatibleSelector: BackwardCompatibleEntitySelector,
    options?: MatcherOptions
  ): EntitySingleSelectorMatchResult | null {
    const selector = this._backwardCompatibleEntitySelector(
      backwardCompatibleSelector
    );
    if (isEntitySelector(selector) && isEntityDescription(description)) {
      const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
        ? {
            ...options,
            extraTemplateData: {
              ...getLegacyEntitySelectorExtraTemplateData(description),
              ...options?.extraTemplateData,
            },
          }
        : options;

      return this._entitiesMatcher.getSelectorMatching(
        description,
        selector,
        matcherOptions
      );
    }
    throw new Error(INVALID_SELECTOR_OR_DESCRIPTION_ERROR);
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
  ): DependencySingleSelectorMatchResult | null {
    const selector = this._backwardCompatibleDependencySelector(
      backwardCompatibleSelector
    );
    if (
      isDependencySelector(selector) &&
      isDependencyDescription(description)
    ) {
      const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
        ? {
            ...options,
            extraTemplateData: {
              ...getLegacyDependencySelectorExtraTemplateData(description),
              ...options?.extraTemplateData,
            },
          }
        : options;

      return this._dependenciesMatcher.getSelectorMatching(
        description,
        selector,
        matcherOptions
      );
    }
    throw new Error(INVALID_SELECTOR_OR_DESCRIPTION_ERROR);
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
      const matcherOptions = this._legacyDescriptorsOrSelectorsDetected
        ? {
            ...options,
            extraTemplateData: {
              ...getLegacyElementSelectorExtraTemplateData(description),
              ...options?.extraTemplateData,
            },
          }
        : options;

      return this._elementsMatcher.getSelectorMatching(
        description,
        selector,
        matcherOptions
      );
    }
    throw new Error(INVALID_SELECTOR_OR_DESCRIPTION_ERROR);
  }

  public getOriginSelectorMatchingDescription(
    description: OriginDescription,
    selector: OriginSelector,
    options?: EntityMatcherOptions
  ) {
    if (isOriginSelector(selector) && isOriginDescription(description)) {
      return this._originsMatcher.getSelectorMatching(
        description,
        selector,
        options
      );
    }
    throw new Error(INVALID_SELECTOR_OR_DESCRIPTION_ERROR);
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
