/**
 * Serialized cache of micromatch matcher.
 */
export type MicromatchSerializedCache = {
  matchingResults: Record<string, boolean>;
  captures: Record<string, string[] | null>;
};
