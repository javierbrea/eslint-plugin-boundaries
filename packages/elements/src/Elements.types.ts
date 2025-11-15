import type { ConfigOptionsNormalized } from "./Config";
import type { ElementDescriptors } from "./Descriptor";
import type { MatcherSerializedCache } from "./Matcher";

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
};
