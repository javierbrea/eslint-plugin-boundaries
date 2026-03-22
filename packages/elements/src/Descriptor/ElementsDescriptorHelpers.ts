import {
  isString,
  isObjectWithProperty,
  isArray,
  isEmptyArray,
} from "../Support/TypeGuards";

import type {
  ElementDescription,
  FileDescription,
  BaseElementDescriptor,
  FileDescriptor,
  ElementDescriptorPattern,
  ElementDescriptorMode,
  ElementDescriptor,
  BaseElementDescription,
} from "./ElementsDescriptor.types";
import {
  ELEMENT_DESCRIPTOR_MODES_MAP,
  FILE_ORIGINS_MAP,
} from "./ElementsDescriptor.types";

/**
 * Determines if the given value is a valid element descriptor mode.
 * @param value The value to check.
 * @returns True if the value is a valid element descriptor mode, false otherwise.
 */
export function isElementDescriptorMode(
  value: unknown
): value is ElementDescriptorMode {
  return (
    isString(value) &&
    Object.values(ELEMENT_DESCRIPTOR_MODES_MAP).includes(
      value as ElementDescriptorMode
    )
  );
}

/**
 * Determines if the given value is a valid element descriptor pattern.
 * @param value The value to check.
 * @returns True if the value is a valid element descriptor pattern, false otherwise.
 */
export function isElementDescriptorPattern(
  value: unknown
): value is ElementDescriptorPattern {
  return (
    isString(value) ||
    (isArray(value) && !isEmptyArray(value) && value.every(isString))
  );
}

/**
 * Determines if the given value is a base element descriptor.
 * @param value The value to check.
 * @returns True if the value is a base element descriptor, false otherwise.
 */
export function isBaseElementDescriptor(
  value: unknown
): value is BaseElementDescriptor {
  return (
    isObjectWithProperty(value, "pattern") &&
    isElementDescriptorPattern(value.pattern)
  );
}

/**
 * Determines if the given value is an element descriptor with type.
 * @param value The value to check.
 * @returns True if the value is an element descriptor with type, false otherwise.
 */
export function isElementDescriptorWithType(
  value: unknown
): value is ElementDescriptor {
  return (
    isBaseElementDescriptor(value) &&
    isObjectWithProperty(value, "type") &&
    isString(value.type)
  );
}

/**
 * Determines if the given value is an element descriptor.
 * @param value The value to check.
 * @returns True if the value is an element descriptor, false otherwise.
 */
export function isElementDescriptor(
  value: unknown
): value is ElementDescriptor {
  return isElementDescriptorWithType(value);
}

/**
 * Determines if the given value is a file descriptor.
 * @param value The value to check.
 * @returns True if the value is a file descriptor, false otherwise.
 */
export function isFileDescriptor(value: unknown): value is FileDescriptor {
  return (
    isBaseElementDescriptor(value) &&
    isObjectWithProperty(value, "category") &&
    (isString(value.category) ||
      (isArray(value.category) &&
        !isEmptyArray(value.category) &&
        value.category.every(isString)))
  );
}

/**
 * Determines if the value is a BaseElement
 * @param value The value to check
 * @returns True if the value is a valid BaseElement, false otherwise
 */
export function isBaseElement(value: unknown): value is BaseElementDescription {
  return (
    isObjectWithProperty(value, "type") &&
    isObjectWithProperty(value, "path") &&
    isObjectWithProperty(value, "captured") &&
    isObjectWithProperty(value, "parents")
  );
}

/**
 * Determines if the given value is an ignored element.
 * @param value The element to check.
 * @returns True if the element is an ignored element, false otherwise.
 */
export function isIgnoredElement(value: unknown): value is null {
  return value === null;
}

/**
 * Determines if the given value is a local element.
 * @param value The value to check.
 * @returns True if the value is a local element, false otherwise.
 */
export function isLocalElement(value: unknown): value is ElementDescription {
  return isBaseElement(value);
}

/**
 * Determines if the given element is local and unknown, because its type and category could not be determined.
 * @param value The value to check.
 * @returns True if the element is an unknown element, false otherwise.
 */
export function isUnknownLocalElement(value: unknown): value is null {
  return value === null;
}

/**
 * Determines if the given element is local and known, because its type and category were determined.
 * @param value The value to check.
 * @returns True if the element is an unknown element, false otherwise.
 */
export function isKnownLocalElement(
  value: unknown
): value is ElementDescription {
  return isBaseElement(value);
}

/**
 * Determines if the given value is a local dependency element (a file from local origin).
 * @param value The value to check.
 * @returns True if the element is a local dependency element, false otherwise.
 */
export function isLocalDependencyElement(
  value: unknown
): value is ElementDescription {
  return isBaseElement(value);
}

/**
 * Determines if the given value is an external file (a file from external origin).
 * @param value The value to check.
 * @returns True if the file is an external file, false otherwise.
 */
export function isExternalDependencyElement(
  value: unknown
): value is FileDescription {
  return isFileDescription(value) && value.origin === FILE_ORIGINS_MAP.EXTERNAL;
}

/**
 * Determines if the given value is a core file (a file from core origin).
 * @param value The value to check.
 * @returns True if the file is a core file, false otherwise.
 */
export function isCoreDependencyElement(
  value: unknown
): value is FileDescription {
  return isFileDescription(value) && value.origin === FILE_ORIGINS_MAP.CORE;
}

/**
 * Determines if the given value is an element (element description, not a file).
 * @param value The value to check.
 * @returns True if the value is an element description, false otherwise.
 */
export function isElementDescription(
  value: unknown
): value is ElementDescription {
  return isBaseElement(value);
}

/**
 * Determines if the given value is a file description.
 * @param value The value to check.
 * @returns True if the value is a file description, false otherwise.
 */
export function isFileDescription(value: unknown): value is FileDescription {
  return (
    isObjectWithProperty(value, "element") &&
    isObjectWithProperty(value, "path") &&
    isObjectWithProperty(value, "category") &&
    isObjectWithProperty(value, "captured") &&
    isObjectWithProperty(value, "origin") &&
    isObjectWithProperty(value, "isIgnored") &&
    isObjectWithProperty(value, "isUnknown")
  );
}
