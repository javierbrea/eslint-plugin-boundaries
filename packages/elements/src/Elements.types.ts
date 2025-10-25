import type { ConfigOptions } from "./Config";
import type {
  DescriptorsSerializedCache,
  ElementDescriptors,
} from "./Descriptor";

/**
 * Serialized cache for Elements class.
 */
export type ElementsSerializedCache = {
  descriptors: Record<
    string,
    {
      config: ConfigOptions;
      elementDescriptors: ElementDescriptors;
      cache: DescriptorsSerializedCache;
    }
  >;
};
