import type { ConfigOptions } from "../Config";
import type { ElementsDescriptorSerializedCache } from "../Descriptor";
import type { ElementDescriptors } from "../Descriptor/ElementsDescriptor.types";

/**
 * Serialized cache for Elements class.
 */
export type ElementsSerializedCache = {
  descriptors: Record<
    string,
    {
      config: ConfigOptions;
      elementDescriptors: ElementDescriptors;
      cache: ElementsDescriptorSerializedCache;
    }
  >;
};
