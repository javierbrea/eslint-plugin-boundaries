import Handlebars from "handlebars";

import type {
  MicromatchPatternNullable,
  MatchersOptionsNormalized,
} from "../Config";
import type { BaseElementDescription } from "../Descriptor";
import {
  isArray,
  isObjectWithProperty,
  isString,
  isBoolean,
  isNull,
  isUndefined,
} from "../Support";

import type {
  BaseElementSelectorData,
  TemplateData,
  SelectableElement,
} from "./Matcher.types";
import type { Micromatch } from "./Micromatch";

const LEGACY_TEMPLATE_REGEX = /\$\{([^}]+)\}/g;
const HANDLEBARS_TEMPLATE_REGEX = /{{\s*[^{}\s][^{}]*}}/;

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
  private _getBackwardsCompatibleTemplate(
    template: string | null
  ): string | null {
    if (!template) {
      return template;
    }
    return template.replaceAll(LEGACY_TEMPLATE_REGEX, "{{ $1 }}");
  }

  /**
   * Determines if a template contains Handlebars syntax.
   * @param template The template to check.
   * @returns True if the template contains Handlebars syntax, false otherwise.
   */
  private _isHandlebarsTemplate(template: string | null): boolean {
    if (!template) {
      return false;
    }
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
    template: string | null,
    templateData: TemplateData
  ): string | null {
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
    template: MicromatchPatternNullable,
    templateData: TemplateData
  ): MicromatchPatternNullable {
    if (isArray(template)) {
      return template.map((temp) => {
        return this._getRenderedTemplate(temp, templateData);
      });
    }
    return this._getRenderedTemplate(template, templateData);
  }

  /**
   * Cleans a micromatch pattern by removing falsy values from arrays.
   * @param pattern The micromatch pattern(s) to clean.
   * @returns The cleaned pattern. If an array is provided, falsy entries are removed and the resulting array may be empty. If null is provided, null is returned unchanged.
   */
  protected cleanMicromatchPattern(
    pattern: MicromatchPatternNullable
  ): string | string[] | null {
    return isArray(pattern) ? (pattern.filter(Boolean) as string[]) : pattern;
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
    pattern: MicromatchPatternNullable
  ): boolean {
    if (isNull(pattern)) {
      return isNull(value);
    }
    if (isNull(value)) {
      return isArray(pattern) && pattern.some(isNull);
    }

    // Clean empty strings from arrays to avoid matching them.
    const patternToCheck = this.cleanMicromatchPattern(pattern);

    if (!patternToCheck?.length) {
      return false;
    }

    // Convert non-string element values to string for matching.
    const elementValueToCheck =
      !value || !isString(value) ? String(value) : value;

    return this.micromatch.isMatch(elementValueToCheck, patternToCheck);
  }

  /**
   * Returns whether the given value matches the micromatch pattern after rendering it as a template.
   * @param pattern The micromatch pattern to render and match against.
   * @param templateData The data to use for rendering the pattern as a template.
   * @param value The value to check.
   * @returns Whether the value matches the rendered pattern.
   */
  protected isTemplateMicromatchMatch(
    pattern: MicromatchPatternNullable,
    templateData: TemplateData,
    value?: unknown
  ): boolean {
    // If the element value is undefined, it cannot match anything.
    if (isUndefined(value)) {
      return false;
    }

    const patternRendered = this.getRenderedTemplates(pattern, templateData);

    // Empty rendered selector values do not match anything. (It may happen due to templates rendering to empty strings.)
    if (!isNull(patternRendered) && !patternRendered) {
      return false;
    }

    if (isArray(value)) {
      // If the value is an array, we check if any of its items matches the pattern.
      return value.some((val) => this.isMicromatchMatch(val, patternRendered));
    }

    return this.isMicromatchMatch(value, patternRendered);
  }

  /**
   * Whether the given element key matches the selector key as booleans.
   * @param param0 The parameters object.
   * @returns Whether the element key matches the selector key.
   */
  protected isElementKeyBooleanMatch<
    T extends BaseElementDescription,
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
    S extends BaseElementSelectorData,
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
    elementKey: keyof T;
    /** The key of the selector to check against. */
    selectorKey: keyof BaseElementSelectorData;
    /** The value of the selector key to check against. */
    selectorValue?: MicromatchPatternNullable;
    /** Data to pass when the selector value is rendered as a template */
    templateData: TemplateData;
  }): boolean {
    // The selector key does not exist in the selector, so it matches any value. We also check the value passed separately in order to improve typing inference.
    if (!(selectorKey in selector)) {
      return true;
    }
    // Undefined selector values do not match anything.
    // The selector key exists in the selector, but it does not exist in the element. No match.
    /* istanbul ignore next - This cases should not happen due to selector validations, but we guard against it anyway. */
    if (
      isUndefined(selectorValue) ||
      !isObjectWithProperty(element, String(elementKey))
    ) {
      return false;
    }

    const elementValue = (element as Record<string, unknown>)[
      String(elementKey)
    ];

    return this.isTemplateMicromatchMatch(
      selectorValue,
      templateData,
      elementValue
    );
  }
}
