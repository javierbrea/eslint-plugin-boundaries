import {
  isString,
  isObjectWithProperty,
  isArray,
  isEmptyArray,
} from "../Support/TypeGuards";

import type {
  ElementDescription,
  LocalElementKnown,
  LocalDependencyElement,
  ExternalDependencyElement,
  DependencyElementDescription,
  BaseElementDescriptor,
  ElementDescriptorPattern,
  ElementDescriptorMode,
  ElementDescriptorWithType,
  ElementDescriptorWithCategory,
  ElementDescriptor,
  IgnoredElement,
  LocalElementUnknown,
  BaseElement,
  CoreDependencyElement,
} from "./ElementsDescriptor.types";
import {
  ELEMENT_DESCRIPTOR_MODES_MAP,
  ELEMENT_ORIGINS_MAP,
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
): value is ElementDescriptorWithType {
  return (
    isBaseElementDescriptor(value) &&
    isObjectWithProperty(value, "type") &&
    isString(value.type)
  );
}

/**
 * Determines if the given value is an element descriptor with category.
 * @param value The value to check.
 * @returns True if the value is an element descriptor with category, false otherwise.
 */
export function isElementDescriptorWithCategory(
  value: unknown
): value is ElementDescriptorWithCategory {
  return (
    isBaseElementDescriptor(value) &&
    isObjectWithProperty(value, "category") &&
    isString(value.category)
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
  return (
    isElementDescriptorWithType(value) || isElementDescriptorWithCategory(value)
  );
}

/**
 * Determines if the value is a BaseElement
 * @param value The value to check
 * @returns True if the value is a valid BaseElement, false otherwise
 */
export function isBaseElement(value: unknown): value is BaseElement {
  return (
    isObjectWithProperty(value, "type") &&
    isObjectWithProperty(value, "category") &&
    isObjectWithProperty(value, "path") &&
    isObjectWithProperty(value, "capturedValues") &&
    isObjectWithProperty(value, "origin") &&
    isObjectWithProperty(value, "isIgnored") &&
    isObjectWithProperty(value, "isUnknown")
  );
}

/**
 * Determines if the given value is an ignored element.
 * @param value The element to check.
 * @returns True if the element is an ignored element, false otherwise.
 */
export function isIgnoredElement(value: unknown): value is IgnoredElement {
  return (
    isBaseElement(value) &&
    isObjectWithProperty(value, "isIgnored") &&
    value.isIgnored === true
  );
}

/**
 * Determines if the given value is a local element.
 * @param value The value to check.
 * @returns True if the value is a local element, false otherwise.
 */
export function isLocalElement(
  value: unknown
): value is LocalElementKnown | LocalElementUnknown {
  return isBaseElement(value) && value.origin === ELEMENT_ORIGINS_MAP.LOCAL;
}

/**
 * Determines if the given element is local and unknown, because its type and category could not be determined.
 * @param value The value to check.
 * @returns True if the element is an unknown element, false otherwise.
 */
export function isUnknownLocalElement(
  value: unknown
): value is LocalElementUnknown {
  return isLocalElement(value) && value.isUnknown === true;
}

/**
 * Determines if the given element is local and known, because its type and category were determined.
 * @param value The value to check.
 * @returns True if the element is an unknown element, false otherwise.
 */
export function isKnownLocalElement(
  value: unknown
): value is LocalElementKnown {
  return isLocalElement(value) && value.isUnknown === false;
}

/**
 * Determines if the given value is a dependency element.
 * @param value The element to check.
 * @returns True if the element is a dependency element, false otherwise.
 */
export function isDependencyElementDescription(
  value: unknown
): value is DependencyElementDescription {
  return (
    isBaseElement(value) &&
    isObjectWithProperty(value, "source") &&
    isString(value.source)
  );
}

/**
 * Determines if the given value is an element (local or dependency).
 * @param value The value to check.
 * @returns True if the value is an element, false otherwise.
 */
export function isElementDescription(
  value: unknown
): value is ElementDescription {
  return (
    isIgnoredElement(value) ||
    isUnknownLocalElement(value) ||
    isKnownLocalElement(value) ||
    isDependencyElementDescription(value)
  );
}

/**
 * Determines if the given value is a local dependency element.
 * @param value The value to check.
 * @returns True if the element is a local dependency element, false otherwise.
 */
export function isLocalDependencyElement(
  value: unknown
): value is LocalDependencyElement {
  return isDependencyElementDescription(value) && isLocalElement(value);
}

/**
 * Determines if the given value is an external element.
 * @param value The value to check.
 * @returns True if the element is an external dependency element, false otherwise.
 */
export function isExternalDependencyElement(
  value: unknown
): value is ExternalDependencyElement {
  return (
    isDependencyElementDescription(value) &&
    value.origin === ELEMENT_ORIGINS_MAP.EXTERNAL &&
    isObjectWithProperty(value, "baseSource") &&
    isString(value.baseSource)
  );
}

/**
 * Determines if the given value is a core element.
 * @param value The value to check.
 * @returns True if the element is a core dependency element, false otherwise.
 */
export function isCoreDependencyElement(
  value: unknown
): value is CoreDependencyElement {
  return (
    isDependencyElementDescription(value) &&
    value.origin === ELEMENT_ORIGINS_MAP.CORE &&
    isObjectWithProperty(value, "baseSource") &&
    isString(value.baseSource)
  );
}
