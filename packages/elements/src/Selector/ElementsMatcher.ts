import Handlebars from "handlebars";
import micromatch from "micromatch";

import type { MicromatchPattern } from "src/Config";

import type {
  LocalElementKnown,
  ElementDescription,
  CoreDependencyElement,
  LocalDependencyElementKnown,
  ExternalDependencyElement,
} from "../Descriptor";
import { isIgnoredElement, isUnknownLocalElement } from "../Descriptor";
import { isArray } from "../Support";

import type {
  ElementsSelector,
  ElementSelector,
  ElementSelectorData,
  BaseElementSelectorData,
  DependencyElementSelectorData,
  SelectableElements,
  CapturedValuesTemplatesData,
} from "./ElementsSelector.types";
import {
  isSimpleElementSelectorByType,
  isElementSelectorWithLegacyOptions,
  isElementSelectorData,
} from "./ElementsSelectorHelpers";

/**
 * Matcher class to determine if elements match a given selector.
 */
export class ElementsMatcher {
  /**
   * The underlying selector used to match elements.
   */
  private _selectorData: ElementSelectorData[];

  /**
   * Creates a new ElementsSelectorMatcher.
   * @param selector The underlying selector used to match elements.
   */
  constructor(selector: ElementsSelector) {
    this._selectorData = this._normalizeElementsSelector(selector);
  }

  /**
   * Normalizes an ElementsSelector into an array of ElementSelectorData.
   * @param elementsSelector The elements selector, in any supported format.
   * @returns The normalized array of selector data.
   */
  private _normalizeElementsSelector(
    elementsSelector: ElementsSelector,
  ): ElementSelectorData[] {
    if (isArray(elementsSelector)) {
      if (isElementSelectorWithLegacyOptions(elementsSelector)) {
        return [this._normalizeSelector(elementsSelector)];
      }
      return elementsSelector.map((sel) => this._normalizeSelector(sel));
    }
    return [this._normalizeSelector(elementsSelector)];
  }

  /**
   * Normalizes a selector into ElementSelectorData format.
   * @param selector The selector to normalize.
   * @returns The normalized selector data.
   */
  private _normalizeSelector(selector: ElementSelector): ElementSelectorData {
    if (isSimpleElementSelectorByType(selector)) {
      return { type: selector };
    }

    if (isElementSelectorData(selector)) {
      return { ...selector };
    }

    if (isElementSelectorWithLegacyOptions(selector)) {
      if (isSimpleElementSelectorByType(selector[0])) {
        return {
          type: selector[0],
          captured: { ...selector[1] },
        };
      }
      return {
        ...selector[0],
        captured: { ...selector[1] },
      };
    }
    throw new Error("Invalid element selector");
  }

  /**
   * Returns the normalized selector data.
   * @returns The normalized selector data.
   */
  public get selector() {
    return this._selectorData;
  }

  /**
   * Whether the given element key matches the selector key using micromatch.
   * @param param0 The parameters object.
   * @returns Whether the element key matches the selector key.
   */
  private _isElementKeyMicromatchMatch<
    T extends
      | LocalElementKnown
      | CoreDependencyElement
      | ExternalDependencyElement
      | LocalDependencyElementKnown,
    S extends BaseElementSelectorData | DependencyElementSelectorData,
  >({
    element,
    selector,
    elementKey,
    selectorKey,
    selectorValue,
  }: {
    /** The element to check. */
    element: T;
    /** The selector to check against. */
    selector: S;
    /** The key of the element to check. */
    elementKey: T extends LocalElementKnown
      ? keyof LocalElementKnown
      : T extends CoreDependencyElement
        ? keyof CoreDependencyElement
        : T extends ExternalDependencyElement
          ? keyof ExternalDependencyElement
          : keyof LocalDependencyElementKnown;
    /** The key of the selector to check against. */
    selectorKey: S extends DependencyElementSelectorData
      ? keyof DependencyElementSelectorData
      : keyof BaseElementSelectorData;
    /** The value of the selector key to check against. */
    selectorValue?: MicromatchPattern;
  }): boolean {
    // The selector key does not exist in the selector, so it matches any value. We also check the value passed separately in order to improve typing inference.
    if (!(selectorKey in selector) || !selectorValue) {
      return true;
    }
    // The selector key exists in the selector, but it does not exist in the element. No match.
    if (!(elementKey in element)) {
      return false;
    }
    return micromatch.isMatch(elementKey, selectorValue);
  }

  /**
   * Whether the given element type matches the selector type.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @returns Whether the element type matches the selector type.
   */
  private _isTypeMatch(
    element: SelectableElements,
    selector: ElementSelectorData,
  ): boolean {
    return this._isElementKeyMicromatchMatch({
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
    element: SelectableElements,
    selector: ElementSelectorData,
  ): boolean {
    return this._isElementKeyMicromatchMatch({
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
    element: SelectableElements,
    selector: ElementSelectorData,
  ): boolean {
    return this._isElementKeyMicromatchMatch({
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
    element: SelectableElements,
    selector: ElementSelectorData,
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
    capturedValuesData: CapturedValuesTemplatesData,
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
    capturedValuesData: CapturedValuesTemplatesData,
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
    element: SelectableElements,
    selector: ElementSelectorData,
    capturedValuesData: CapturedValuesTemplatesData,
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
  private _isMatchElement(
    element: SelectableElements,
    capturedValuesData: CapturedValuesTemplatesData,
  ): boolean {
    return this._selectorData.some((selectorData) => {
      return (
        this._isTypeMatch(element, selectorData) &&
        this._isCategoryMatch(element, selectorData) &&
        this._isOriginMatch(element, selectorData) &&
        this._isInternalPathMatch(element, selectorData) &&
        this._isCapturedValuesMatch(element, selectorData, capturedValuesData)
      );
    });
  }

  /**
   * Returns whether the given element matches the selector.
   * It omits checks in keys applying only to dependency between elements, such as origin, kind, specifier, nodeKind, etc.
   * @param element The element to check.
   * @returns Whether the element matches the selector properties applying to elements.
   */
  public isElementMatch(
    element: ElementDescription,
    {
      capturedValuesData = {},
    }: {
      /** The data to pass to captured patterns when they are rendered using templates before matching. */
      capturedValuesData?: CapturedValuesTemplatesData;
    } = {},
  ): boolean {
    if (isIgnoredElement(element) || isUnknownLocalElement(element)) {
      return false;
    }
    return this._isMatchElement(element, capturedValuesData);
  }
}
