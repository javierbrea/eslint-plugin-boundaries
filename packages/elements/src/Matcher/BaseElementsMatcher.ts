import Handlebars from "handlebars";

import type { MicromatchPattern, MatchersOptionsNormalized } from "../Config";
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
import type { Micromatch } from "./Micromatch";

const HANDLEBARS_TEMPLATE_REGEX = /{{\s*[^}\s]+(?:\s+[^}\s]+)*\s*}}/;
const LEGACY_TEMPLATE_REGEX = /\$\{([^}]+)\}/g;

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
      captured: selector[1] ? { ...selector[1] } : undefined,
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
   * Option to use legacy templates with ${} syntax.
   */
  protected readonly _legacyTemplates: boolean;

  /**
   * Micromatch instance for matching.
   */
  protected micromatch: Micromatch;

  /**
   * Creates a new BaseElementsMatcher.
   * @param config Configuration options for the matcher.
   * @param globalCache Global cache instance.
   */
  constructor(config: MatchersOptionsNormalized, micromatch: Micromatch) {
    this.micromatch = micromatch;
    this._legacyTemplates = config.legacyTemplates;
  }

  /**
   * Converts a template with ${} to Handlebars {{}} templates for backwards compatibility.
   * @param template The template to convert.
   * @returns The converted template.
   */
  private _getBackwardsCompatibleTemplate(template: string): string {
    return template.replaceAll(LEGACY_TEMPLATE_REGEX, "{{ $1 }}");
  }

  /**
   * Determines if a template contains Handlebars syntax.
   * @param template The template to check.
   * @returns True if the template contains Handlebars syntax, false otherwise.
   */
  private _isHandlebarsTemplate(template: string): boolean {
    return HANDLEBARS_TEMPLATE_REGEX.test(template);
  }

  /**
   * Returns a rendered template using the provided template data.
   * Optimized version with template caching for better performance.
   * @param template The template to render.
   * @param templateData The data to use for replace in the template.
   * @returns The rendered template.
   */
  private _getRenderedTemplate(
    template: string,
    templateData: TemplateData
  ): string {
    const templateToUse = this._legacyTemplates
      ? this._getBackwardsCompatibleTemplate(template)
      : template;
    if (!this._isHandlebarsTemplate(templateToUse)) {
      // If the template does not contain any Handlebars syntax, return it as is.
      return template;
    }

    const compiledTemplate = Handlebars.compile(templateToUse);

    return compiledTemplate(templateData);
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
   * Optimized version with caching for better performance.
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

    return this.micromatch.isMatch(elementValueToCheck, selectorValueToCheck);
  }

  /**
   * Returns whether the given value matches the micromatch pattern after rendering it as a template.
   * @param pattern The micromatch pattern to render and match against.
   * @param templateData The data to use for rendering the pattern as a template.
   * @param value The value to check.
   * @returns Whether the value matches the rendered pattern.
   */
  protected isTemplateMicromatchMatch(
    pattern: MicromatchPattern,
    templateData: TemplateData,
    value?: unknown
  ): boolean {
    // If the element value is nullish, it cannot match anything.
    if (isNullish(value)) {
      return false;
    }

    const patternRendered = this.getRenderedTemplates(pattern, templateData);

    // Empty rendered selector values do not match anything. (It may happen due to templates rendering to empty strings.)
    if (!patternRendered) {
      return false;
    }

    // Clean empty strings from arrays to avoid matching them.
    const filteredPattern = isArray(patternRendered)
      ? patternRendered.filter(Boolean)
      : patternRendered;

    if (isArray(value)) {
      // If the value is an array, we check if any of its items match the pattern.
      return value.some((val) => this.isMicromatchMatch(val, filteredPattern));
    }
    return this.isMicromatchMatch(value, filteredPattern);
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

    // The selector key exists in the selector, but it does not exist in the element. No match.
    if (!isObjectWithProperty(element, elementKey)) {
      return false;
    }

    return this.isTemplateMicromatchMatch(
      selectorValue,
      templateData,
      element[elementKey]
    );
  }
}
