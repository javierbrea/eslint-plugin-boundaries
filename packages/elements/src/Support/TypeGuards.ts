/**
 * Determines if the given value is a string.
 * @param value The value to check.
 * @returns True if the value is a string, false otherwise.
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Determines if the given value is not null or undefined.
 * @param value The value to check.
 * @returns True if the value is not null or undefined, false otherwise.
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Determines if the given value is a non-null object.
 * @param value The value to check.
 * @returns True if the value is a non-null object, false otherwise.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return !isNullish(value) && typeof value === "object";
}
