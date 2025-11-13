import type { BaseElementsSelector, BaseElementSelectorData } from "../Matcher";

import { CacheManager } from "./Cache";
import type {
  MicromatchCapturesCache,
  MicromatchPathRegexpsCache,
  MicromatchMatchingResultsCache,
  SerializedGlobalCache,
  NormalizedElementsSelectorsCache,
  NormalizedElementsSelectorCache,
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
  private _normalizedElementsSelectors: NormalizedElementsSelectorsCache;

  /** Cache for normalized selector */
  private _normalizedElementsSelector: NormalizedElementsSelectorCache;

  /** Cache for Handlebars templates */
  private _handleBarsTemplates: HandleBarsTemplatesCache;

  /**
   * Creates an instance of GlobalCache.
   */
  constructor() {
    this._micromatchPathRegexps = new CacheManager<string, RegExp>();
    this._micromatchCaptures = new CacheManager<string, string[] | null>();
    this._micromatchMatchingResults = new CacheManager<string, boolean>();
    this._normalizedElementsSelectors = new CacheManager<
      BaseElementsSelector,
      BaseElementSelectorData[]
    >();
    this._normalizedElementsSelector = new CacheManager<
      BaseElementsSelector,
      BaseElementSelectorData
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
   */
  public get micromatchMatchingResults(): MicromatchMatchingResultsCache {
    return this._micromatchMatchingResults;
  }

  /**
   * Cache for normalized elements selectors
   */
  public get normalizedElementsSelectors(): NormalizedElementsSelectorsCache {
    return this._normalizedElementsSelectors;
  }

  /**
   * Cache for normalized elements selector
   */
  public get normalizedElementsSelector(): NormalizedElementsSelectorCache {
    return this._normalizedElementsSelector;
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
    this._normalizedElementsSelectors.clear();
    this._normalizedElementsSelector.clear();
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
      normalizedElementsSelectors:
        this._normalizedElementsSelectors.serialize(),
      normalizedElementsSelector: this._normalizedElementsSelector.serialize(),
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
    this._normalizedElementsSelectors.setFromSerialized(
      serializedCache.normalizedElementsSelectors
    );
    this._normalizedElementsSelector.setFromSerialized(
      serializedCache.normalizedElementsSelector
    );
  }
}
