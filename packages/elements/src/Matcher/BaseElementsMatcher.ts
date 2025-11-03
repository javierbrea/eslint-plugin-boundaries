import Handlebars from "handlebars";
import micromatch from "micromatch";

import type { MicromatchPattern } from "../Config";
import type {
  LocalElementKnown,
  CoreDependencyElement,
  LocalDependencyElementKnown,
  ExternalDependencyElement,
  BaseElement,
  IgnoredElement,
} from "../Descriptor";
import {
  isArray,
  isObjectWithProperty,
  isString,
  isBoolean,
  isNullish,
} from "../Support";

import type {
  BaseElementSelector,
  BaseElementSelectorData,
  DependencyElementSelectorData,
  DependencyElementSelector,
  BaseElementsSelector,
  ElementsSelector,
  ElementSelector,
  ElementSelectorData,
  DependencyElementsSelector,
  TemplateData,
  SelectableElement,
} from "./Matcher.types";
import {
  isSimpleElementSelectorByType,
  isElementSelectorWithLegacyOptions,
  isElementSelectorData,
} from "./MatcherHelpers";

/**
 * Normalizes a selector into ElementSelectorData format.
 * @param selector The selector to normalize.
 * @returns The normalized selector data.
 */
function normalizeSelector(
  selector: BaseElementSelector
): BaseElementSelectorData;
function normalizeSelector(
  selector: DependencyElementSelector
): DependencyElementSelectorData;
function normalizeSelector(selector: ElementSelector): ElementSelectorData {
  if (isSimpleElementSelectorByType(selector)) {
    return { type: selector };
  }

  if (isElementSelectorData(selector)) {
    return { ...selector };
  }

  if (isElementSelectorWithLegacyOptions(selector)) {
    return {
      type: selector[0],
      captured: { ...selector[1] },
    };
  }
  throw new Error("Invalid element selector");
}

/**
 * Normalizes an ElementsSelector into an array of ElementSelectorData.
 * @param elementsSelector The elements selector, in any supported format.
 * @returns The normalized array of selector data.
 */
export function normalizeElementsSelector(
  elementsSelector: BaseElementsSelector
): BaseElementSelectorData[];
export function normalizeElementsSelector(
  elementsSelector: DependencyElementsSelector
): DependencyElementSelectorData[];
export function normalizeElementsSelector(
  elementsSelector: ElementsSelector
): ElementSelectorData[] {
  if (isArray(elementsSelector)) {
    if (isElementSelectorWithLegacyOptions(elementsSelector)) {
      return [normalizeSelector(elementsSelector)];
    }
    return elementsSelector.map((sel) => normalizeSelector(sel));
  }
  return [normalizeSelector(elementsSelector)];
}

/**
 * Base matcher class to determine if elements or dependencies match a given selector.
 */
export class BaseElementsMatcher {
  /**
   * Converts a template with ${} to Handlebars {{}} templates for backwards compatibility.
   * @param template The template to convert.
   * @returns The converted template.
   */
  private _getBackwardsCompatibleTemplate(template: string): string {
    return template.replaceAll(/\$\{([^}]+)\}/g, "{{ $1 }}");
  }

  /**
   * Returns a rendered template using the provided template data.
   * @param template The template to render.
   * @param extraTemplateData The data to use for replace in the template.
   * @returns The rendered template.
   */
  private _getRenderedTemplate(
    template: string,
    templateData: TemplateData
  ): string {
    return Handlebars.compile(this._getBackwardsCompatibleTemplate(template))(
      templateData
    );
  }

  /**
   * Returns rendered templates using the provided template data.
   * @param template The templates to render.
   * @param extraTemplateData The data to use for replace in the templates.
   * @returns The rendered templates.
   */
  protected getRenderedTemplates(
    template: MicromatchPattern,
    templateData: TemplateData
  ): MicromatchPattern {
    if (isArray(template)) {
      return template.map((temp) => {
        return this._getRenderedTemplate(temp, templateData);
      });
    }
    return this._getRenderedTemplate(template, templateData);
  }

  /**
   * Returns whether the given value matches the micromatch pattern, converting non-string values to strings.
   * @param value The value to check.
   * @param pattern The micromatch pattern to match against.
   * @returns Whether the value matches the pattern.
   */
  protected isMicromatchMatch(
    value: unknown,
    pattern: MicromatchPattern
  ): boolean {
    // Convert non-string element values to string for matching.
    const elementValueToCheck =
      !value || !isString(value) ? String(value) : value;
    // Clean empty strings from arrays to avoid matching them.
    const selectorValueToCheck = isArray(pattern)
      ? pattern.filter(Boolean)
      : pattern;

    return micromatch.isMatch(elementValueToCheck, selectorValueToCheck);
  }

  /**
   * Whether the given element key matches the selector key as booleans.
   * @param param0 The parameters object.
   * @returns Whether the element key matches the selector key.
   */
  protected isElementKeyBooleanMatch<
    T extends BaseElement,
    S extends BaseElementSelectorData,
  >({
    /** The element to check. */
    element,
    /** The selector to check against. */
    selector,
    /** The key of the element to check. */
    elementKey,
    /** The key of the selector to check against. */
    selectorKey,
  }: {
    /** The element to check. */
    element: T;
    /** The selector to check against. */
    selector: S;
    /** The key of the element to check. */
    elementKey: keyof T;
    /** The key of the selector to check against. */
    selectorKey: keyof S;
  }): boolean {
    // The selector key does not exist in the selector, so it matches any value.
    if (!(selectorKey in selector)) {
      return true;
    }
    // The selector key exists in the selector, but it does not exist in the element. No match.
    // istanbul ignore next - This case should not happen due to element validations, but we guard against it anyway.
    if (!(elementKey in element)) {
      return false;
    }
    // Both values must be booleans to match.
    if (!isBoolean(selector[selectorKey]) || !isBoolean(element[elementKey])) {
      return false;
    }
    return (
      (selector[selectorKey] as boolean) === (element[elementKey] as boolean)
    );
  }

  /**
   * Whether the given element key matches the selector key using micromatch.
   * @param param0 The parameters object.
   * @returns Whether the element key matches the selector key.
   */
  protected isElementKeyMicromatchMatch<
    T extends SelectableElement,
    S extends BaseElementSelectorData | DependencyElementSelectorData,
  >({
    element,
    selector,
    elementKey,
    selectorKey,
    selectorValue,
    templateData,
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
          : T extends IgnoredElement
            ? keyof IgnoredElement
            : keyof LocalDependencyElementKnown;
    /** The key of the selector to check against. */
    selectorKey: S extends DependencyElementSelectorData
      ? keyof DependencyElementSelectorData
      : keyof BaseElementSelectorData;
    /** The value of the selector key to check against. */
    selectorValue?: MicromatchPattern;
    /** Data to pass when the selector value is rendered as a template */
    templateData: TemplateData;
  }): boolean {
    // The selector key does not exist in the selector, so it matches any value. We also check the value passed separately in order to improve typing inference.
    if (!(selectorKey in selector)) {
      return true;
    }
    // Empty selector values do not match anything.
    if (!selectorValue) {
      return false;
    }

    const selectorValueRendered = this.getRenderedTemplates(
      selectorValue,
      templateData
    );

    // Empty rendered selector values do not match anything. (It may happen due to templates rendering to empty strings.)
    if (!selectorValueRendered) {
      return false;
    }

    // The selector key exists in the selector, but it does not exist in the element. No match.
    if (!isObjectWithProperty(element, elementKey)) {
      return false;
    }

    // The element key value is nullish, so it cannot match anything.
    if (isNullish(element[elementKey])) {
      return false;
    }

    return this.isMicromatchMatch(element[elementKey], selectorValueRendered);
  }
}
