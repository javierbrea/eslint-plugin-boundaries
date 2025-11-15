import type { DependenciesDescriptorSerializedCache } from "./DependenciesDescriptor.types";
import type { ElementsDescriptorSerializedCache } from "./ElementsDescriptor.types";

/**
 * Serialized cache for Descriptors class.
 */
export type DescriptorsSerializedCache = {
  /** Serialized elements cache */
  elements: ElementsDescriptorSerializedCache;
  /** Serialized dependencies cache */
  dependencies: DependenciesDescriptorSerializedCache;
};
