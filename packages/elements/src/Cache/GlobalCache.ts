import type { BaseElementsSelector, BaseElementSelectorData } from "../Matcher";

import { CacheManager } from "./Cache";
import type {
  MicromatchCapturesCache,
  MicromatchPathRegexpsCache,
  MicromatchMatchingResultsCache,
  SerializedGlobalCache,
  NormalizedSelectorsCache,
  HandleBarsTemplatesCache,
} from "./GlobalCache.types";

/**
 * Global cache for various caching needs
 */
export class GlobalCache {
  /** Cache for micromatch paths RegExp instances */
  private _micromatchPathRegexps: MicromatchPathRegexpsCache;

  /** Cache for micromatch captures */
  private _micromatchCaptures: MicromatchCapturesCache;

  /** Cache for micromatch matching results */
  private _micromatchMatchingResults: MicromatchMatchingResultsCache;

  /** Cache for normalized selectors */
  private _normalizedSelectors: NormalizedSelectorsCache;

  /** Cache for Handlebars templates */
  private _handleBarsTemplates: HandleBarsTemplatesCache;

  /**
   * Creates an instance of GlobalCache.
   */
  constructor() {
    this._micromatchPathRegexps = new CacheManager<string, RegExp>();
    this._micromatchCaptures = new CacheManager<string, string[] | null>();
    this._micromatchMatchingResults = new CacheManager<string, boolean>();
    this._normalizedSelectors = new CacheManager<
      BaseElementsSelector,
      BaseElementSelectorData[]
    >();
    this._handleBarsTemplates = new CacheManager<
      string,
      (data: Record<string, unknown>) => string
    >();
  }

  /**
   * Cache for micromatch paths RegExp instances
   */
  public get micromatchPathRegexps(): MicromatchPathRegexpsCache {
    return this._micromatchPathRegexps;
  }

  /**
   * Cache for micromatch captures
   */
  public get micromatchCaptures(): MicromatchCapturesCache {
    return this._micromatchCaptures;
  }

  /**
   * Cache for micromatch matching results
   * TODO: Use this cache in the matcher, and test performance improvements
   */
  // istanbul ignore next: currently not used
  public get micromatchMatchingResults(): MicromatchMatchingResultsCache {
    // istanbul ignore next: currently not used
    return this._micromatchMatchingResults;
  }

  /**
   * Cache for normalized selectors
   */
  public get normalizedSelectors(): NormalizedSelectorsCache {
    return this._normalizedSelectors;
  }

  /**
   * Cache for Handlebars templates
   */
  public get handleBarsTemplates(): HandleBarsTemplatesCache {
    return this._handleBarsTemplates;
  }

  /**
   * Clears all caches in the GlobalCache.
   */
  public clear(): void {
    this._micromatchPathRegexps.clear();
    this._micromatchCaptures.clear();
    this._micromatchMatchingResults.clear();
    this._normalizedSelectors.clear();
    this._handleBarsTemplates.clear();
  }

  /**
   * Serializes the GlobalCache to a plain object.
   * @returns The serialized representation of the GlobalCache.
   */
  public serialize(): SerializedGlobalCache {
    return {
      micromatchCaptures: this._micromatchCaptures.serialize(),
      micromatchMatchingResults: this._micromatchMatchingResults.serialize(),
      normalizedSelectors: this._normalizedSelectors.serialize(),
    };
  }

  /**
   * Restores the GlobalCache from a serialized representation.
   * @param serializedCache The serialized representation of the GlobalCache.
   */
  public setFromSerialized(serializedCache: SerializedGlobalCache): void {
    this._micromatchCaptures.setFromSerialized(
      serializedCache.micromatchCaptures
    );
    this._micromatchMatchingResults.setFromSerialized(
      serializedCache.micromatchMatchingResults
    );
    this._normalizedSelectors.setFromSerialized(
      serializedCache.normalizedSelectors
    );
  }
}
