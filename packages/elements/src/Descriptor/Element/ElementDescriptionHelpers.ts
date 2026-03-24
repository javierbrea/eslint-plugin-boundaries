import { isObjectWithProperty } from "../../Support/TypeGuards";
import {
  isBaseDescription,
  isIgnoredDescription,
  isKnownDescription,
  isUnknownDescription,
} from "../Shared";

import type {
  ElementDescription,
  IgnoredElementDescription,
  KnownElementDescription,
  UnknownElementDescription,
} from "./ElementDescription.types";

/**
 * Determines if the given value is a base element description.
 * @param value The value to check.
 * @returns True if the value is a base element description, false otherwise.
 */
export function isElementDescription(
  value: unknown
): value is ElementDescription {
  return (
    isBaseDescription(value) &&
    isObjectWithProperty(value, "type") &&
    isObjectWithProperty(value, "parents")
  );
}

/**
 * Determines if the given element is unknown, because its type could not be determined.
 * @param value The value to check.
 * @returns True if the element is an unknown element, false otherwise.
 */
export function isUnknownElementDescription(
  value: unknown
): value is UnknownElementDescription {
  return isElementDescription(value) && isUnknownDescription(value);
}

/**
 * Determines if the given element is known, because its type was determined.
 * @param value The value to check.
 * @returns True if the element is a known element, false otherwise.
 */
export function isKnownElementDescription(
  value: unknown
): value is KnownElementDescription {
  return isElementDescription(value) && isKnownDescription(value);
}

/**
 * Determines if the given element is ignored.
 * @param value The value to check.
 * @returns True if the element is an ignored element, false otherwise.
 */
export function isIgnoredElementDescription(
  value: unknown
): value is IgnoredElementDescription {
  return isElementDescription(value) && isIgnoredDescription(value);
}
