import type { EntityDescription } from "./EntityDescription.types";

/**
 * Serialized cache of entity descriptions.
 */
export type EntityDescriptionsSerializedCache = Record<
  string,
  EntityDescription
>;

/**
 * Serialized cache for EntitiesDescriptor class.
 */
export type EntitiesDescriptorSerializedCache = {
  /** Serialized descriptions cache */
  descriptions: EntityDescriptionsSerializedCache;
};
