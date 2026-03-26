import { isObjectWithProperty } from "../../Shared/TypeGuards";
import {
  isBaseDescription,
  isIgnoredDescription,
  isKnownDescription,
  isUnknownDescription,
} from "../Shared";

import type {
  FileDescription,
  IgnoredFileDescription,
  UnknownFileDescription,
  KnownFileDescription,
} from "./FileDescription.types";

/**
 * Determines if the given value is a file description.
 * @param value The value to check.
 * @returns True if the value is a file description, false otherwise.
 */
export function isFileDescription(value: unknown): value is FileDescription {
  return isBaseDescription(value) && isObjectWithProperty(value, "categories");
}

/**
 * Determines if the given file is unknown, because its type could not be determined.
 * @param value The value to check.
 * @returns True if the file is an unknown file, false otherwise.
 */
export function isUnknownFileDescription(
  value: unknown
): value is UnknownFileDescription {
  return isFileDescription(value) && isUnknownDescription(value);
}

/**
 * Determines if the given file is known, because its type was determined.
 * @param value The value to check.
 * @returns True if the file is a known file, false otherwise.
 */
export function isKnownFileDescription(
  value: unknown
): value is KnownFileDescription {
  return isFileDescription(value) && isKnownDescription(value);
}

/**
 * Determines if the given file is ignored.
 * @param value The value to check.
 * @returns True if the file is an ignored file, false otherwise.
 */
export function isIgnoredFileDescription(
  value: unknown
): value is IgnoredFileDescription {
  return isFileDescription(value) && isIgnoredDescription(value);
}
