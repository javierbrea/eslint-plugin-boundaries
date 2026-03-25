import {
  isString,
  isObjectWithProperty,
  isNull,
  isNullish,
  isStringArray,
} from "../../Shared/TypeGuards";
import { isEntityDescription } from "../Entity";

import {
  DEPENDENCY_KINDS_SET,
  DEPENDENCY_RELATIONSHIPS_MAP,
  DEPENDENCY_RELATIONSHIPS_SET,
} from "./DependencyDescription.types";
import type {
  DependencyKind,
  DependencyRelationshipType,
  DependencyInfo,
  DependencyDescription,
} from "./DependencyDescription.types";

/**
 * Determines if the value is a valid dependency kind.
 * @param value The value to check
 * @returns True if the value is a valid dependency kind, false otherwise.
 */
export function isDependencyKind(value: unknown): value is DependencyKind {
  return isString(value) && DEPENDENCY_KINDS_SET.has(value as DependencyKind);
}

/**
 * Determines if the given value is a valid dependency relationship.
 * @param value The value to check.
 * @returns True if the value is a valid dependency relationship, false otherwise.
 */
export function isDependencyRelationship(
  value: unknown
): value is DependencyRelationshipType {
  return (
    isString(value) &&
    DEPENDENCY_RELATIONSHIPS_SET.has(value as DependencyRelationshipType)
  );
}

/**
 * Determines if the given value is a valid dependency relationship description.
 * @param value The value to check.
 * @returns True if the value is a valid dependency relationship, false otherwise.
 */
export function isDependencyRelationshipDescription(
  value: unknown
): value is DependencyRelationshipType {
  return (
    isObjectWithProperty(value, "to") &&
    (isNull(value.to) || isDependencyRelationship(value.to)) &&
    isObjectWithProperty(value, "from") &&
    (isNull(value.from) || isDependencyRelationship(value.from))
  );
}

/**
 * Returns whether the given value is a valid DependencyInfo object.
 * @param value The value to check.
 * @returns True if the value is a valid DependencyInfo object, false otherwise.
 */
export function isDependencyInfo(value: unknown): value is DependencyInfo {
  return (
    isObjectWithProperty(value, "source") &&
    isString(value.source) &&
    isObjectWithProperty(value, "module") &&
    (isNullish(value.module) || isString(value.module)) &&
    isObjectWithProperty(value, "kind") &&
    isDependencyKind(value.kind) &&
    isObjectWithProperty(value, "relationship") &&
    isDependencyRelationshipDescription(value.relationship) &&
    isObjectWithProperty(value, "nodeKind") &&
    (isNull(value.nodeKind) || isString(value.nodeKind)) &&
    isObjectWithProperty(value, "specifiers") &&
    (isNull(value.specifiers) || isStringArray(value.specifiers))
  );
}

/**
 * Determines whether the given value is a valid DependencyDescription object.
 * @param value The value to check.
 * @returns True if the value is a valid DependencyDescription object, false otherwise.
 */
export function isDependencyDescription(
  value: unknown
): value is DependencyDescription {
  return (
    isObjectWithProperty(value, "to") &&
    isEntityDescription(value.to) &&
    isObjectWithProperty(value, "from") &&
    isEntityDescription(value.from) &&
    isObjectWithProperty(value, "dependency") &&
    isDependencyInfo(value.dependency)
  );
}

/**
 * Determines whether the given dependency description has an internal relationship.
 * @param dependency The dependency to check
 * @returns True if the dependency has an internal relationship, false otherwise
 */
export function isDependencyWithInternalRelationship(
  dependency: DependencyDescription
): boolean {
  return (
    dependency.dependency.relationship.to ===
    DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL
  );
}
