import {
  isNullish,
  isString,
  isObjectWithProperty,
} from "../Support/TypeGuards";

import type {
  ElementDescription,
  LocalElement,
  LocalDependencyElement,
  ExternalDependencyElement,
  DependencyElement,
} from "./ElementsDescriptor.types";

/**
 * Determines if the given value is a local element.
 * @param value The value to check.
 * @returns True if the value is a local element, false otherwise.
 */
export function isLocalElement(value: unknown): value is LocalElement {
  return isObjectWithProperty(value, "path") && isString(value.path);
}

/**
 * Determines if the given value is a dependency element.
 * @param value The value to check.
 * @returns True if the value is a dependency element, false otherwise.
 */
export function isDependencyElement(
  value: unknown,
): value is DependencyElement {
  return isObjectWithProperty(value, "source") && !isNullish(value.source);
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
  return isLocalElement(value) || isDependencyElement(value);
}
