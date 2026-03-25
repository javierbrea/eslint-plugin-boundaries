import type { OriginDescription } from "./OriginDescription.types";

/**
 * Serialized cache of origin descriptions.
 */
export type OriginDescriptionsSerializedCache = Record<
  string,
  OriginDescription
>;

/**
 * Serialized cache for OriginsDescriptor class.
 */
export type OriginsDescriptorSerializedCache = {
  /** Serialized descriptions cache */
  descriptions: OriginDescriptionsSerializedCache;
};
