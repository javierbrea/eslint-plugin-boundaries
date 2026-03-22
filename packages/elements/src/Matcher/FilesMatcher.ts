import type {
  MatchersOptionsNormalized,
  MicromatchPatternNullable,
} from "../Config";
import type { FileDescription } from "../Descriptor";
import { isArray, isString, isNull, isUndefined } from "../Support";

import type { ElementsMatcher } from "./ElementsMatcher";
import type {
  FileSelectorData,
  FileElementSelectorData,
  FilesSelector,
  MatcherOptions,
} from "./Matcher.types";
import { normalizeFilesSelector } from "./MatcherHelpers";
import type { Micromatch } from "./Micromatch";

/**
 * Matcher for file descriptions against file selectors.
 * Files are classified by categories and can contain references to architectural elements.
 */
export class FilesMatcher {
  private _elementsMatcher: ElementsMatcher;
  private _micromatch: Micromatch;

  constructor(
    _config: MatchersOptionsNormalized,
    elementsMatcher: ElementsMatcher,
    micromatch: Micromatch
  ) {
    this._elementsMatcher = elementsMatcher;
    this._micromatch = micromatch;
  }

  /**
   * Checks if a file's category matches the selector category.
   */
  private _isCategoryMatch(
    fileCategory: string | string[] | null,
    selectorCategory: FileSelectorData["category"]
  ): boolean {
    if (isNull(selectorCategory)) {
      return isNull(fileCategory);
    }

    if (isString(selectorCategory) || isArray(selectorCategory)) {
      if (isArray(fileCategory)) {
        return fileCategory.some((category) =>
          this._isMicromatchMatch(
            category,
            selectorCategory as MicromatchPatternNullable
          )
        );
      }
      return this._isMicromatchMatch(
        String(fileCategory || ""),
        selectorCategory as MicromatchPatternNullable
      );
    }

    return false;
  }

  /**
   * Checks if a file path matches the selector path pattern.
   */
  private _isPathMatch(
    filePath: string | null,
    selectorPath: FileSelectorData["path"]
  ): boolean {
    if (isUndefined(selectorPath)) {
      return true;
    }
    if (isNull(filePath)) {
      return isNull(selectorPath);
    }
    return this._isMicromatchMatch(
      filePath,
      selectorPath as MicromatchPatternNullable
    );
  }

  /**
   * Checks if an element internalPath matches the selector pattern.
   */
  private _isInternalPathMatch(
    fileInternalPath: string | null,
    selectorInternalPath: FileSelectorData["internalPath"]
  ): boolean {
    if (isUndefined(selectorInternalPath)) {
      return true;
    }
    if (!fileInternalPath) {
      return false;
    }
    return this._isMicromatchMatch(
      fileInternalPath,
      selectorInternalPath as MicromatchPatternNullable
    );
  }

  /**
   * Checks if a file's origin matches the selector origin.
   */
  private _isOriginMatch(
    fileOrigin: string | null,
    selectorOrigin: FileSelectorData["origin"]
  ): boolean {
    if (isUndefined(selectorOrigin)) {
      return true;
    }
    if (isNull(fileOrigin)) {
      return isNull(selectorOrigin);
    }
    return fileOrigin === selectorOrigin;
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
    selectorCaptured: FileSelectorData["captured"]
  ): boolean {
    if (isUndefined(selectorCaptured)) {
      return true;
    }

    if (isArray(selectorCaptured)) {
      return selectorCaptured.some((capturedValue) =>
        this._isCapturedValuesMatch(fileCapturedValues, capturedValue)
      );
    }

    if (selectorCaptured) {
      const selectorCapturedObj = selectorCaptured;
      if (!fileCapturedValues) {
        return false;
      }

      for (const [key, value] of Object.entries(selectorCapturedObj)) {
        const fileValue = fileCapturedValues[key];
        if (!this._isMicromatchMatch(fileValue || "", value)) {
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
    elementSelector: FileElementSelectorData | null | undefined
  ): boolean {
    if (!elementSelector || isNull(elementSelector)) {
      return !fileElement;
    }

    if (!fileElement) {
      return false;
    }

    return this._elementsMatcher.isElementMatch(
      fileElement as Parameters<ElementsMatcher["isElementMatch"]>[0],
      elementSelector as Parameters<ElementsMatcher["isElementMatch"]>[1]
    );
  }

  /**
   * Determines the matching selector data for a file.
   */
  private _getSelectorMatching(
    file: FileDescription,
    selectorsData: FileSelectorData[]
  ): FileSelectorData | null {
    for (const selectorData of selectorsData) {
      if (!this._isPathMatch(file.path, selectorData.path)) {
        continue;
      }

      if (
        !this._isInternalPathMatch(file.internalPath, selectorData.internalPath)
      ) {
        continue;
      }

      if (!this._isCategoryMatch(file.category, selectorData.category)) {
        continue;
      }

      if (!this._isOriginMatch(file.origin, selectorData.origin)) {
        continue;
      }

      if (!this._isIgnoredMatch(file.isIgnored, selectorData.isIgnored)) {
        continue;
      }

      if (!this._isUnknownMatch(file.isUnknown, selectorData.isUnknown)) {
        continue;
      }

      if (!this._isCapturedValuesMatch(file.captured, selectorData.captured)) {
        continue;
      }

      if (!isUndefined(selectorData.element)) {
        if (!this._isElementMatch(file.element, selectorData.element)) {
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
    options?: MatcherOptions
  ): FileSelectorData | null {
    void options;
    const selectorsData = normalizeFilesSelector(selector);
    return this._getSelectorMatching(file, selectorsData);
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

  /**
   * Returns whether the given value matches the micromatch pattern.
   */
  private _isMicromatchMatch(
    value: string | boolean,
    pattern: MicromatchPatternNullable
  ): boolean {
    if (isNull(pattern)) {
      return false;
    }

    if (isNull(value)) {
      return isArray(pattern) && pattern.some(isNull);
    }

    const patternToCheck = isArray(pattern)
      ? (pattern.filter(Boolean) as string[])
      : pattern;

    if (!patternToCheck) {
      return false;
    }

    const valueStr = String(value);
    return this._micromatch.isMatch(valueStr, patternToCheck);
  }
}
