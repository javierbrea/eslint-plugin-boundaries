import type { DependencyDescriptorSerializedCache } from "./Dependency";
import type { ElementDescriptorSerializedCache } from "./Element";

/**
 * Serialized cache for Descriptors class.
 */
export type DescriptorsSerializedCache = {
  /** Serialized elements cache */
  elements: ElementDescriptorSerializedCache;
  /** Serialized dependencies cache */
  dependencies: DependencyDescriptorSerializedCache;
};
