import type {
  MatchersOptionsNormalized,
  MicromatchPatternNullable,
} from "../Config";
import type { FileDescription } from "../Descriptor";
import { isArray, isString, isNull, isUndefined } from "../Support";

import { BaseElementsMatcher } from "./BaseElementsMatcher";
import type { ElementsMatcher } from "./ElementsMatcher";
import type {
  FileSelectorData,
  FileElementSelectorData,
  FilesSelector,
  MatcherOptions,
  TemplateData,
} from "./Matcher.types";
import { normalizeFilesSelector } from "./MatcherHelpers";
import type { Micromatch } from "./Micromatch";

/**
 * Matcher for file descriptions against file selectors.
 * Files are classified by categories and can contain references to architectural elements.
 */
export class FilesMatcher extends BaseElementsMatcher {
  private _elementsMatcher: ElementsMatcher;

  constructor(
    config: MatchersOptionsNormalized,
    elementsMatcher: ElementsMatcher,
    micromatch: Micromatch
  ) {
    super(config, micromatch);
    this._elementsMatcher = elementsMatcher;
  }

  /**
   * Checks if a file's category matches the selector category.
   */
  private _isCategoryMatch(
    fileCategory: string | string[] | null,
    selectorCategory: FileSelectorData["category"],
    templateData: TemplateData
  ): boolean {
    if (isUndefined(selectorCategory)) {
      return true;
    }

    if (isNull(selectorCategory)) {
      return isNull(fileCategory);
    }

    if (isString(selectorCategory) || isArray(selectorCategory)) {
      if (isArray(fileCategory)) {
        return fileCategory.some((category) =>
          this.isTemplateMicromatchMatch(
            selectorCategory as MicromatchPatternNullable,
            templateData,
            category
          )
        );
      }
      return this.isTemplateMicromatchMatch(
        selectorCategory as MicromatchPatternNullable,
        templateData,
        String(fileCategory || "")
      );
    }

    return false;
  }

  /**
   * Checks if a file path matches the selector path pattern.
   */
  private _isPathMatch(
    filePath: string | null,
    selectorPath: FileSelectorData["path"],
    templateData: TemplateData
  ): boolean {
    if (isUndefined(selectorPath)) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selectorPath as MicromatchPatternNullable,
      templateData,
      filePath
    );
  }

  /**
   * Checks if an element internalPath matches the selector pattern.
   */
  private _isInternalPathMatch(
    fileInternalPath: string | null,
    selectorInternalPath: FileSelectorData["internalPath"],
    templateData: TemplateData
  ): boolean {
    if (isUndefined(selectorInternalPath)) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selectorInternalPath as MicromatchPatternNullable,
      templateData,
      fileInternalPath
    );
  }

  /**
   * Checks if a file's origin matches the selector origin.
   */
  private _isOriginMatch(
    fileOrigin: string | null,
    selectorOrigin: FileSelectorData["origin"],
    templateData: TemplateData
  ): boolean {
    if (isUndefined(selectorOrigin)) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selectorOrigin as MicromatchPatternNullable,
      templateData,
      fileOrigin
    );
  }

  /**
   * Checks if the isIgnored flag matches the selector.
   */
  private _isIgnoredMatch(
    fileIsIgnored: boolean,
    selectorIsIgnored: FileSelectorData["isIgnored"]
  ): boolean {
    if (isUndefined(selectorIsIgnored)) {
      return true;
    }
    return fileIsIgnored === selectorIsIgnored;
  }

  /**
   * Checks if the isUnknown flag matches the selector.
   */
  private _isUnknownMatch(
    fileIsUnknown: boolean,
    selectorIsUnknown: FileSelectorData["isUnknown"]
  ): boolean {
    if (isUndefined(selectorIsUnknown)) {
      return true;
    }
    return fileIsUnknown === selectorIsUnknown;
  }

  /**
   * Checks if captured values match the selector.
   */
  private _isCapturedValuesMatch(
    fileCapturedValues: Record<string, string> | null,
    selectorCaptured: FileSelectorData["captured"],
    templateData: TemplateData
  ): boolean {
    if (isUndefined(selectorCaptured)) {
      return true;
    }

    if (isArray(selectorCaptured)) {
      return selectorCaptured.some((capturedValue) =>
        this._isCapturedValuesMatch(
          fileCapturedValues,
          capturedValue,
          templateData
        )
      );
    }

    if (selectorCaptured) {
      const selectorCapturedObj = selectorCaptured;
      if (!fileCapturedValues) {
        return false;
      }

      for (const [key, value] of Object.entries(selectorCapturedObj)) {
        const fileValue = fileCapturedValues[key];
        if (!this.isTemplateMicromatchMatch(value, templateData, fileValue)) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Checks if a nested element selector matches the file's element.
   */
  private _isElementMatch(
    fileElement: FileDescription["element"],
    elementSelector: FileElementSelectorData | null | undefined,
    templateData: TemplateData
  ): boolean {
    if (!elementSelector || isNull(elementSelector)) {
      return !fileElement;
    }

    if (!fileElement) {
      return false;
    }

    return this._elementsMatcher.isElementMatch(
      fileElement as Parameters<ElementsMatcher["isElementMatch"]>[0],
      elementSelector as Parameters<ElementsMatcher["isElementMatch"]>[1],
      {
        extraTemplateData: templateData,
      }
    );
  }

  /**
   * Determines the matching selector data for a file.
   */
  private _getSelectorMatching(
    file: FileDescription,
    selectorsData: FileSelectorData[],
    extraTemplateData: TemplateData
  ): FileSelectorData | null {
    const templateData: TemplateData = {
      file,
      ...extraTemplateData,
    };

    for (const selectorData of selectorsData) {
      if (!this._isPathMatch(file.path, selectorData.path, templateData)) {
        continue;
      }

      if (
        !this._isInternalPathMatch(
          file.internalPath,
          selectorData.internalPath,
          templateData
        )
      ) {
        continue;
      }

      if (
        !this._isCategoryMatch(
          file.category,
          selectorData.category,
          templateData
        )
      ) {
        continue;
      }

      if (
        !this._isOriginMatch(file.origin, selectorData.origin, templateData)
      ) {
        continue;
      }

      if (!this._isIgnoredMatch(file.isIgnored, selectorData.isIgnored)) {
        continue;
      }

      if (!this._isUnknownMatch(file.isUnknown, selectorData.isUnknown)) {
        continue;
      }

      if (
        !this._isCapturedValuesMatch(
          file.captured,
          selectorData.captured,
          templateData
        )
      ) {
        continue;
      }

      if (!isUndefined(selectorData.element)) {
        if (
          !this._isElementMatch(
            file.element,
            selectorData.element,
            templateData
          )
        ) {
          continue;
        }
      }

      return selectorData;
    }

    return null;
  }

  /**
   * Returns the matching selector data for a file and selector.
   */
  getSelectorMatching(
    file: FileDescription,
    selector: FilesSelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): FileSelectorData | null {
    const selectorsData = normalizeFilesSelector(selector);
    return this._getSelectorMatching(file, selectorsData, extraTemplateData);
  }

  /**
   * Returns whether a file matches a given selector.
   */
  isFileMatch(
    file: FileDescription,
    selector: FilesSelector,
    options?: MatcherOptions
  ): boolean {
    return this.getSelectorMatching(file, selector, options) !== null;
  }
}
