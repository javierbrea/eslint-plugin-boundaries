import type { DescribedValue } from "./formatValue.types";

/** The keys that read as they are in an object literal, as in the descriptions of the plugin and in the config text. */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Formats the key of an object.
 * @param key The key.
 * @returns The key as it is when it is an identifier, and in double quotes otherwise.
 */
function formatKey(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

/**
 * Formats a described value as the inspector shows it: the literal of the value, with the spaces inside the brackets that the mockup draws. Nested values are formatted the same way.
 * @param value The value of a description, such as `["module"]` or `{ name: "Price" }`.
 * @returns `null`, a number or a boolean as they are, a string in double quotes, an array as `[ "a", "b" ]` and an object as `{ name: "Price" }`, or `[]` and `{}` when they are empty.
 */
export function formatValue(value: DescribedValue): string {
  if (Array.isArray(value)) {
    return value.length === 0
      ? "[]"
      : `[ ${value.map((item) => formatValue(item)).join(", ")} ]`;
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    return entries.length === 0
      ? "{}"
      : `{ ${entries
          .map(([key, item]) => `${formatKey(key)}: ${formatValue(item)}`)
          .join(", ")} }`;
  }
  // `null`, strings, numbers and booleans are what JSON writes
  return JSON.stringify(value);
}
