import { isArray, isObject } from "../../Shared";

/**
 * Key used in the second level of a pair memoization when the second argument is undefined, because `undefined` cannot be a WeakMap key.
 */
const UNDEFINED_KEY: object = {};

/**
 * Determines if the given value can be used as a WeakMap key, which is the case for any non-null object, including arrays.
 * @param value The value to check.
 * @returns True if the value can be a WeakMap key, false otherwise.
 */
function isWeakMapKey(value: unknown): value is object {
  return isObject(value) || isArray(value);
}

/**
 * Wraps a pure unary function so that each object received is processed once. The result of the first call with a given object (or array) is kept in a WeakMap keyed by that object, and returned on every later call with the same object, until the object is garbage collected. Primitive inputs cannot be WeakMap keys, so they are passed through to the function on every call.
 *
 * The memoized function has the same type as the wrapped one, so its declaration keeps the wrapped function's parameter name. The cached result is shared by every caller, so it must be treated as read-only. Mutating the input object after the first call does not invalidate the cached result.
 * @param fn The pure function to memoize.
 * @returns The memoized function.
 */
export function memoizeByIdentity<Fn extends (input: never) => unknown>(
  fn: Fn
): Fn {
  const cache = new WeakMap<object, unknown>();
  const memoized = (input: Parameters<Fn>[0]): unknown => {
    if (!isWeakMapKey(input)) {
      return fn(input);
    }
    if (cache.has(input)) {
      return cache.get(input);
    }
    const result = fn(input);
    cache.set(input, result);
    return result;
  };
  return memoized as Fn;
}

/**
 * Wraps a pure binary function so that each pair of objects received is processed once. The result of the first call with a given pair is kept in nested WeakMaps keyed by the first and then the second argument, and returned on every later call with the same pair, until the first object is garbage collected. The second argument must be an object or undefined. When the first argument is not an object, the function is called on every call.
 *
 * The cached result is shared by every caller, so it must be treated as read-only. Mutating any of the input objects after the first call does not invalidate the cached result.
 * @param fn The pure function to memoize.
 * @returns The memoized function.
 */
export function memoizeByIdentityPair<
  First,
  Second extends object | undefined,
  Output,
>(
  fn: (first: First, second: Second) => Output
): (first: First, second: Second) => Output {
  const cache = new WeakMap<object, WeakMap<object, Output>>();
  return (first: First, second: Second): Output => {
    if (!isWeakMapKey(first)) {
      return fn(first, second);
    }
    const secondKey = isWeakMapKey(second) ? second : UNDEFINED_KEY;
    let secondCache = cache.get(first);
    if (!secondCache) {
      secondCache = new WeakMap<object, Output>();
      cache.set(first, secondCache);
    }
    if (secondCache.has(secondKey)) {
      return secondCache.get(secondKey)!;
    }
    const result = fn(first, second);
    secondCache.set(secondKey, result);
    return result;
  };
}
