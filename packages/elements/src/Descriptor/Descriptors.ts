import type { DescriptorOptionsNormalized } from "../Config";
import type { Micromatch } from "../Matcher";

import type {
  DependencyDescription,
  DependencyDescriptorOptions,
} from "./Dependency";
import { DependenciesDescriptor } from "./Dependency";
import type {
  DescriptorsConfig,
  DescriptorsSerializedCache,
} from "./Descriptors.types";
import type { ElementDescription } from "./Element";
import { ElementsDescriptor } from "./Element";
import { EntitiesDescriptor } from "./Entity";
import type { EntityDescription } from "./Entity";
import type { FileDescription } from "./File";
import { FilesDescriptor } from "./File";
import { OriginsDescriptor } from "./Origin";
import type { OriginDescription } from "./Origin";

/**
 * Class with methods to describe files, elements, entities, and dependencies between them.
 */
export class Descriptors {
  private readonly _elementsDescriptor: ElementsDescriptor;
  private readonly _filesDescriptor: FilesDescriptor;
  private readonly _dependenciesDescriptor: DependenciesDescriptor;
  private readonly _entitiesDescriptor: EntitiesDescriptor;
  private readonly _originsDescriptor: OriginsDescriptor;

  /** Creates a new DescriptorsManager instance
   * @param descriptors The descriptors.
   * @param configOptions The configuration options.
   * @param micromatch The Micromatch instance.
   */
  constructor(
    descriptors: DescriptorsConfig,
    config: DescriptorOptionsNormalized,
    micromatch: Micromatch
  ) {
    this._elementsDescriptor = new ElementsDescriptor(
      descriptors.elements || [],
      config,
      micromatch
    );
    this._filesDescriptor = new FilesDescriptor(
      descriptors.files || [],
      config,
      micromatch
    );
    this._originsDescriptor = new OriginsDescriptor(config, micromatch);
    this._entitiesDescriptor = new EntitiesDescriptor(
      this._elementsDescriptor,
      this._filesDescriptor,
      this._originsDescriptor,
      config
    );
    this._dependenciesDescriptor = new DependenciesDescriptor(
      this._entitiesDescriptor,
      config
    );
  }

  /**
   * Serializes the elements, files, entities, and dependencies cache to a plain object.
   * @returns The serialized elements, files, entities, and dependencies cache.
   */
  public serializeCache(): DescriptorsSerializedCache {
    return {
      elements: this._elementsDescriptor.serializeCache(),
      files: this._filesDescriptor.serializeCache(),
      entities: this._entitiesDescriptor.serializeCache(),
      dependencies: this._dependenciesDescriptor.serializeCache(),
      origins: this._originsDescriptor.serializeCache(),
    };
  }

  /**
   * Sets the elements, files, entities, and dependencies cache from a serialized object.
   * @param serializedCache The serialized elements, files, entities, and dependencies cache.
   */
  public setCacheFromSerialized(
    serializedCache: DescriptorsSerializedCache
  ): void {
    this._elementsDescriptor.setCacheFromSerialized(serializedCache.elements);
    this._filesDescriptor.setCacheFromSerialized(serializedCache.files);
    this._entitiesDescriptor.setCacheFromSerialized(serializedCache.entities);
    this._dependenciesDescriptor.setCacheFromSerialized(
      serializedCache.dependencies
    );
    this._originsDescriptor.setCacheFromSerialized(serializedCache.origins);
  }

  /**
   * Clears all caches.
   */
  public clearCache(): void {
    this._elementsDescriptor.clearCache();
    this._filesDescriptor.clearCache();
    this._entitiesDescriptor.clearCache();
    this._dependenciesDescriptor.clearCache();
    this._originsDescriptor.clearCache();
  }

  /**
   * Describes an element given its file path.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  public describeElement(filePath?: string): ElementDescription {
    return this._elementsDescriptor.describeElement(filePath);
  }

  /**
   * Returns the description of a file given its path.
   * @param filePath The path of the file to describe.
   * @returns The description of the file.
   */
  public describeFile(filePath: string): FileDescription {
    return this._filesDescriptor.describeFile(filePath);
  }

  /**
   * Describes a file given its path. It returns both the file description and the element description.
   * @param filePath The path of the file to describe.
   * @param source The optional dependency source (e.g., the importer file path) to use for describing the origin of the entity being imported.
   * @returns The entity description of the file, including both the file description and the element description.
   */
  public describeEntity(filePath: string, source?: string): EntityDescription {
    return this._entitiesDescriptor.describeEntity(filePath, source);
  }

  /**
   * Describes the origin of a file given its path and the path of the importer file.
   * @param filePath The path of the file to describe.
   * @param source The optional dependency source (e.g., the importer file path) to use for describing the origin of the entity being imported.
   * @returns The description of the file's origin.
   */
  public describeOrigin(filePath?: string, source?: string): OriginDescription {
    return this._originsDescriptor.describeOrigin(filePath, source);
  }

  /**
   * Describes elements in a dependency relationship, and provides additional information about the dependency itself.
   * @param options The options for describing the elements and the dependency details.
   * @returns The description of the dependency between the elements.
   */
  public describeDependency(
    options: DependencyDescriptorOptions
  ): DependencyDescription {
    return this._dependenciesDescriptor.describeDependency(options);
  }
}
