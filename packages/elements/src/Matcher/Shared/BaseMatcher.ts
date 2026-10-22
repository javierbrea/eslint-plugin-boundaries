import Handlebars from "handlebars";

import { CacheManager, CacheManagerDisabled } from "../../Cache";
import type { MatchersOptionsNormalized } from "../../Config";
import type { BaseDescription, ModuleDescription } from "../../Descriptor";
import {
  isArray,
  isObjectWithProperty,
  isString,
  isBoolean,
  isNull,
  isUndefined,
} from "../../Shared";
import type {
  MicromatchPatternNullable,
  MicromatchMatchableValue,
} from "../../Shared";
import type { ElementSingleSelector } from "../Element";
import type { ModuleSelector } from "../Module";

import type { ArrayQuery, StringArrayQuery } from "./ArrayQuery.types";
import { expandStringArrayQuery } from "./ArrayQuerySelectorHelpers";
import type { TemplateData } from "./BaseMatcher.types";
import type { Micromatch } from "./Micromatch";

const LEGACY_TEMPLATE_REGEX = /\$\{([^}]+)\}/g;
const HANDLEBARS_TEMPLATE_REGEX = /{{\s*[^{}\s][^{}]*}}/;

/**
 * Compiled Handlebars template, or null when the template has no Handlebars syntax
 */
type CompiledTemplate = Handlebars.TemplateDelegate<TemplateData> | null;

/**
 * Base matcher class to determine if objects match a given selector.
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
   * Cache for compiled Handlebars templates, keyed by the template as received. Templates without Handlebars syntax are stored as null, so they are not checked again either.
   */
  private readonly _compiledTemplatesCache:
    | CacheManager<string, CompiledTemplate>
    | CacheManagerDisabled<string, CompiledTemplate>;

  /**
   * Creates a new BaseElementsMatcher.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   */
  constructor(config: MatchersOptionsNormalized, micromatch: Micromatch) {
    this.micromatch = micromatch;
    this._legacyTemplates = config.legacyTemplates;
    this._compiledTemplatesCache = config.cache
      ? new CacheManager<string, CompiledTemplate>()
      : new CacheManagerDisabled<string, CompiledTemplate>();
  }

  /**
   * Clears the cache of compiled templates.
   */
  public clearCache(): void {
    this._compiledTemplatesCache.clear();
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
   * Returns the compiled Handlebars template, or null when the template has no Handlebars syntax.
   * When the cache is enabled, each distinct template is converted and compiled only once per matcher, because compiling is expensive and the same templates are rendered for every entity matched.
   * @param template The template to compile.
   * @returns The compiled template, or null when there is nothing to render.
   */
  private _getCompiledTemplate(template: string): CompiledTemplate {
    const cachedTemplate = this._compiledTemplatesCache.get(template);
    if (!isUndefined(cachedTemplate)) {
      return cachedTemplate;
    }
    const templateToUse = this._legacyTemplates
      ? this._getBackwardsCompatibleTemplate(template)
      : template;
    const compiledTemplate = this._isHandlebarsTemplate(templateToUse)
      ? Handlebars.compile<TemplateData>(templateToUse)
      : null;
    this._compiledTemplatesCache.set(template, compiledTemplate);
    return compiledTemplate;
  }

  /**
   * Returns a rendered template using the provided template data.
   * @param template The template to render.
   * @param templateData The data to use for replace in the template.
   * @returns The rendered template.
   */
  private _getRenderedTemplate(
    template: string | null,
    templateData: TemplateData
  ): string | null {
    if (!template) {
      return template;
    }
    const compiledTemplate = this._getCompiledTemplate(template);
    if (!compiledTemplate) {
      // If the template does not contain any Handlebars syntax, return it as is.
      return template;
    }
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
    value: string | null | undefined | boolean,
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
    value: MicromatchMatchableValue
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
   * @returns Whether the object key matches the selector key.
   */
  protected isObjectKeyBooleanMatch<
    T extends BaseDescription | ModuleDescription,
    S extends ElementSingleSelector | ModuleSelector,
  >({
    /** The object to check. */
    object,
    /** The selector to check against. */
    selector,
    /** The key of the object to check. */
    objectKey,
    /** The key of the selector to check against. */
    selectorKey,
  }: {
    /** The object to check. */
    object: T;
    /** The selector to check against. */
    selector: S;
    /** The key of the object to check. */
    objectKey: keyof T;
    /** The key of the selector to check against. */
    selectorKey: keyof S;
  }): boolean {
    // The selector key does not exist in the selector, so it matches any value.
    if (!(selectorKey in selector) || isUndefined(selector[selectorKey])) {
      return true;
    }
    // The selector key exists in the selector, but it does not exist in the object. No match.
    // istanbul ignore next - This case should not happen due to object validations, but we guard against it anyway.
    if (!(objectKey in object)) {
      return false;
    }
    // Both values must be booleans to match.
    if (!isBoolean(selector[selectorKey]) || !isBoolean(object[objectKey])) {
      return false;
    }
    return (
      (selector[selectorKey] as boolean) === (object[objectKey] as boolean)
    );
  }

  /**
   * Generic array-query matcher. All present operators are AND-combined.
   * @param array The target array from the description (may be null).
   * @param query The array query object.
   * @param matchElement Predicate matching one array element against one matcher.
   * @returns Whether the array satisfies the query.
   */
  protected isArrayQueryMatch<TElement, TMatcher>(
    array: readonly TElement[] | null,
    query: ArrayQuery<TMatcher>,
    matchElement: (element: TElement, matcher: TMatcher) => boolean
  ): boolean {
    if (isNull(array)) {
      return false;
    }

    if (!isUndefined(query.hasLength) && array.length !== query.hasLength) {
      return false;
    }

    if (this._arrayQueryEqualsToFails(array, query, matchElement)) {
      return false;
    }

    if (this._arrayQueryAtIndexFails(array, query, matchElement)) {
      return false;
    }

    if (
      !isUndefined(query.anyOf) &&
      !array.some((element) =>
        query.anyOf!.some((matcher) => matchElement(element, matcher))
      )
    ) {
      return false;
    }

    if (
      !isUndefined(query.allOf) &&
      !query.allOf.every((matcher) =>
        array.some((element) => matchElement(element, matcher))
      )
    ) {
      return false;
    }

    if (
      !isUndefined(query.noneOf) &&
      query.noneOf.some((matcher) =>
        array.some((element) => matchElement(element, matcher))
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Whether the array-query `equalsTo` operator, if present, fails to match the array.
   * @param array The target array from the description.
   * @param query The array query object.
   * @param matchElement Predicate matching one array element against one matcher.
   * @returns Whether the `equalsTo` operator is present and not satisfied by the array.
   */
  private _arrayQueryEqualsToFails<TElement, TMatcher>(
    array: readonly TElement[],
    query: ArrayQuery<TMatcher>,
    matchElement: (element: TElement, matcher: TMatcher) => boolean
  ): boolean {
    if (isUndefined(query.equalsTo)) {
      return false;
    }
    if (array.length !== query.equalsTo.length) {
      return true;
    }
    return !query.equalsTo.every((matcher, index) =>
      matchElement(array[index], matcher)
    );
  }

  /**
   * Whether the array-query `atIndex` operator, if present, fails to match the array.
   * @param array The target array from the description.
   * @param query The array query object.
   * @param matchElement Predicate matching one array element against one matcher.
   * @returns Whether the `atIndex` operator is present and not satisfied by the array.
   */
  private _arrayQueryAtIndexFails<TElement, TMatcher>(
    array: readonly TElement[],
    query: ArrayQuery<TMatcher>,
    matchElement: (element: TElement, matcher: TMatcher) => boolean
  ): boolean {
    if (isUndefined(query.atIndex)) {
      return false;
    }
    const { index, matches } = query.atIndex;
    const resolvedIndex = index < 0 ? array.length + index : index;
    if (resolvedIndex < 0 || resolvedIndex >= array.length) {
      return true;
    }
    const matcherList = isArray(matches)
      ? (matches as TMatcher[])
      : [matches as TMatcher];
    return !matcherList.some((m) => matchElement(array[resolvedIndex], m));
  }

  /**
   * String array query matcher with `expand` item support.
   * Expands `{ expand }` operand items against the template data, then evaluates
   * with the standard template-micromatch element matcher.
   */
  protected isStringArrayQueryMatch(
    array: readonly string[] | null,
    query: StringArrayQuery,
    templateData: TemplateData
  ): boolean {
    const expanded = expandStringArrayQuery(query, templateData);
    return this.isArrayQueryMatch(array, expanded, (value, pattern) =>
      this.isTemplateMicromatchMatch(pattern, templateData, value)
    );
  }

  /**
   * Whether the given object key matches the selector key using micromatch.
   * @param param0 The parameters object.
   * @returns Whether the object key matches the selector key.
   */
  protected isObjectKeyMicromatchMatch<
    T extends BaseDescription | ModuleDescription,
    S extends ElementSingleSelector | ModuleSelector,
    K extends keyof T,
  >({
    object,
    selector,
    objectKey,
    selectorKey,
    selectorValue,
    templateData,
  }: {
    /** The object to check. */
    object: T & Record<K, MicromatchMatchableValue>;
    /** The selector to check against. */
    selector: S;
    /** The key of the object to check. */
    objectKey: K;
    /** The key of the selector to check against. */
    selectorKey: keyof S;
    /** The value of the selector key to check against. */
    selectorValue?: MicromatchPatternNullable;
    /** Data to pass when the selector value is rendered as a template */
    templateData: TemplateData;
  }): boolean {
    // The selector key does not exist in the selector, so it matches any value. We also check the value passed separately in order to improve typing inference.
    if (!(selectorKey in selector) || isUndefined(selectorValue)) {
      return true;
    }
    // Undefined selector values do not match anything.
    // The selector key exists in the selector, but it does not exist in the object. No match.
    /* istanbul ignore next - This cases should not happen due to selector validations, but we guard against it anyway. */
    if (!isObjectWithProperty(object, String(objectKey))) {
      return false;
    }

    const objectValue = object[objectKey];

    return this.isTemplateMicromatchMatch(
      selectorValue,
      templateData,
      objectValue
    );
  }
}
