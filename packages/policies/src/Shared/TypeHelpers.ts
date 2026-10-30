/**
 * Determines if the provided object is an array.
 * @param object The object to check.
 * @returns True if the object is an array, false otherwise.
 */
export function isArray(object: unknown): object is unknown[] {
  return Array.isArray(object);
}

/**
 * Determines if the provided object is null.
 * @param object The object to check.
 * @returns True if the object is null, false otherwise.
 */
export function isNull(object: unknown): object is null {
  return object === null;
}

/**
 * Determines if the provided object is a non-null object (but not an array).
 * @param object The object to check.
 * @returns True if the object is a non-null object, false otherwise.
 */
export function isObject(object: unknown): object is Record<string, unknown> {
  return typeof object === "object" && !isNull(object) && !isArray(object);
}

/**
 * Determines if the provided object is undefined.
 * @param object The object to check.
 * @returns True if the object is undefined, false otherwise.
 */
export function isUndefined(object: unknown): object is undefined {
  return object === undefined;
}
