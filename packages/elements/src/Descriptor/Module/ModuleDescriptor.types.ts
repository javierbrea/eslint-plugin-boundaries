import type { ModuleDescription } from "./ModuleDescription.types";

/**
 * Serialized cache of module descriptions.
 */
export type ModuleDescriptionsSerializedCache = Record<
  string,
  ModuleDescription
>;

/**
 * Serialized cache for ModulesDescriptor class.
 */
export type ModulesDescriptorSerializedCache = {
  /** Serialized descriptions cache */
  descriptions: ModuleDescriptionsSerializedCache;
};
