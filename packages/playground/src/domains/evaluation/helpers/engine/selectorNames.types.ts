/** The element types and file categories that the selectors of a policy name */
export type SelectorNames = {
  /** Those of the importing files, in order and without duplicates */
  readonly from: readonly string[];
  /** Those of the imported files, in order and without duplicates */
  readonly to: readonly string[];
};
