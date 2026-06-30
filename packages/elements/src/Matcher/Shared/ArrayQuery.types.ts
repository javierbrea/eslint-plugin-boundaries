/**
 * Index + matcher pair for the `atIndex` operator.
 * `matches` is distinct from `equalsTo` to keep the whole-array equality operator unambiguous.
 */
export type ArrayQueryAtIndex<TMatcher> = {
  /** Index into the array. Negative values count from the end (-1 = last element). */
  index: number;
  /**
   * Matcher applied to the element found at `index`.
   * A single value or an array of values — array means OR (matches if any item matches).
   */
  matches: TMatcher | TMatcher[];
};

/**
 * Query object for matching against an array-valued property.
 * `TMatcher` matches a single array element:
 *  - micromatch pattern (string) for string arrays (types, categories)
 *  - ParentElementSingleSelector for the parent ancestor chain (parents)
 *
 * All present operators are combined with AND. An operator that is `undefined`
 * imposes no constraint.
 */
export type ArrayQuery<TMatcher> = {
  /** Matches if at least one array element matches at least one of these matchers. */
  anyOf?: TMatcher[];
  /** Matches if, for every matcher, at least one array element matches it. */
  allOf?: TMatcher[];
  /** Matches if no array element matches any of these matchers. */
  noneOf?: TMatcher[];
  /** Ordered exact match: array length equals N and array[i] matches matcher[i]. */
  equalsTo?: TMatcher[];
  /** Matches the single element at the given index. Negative index counts from the end. */
  atIndex?: ArrayQueryAtIndex<TMatcher>;
  /** Matches if the array length is exactly this value. */
  hasLength?: number;
};

/**
 * Template-array operand item used inside `anyOf` / `allOf` / `noneOf`.
 * Its `expand` template is resolved against the template data to a raw string array
 * (or single string), whose values are spread in place as additional matchers.
 */
export type ArrayQueryExpandItem = {
  /** A single Handlebars expression (e.g. "{{ from.element.types }}") resolving to a string array. */
  expand: string;
};

/** Matcher item for a string array query: a micromatch pattern or an expand item. */
export type StringArrayQueryMatcher = string | ArrayQueryExpandItem;

/** Array query over a string array (file `categories`, element `types`). */
export type StringArrayQuery = {
  /** anyOf/allOf/noneOf items may be micromatch patterns or `{ expand }` items. */
  anyOf?: StringArrayQueryMatcher[];
  allOf?: StringArrayQueryMatcher[];
  noneOf?: StringArrayQueryMatcher[];
  equalsTo?: string[];
  atIndex?: ArrayQueryAtIndex<string>;
  hasLength?: number;
};
