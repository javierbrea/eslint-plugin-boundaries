import { isString, isObjectWithProperty } from "../../Shared/TypeGuards";
import { isBaseDescriptor } from "../Shared";

import type { ElementDescriptor } from "./ElementDescriptor.types";

/**
 * Determines if the given value is an element descriptor with type.
 * @param value The value to check.
 * @returns True if the value is an element descriptor with type, false otherwise.
 */
export function isElementDescriptor(
  value: unknown
): value is ElementDescriptor {
  return (
    isBaseDescriptor(value) &&
    isObjectWithProperty(value, "type") &&
    isString(value.type)
  );
}
