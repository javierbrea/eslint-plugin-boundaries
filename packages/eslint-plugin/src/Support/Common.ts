/**
 * Determines if the provided object is an array.
 * @param object The object to check.
 * @returns True if the object is an array, false otherwise.
 */
export function isArray(object: unknown): object is unknown[] {
  return Array.isArray(object);
}

/**
 * Determines if the provided object is a string.
 * @param object The object to check.
 * @returns True if the object is a string, false otherwise.
 */
export function isString(object: unknown): object is string {
  return typeof object === "string";
}

/**
 * Determines if the provided object is a boolean.
 * @param object The object to check.
 * @returns True if the object is a boolean, false otherwise.
 */
export function isBoolean(object: unknown): object is boolean {
  return typeof object === "boolean";
}

/**
 * Determines if the provided object is a non-null object (but not an array).
 * @param object The object to check.
 * @returns True if the object is a non-null object, false otherwise.
 */
export function isObject(object: unknown): object is Record<string, unknown> {
  return typeof object === "object" && object !== null && !isArray(object);
}

/**
 * Returns the value as an array if it is an array, or null otherwise.
 * @param value The value to check.
 * @returns The value as an array or null.
 */
export function getArrayOrNull<T>(value: unknown): T[] | null {
  return isArray(value) ? (value as T[]) : null;
}
