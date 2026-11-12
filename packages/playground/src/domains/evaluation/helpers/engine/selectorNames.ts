import { isStringArrayQuery } from "@boundaries/elements";
import type {
  DependencySingleSelectorNormalized,
  EntitySelectorNormalized,
  EntitySingleSelectorNormalized,
  MicromatchPatternNullable,
  StringArrayQuery,
} from "@boundaries/elements";

import type { SelectorNames } from "./selectorNames.types";

/** A selector in the `allow` or `disallow` of a normalized policy: the entity that is allowed, or a dependency selector with its own `from`, `to` and `dependency` */
type EffectSelector =
  | DependencySingleSelectorNormalized
  | EntitySingleSelectorNormalized;

/**
 * Reads the names that a value of a selector writes.
 * @param value A `type`, `types`, `category` or `categories` of a selector: a pattern, a list of them, a query over the list, or nothing.
 * @returns The strings it writes, in order. A query names what it asks for with `anyOf`, `allOf` and `equalsTo`, and not what it excludes with `noneOf`; a `null` or a `{ expand }` template names nothing.
 */
function readNames(
  value: MicromatchPatternNullable | StringArrayQuery | undefined
): string[] {
  const names = isStringArrayQuery(value)
    ? [value.anyOf, value.allOf, value.equalsTo].flat()
    : [value].flat();
  return names.filter((item): item is string => typeof item === "string");
}

/**
 * Reads the element types and the file categories that entity selectors name.
 * @param selector The normalized selectors, or `undefined` when there are none.
 * @returns For each selector, in order, the `type`, `types` and legacy `category` of its element selectors, then the `categories` of its file selectors.
 */
function readEntityNames(
  selector: EntitySelectorNormalized | undefined
): string[] {
  return (selector ?? []).flatMap(({ element = [], file = [] }) => [
    ...element.flatMap(({ type, types, category }) => [
      ...readNames(type),
      ...readNames(types),
      ...readNames(category),
    ]),
    ...file.flatMap(({ categories }) => readNames(categories)),
  ]);
}

/**
 * Tells whether the selector of an `allow` or a `disallow` is a dependency selector, and not an entity selector.
 * @param selector The selector to check.
 * @returns `true` when it has a `from`, a `to` or a `dependency`, which an entity selector, with its `element`, `file` and `module`, never has.
 */
function isDependencySelector(
  selector: EffectSelector
): selector is DependencySingleSelectorNormalized {
  return "from" in selector || "to" in selector || "dependency" in selector;
}

/**
 * Removes the names that are repeated.
 * @param names The names, in order.
 * @returns The names in the order of their first appearance.
 */
function unique(names: readonly string[]): string[] {
  return Array.from(new Set(names));
}

/**
 * Reads the element types and the file categories that a policy names, on the side of the importing file and on the side of the imported one.
 * @param policy The policy, normalized.
 * @param policy.from The selector of the importing files.
 * @param policy.to The selector of the imported files.
 * @param policy.allow What is allowed: entity selectors, or dependency selectors.
 * @param policy.disallow What is disallowed, in the same shapes.
 * @returns The names of its own `from`, then of the `from` of the dependency selectors of its `allow` and `disallow`; and, for `to`, those of its own `to`, then of the `to` of those dependency selectors and of the entity selectors that `allow` and `disallow` hold, which select what is imported. Without duplicates.
 */
export function readSelectorNames({
  from,
  to,
  allow,
  disallow,
}: {
  readonly from?: EntitySelectorNormalized;
  readonly to?: EntitySelectorNormalized;
  readonly allow?: readonly EffectSelector[];
  readonly disallow?: readonly EffectSelector[];
}): SelectorNames {
  const effects = [...(allow ?? []), ...(disallow ?? [])];
  return {
    from: unique([
      ...readEntityNames(from),
      ...effects.flatMap((effect) =>
        isDependencySelector(effect) ? readEntityNames(effect.from) : []
      ),
    ]),
    to: unique([
      ...readEntityNames(to),
      ...effects.flatMap((effect) =>
        readEntityNames(isDependencySelector(effect) ? effect.to : [effect])
      ),
    ]),
  };
}
