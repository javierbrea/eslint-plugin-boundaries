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
  ElementDescription,
  FileDescription,
  FileDescriptors,
} from "./ElementsDescriptor.types";
import { FilesDescriptor } from "./FilesDescriptor";

/**
 * Class with methods to describe elements and dependencies between them.
 */
export class Descriptors {
  private readonly _elementsDescriptor: ElementsDescriptor;
  private readonly _dependenciesDescriptor: DependenciesDescriptor;
  private readonly _filesDescriptor: FilesDescriptor;
  private readonly _hasFileDescriptors: boolean;

  /** Creates a new DescriptorsManager instance
   * @param elementDescriptors The element descriptors.
   * @param configOptions The configuration options.
   * @param micromatch The Micromatch instance.
   */
  constructor(
    elementDescriptors: ElementDescriptors,
    config: DescriptorOptionsNormalized,
    micromatch: Micromatch,
    fileDescriptors?: FileDescriptors
  ) {
    this._elementsDescriptor = new ElementsDescriptor(
      elementDescriptors,
      config,
      micromatch
    );
    this._hasFileDescriptors = Boolean(fileDescriptors);
    this._filesDescriptor = new FilesDescriptor(
      this._elementsDescriptor,
      fileDescriptors || [],
      config,
      micromatch
    );
    this._dependenciesDescriptor = new DependenciesDescriptor(
      this._elementsDescriptor,
      this._filesDescriptor,
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
      files: this._hasFileDescriptors
        ? this._filesDescriptor.serializeCache()
        : undefined,
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
    if (serializedCache.files) {
      this._filesDescriptor.setCacheFromSerialized(serializedCache.files);
    }
  }

  /**
   * Clears all caches.
   */
  public clearCache(): void {
    this._elementsDescriptor.clearCache();
    this._dependenciesDescriptor.clearCache();
    this._filesDescriptor.clearCache();
  }

  /**
   * Describes an element given its file path.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  public describeElement(filePath?: string): ElementDescription | null {
    return this._elementsDescriptor.describeElement(filePath);
  }

  /**
   * Describes a file given its file path.
   * @param filePath The path of the file to describe.
   * @returns The description of the file.
   */
  public describeFile(filePath?: string): FileDescription {
    if (!this._hasFileDescriptors) {
      throw new Error(
        "Files descriptor is not configured. Please provide fileDescriptors when creating the matcher."
      );
    }
    return this._filesDescriptor.describeFile(filePath);
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
