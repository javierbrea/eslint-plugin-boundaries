import { isString, isObjectWithProperty } from "../../Shared/TypeGuards";
import { isBaseDescriptor } from "../Shared";

import { DESCRIPTOR_MODES_MAP } from "./ElementDescriptor.types";
import type {
  ElementDescriptor,
  DescriptorMode,
} from "./ElementDescriptor.types";

/**
 * Determines if the given value is a valid element descriptor mode.
 * @param value The value to check.
 * @returns True if the value is a valid element descriptor mode, false otherwise.
 */
export function isElementDescriptorMode(
  value: unknown
): value is DescriptorMode {
  return (
    isString(value) &&
    Object.values(DESCRIPTOR_MODES_MAP).includes(value as DescriptorMode)
  );
}

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
