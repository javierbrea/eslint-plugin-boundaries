import type { ConfigOptions } from "../Config";

import { DependenciesDescriptor } from "./DependenciesDescriptor";
import type {
  DependencyDescription,
  DescribeDependencyOptions,
} from "./DependenciesDescriptor.types";
import type { DescriptorsSerializedCache } from "./Descriptors.types";
import { ElementsDescriptor } from "./ElementsDescriptor";
import type {
  ElementDescriptors,
  ElementDescription,
  LocalElementUnknown,
  DependencyElement,
  FileElement,
  IgnoredElement,
} from "./ElementsDescriptor.types";

/**
 * Class with methods to describe elements and dependencies between them.
 */
export class Descriptors {
  private _elementsDescriptor: ElementsDescriptor;
  private _dependenciesDescriptor: DependenciesDescriptor;

  /** Creates a new DescriptorsManager instance
   * @param elementDescriptors The element descriptors.
   * @param configOptions The configuration options.
   */
  constructor(
    elementDescriptors: ElementDescriptors,
    configOptions?: ConfigOptions,
  ) {
    this._elementsDescriptor = new ElementsDescriptor(
      elementDescriptors,
      configOptions,
    );
    this._dependenciesDescriptor = new DependenciesDescriptor(
      this._elementsDescriptor,
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
    serializedCache: DescriptorsSerializedCache,
  ): void {
    this._elementsDescriptor.setCacheFromSerialized(serializedCache.elements);
    this._dependenciesDescriptor.setCacheFromSerialized(
      serializedCache.dependencies,
    );
  }

  /**
   * Describes an element given its file path and dependency source, if any.
   * @param filePath The path of the file to describe.
   * @param dependencySource The source of the dependency, if the element to describe is so. It refers to the import/export path used to reference the file or external module.
   * @returns The description of the element.
   */
  public describeElement(): LocalElementUnknown;
  public describeElement(
    // eslint-disable-next-line no-unused-vars
    filePath?: string,
  ): FileElement;
  public describeElement(
    // eslint-disable-next-line no-unused-vars
    filePath?: string,
    // eslint-disable-next-line no-unused-vars
    dependencySource?: string,
  ): DependencyElement | IgnoredElement;

  public describeElement(
    filePath?: string,
    dependencySource?: string,
  ): ElementDescription {
    return this._elementsDescriptor.describeElement(filePath, dependencySource);
  }

  /**
   * Describes elements in a dependency relationship, and provides additional information about the dependency itself.
   * @param options The options for describing the elements and the dependency details.
   * @returns The description of the dependency between the elements.
   */
  public describeDependency(
    options: DescribeDependencyOptions,
  ): DependencyDescription {
    return this._dependenciesDescriptor.describeDependency(options);
  }
}
