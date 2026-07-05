import { isString, isObjectWithProperty } from "../../Shared/TypeGuards";
import { isBaseDescriptor } from "../Shared";

import type { FileDescriptor } from "./FileDescriptor.types";

/**
 * Determines if the given value is a file descriptor.
 * @param value The value to check.
 * @returns True if the value is a file descriptor, false otherwise.
 */
export function isFileDescriptor(value: unknown): value is FileDescriptor {
  return (
    isBaseDescriptor(value) &&
    isObjectWithProperty(value, "category") &&
    isString(value.category)
  );
}
