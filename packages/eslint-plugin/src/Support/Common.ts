export function isArray(object: unknown): object is unknown[] {
  return Array.isArray(object);
}

export function isString(object: unknown): object is string {
  return typeof object === "string";
}

export function isObject(object: unknown): object is Record<string, unknown> {
  return typeof object === "object" && object !== null && !isArray(object);
}

export function getArrayOrNull<T>(value: unknown): T[] | null {
  return isArray(value) ? (value as T[]) : null;
}
