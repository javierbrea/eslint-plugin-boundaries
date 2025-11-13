import type { SerializedGlobalCache } from "./Cache";
import type {
  ConfigOptionsNormalized,
  MatchersOptionsNormalized,
} from "./Config";
import type { ElementDescriptors } from "./Descriptor";
import type {
  MatcherSerializedCache,
  ElementsMatcherSerializedCache,
  DependenciesMatcherSerializedCache,
} from "./Matcher";

/**
 * Serialized cache for Elements class.
 */
export type ElementsSerializedCache = {
  /** Cache for Matcher instances per configuration */
  matchers: Record<
    string,
    {
      config: ConfigOptionsNormalized;
      elementDescriptors: ElementDescriptors;
      cache: MatcherSerializedCache;
    }
  >;
  /** Cache for ElementsMatcher instances per configuration */
  elementsMatchers: Record<
    string,
    {
      config: MatchersOptionsNormalized;
      cache: ElementsMatcherSerializedCache;
    }
  >;
  /** Cache for DependenciesMatcher instances per configuration */
  dependenciesMatchers: Record<
    string,
    {
      config: MatchersOptionsNormalized;
      cache: DependenciesMatcherSerializedCache;
    }
  >;
  /** Global cache not dependent on configuration */
  global: SerializedGlobalCache;
};
