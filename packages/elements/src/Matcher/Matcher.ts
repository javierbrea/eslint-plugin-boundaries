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
  DescriptorsConfig,
} from "../Descriptor";
import { Descriptors } from "../Descriptor";
import {
  getLegacyDependencySelectorExtraTemplateData,
  getLegacyElementSelectorExtraTemplateData,
  getLegacyEntitySelectorExtraTemplateData,
} from "../Legacy";

import type {
  BackwardCompatibleDependencySelector,
  DependencySingleSelectorMatchResult,
} from "./Dependency";
import { DependenciesMatcher } from "./Dependency";
import type {
  BackwardCompatibleElementSelector,
  ElementSingleSelector,
} from "./Element";
import { ElementsMatcher } from "./Element";
import { EntitiesMatcher } from "./Entity";
import type {
  BackwardCompatibleEntitySelector,
  EntitySingleSelectorMatchResult,
} from "./Entity";
import { FilesMatcher } from "./File";
import type { MatcherSerializedCache } from "./Matcher.types";
import type { OriginSelector } from "./Origin";
import { OriginsMatcher } from "./Origin";
import type {
  Micromatch,
  MatcherOptions,
  EntityMatcherOptions,
} from "./Shared";

/**
 * Matcher class to evaluate if elements or dependencies match given selectors.
 */
export class Matcher {
  private readonly _elementsMatcher: ElementsMatcher;
  private readonly _filesMatcher: FilesMatcher;
  private readonly _entitiesMatcher: EntitiesMatcher;
  private readonly _originsMatcher: OriginsMatcher;
  private readonly _dependenciesMatcher: DependenciesMatcher;
  private readonly _originalDescriptors: DescriptorsConfig;
  private readonly _descriptorOptions: DescriptorOptionsNormalized;
  private readonly _micromatch: Micromatch;
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
    descriptors: DescriptorsConfig;
    options: {
      descriptors: DescriptorOptionsNormalized;
      matchers: MatchersOptionsNormalized;
    };
    micromatch: Micromatch;
  }) {
    this._originalDescriptors = descriptors;
    this._descriptorOptions = descriptorOptions;
    this._micromatch = micromatch;
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
   * @param selector The selector to match against
   * @param options Extra matcher options
   * @returns True if the element matches the selector, false otherwise
   */
  public isElementMatch(
    filePath: string,
    selector: BackwardCompatibleElementSelector,
    options?: MatcherOptions
  ): boolean {
    const description = this._descriptors.describeElement(filePath);
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyElementSelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

    return this._elementsMatcher.isElementMatch(
      description,
      selector,
      matcherOptions
    );
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
    selector: BackwardCompatibleDependencySelector,
    options?: MatcherOptions
  ): boolean {
    const description = this._descriptors.describeDependency(dependencyData);
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyDependencySelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

    return this._dependenciesMatcher.isDependencyMatch(
      description,
      selector,
      matcherOptions
    );
  }

  /**
   * Determines if an entity matches a given selector.
   * @param filePath The file path of the entity
   * @param selector The selector to match against
   * @param options Extra matcher options
   * @returns True if the entity matches the selector, false otherwise
   */
  public isEntityMatch(
    filePath: string,
    selector: BackwardCompatibleEntitySelector,
    options?: EntityMatcherOptions
  ): boolean {
    const description = this._descriptors.describeEntity(
      filePath,
      options?.source
    );
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyEntitySelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

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
   * @param selector The selector to match against
   * @param options Extra matcher options
   * @returns True if the entity matches the selector, false otherwise
   */
  public getEntitySelectorMatching(
    filePath: string,
    selector: BackwardCompatibleEntitySelector,
    options?: EntityMatcherOptions
  ) {
    const description = this._descriptors.describeEntity(
      filePath,
      options?.source
    );
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyEntitySelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

    return this._entitiesMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
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
    selector: BackwardCompatibleElementSelector,
    options?: MatcherOptions
  ) {
    const description = this._descriptors.describeElement(filePath);
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyElementSelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

    return this._elementsMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
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
    selector: BackwardCompatibleDependencySelector,
    options?: MatcherOptions
  ) {
    const description = this._descriptors.describeDependency(dependencyData);
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyDependencySelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

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
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The first selector matching result for the given entity and selector, or null if no match is found.
   */
  public getEntitySelectorMatchingDescription(
    description: EntityDescription,
    selector: BackwardCompatibleEntitySelector,
    options?: MatcherOptions
  ): EntitySingleSelectorMatchResult | null {
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyEntitySelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

    return this._entitiesMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
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
    selector: BackwardCompatibleDependencySelector,
    options?: MatcherOptions
  ): DependencySingleSelectorMatchResult | null {
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyDependencySelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

    return this._dependenciesMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
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
    selector: BackwardCompatibleElementSelector,
    options?: MatcherOptions
  ): ElementSingleSelector | null {
    const matcherOptions = {
      ...options,
      extraTemplateData: {
        ...getLegacyElementSelectorExtraTemplateData(description),
        ...options?.extraTemplateData,
      },
    };

    return this._elementsMatcher.getSelectorMatching(
      description,
      selector,
      matcherOptions
    );
  }

  public getOriginSelectorMatchingDescription(
    description: OriginDescription,
    selector: OriginSelector,
    options?: EntityMatcherOptions
  ) {
    return this._originsMatcher.getSelectorMatching(
      description,
      selector,
      options
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
