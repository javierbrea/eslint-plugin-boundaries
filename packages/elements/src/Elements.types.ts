import type { ConfigOptionsNormalized } from "./Config";
import type { DescriptorsConfig } from "./Descriptor";
import type {
  MatcherSerializedCache,
  MicromatchSerializedCache,
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
      descriptors: DescriptorsConfig;
      cache: MatcherSerializedCache;
    }
  >;
  micromatch: MicromatchSerializedCache;
};
