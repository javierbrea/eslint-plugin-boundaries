import micromatch from "micromatch";

import { CacheManager } from "../Cache";
import type { ElementDescription } from "../Descriptor";
import { isIgnoredElement, isUnknownLocalElement } from "../Descriptor";
import { isArray, isNullish } from "../Support";

import { BaseElementsMatcher } from "./BaseElementsMatcher";
import type {
  ElementsSelector,
  BaseElementSelectorData,
  SelectableElement,
  TemplateData,
  ElementsMatcherSerializedCache,
  BaseElementsSelector,
  MatcherOptions,
  ElementSelectorData,
} from "./ElementsSelector.types";

/**
 * Matcher class to determine if elements match a given selector.
 */
export class ElementsMatcher extends BaseElementsMatcher {
  /**
   * Cache to store previously described elements.
   */
  private _cache: CacheManager<
    {
      element: ElementDescription;
      selector: ElementsSelector;
      extraTemplateData: TemplateData;
    },
    ElementSelectorData | null
  >;

  /**
   * Creates a new ElementsSelectorMatcher.
   */
  constructor() {
    super();
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
    const selectorValue = !isNullish(selector.type)
      ? this.getRenderedTemplates(selector.type, templateData)
      : selector.type;
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "type",
      selectorKey: "type",
      selectorValue,
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
    const selectorValue = !isNullish(selector.category)
      ? this.getRenderedTemplates(selector.category, templateData)
      : selector.category;
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "category",
      selectorKey: "category",
      selectorValue,
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
    const selectorValue = !isNullish(selector.internalPath)
      ? this.getRenderedTemplates(selector.internalPath, templateData)
      : selector.internalPath;
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "internalPath",
      selectorKey: "internalPath",
      selectorValue,
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
    const selectorValue = !isNullish(selector.origin)
      ? this.getRenderedTemplates(selector.origin, templateData)
      : selector.origin;
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "origin",
      selectorKey: "origin",
      selectorValue,
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
    const selectorValue = !isNullish(selector.baseSource)
      ? this.getRenderedTemplates(selector.baseSource, templateData)
      : selector.baseSource;
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "baseSource",
      selectorKey: "baseSource",
      selectorValue,
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
    if (!selector.captured) {
      return true;
    }
    if (!element.capturedValues) {
      return false;
    }
    return Object.entries(selector.captured).every(([key, pattern]) => {
      const elementValue =
        (element.capturedValues && element.capturedValues[key]) || "";
      const renderedPattern = this.getRenderedTemplates(pattern, templateData);
      if (!renderedPattern) {
        return false;
      }
      if (isArray(renderedPattern)) {
        return renderedPattern.some(
          (pat) => pat && micromatch.isMatch(elementValue, pat)
        );
      }
      return micromatch.isMatch(elementValue, renderedPattern);
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
    selector: BaseElementsSelector,
    extraTemplateData: TemplateData
  ): ElementSelectorData | null {
    const selectorsData = this.normalizeElementsSelector(selector);

    const templateData: TemplateData = {
      element,
      ...extraTemplateData,
    };

    for (const selectorData of selectorsData) {
      const isMatch =
        this._isTypeMatch(element, selectorData, templateData) &&
        this._isCategoryMatch(element, selectorData, templateData) &&
        this._isOriginMatch(element, selectorData, templateData) &&
        this._isInternalPathMatch(element, selectorData, templateData) &&
        this._isBaseSourceMatch(element, selectorData, templateData) &&
        this._isCapturedValuesMatch(element, selectorData, templateData);

      if (isMatch) {
        return selectorData;
      }
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
    if (
      this._cache.has({
        element,
        selector,
        extraTemplateData,
      })
    ) {
      return this._cache.get({
        element,
        selector,
        extraTemplateData,
      })!;
    }

    const result =
      isIgnoredElement(element) || isUnknownLocalElement(element)
        ? null
        : this._getSelectorMatching(element, selector, extraTemplateData);

    this._cache.set(
      {
        element,
        selector,
        extraTemplateData,
      },
      result
    );
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
    { extraTemplateData = {} }: MatcherOptions = {}
  ): boolean {
    const selectorMatching = this.getSelectorMatching(element, selector, {
      extraTemplateData,
    });
    return !isNullish(selectorMatching);
  }
}
