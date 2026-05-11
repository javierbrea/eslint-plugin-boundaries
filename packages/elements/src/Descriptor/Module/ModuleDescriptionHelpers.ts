import { isObjectWithAnyOfProperties } from "../../Shared";

import type { ModuleDescription } from "./ModuleDescription.types";
import { ORIGINS_SET } from "./ModuleDescription.types";

/**
 * Determines if the given value is an OriginDescription.
 * @param value The value to check.
 * @returns True if the value is an OriginDescription, false otherwise.
 */
export function isOriginDescription(
  value: unknown
): value is ModuleDescription {
  return (
    isObjectWithAnyOfProperties(value, ["origin", "source", "internalPath"]) &&
    ORIGINS_SET.has(value.origin as ModuleDescription["origin"])
  );
}
