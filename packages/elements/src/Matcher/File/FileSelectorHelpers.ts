import { isArray, isObjectWithAnyOfProperties } from "../../Shared/TypeGuards";
import { extendsSingleSelector } from "../Shared";

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
    isObjectWithAnyOfProperties(value, [
      "elementInternalPath",
      "categories",
      "isExternal",
    ]) || extendsSingleSelector<FileSingleSelector>(value)
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
 * Normalizes a FileSelector into an array of FileSingleSelector.
 * @param fileSelector The file selector, in any supported format.
 * @returns The normalized array of single file selectors.
 */
export function normalizeFileSelector(
  fileSelector: FileSelector
): FileSelectorNormalized {
  if (isArray(fileSelector)) {
    return fileSelector.map((sel) => normalizeSingleFileSelector(sel));
  }
  return [normalizeSingleFileSelector(fileSelector)];
}
