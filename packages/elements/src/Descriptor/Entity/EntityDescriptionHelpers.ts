import { isObjectWithProperty } from "../../Shared";
import { isElementDescription } from "../Element";
import { isFileDescription } from "../File/FileDescriptionHelpers";

import type { EntityDescription } from "./EntityDescription.types";

/**
 * Determines if the given value is an EntityDescription.
 * @param value The value to check.
 * @returns True if the value is an EntityDescription, false otherwise.
 */
export function isEntityDescription(
  value: unknown
): value is EntityDescription {
  return (
    isObjectWithProperty(value, "element") &&
    isObjectWithProperty(value, "file") &&
    isObjectWithProperty(value, "origin") &&
    isElementDescription(value.element) &&
    isFileDescription(value.file)
  );
}
