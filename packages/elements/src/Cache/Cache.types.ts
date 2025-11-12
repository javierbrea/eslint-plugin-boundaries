export type ObjectCacheKey = Record<string, unknown>;

export type NotUndefined =
  | object
  | string
  | number
  | boolean
  | null
  | NotUndefined[];
