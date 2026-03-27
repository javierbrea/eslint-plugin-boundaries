import { isObjectWithAnyOfProperties } from "../../Shared";

import type { OriginDescription } from "./OriginDescription.types";
import { ORIGINS_SET } from "./OriginDescription.types";

/**
 * Determines if the given value is an OriginDescription.
 * @param value The value to check.
 * @returns True if the value is an OriginDescription, false otherwise.
 */
export function isOriginDescription(
  value: unknown
): value is OriginDescription {
  return (
    isObjectWithAnyOfProperties(value, ["kind", "module"]) &&
    ORIGINS_SET.has(value.kind as OriginDescription["kind"])
  );
}
