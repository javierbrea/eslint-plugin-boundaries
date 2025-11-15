import type { DescriptorOptionsNormalized } from "../Config";
import type { Micromatch } from "../Matcher";

import { DependenciesDescriptor } from "./DependenciesDescriptor";
import type {
  DependencyDescription,
  DescribeDependencyOptions,
} from "./DependenciesDescriptor.types";
import type { DescriptorsSerializedCache } from "./Descriptors.types";
import { ElementsDescriptor } from "./ElementsDescriptor";
import type {
  ElementDescriptors,
  DependencyElementDescription,
  FileElement,
} from "./ElementsDescriptor.types";

/**
 * Class with methods to describe elements and dependencies between them.
 */
export class Descriptors {
  private readonly _elementsDescriptor: ElementsDescriptor;
  private readonly _dependenciesDescriptor: DependenciesDescriptor;

  /** Creates a new DescriptorsManager instance
   * @param elementDescriptors The element descriptors.
   * @param configOptions The configuration options.
   * @param micromatch The Micromatch instance.
   */
  constructor(
    elementDescriptors: ElementDescriptors,
    config: DescriptorOptionsNormalized,
    micromatch: Micromatch
  ) {
    this._elementsDescriptor = new ElementsDescriptor(
      elementDescriptors,
      config,
      micromatch
    );
    this._dependenciesDescriptor = new DependenciesDescriptor(
      this._elementsDescriptor,
      config
    );
  }

  /**
   * Serializes the elements and dependencies cache to a plain object.
   * @returns The serialized elements and dependencies cache.
   */
  public serializeCache(): DescriptorsSerializedCache {
    return {
      elements: this._elementsDescriptor.serializeCache(),
      dependencies: this._dependenciesDescriptor.serializeCache(),
    };
  }

  /**
   * Sets the elements and dependencies cache from a serialized object.
   * @param serializedCache The serialized elements and dependencies cache.
   */
  public setCacheFromSerialized(
    serializedCache: DescriptorsSerializedCache
  ): void {
    this._elementsDescriptor.setCacheFromSerialized(serializedCache.elements);
    this._dependenciesDescriptor.setCacheFromSerialized(
      serializedCache.dependencies
    );
  }

  /**
   * Clears all caches.
   */
  public clearCache(): void {
    this._elementsDescriptor.clearCache();
    this._dependenciesDescriptor.clearCache();
  }

  /**
   * Describes an element given its file path.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  public describeElement(filePath?: string): FileElement {
    return this._elementsDescriptor.describeElement(filePath);
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
  ): DependencyElementDescription {
    return this._elementsDescriptor.describeDependencyElement(
      dependencySource,
      filePath
    );
  }

  /**
   * Describes elements in a dependency relationship, and provides additional information about the dependency itself.
   * @param options The options for describing the elements and the dependency details.
   * @returns The description of the dependency between the elements.
   */
  public describeDependency(
    options: DescribeDependencyOptions
  ): DependencyDescription {
    return this._dependenciesDescriptor.describeDependency(options);
  }
}
