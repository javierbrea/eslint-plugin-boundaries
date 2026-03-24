import type {
  MatchersOptionsNormalized,
  MicromatchPatternNullable,
} from "../../Config";
import type { ElementDescription } from "../../Descriptor";
import {
  isArray,
  isNullish,
  isEmptyObject,
  isUndefined,
  isNull,
} from "../../Support";
import type {
  BaseElementSelectorData,
  ParentElementSelectorData,
  SelectableElement,
  TemplateData,
  BaseElementsSelector,
  MatcherOptions,
} from "../Matcher.types";
import { BaseElementsMatcher } from "../Shared";
import type { Micromatch } from "../Shared";

import { normalizeElementsSelector } from "./MatcherHelpers";

/**
 * Matcher class to determine if elements match a given selector.
 */
export class ElementsMatcher extends BaseElementsMatcher {
  /**
   * Creates a new ElementsSelectorMatcher.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   * @param globalCache Global cache instance.
   */
  constructor(config: MatchersOptionsNormalized, micromatch: Micromatch) {
    super(config, micromatch);
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
   * Checks if a single captured values object matches the element.
   * @param capturedValues The captured values to check.
   * @param capturedSelector The captured values selector object to check against
   * @param templateData The data to use for replace in selector values
   * @returns True if all captured values in the selector match those in the element, false otherwise.
   */
  private _checkCapturedValuesObject(
    capturedValues: SelectableElement["captured"],
    capturedSelector: Record<string, MicromatchPatternNullable>,
    templateData: TemplateData
  ): boolean {
    if (!capturedValues) {
      return false;
    }
    // Use for...of with early return for better performance than every()
    for (const [key, pattern] of Object.entries(capturedSelector)) {
      const elementValue = capturedValues[key];
      if (!elementValue) {
        return false;
      }

      const renderedPattern = this.getRenderedTemplates(pattern, templateData);

      const filteredPattern = this.cleanMicromatchPattern(renderedPattern);

      if (!filteredPattern) {
        return false;
      }

      const isMatch = this.micromatch.isMatch(elementValue, filteredPattern);
      if (!isMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Determines if the captured values of the element match those in the selector.
   * When the selector is an array, the element matches if it matches any of the array elements (OR logic).
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

    // Handle array of captured values selectors (OR logic)
    if (isArray(selector.captured)) {
      // Empty array doesn't match anything
      if (selector.captured.length === 0) {
        return false;
      }
      // Match if any of the array elements matches
      return selector.captured.some((capturedSelector) =>
        this._checkCapturedValuesObject(
          element.captured,
          capturedSelector,
          templateData
        )
      );
    }

    // Handle single captured values selector object
    return this._checkCapturedValuesObject(
      element.captured,
      selector.captured,
      templateData
    );
  }

  /**
   * Determines if the parent captured values match the selector.
   * @param parentSelector The parent selector to match.
   * @param parentCaptured The captured values from first parent.
   * @param templateData The data to use for replace in selector values
   * @returns True if the captured values match, false otherwise.
   */
  private _isParentCapturedValuesMatch(
    parentSelector: ParentElementSelectorData,
    parentCaptured: SelectableElement["captured"],
    templateData: TemplateData
  ): boolean {
    if (!parentSelector.captured || isEmptyObject(parentSelector.captured)) {
      return true;
    }

    if (isArray(parentSelector.captured)) {
      if (parentSelector.captured.length === 0) {
        return false;
      }
      return parentSelector.captured.some((capturedSelector) =>
        this._checkCapturedValuesObject(
          parentCaptured,
          capturedSelector,
          templateData
        )
      );
    }

    return this._checkCapturedValuesObject(
      parentCaptured,
      parentSelector.captured,
      templateData
    );
  }

  /**
   * Whether the given element first parent matches the selector parent.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector values
   * @returns Whether the first parent matches the selector parent.
   */
  private _isParentMatch(
    element: SelectableElement,
    selector: BaseElementSelectorData,
    templateData: TemplateData
  ): boolean {
    if (isUndefined(selector.parent)) {
      return true;
    }
    if (isNull(selector.parent)) {
      return !element.parents || element.parents.length === 0;
    }

    const firstParent = element.parents?.[0];

    if (!firstParent) {
      return false;
    }

    if (
      !isUndefined(selector.parent.type) &&
      !this.isTemplateMicromatchMatch(
        selector.parent.type,
        templateData,
        firstParent.type
      )
    ) {
      return false;
    }

    if (
      !isUndefined(selector.parent.category) &&
      !this.isTemplateMicromatchMatch(
        selector.parent.category,
        templateData,
        firstParent.category
      )
    ) {
      return false;
    }

    if (
      !isUndefined(selector.parent.elementPath) &&
      !this.isTemplateMicromatchMatch(
        selector.parent.elementPath,
        templateData,
        firstParent.elementPath
      )
    ) {
      return false;
    }

    if (
      !this._isParentCapturedValuesMatch(
        selector.parent,
        firstParent.captured,
        templateData
      )
    ) {
      return false;
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
  ): BaseElementSelectorData | null {
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
        !this._isCapturedValuesMatch(element, selectorData, templateData) ||
        !this._isParentMatch(element, selectorData, templateData)
      ) {
        continue; // Early exit on first failed condition
      }

      // All conditions passed, return the first matching selector
      return selectorData;
    }

    return null;
  }

  /**
   * Returns the selector matching result for the given element, or null if none matches.
   * It omits checks in keys applying only to dependency between elements, such as relationship.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The selector matching result for the given element, or null if none matches.
   */
  public getSelectorMatching(
    element: ElementDescription,
    selector: BaseElementsSelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): BaseElementSelectorData | null {
    const selectorsData = normalizeElementsSelector(selector);
    return this._getSelectorMatching(element, selectorsData, extraTemplateData);
  }

  /**
   * Returns whether the given element matches the selector.
   * It omits checks in keys applying only to dependency between elements, such as relationship.
   * @param element The element to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
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
