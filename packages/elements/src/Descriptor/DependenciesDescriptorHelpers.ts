import { isString, isObjectWithProperty, isNull } from "../Support/TypeGuards";

import type {
  DependencyKind,
  DependencyRelationship,
  ElementsDependencyInfo,
  DependencyDescription,
} from "./DependenciesDescriptor.types";
import {
  DEPENDENCY_KINDS_MAP,
  DEPENDENCY_RELATIONSHIPS_MAP,
} from "./DependenciesDescriptor.types";
import { isElement } from "./ElementsDescriptorHelpers";

/**
 * Determines if the value is a valid dependency kind.
 * @param value The value to check
 * @returns True if the value is a valid dependency kind, false otherwise.
 */
export function isDependencyKind(value: unknown): value is DependencyKind {
  return (
    isString(value) &&
    Object.values(DEPENDENCY_KINDS_MAP).includes(value as DependencyKind)
  );
}

/**
 * Determines if the given value is a valid dependency relationship.
 * @param value The value to check.
 * @returns True if the value is a valid dependency relationship, false otherwise.
 */
export function isDependencyRelationship(
  value: unknown,
): value is DependencyRelationship {
  return (
    isString(value) &&
    Object.values(DEPENDENCY_RELATIONSHIPS_MAP).includes(
      value as DependencyRelationship,
    )
  );
}

/**
 * Determines if the given value is a valid dependency relationship description.
 * @param value The value to check.
 * @returns True if the value is a valid dependency relationship, false otherwise.
 */
export function isDependencyRelationshipDescription(
  value: unknown,
): value is DependencyRelationship {
  return (
    isObjectWithProperty(value, "to") &&
    (isNull(value.to) || isDependencyRelationship(value.to)) &&
    isObjectWithProperty(value, "from") &&
    (isNull(value.from) || isDependencyRelationship(value.from))
  );
}

/**
 * Returns whether the given value is a valid ElementsDependencyInfo object.
 * @param value The value to check.
 * @returns True if the value is a valid ElementsDependencyInfo object, false otherwise.
 */
export function isElementsDependencyInfo(
  value: unknown,
): value is ElementsDependencyInfo {
  return (
    isObjectWithProperty(value, "kind") &&
    isDependencyKind(value.kind) &&
    isObjectWithProperty(value, "relationship") &&
    isDependencyRelationshipDescription(value.relationship) &&
    isObjectWithProperty(value, "nodeKind") &&
    (isNull(value.nodeKind) || isString(value.nodeKind))
  );
}

/**
 * Determines whether the given value is a valid DependencyDescription object.
 * @param value The value to check
 * @returns True if the value is a valid DependencyDescription object, false otherwise.
 */
export function isDependencyDescription(
  value: unknown,
): value is DependencyDescription {
  return (
    isObjectWithProperty(value, "to") &&
    isElement(value.to) &&
    isObjectWithProperty(value, "from") &&
    isElement(value.from) &&
    isObjectWithProperty(value, "dependency") &&
    isElementsDependencyInfo(value.dependency)
  );
}

/**
 * Determines whether the given dependency is internal.
 * @param dependency The dependency to check
 * @returns True if the dependency is internal, false otherwise
 */
export function isInternalDependency(
  dependency: DependencyDescription,
): boolean {
  return (
    dependency.dependency.relationship.from ===
    DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL
  );
}
