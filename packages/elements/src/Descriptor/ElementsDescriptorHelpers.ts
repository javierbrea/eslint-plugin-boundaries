import {
  isNullish,
  isString,
  isObjectWithProperty,
  isArray,
  isEmptyArray,
  isNull,
  isObject,
} from "../Support/TypeGuards";

import type {
  ElementDescription,
  BaseElementWithType,
  BaseElementWithCategory,
  BaseElementWithTypeAndCategory,
  BaseElement,
  LocalElement,
  LocalDependencyElement,
  ExternalDependencyElement,
  DependencyElement,
  BaseElementDescriptor,
  ElementDescriptorPattern,
  ElementDescriptorMode,
  ElementDescriptorWithType,
  ElementDescriptorWithCategory,
  ElementDescriptorWithTypeAndCategory,
  ElementDescriptor,
} from "./ElementsDescriptor.types";
import { ELEMENT_DESCRIPTOR_MODES_MAP } from "./ElementsDescriptor.types";

/**
 * Determines if the value is a base element with type only
 * @param value The value to check
 * @returns True if the value is a base element with type, false otherwise.
 */
export function isBaseElementWithType(
  value: unknown,
): value is BaseElementWithType {
  return (
    isObjectWithProperty(value, "type") &&
    isString(value.type) &&
    isObjectWithProperty(value, "category") &&
    isNull(value.category)
  );
}

/**
 * Determines if the value is a base element with category only
 * @param value The value to check
 * @returns True if the value is a base element with category, false otherwise.
 */
export function isBaseElementWithCategory(
  value: unknown,
): value is BaseElementWithCategory {
  return (
    isObjectWithProperty(value, "category") &&
    isString(value.category) &&
    isObjectWithProperty(value, "type") &&
    isNull(value.type)
  );
}

/**
 * Determines if the value is a base element with category and type
 * @param value The value to check
 * @returns True if the value is a base element with category and type, false otherwise.
 */
export function isBaseElementWithTypeAndCategory(
  value: unknown,
): value is BaseElementWithTypeAndCategory {
  return (
    isObjectWithProperty(value, "category") &&
    isString(value.category) &&
    isObjectWithProperty(value, "type") &&
    isString(value.type)
  );
}

/**
 * Determines if the value is a BaseElement
 * @param value The value to check
 * @returns True if the value is a valid BaseElement, false otherwise
 */
export function isBaseElement(value: unknown): value is BaseElement {
  return (
    isObjectWithProperty(value, "capturedValues") &&
    isObject(value.capturedValues) &&
    (isBaseElementWithType(value) ||
      isBaseElementWithCategory(value) ||
      isBaseElementWithTypeAndCategory(value))
  );
}

/**
 * Determines if the given element is a local element.
 * @param value The element to check.
 * @returns True if the value is a local element, false otherwise.
 */
export function isLocalElement(
  element: ElementDescription,
): element is LocalElement {
  return (
    isBaseElement(element) &&
    isObjectWithProperty(element, "path") &&
    isString(element.path)
  );
}

/**
 * Determines if the given element is a dependency element.
 * @param element The element to check.
 * @returns True if the element is a dependency element, false otherwise.
 */
export function isDependencyElement(
  element: ElementDescription,
): element is DependencyElement {
  return (
    isBaseElement(element) &&
    isObjectWithProperty(element, "source") &&
    !isNullish(element.source)
  );
}

/**
 * Determines if the given element is a local dependency.
 * @param element The element to check.
 * @returns True if the element is a local dependency, false otherwise.
 */
export function isLocalDependency(
  element: ElementDescription,
): element is LocalDependencyElement {
  return (
    isDependencyElement(element) &&
    isLocalElement(element) &&
    isObjectWithProperty(element, "isLocal") &&
    element.isLocal === true
  );
}

/**
 * Determines if the given element is an external dependency.
 * @param element The element to check.
 * @returns True if the element is an external dependency, false otherwise.
 */
export function isExternalDependency(
  element: ElementDescription,
): element is ExternalDependencyElement {
  return (
    isDependencyElement(element) &&
    element.isExternal === true &&
    isString((element as ExternalDependencyElement).baseModule)
  );
}

/**
 * Determines if the given value is an element (local or dependency).
 * @param value The value to check.
 * @returns True if the value is an element, false otherwise.
 */
export function isElement(value: unknown): value is ElementDescription {
  return (
    isLocalElement(value as ElementDescription) ||
    isDependencyElement(value as ElementDescription)
  );
}

/**
 * Determines if the given value is a valid element descriptor mode.
 * @param value The value to check.
 * @returns True if the value is a valid element descriptor mode, false otherwise.
 */
export function isElementDescriptorMode(
  value: unknown,
): value is ElementDescriptorMode {
  return (
    isString(value) &&
    Object.values(ELEMENT_DESCRIPTOR_MODES_MAP).includes(
      value as ElementDescriptorMode,
    )
  );
}

/**
 * Determines if the given value is a valid element descriptor pattern.
 * @param value The value to check.
 * @returns True if the value is a valid element descriptor pattern, false otherwise.
 */
export function isElementDescriptorPattern(
  value: unknown,
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
  value: unknown,
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
  value: unknown,
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
  value: unknown,
): value is ElementDescriptorWithCategory {
  return (
    isBaseElementDescriptor(value) &&
    isObjectWithProperty(value, "category") &&
    isString(value.category)
  );
}

/**
 * Determines if the given value is an element descriptor with both type and category.
 * @param value The value to check.
 * @returns True if the value is an element descriptor with both type and category, false otherwise.
 */
export function isElementDescriptorWithTypeAndCategory(
  value: unknown,
): value is ElementDescriptorWithTypeAndCategory {
  return (
    isElementDescriptorWithType(value) && isElementDescriptorWithCategory(value)
  );
}

/**
 * Determines if the given value is an element descriptor.
 * @param value The value to check.
 * @returns True if the value is an element descriptor, false otherwise.
 */
export function isElementDescriptor(
  value: unknown,
): value is ElementDescriptor {
  return (
    isElementDescriptorWithType(value) ||
    isElementDescriptorWithCategory(value) ||
    isElementDescriptorWithTypeAndCategory(value)
  );
}
