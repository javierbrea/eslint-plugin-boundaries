import { CacheManager } from "../Cache";
import type { GlobalCache } from "../Cache";
import type { MatchersOptionsNormalized } from "../Config";
import type { ElementDescription } from "../Descriptor";
import { isArray, isNullish, isEmptyObject } from "../Support";

import { BaseElementsMatcher } from "./BaseElementsMatcher";
import type {
  BaseElementSelectorData,
  SelectableElement,
  TemplateData,
  ElementsMatcherSerializedCache,
  BaseElementsSelector,
  MatcherOptions,
  ElementSelectorData,
} from "./Matcher.types";
import type { Micromatch } from "./Micromatch";

/**
 * Matcher class to determine if elements match a given selector.
 */
export class ElementsMatcher extends BaseElementsMatcher {
  /**
   * Cache to store previously described elements.
   */
  private readonly _cache: CacheManager<
    {
      element: ElementDescription;
      selector: BaseElementSelectorData[];
      extraTemplateData: TemplateData;
    },
    ElementSelectorData | null
  >;

  /**
   * Creates a new ElementsSelectorMatcher.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   * @param globalCache Global cache instance.
   */
  constructor(
    config: MatchersOptionsNormalized,
    micromatch: Micromatch,
    globalCache: GlobalCache
  ) {
    super(config, micromatch, globalCache);
    this._cache = new CacheManager();
  }

  /**
   * Serializes the cache to a plain object.
   * @returns The serialized cache.
   */
  public serializeCache(): ElementsMatcherSerializedCache {
    return this._cache.serialize();
  }

  /**
   * Sets the cache from a serialized object.
   * @param serializedCache The serialized cache.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsMatcherSerializedCache
  ): void {
    this._cache.setFromSerialized(serializedCache);
  }

  /**
   * Clears the cache.
   */
  public clearCache(): void {
    this._cache.clear();
  }

  /**
   * Optimized selector normalization with caching.
   * @param selector The selector to normalize.
   * @returns The normalized selector data array.
   */
  private _cachedNormalizeElementsSelector(
    selector: BaseElementsSelector
  ): BaseElementSelectorData[] {
    const cacheKey =
      this.globalCache.normalizedElementsSelectors.getKey(selector);
    if (this.globalCache.normalizedElementsSelectors.has(cacheKey)) {
      return this.globalCache.normalizedElementsSelectors.get(cacheKey)!;
    }

    const result = this.normalizeElementsSelector(selector);
    this.globalCache.normalizedElementsSelectors.set(cacheKey, result);
    return result;
  }

  /**
   * Whether the given element type matches the selector type.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element type matches the selector type.
   */
  private _isTypeMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "type",
      selectorKey: "type",
      selectorValue: selector.type,
      templateData,
    });
  }

  /**
   * Whether the given element category matches the selector category.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element category matches the selector category.
   */
  private _isCategoryMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "category",
      selectorKey: "category",
      selectorValue: selector.category,
      templateData,
    });
  }

  /**
   * Whether the given element path matches the selector path.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element path matches the selector path.
   */
  private _isPathMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "path",
      selectorKey: "path",
      selectorValue: selector.path,
      templateData,
    });
  }

  /**
   * Whether the given element path matches the selector element path.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element path matches the selector element path.
   */
  private _isElementPathMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "elementPath",
      selectorKey: "elementPath",
      selectorValue: selector.elementPath,
      templateData,
    });
  }

  /**
   * Whether the given element internal path matches the selector internal path.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element internal path matches the selector internal path.
   */
  private _isInternalPathMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "internalPath",
      selectorKey: "internalPath",
      selectorValue: selector.internalPath,
      templateData,
    });
  }

  /**
   * Whether the given element origin matches the selector origin
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element origin matches the selector origin.
   */
  private _isOriginMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "origin",
      selectorKey: "origin",
      selectorValue: selector.origin,
      templateData,
    });
  }

  /**
   * Whether the given element baseSource matches the selector baseSource
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element baseSource matches the selector baseSource.
   */
  private _isBaseSourceMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "baseSource",
      selectorKey: "baseSource",
      selectorValue: selector.baseSource,
      templateData,
    });
  }

  /**
   * Whether the given element source matches the selector source
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value
   * @returns Whether the element source matches the selector source.
   */
  private _isSourceMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "source",
      selectorKey: "source",
      selectorValue: selector.source,
      templateData,
    });
  }

  /**
   * Determines if the captured values of the element match those in the selector.
   * @param element The element to check.
   * @param selector The selector to check against
   * @param templateData The data to use for replace in selector values
   * @returns True if the captured values match, false otherwise.
   */
  private _isCapturedValuesMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    if (!selector.captured || isEmptyObject(selector.captured)) {
      return true;
    }
    if (!element.captured) {
      return false;
    }

    // Use for...of with early return for better performance than every()
    for (const [key, pattern] of Object.entries(selector.captured)) {
      const elementValue = element.captured?.[key];
      if (!elementValue) {
        return false;
      }

      const renderedPattern = this.getRenderedTemplates(pattern, templateData);
      // Empty selector values do not match anything.
      if (!renderedPattern) {
        return false;
      }

      // Clean empty strings from arrays to avoid matching them.
      const filteredPattern = isArray(renderedPattern)
        ? renderedPattern.filter(Boolean)
        : renderedPattern;

      const isMatch = this.micromatch.isMatch(elementValue, filteredPattern);

      if (!isMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Determines if the isIgnored property of the element matches that in the selector.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @returns True if the isIgnored properties match, false otherwise.
   */
  private _isIgnoredMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData
  ): boolean {
    return this.isElementKeyBooleanMatch({
      element,
      selector,
      elementKey: "isIgnored",
      selectorKey: "isIgnored",
    });
  }

  /**
   * Determines if the isUnknown property of the element matches that in the selector.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @returns True if the isUnknown properties match, false otherwise.
   */
  private _isUnknownMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData
  ): boolean {
    return this.isElementKeyBooleanMatch({
      element,
      selector,
      elementKey: "isUnknown",
      selectorKey: "isUnknown",
    });
  }

  /**
   * Returns the selector matching result for the given local or external element.
   * @param element The local or external element to check.
   * @param selector The selector to check against.
   * @param extraTemplateData Extra template data to use for matching.
   * @returns The selector matching result for the given element, or null if none matches.
   */
  private _getSelectorMatching(
    element: SelectableElement,
    selectorsData: BaseElementSelectorData[],
    extraTemplateData: TemplateData
  ): ElementSelectorData | null {
    const templateData: TemplateData = {
      element,
      ...extraTemplateData,
    };
    // Optimized loop with early exits for better performance
    for (const selectorData of selectorsData) {
      // Order checks by likelihood of failing for better short-circuiting
      // Most restrictive checks first to fail fast
      if (
        !this._isTypeMatch(element, selectorData, templateData) ||
        !this._isCategoryMatch(element, selectorData, templateData) ||
        !this._isOriginMatch(element, selectorData, templateData) ||
        !this._isIgnoredMatch(element, selectorData) ||
        !this._isUnknownMatch(element, selectorData) ||
        !this._isPathMatch(element, selectorData, templateData) ||
        !this._isElementPathMatch(element, selectorData, templateData) ||
        !this._isInternalPathMatch(element, selectorData, templateData) ||
        !this._isSourceMatch(element, selectorData, templateData) ||
        !this._isBaseSourceMatch(element, selectorData, templateData) ||
        !this._isCapturedValuesMatch(element, selectorData, templateData)
      ) {
        continue; // Early exit on first failed condition
      }

      // All conditions passed, return the matching selector
      return selectorData;
    }

    return null;
  }

  /**
   * Returns the selector matching result for the given element, or null if none matches.
   * It omits checks in keys applying only to dependency between elements, such as relationship.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, globals for dependency selectors, etc.
   * @returns The selector matching result for the given element, or null if none matches.
   */
  public getSelectorMatching(
    element: ElementDescription,
    selector: BaseElementsSelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): ElementSelectorData | null {
    const selectorsData = this._cachedNormalizeElementsSelector(selector);
    const cacheKey = this._cache.getKey({
      element,
      selector: selectorsData,
      extraTemplateData,
    });
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)!;
    }

    const result = this._getSelectorMatching(
      element,
      selectorsData,
      extraTemplateData
    );

    this._cache.set(cacheKey, result);
    return result;
  }

  /**
   * Returns whether the given element matches the selector.
   * It omits checks in keys applying only to dependency between elements, such as relationship.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, globals for dependency selectors, etc.
   * @returns Whether the element matches the selector properties applying to elements.
   */
  public isElementMatch(
    element: ElementDescription,
    selector: BaseElementsSelector,
    options?: MatcherOptions
  ): boolean {
    const selectorMatching = this.getSelectorMatching(
      element,
      selector,
      options
    );
    return !isNullish(selectorMatching);
  }
}
