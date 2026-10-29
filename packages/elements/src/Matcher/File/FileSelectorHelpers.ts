import { isArray, isObjectWithAnyOfProperties } from "../../Shared/TypeGuards";
import { extendsSingleSelector, memoizeByIdentity } from "../Shared";

import type {
  FileSelector,
  FileSelectorNormalized,
  FileSingleSelector,
} from "./FileSelector.types";
/**
 * Determines if the given selector is a single file selector
 * @param value The value to check.
 * @returns True if the selector is a single file selector, false otherwise.
 */
export function isFileSingleSelector(
  value: unknown
): value is FileSingleSelector {
  return (
    isObjectWithAnyOfProperties(value, ["categories"]) ||
    extendsSingleSelector<FileSingleSelector>(value)
  );
}

/**
 * Determines if the given value is a file selector.
 * @param value The value to check.
 * @returns True if the value is a file selector, false otherwise.
 */
export function isFileSelector(value: unknown): value is FileSelector {
  return (
    isFileSingleSelector(value) ||
    (isArray(value) && value.every(isFileSingleSelector))
  );
}

/**
 * Normalizes a single file selector, ensuring it has the correct structure and default values.
 * @param selector The selector to normalize.
 * @returns The normalized selector.
 */
export function normalizeSingleFileSelector(
  selector: FileSingleSelector
): FileSingleSelector {
  if (isFileSingleSelector(selector)) {
    return { ...selector };
  }

  throw new Error("Invalid file selector");
}

/**
 * Normalizes a FileSelector into an array of FileSingleSelector. The result is computed once per selector object and shared by every later call that passes the same object (see `memoizeByIdentity`), so it must be treated as read-only; primitive selectors are normalized on every call.
 * @param fileSelector The file selector, in any supported format.
 * @returns The normalized array of single file selectors.
 */
export const normalizeFileSelector = memoizeByIdentity(
  (fileSelector: FileSelector): FileSelectorNormalized => {
    if (isArray(fileSelector)) {
      return fileSelector.map((sel) => normalizeSingleFileSelector(sel));
    }
    return [normalizeSingleFileSelector(fileSelector)];
  }
);
