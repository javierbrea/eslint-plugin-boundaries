import type { MatchersOptionsNormalized } from "../../Config";
import type { FileDescription } from "../../Descriptor";
import type { MicromatchPatternNullable } from "../../Shared";
import { isArray, isNullish, isEmptyObject } from "../../Shared";
import { BaseElementsMatcher } from "../Shared";
import type { TemplateData, MatcherOptions, Micromatch } from "../Shared";

import type { FileSingleSelector, FileSelector } from "./FileSelector.types";
import { normalizeFileSelector } from "./FileSelectorHelpers";

/**
 * Matcher class to determine if files match a given selector.
 */
export class FilesMatcher extends BaseElementsMatcher {
  /**
   * Creates a new FilesMatcher.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   */
  constructor(config: MatchersOptionsNormalized, micromatch: Micromatch) {
    super(config, micromatch);
  }

  /**
   * Whether the given file path matches the selector path.
   * @param file The file to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value.
   * @returns Whether the file path matches the selector path.
   */
  private _isPathMatch(
    file: FileDescription,
    selector: FileSingleSelector,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element: file,
      selector,
      elementKey: "path",
      selectorKey: "path",
      selectorValue: selector.path,
      templateData,
    });
  }

  /**
   * Whether the given file categories match the selector categories.
   * File descriptions expose categories as an array, so it matches when any category matches the selector pattern.
   * @param file The file to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value.
   * @returns Whether the file categories match the selector categories.
   */
  private _isCategoriesMatch(
    file: FileDescription,
    selector: FileSingleSelector,
    templateData: TemplateData
  ): boolean {
    const categoriesSelector = selector.categories;

    if (isNullish(categoriesSelector)) {
      return true;
    }

    return this.isTemplateMicromatchMatch(
      categoriesSelector,
      templateData,
      file.categories
    );
  }

  /**
   * Checks if a single captured values object matches the file.
   * @param capturedValues The captured values to check.
   * @param capturedSelector The captured values selector object to check against.
   * @param templateData The data to use for replace in selector values.
   * @returns True if all captured values in the selector match those in the file, false otherwise.
   */
  private _checkCapturedValuesObject(
    capturedValues: FileDescription["captured"],
    capturedSelector: Record<string, MicromatchPatternNullable>,
    templateData: TemplateData
  ): boolean {
    if (!capturedValues) {
      return false;
    }

    for (const [key, pattern] of Object.entries(capturedSelector)) {
      const fileValue = capturedValues[key];
      if (!fileValue) {
        return false;
      }

      const renderedPattern = this.getRenderedTemplates(pattern, templateData);
      const filteredPattern = this.cleanMicromatchPattern(renderedPattern);

      if (!filteredPattern) {
        return false;
      }

      const isMatch = this.micromatch.isMatch(fileValue, filteredPattern);
      if (!isMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Determines if the captured values of the file match those in the selector.
   * When the selector is an array, the file matches if it matches any of the array elements.
   * @param file The file to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector values.
   * @returns True if the captured values match, false otherwise.
   */
  private _isCapturedValuesMatch(
    file: FileDescription,
    selector: FileSingleSelector,
    templateData: TemplateData
  ): boolean {
    if (!selector.captured || isEmptyObject(selector.captured)) {
      return true;
    }

    if (isArray(selector.captured)) {
      if (selector.captured.length === 0) {
        return false;
      }

      return selector.captured.some((capturedSelector) =>
        this._checkCapturedValuesObject(
          file.captured,
          capturedSelector,
          templateData
        )
      );
    }

    return this._checkCapturedValuesObject(
      file.captured,
      selector.captured,
      templateData
    );
  }

  /**
   * Determines if the isIgnored property of the file matches that in the selector.
   * @param file The file to check.
   * @param selector The selector to check against.
   * @returns True if the isIgnored properties match, false otherwise.
   */
  private _isIgnoredMatch(
    file: FileDescription,
    selector: FileSingleSelector
  ): boolean {
    return this.isElementKeyBooleanMatch({
      element: file,
      selector,
      elementKey: "isIgnored",
      selectorKey: "isIgnored",
    });
  }

  /**
   * Determines if the isUnknown property of the file matches that in the selector.
   * @param file The file to check.
   * @param selector The selector to check against.
   * @returns True if the isUnknown properties match, false otherwise.
   */
  private _isUnknownMatch(
    file: FileDescription,
    selector: FileSingleSelector
  ): boolean {
    return this.isElementKeyBooleanMatch({
      element: file,
      selector,
      elementKey: "isUnknown",
      selectorKey: "isUnknown",
    });
  }

  /**
   * Returns the selector matching result for the given file.
   * @param file The file to check.
   * @param selectorsData The selectors to check against.
   * @param extraTemplateData Extra template data to use for matching.
   * @returns The selector matching result for the given file, or null if none matches.
   */
  private _getSelectorMatching(
    file: FileDescription,
    selectorsData: FileSingleSelector[],
    extraTemplateData: TemplateData
  ): FileSingleSelector | null {
    const templateData: TemplateData = {
      file,
      ...extraTemplateData,
    };

    for (const selectorData of selectorsData) {
      if (
        !this._isIgnoredMatch(file, selectorData) ||
        !this._isUnknownMatch(file, selectorData) ||
        !this._isPathMatch(file, selectorData, templateData) ||
        !this._isCategoriesMatch(file, selectorData, templateData) ||
        !this._isCapturedValuesMatch(file, selectorData, templateData)
      ) {
        continue;
      }

      return selectorData;
    }

    return null;
  }

  /**
   * Returns the selector matching result for the given file, or null if none matches.
   * @param file The file to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The selector matching result for the given file, or null if none matches.
   */
  public getSelectorMatching(
    file: FileDescription,
    selector: FileSelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): FileSingleSelector | null {
    const selectorsData = normalizeFileSelector(selector);
    return this._getSelectorMatching(file, selectorsData, extraTemplateData);
  }

  /**
   * Returns whether the given file matches the selector.
   * @param file The file to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns Whether the file matches the selector.
   */
  public isFileMatch(
    file: FileDescription,
    selector: FileSelector,
    options?: MatcherOptions
  ): boolean {
    const selectorMatching = this.getSelectorMatching(file, selector, options);
    return !isNullish(selectorMatching);
  }
}
