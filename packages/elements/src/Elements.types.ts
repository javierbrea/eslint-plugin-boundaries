import type { ConfigOptionsNormalized } from "./Config";
import type { ElementDescriptors, FileDescriptors } from "./Descriptor";
import type {
  MatcherSerializedCache,
  MicromatchSerializedCache,
} from "./Matcher";

/**
 * Descriptors configuration accepted by Elements.getMatcher.
 */
export type MatcherDescriptors = {
  /** Element descriptors used to resolve architectural elements. */
  elementDescriptors?: ElementDescriptors;
  /** File descriptors used to classify files. */
  fileDescriptors?: FileDescriptors;
};

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
      fileDescriptors?: FileDescriptors;
      cache: MatcherSerializedCache;
    }
  >;
  micromatch: MicromatchSerializedCache;
};
