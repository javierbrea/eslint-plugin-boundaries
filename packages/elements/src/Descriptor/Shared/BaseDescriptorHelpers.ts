import {
  isString,
  isObjectWithProperty,
  isArray,
  isEmptyArray,
} from "../../Shared";

import type { BaseDescriptor, DescriptorPattern } from "./BaseDescriptor.types";

/**
 * Determines if the given value is a valid base descriptor pattern.
 * @param value The value to check.
 * @returns True if the value is a valid base descriptor pattern, false otherwise.
 */
export function isBaseDescriptorPattern(
  value: unknown
): value is DescriptorPattern {
  return (
    isString(value) ||
    (isArray(value) && !isEmptyArray(value) && value.every(isString))
  );
}

/**
 * Determines if the given value can be the `capture` or `baseCapture` of a descriptor: a list of names, or a falsy value, such as `undefined` or `null`, which captures nothing.
 * @param value The value to check.
 * @returns True if the value is an array or falsy, false otherwise.
 */
export function isDescriptorCapture(value: unknown): boolean {
  return !value || isArray(value);
}

/**
 * Determines if the given value is a base descriptor.
 * @param value The value to check.
 * @returns True if the value is a base descriptor, false otherwise.
 */
export function isBaseDescriptor(value: unknown): value is BaseDescriptor {
  return (
    isObjectWithProperty(value, "pattern") &&
    isBaseDescriptorPattern(value.pattern) &&
    isDescriptorCapture(value.capture)
  );
}
