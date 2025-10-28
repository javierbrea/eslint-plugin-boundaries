import type { ConfigOptions } from "./Config";
import type {
  DescriptorsSerializedCache,
  ElementDescriptors,
} from "./Descriptor";
import type {
  DependenciesMatcherSerializedCache,
  ElementsMatcherSerializedCache,
} from "./Selector";

/**
 * Serialized cache for Elements class.
 */
export type ElementsSerializedCache = {
  /** Cache for Descriptors instances per configuration */
  descriptors: Record<
    string,
    {
      config: ConfigOptions;
      elementDescriptors: ElementDescriptors;
      cache: DescriptorsSerializedCache;
    }
  >;
  /** Caches for selectors */
  selectors: {
    /** Cache for element selectors */
    elementsMatcherCache: ElementsMatcherSerializedCache;
    /** Cache for dependency selectors */
    dependenciesMatcherCache: DependenciesMatcherSerializedCache;
  };
};
