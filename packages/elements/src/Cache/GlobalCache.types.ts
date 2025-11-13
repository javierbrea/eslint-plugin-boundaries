import type { BaseElementsSelector, BaseElementSelectorData } from "../Matcher";

import type { CacheManager } from "./Cache";

/**
 * Cache for micromatch paths RegExp instances
 */
export type MicromatchPathRegexpsCache = CacheManager<string, RegExp>;

/**
 * Cache for micromatch captures
 */
export type MicromatchCapturesCache = CacheManager<string, string[] | null>;

/**
 * Cache for Micromatch matching results
 */
export type MicromatchMatchingResultsCache = CacheManager<string, boolean>;

/**
 * Cache for normalized selectors
 */
export type NormalizedElementsSelectorsCache = CacheManager<
  BaseElementsSelector,
  BaseElementSelectorData[]
>;

/**
 * Cache for normalized selector
 */
export type NormalizedElementsSelectorCache = CacheManager<
  BaseElementsSelector,
  BaseElementSelectorData
>;

/**
 * Cache for Handlebars templates
 */
export type HandleBarsTemplatesCache = CacheManager<
  string,
  (data: Record<string, unknown>) => string
>;

/**
 * Serialized representation of GlobalCache
 * Objects such as RegExp instances or functions are not serializable, so we leave them out
 * and only serialize primitive values or serializable structures.
 * The cost of recreating them when restoring the cache would be higher than the cost of creating them in runtime when needed.
 */
export type SerializedGlobalCache = {
  /** Cache for micromatch captures */
  micromatchCaptures: Record<string, string[] | null>;
  /** Cache for Micromatch matching results */
  micromatchMatchingResults: Record<string, boolean>;
  /** Cache for normalized elements selectors */
  normalizedElementsSelectors: Record<string, BaseElementSelectorData[]>;
  /** Cache for normalized elements selector */
  normalizedElementsSelector: Record<string, BaseElementSelectorData>;
};
