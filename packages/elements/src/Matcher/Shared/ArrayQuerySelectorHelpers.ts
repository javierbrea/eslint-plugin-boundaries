import {
  isArray,
  isNullish,
  isObject,
  isObjectWithAnyOfProperties,
  isObjectWithProperty,
  isString,
} from "../../Shared";

import type {
  ArrayQuery,
  ArrayQueryExpandItem,
  StringArrayQuery,
  StringArrayQueryMatcher,
} from "./ArrayQuery.types";
import type { TemplateData } from "./BaseMatcher.types";

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

/**
 * Narrows a value to StringArrayQuery.
 * Use this instead of isArrayQuery when the value originates from a
 * MicromatchPatternNullable | StringArrayQuery union, so the call site does
 * not need an unsafe cast.
 */
export function isStringArrayQuery(value: unknown): value is StringArrayQuery {
  return isArrayQuery(value);
}

/** A `{ expand: string }` item inside a string array query operator. */
export function isExpandItem(value: unknown): value is ArrayQueryExpandItem {
  return isObjectWithProperty(value, "expand") && isString(value.expand);
}

const SINGLE_TEMPLATE_REGEX = /^\s*{{\s*([^{}]+?)\s*}}\s*$/;

/** Resolves a dotted path (supports `a.b`, `a.[0].b`, `a[0].b`) against the data. */
function resolvePath(path: string, data: TemplateData): unknown {
  const segments = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
  let current: unknown = data;
  for (const segment of segments) {
    if (!isObject(current) && !isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Resolves an expand item to its list of string matchers (spread). */
export function resolveExpandItem(
  item: ArrayQueryExpandItem,
  templateData: TemplateData
): string[] {
  const match = SINGLE_TEMPLATE_REGEX.exec(item.expand);
  if (!match) return [];
  const value = resolvePath(match[1], templateData);
  if (isArray(value)) {
    return value.filter((v) => !isNullish(v)).map((v) => String(v));
  }
  if (isNullish(value)) return [];
  return [String(value)];
}

/** Expands `{ expand }` items in an operand list, keeping plain string matchers as-is. */
function expandMatchers(
  matchers: StringArrayQueryMatcher[],
  templateData: TemplateData
): string[] {
  return matchers.flatMap((m) =>
    isExpandItem(m) ? resolveExpandItem(m, templateData) : [m]
  );
}

/**
 * Returns a plain `ArrayQuery<string>` where any `{ expand }` items in
 * anyOf/allOf/noneOf are resolved to their string values. Other operators pass through.
 */
export function expandStringArrayQuery(
  query: StringArrayQuery,
  templateData: TemplateData
): ArrayQuery<string> {
  const expanded: ArrayQuery<string> = { ...(query as ArrayQuery<string>) };
  if (query.anyOf) expanded.anyOf = expandMatchers(query.anyOf, templateData);
  if (query.allOf) expanded.allOf = expandMatchers(query.allOf, templateData);
  if (query.noneOf)
    expanded.noneOf = expandMatchers(query.noneOf, templateData);
  return expanded;
}
