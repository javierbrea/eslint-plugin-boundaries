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

/**
 * Determines if the given value is an array.
 * @param value The value to check.
 * @returns True if the value is an array, false otherwise.
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Determines if the given array is empty
 * @param arr The array to check
 * @returns Whether the array is empty or not
 */
export function isEmptyArray(arr: unknown[]): arr is [] {
  return arr.length === 0;
}

/**
 * Determines if the given value is a string array.
 * @param value The value to check.
 * @returns True if the value is a string array, false otherwise.
 */
export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

/**
 * Determines if the given value is an object with the specified property.
 * @param value The value to check.
 * @param key The property key to check for.
 * @returns True if the value is an object with the specified property, false otherwise.
 */
export function isObjectWithProperty<Key extends string>(
  value: unknown,
  key: Key,
): value is Record<Key, unknown> & Record<string, unknown> {
  return isObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}
