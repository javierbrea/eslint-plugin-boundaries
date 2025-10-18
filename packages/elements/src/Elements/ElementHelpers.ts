import { isNullish, isObject, isString } from "../Support/TypeGuards";

import type {
  ElementDescription,
  LocalElement,
  LocalDependencyElement,
  ExternalDependencyElement,
  DependencyElement,
} from "./ElementsDescriptor.types";

/**
 * Determines if the given element is a local element.
 * @param element The element to check.
 * @returns True if the element is a local element, false otherwise.
 */
export function isLocalElement(
  element: ElementDescription,
): element is LocalElement {
  return isObject(element) && isString((element as LocalElement).path);
}

/**
 * Determines if the given element is a dependency element.
 * @param element The element to check.
 * @returns True if the element is a dependency element, false otherwise.
 */
export function isDependencyElement(
  element: ElementDescription,
): element is DependencyElement {
  return isObject(element) && !isNullish((element as DependencyElement).source);
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
