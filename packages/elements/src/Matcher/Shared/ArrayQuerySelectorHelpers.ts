import { isObjectWithAnyOfProperties } from "../../Shared";

import type { ArrayQuery } from "./ArrayQuery.types";

/** All operator keys that identify an ArrayQuery object. */
export const ARRAY_QUERY_KEYS = [
  "anyOf",
  "allOf",
  "noneOf",
  "equalsTo",
  "atIndex",
  "hasLength",
] as const;

/**
 * Determines if a value is an ArrayQuery object (vs. a plain micromatch pattern / array).
 * A string or an array is NOT an ArrayQuery; only a plain object carrying at least one
 * operator key is.
 */
export function isArrayQuery(value: unknown): value is ArrayQuery<unknown> {
  return isObjectWithAnyOfProperties(value, [...ARRAY_QUERY_KEYS]);
}
