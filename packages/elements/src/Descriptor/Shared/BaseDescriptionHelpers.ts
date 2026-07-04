import { isObjectWithProperty } from "../../Shared";

import type { BaseDescription } from "./BaseDescription.types";

/**
 * Determines if the value is a BaseDescription
 * @param value The value to check
 * @returns True if the value is a valid BaseDescription, false otherwise
 */
export function isBaseDescription(value: unknown): value is BaseDescription {
  return (
    isObjectWithProperty(value, "path") &&
    isObjectWithProperty(value, "captured") &&
    isObjectWithProperty(value, "isIgnored") &&
    isObjectWithProperty(value, "isUnknown")
  );
}

/**
 * Determines if the given description is an ignored description.
 * @param description The description to check.
 * @returns True if the description is an ignored description, false otherwise.
 */
export function isIgnoredDescription<T extends BaseDescription>(
  description: T
): boolean {
  return description.isIgnored === true;
}

/**
 * Determines if the given description is a known description.
 * @param description The description to check.
 * @returns True if the description is a known description, false otherwise.
 */
export function isKnownDescription<T extends BaseDescription>(
  description: T
): boolean {
  return (
    !isIgnoredDescription(description) && !isUnknownDescription(description)
  );
}

/**
 * Determines if the given description is an unknown description.
 * @param description The description to check.
 * @returns True if the description is an unknown description, false otherwise.
 */
export function isUnknownDescription<T extends BaseDescription>(
  description: T
): boolean {
  return description.isUnknown === true;
}
