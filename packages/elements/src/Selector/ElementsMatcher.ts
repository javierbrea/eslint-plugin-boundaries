import Handlebars from "handlebars";
import micromatch from "micromatch";

import { CacheManager } from "../Cache";
import type { MicromatchPattern } from "../Config";
import type { ElementDescription } from "../Descriptor";
import { isIgnoredElement, isUnknownLocalElement } from "../Descriptor";
import { isArray } from "../Support";

import { BaseElementsMatcher } from "./BaseElementsMatcher";
import type {
  ElementsSelector,
  BaseElementSelectorData,
  SelectableElement,
  CapturedValuesTemplateData,
  ElementsMatcherSerializedCache,
  BaseElementsSelector,
  ElementSelector,
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
      capturedValuesTemplateData: CapturedValuesTemplateData;
    },
    boolean
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
    serializedCache: ElementsMatcherSerializedCache,
  ): void {
    this._cache.setFromSerialized(serializedCache);
  }

  /**
   * Whether the given element type matches the selector type.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @returns Whether the element type matches the selector type.
   */
  private _isTypeMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "type",
      selectorKey: "type",
      selectorValue: selector.type,
    });
  }

  /**
   * Whether the given element category matches the selector category.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @returns Whether the element category matches the selector category.
   */
  private _isCategoryMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "category",
      selectorKey: "category",
      selectorValue: selector.category,
    });
  }

  /**
   * Whether the given element internal path matches the selector internal path.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @returns Whether the element internal path matches the selector internal path.
   */
  private _isInternalPathMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element,
      selector,
      elementKey: "internalPath",
      selectorKey: "internalPath",
      selectorValue: selector.internalPath,
    });
  }

  /**
   * Whether the given element origin matches the selector origin
   * @param element The element to check.
   * @param selector The selector to check against.
   * @returns Whether the element origin matches the selector origin.
   */
  private _isOriginMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
  ): boolean {
    if (!selector.origin) {
      return true;
    }
    const selectorOrigins = Array.isArray(selector.origin)
      ? selector.origin
      : [selector.origin];
    return selectorOrigins.includes(element.origin);
  }

  /**
   * Converts a micromatch pattern with ${} templates to Handlebars {{}} templates for backwards compatibility.
   * @param pattern The pattern to convert.
   * @returns The converted pattern.
   */
  private _makePatternBackwardsCompatible(pattern: string): string {
    return pattern.replace(/\$\{([^}]+)\}/g, "{{ $1 }}");
  }

  /**
   * Converts micromatch patterns with ${} templates to Handlebars {{}} templates for backwards compatibility.
   * @param pattern The pattern to convert.
   * @returns The converted pattern.
   */
  private _makePatternsBackwardsCompatible(
    pattern: MicromatchPattern,
  ): MicromatchPattern {
    if (Array.isArray(pattern)) {
      return pattern.map((pat) => this._makePatternBackwardsCompatible(pat));
    }
    return this._makePatternBackwardsCompatible(pattern);
  }

  /**
   * Returns a rendered captured value pattern using the provided captured values data.
   * @param pattern The captured value pattern to render.
   * @param capturedValuesData The data to pass to the template.
   * @returns The rendered pattern.
   */
  private _getRenderedCapturedValuePattern(
    pattern: string,
    capturedValuesData: CapturedValuesTemplateData,
  ): string {
    return Handlebars.compile(this._makePatternsBackwardsCompatible(pattern))(
      capturedValuesData,
    );
  }

  /**
   * Renders a captured value pattern using the provided captured values data. Supports both string and array of strings.
   * @param pattern The captured value pattern to render.
   * @param capturedValuesData The data to use for rendering the pattern.
   * @returns The rendered pattern.
   */
  private _getRenderedCapturedValuePatterns(
    pattern: MicromatchPattern,
    capturedValuesData: CapturedValuesTemplateData,
  ): MicromatchPattern {
    if (isArray(pattern)) {
      return pattern.map((pat) => {
        return this._getRenderedCapturedValuePattern(pat, capturedValuesData);
      });
    }
    return this._getRenderedCapturedValuePattern(pattern, capturedValuesData);
  }

  /**
   * Determines if the captured values of the element match those in the selector.
   * @param element The element to check.
   * @param selector The selector to check against
   * @returns True if the captured values match, false otherwise.
   */
  private _isCapturedValuesMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    capturedValuesData: CapturedValuesTemplateData,
  ): boolean {
    if (!selector.captured) {
      return true;
    }
    if (!element.capturedValues) {
      return false;
    }
    return Object.entries(selector.captured).every(([key, pattern]) => {
      const elementValue = element.capturedValues
        ? element.capturedValues[key]
        : ""; // NOTE: When no value was captured, we use an empty string, so patterns like '*' can still match

      const renderedPattern = this._getRenderedCapturedValuePatterns(
        pattern,
        capturedValuesData,
      );
      if (Array.isArray(renderedPattern)) {
        return renderedPattern.some((pat) =>
          micromatch.isMatch(elementValue, pat),
        );
      }
      return micromatch.isMatch(elementValue, renderedPattern);
    });
  }

  /**
   * Whether a local known element or external dependency element matches the selector.
   * @param element The local or external element to check.
   * @returns Whether the element matches the selector.
   */
  private _isElementMatch(
    element: SelectableElement,
    selector: BaseElementsSelector,
    capturedValuesTemplateData: CapturedValuesTemplateData,
  ): boolean {
    const selectorsData = this.normalizeElementsSelector(selector);
    return selectorsData.some((selectorData) => {
      return (
        this._isTypeMatch(element, selectorData) &&
        this._isCategoryMatch(element, selectorData) &&
        this._isOriginMatch(element, selectorData) &&
        this._isInternalPathMatch(element, selectorData) &&
        this._isCapturedValuesMatch(
          element,
          selectorData,
          capturedValuesTemplateData,
        )
      );
    });
  }

  /**
   * Temporal method to normalize selectors
   */
  public normalize(selector: ElementSelector): ElementSelectorData[] {
    return this.normalizeElementsSelector(selector);
  }

  /**
   * Returns whether the given element matches the selector.
   * It omits checks in keys applying only to dependency between elements, such as relationship.
   * @param element The element to check.
   * @returns Whether the element matches the selector properties applying to elements.
   */
  public isElementMatch(
    element: ElementDescription,
    selector: BaseElementsSelector,
    {
      capturedValuesTemplateData = {},
    }: {
      /** The data to pass to captured patterns when they are rendered using templates before matching. */
      capturedValuesTemplateData?: CapturedValuesTemplateData;
    } = {},
  ): boolean {
    if (
      this._cache.has({
        element,
        selector,
        capturedValuesTemplateData,
      })
    ) {
      return this._cache.get({
        element,
        selector,
        capturedValuesTemplateData,
      })!;
    }

    const result =
      isIgnoredElement(element) || isUnknownLocalElement(element)
        ? false
        : this._isElementMatch(element, selector, capturedValuesTemplateData);

    this._cache.set(
      {
        element,
        selector,
        capturedValuesTemplateData,
      },
      result,
    );
    return result;
  }
}
