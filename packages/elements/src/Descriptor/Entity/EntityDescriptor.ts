import { CacheManager, CacheManagerDisabled } from "../../Cache";
import type { DescriptorOptionsNormalized } from "../../Config";
import type { ElementsDescriptor } from "../Element";
import type { FilesDescriptor } from "../File";
import type { OriginsDescriptor } from "../Origin";

import type { EntityDescription } from "./EntityDescription.types";
import type { EntitiesDescriptorSerializedCache } from "./EntityDescriptor.types";

/**
 * Class describing entities in a project given their paths and configuration.
 */
export class EntitiesDescriptor {
  /**
   * Cache to store previously described entities.
   */
  private readonly _descriptionsCache:
    | CacheManager<string, EntityDescription>
    | CacheManagerDisabled<string, EntityDescription>;

  /**
   * Configuration instance for this descriptor.
   */
  private readonly _config: DescriptorOptionsNormalized;

  private readonly _elementsDescriptor: ElementsDescriptor;
  private readonly _filesDescriptor: FilesDescriptor;
  private readonly _originsDescriptor: OriginsDescriptor;

  /**
   * The configuration options for this descriptor.
   * @param elementsDescriptor The elements descriptor instance, used to describe elements when describing entities.
   * @param filesDescriptor The files descriptor instance, used to describe files when describing entities.
   * @param originsDescriptor The origins descriptor instance, used to describe the origin of entities when describing them.
   * @param config The configuration options for this descriptor.
   */
  constructor(
    elementsDescriptor: ElementsDescriptor,
    filesDescriptor: FilesDescriptor,
    originsDescriptor: OriginsDescriptor,
    config: DescriptorOptionsNormalized
  ) {
    this._elementsDescriptor = elementsDescriptor;
    this._filesDescriptor = filesDescriptor;
    this._originsDescriptor = originsDescriptor;
    this._config = config;
    this._descriptionsCache = this._config.cache
      ? new CacheManager<string, EntityDescription>()
      : new CacheManagerDisabled<string, EntityDescription>();
  }

  /**
   * Serializes the elements cache to a plain object.
   * @returns The serialized elements cache.
   */
  public serializeCache(): EntitiesDescriptorSerializedCache {
    return {
      descriptions: this._descriptionsCache.serialize(),
    };
  }

  /**
   * Sets the elements cache from a serialized object.
   * @param serializedCache The serialized files cache.
   */
  public setCacheFromSerialized(
    serializedCache: EntitiesDescriptorSerializedCache
  ): void {
    this._descriptionsCache.setFromSerialized(serializedCache.descriptions);
  }

  /**
   * Clears the files cache.
   */
  public clearCache(): void {
    this._descriptionsCache.clear();
  }

  /**
   * Describes an entity given its file path.
   * @param filePath The absolute path of the file to describe
   */
  public describeEntity(filePath?: string): EntityDescription {
    const cacheKey = `$${filePath}`;
    if (this._descriptionsCache.has(cacheKey)) {
      return this._descriptionsCache.get(cacheKey)!;
    }

    const elementDescription =
      this._elementsDescriptor.describeElement(filePath);
    const fileDescription = this._filesDescriptor.describeFile(filePath);
    const originDescription = this._originsDescriptor.describeOrigin(filePath);

    const entityDescription: EntityDescription = {
      element: elementDescription,
      file: fileDescription,
      origin: originDescription,
    };

    this._descriptionsCache.set(cacheKey, entityDescription);
    return entityDescription;
  }
}
